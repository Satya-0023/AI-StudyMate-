from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_change_in_production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class GenerateTopicRequest(BaseModel):
    topic: str
    difficulty: str  # "beginner", "intermediate", "advanced"

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class TopicResponse(BaseModel):
    id: str
    user_id: str
    topic: str
    difficulty: str
    explanation: str
    quiz: List[QuizQuestion]
    score: Optional[int] = None
    created_at: datetime

class SubmitQuizRequest(BaseModel):
    topic_id: str
    answers: List[str]  # User's selected answers

class QuizResult(BaseModel):
    score: int
    total: int
    percentage: float
    passed: bool

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

async def generate_ai_content(topic: str, difficulty: str) -> dict:
    """
    Generate explanation and quiz using AI
    """
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        # Create prompt based on difficulty
        difficulty_context = {
            "beginner": "Explain in very simple terms, suitable for someone with no prior knowledge. Use analogies and examples.",
            "intermediate": "Provide a detailed explanation with some technical details, suitable for someone with basic understanding.",
            "advanced": "Give a comprehensive, technical explanation with advanced concepts and nuances."
        }
        
        system_message = f"""You are an expert educator. Your task is to:
1. Provide a clear, {difficulty}-level explanation of the given topic
2. Generate exactly 5 multiple-choice quiz questions to test understanding

{difficulty_context.get(difficulty, difficulty_context['beginner'])}

You MUST respond with valid JSON in this exact format:
{{
  "explanation": "Your detailed explanation here",
  "quiz": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }}
  ]
}}

Ensure the JSON is valid and properly formatted. Do not include any text outside the JSON."""
        
        user_message_text = f"Topic: {topic}\n\nGenerate a {difficulty}-level explanation and 5 quiz questions."
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"studymate_{uuid.uuid4()}",
            system_message=system_message
        )
        chat.with_model("openai", "gpt-5.2")
        
        # Create user message
        user_message = UserMessage(text=user_message_text)
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        logger.info(f"AI Response: {response}")
        
        # Parse JSON response
        try:
            # Try to parse the response as JSON
            content = json.loads(response)
        except json.JSONDecodeError:
            # If response contains markdown code blocks, extract JSON
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
                content = json.loads(json_str)
            elif "```" in response:
                json_start = response.find("```") + 3
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
                content = json.loads(json_str)
            else:
                raise ValueError("Could not parse AI response as JSON")
        
        # Validate response structure
        if "explanation" not in content or "quiz" not in content:
            raise ValueError("AI response missing required fields")
        
        if len(content["quiz"]) < 5:
            raise ValueError("AI did not generate enough quiz questions")
        
        return content
        
    except Exception as e:
        logger.error(f"Error generating AI content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}"
        )

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at.isoformat()
        }
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "created_at": current_user["created_at"]
    }

@api_router.delete("/auth/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    # Delete all user's topics
    await db.topics.delete_many({"user_id": current_user["id"]})
    
    # Delete user
    await db.users.delete_one({"id": current_user["id"]})
    
    return {"message": "Account deleted successfully"}

# ==================== TOPIC ROUTES ====================

@api_router.post("/topics/generate", response_model=TopicResponse)
async def generate_topic(request: GenerateTopicRequest, current_user: dict = Depends(get_current_user)):
    # Validate difficulty
    if request.difficulty not in ["beginner", "intermediate", "advanced"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be 'beginner', 'intermediate', or 'advanced'"
        )
    
    # Generate AI content
    ai_content = await generate_ai_content(request.topic, request.difficulty)
    
    # Create topic document
    topic = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "topic": request.topic,
        "difficulty": request.difficulty,
        "explanation": ai_content["explanation"],
        "quiz": ai_content["quiz"],
        "score": None,
        "created_at": datetime.utcnow()
    }
    
    await db.topics.insert_one(topic)
    
    return TopicResponse(**topic)

@api_router.post("/topics/submit-quiz", response_model=QuizResult)
async def submit_quiz(request: SubmitQuizRequest, current_user: dict = Depends(get_current_user)):
    # Find topic
    topic = await db.topics.find_one({"id": request.topic_id, "user_id": current_user["id"]})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Calculate score
    quiz = topic["quiz"]
    if len(request.answers) != len(quiz):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of answers must match number of questions"
        )
    
    correct_count = 0
    for i, answer in enumerate(request.answers):
        if answer == quiz[i]["correct_answer"]:
            correct_count += 1
    
    total = len(quiz)
    percentage = (correct_count / total) * 100
    passed = percentage >= 60  # 60% passing grade
    
    # Update topic with score
    await db.topics.update_one(
        {"id": request.topic_id},
        {"$set": {"score": correct_count}}
    )
    
    return QuizResult(
        score=correct_count,
        total=total,
        percentage=percentage,
        passed=passed
    )

@api_router.get("/topics/history", response_model=List[TopicResponse])
async def get_history(current_user: dict = Depends(get_current_user)):
    topics = await db.topics.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    return [TopicResponse(**topic) for topic in topics]

@api_router.get("/topics/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, current_user: dict = Depends(get_current_user)):
    topic = await db.topics.find_one({"id": topic_id, "user_id": current_user["id"]})
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    return TopicResponse(**topic)

# ==================== INCLUDE ROUTER ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
