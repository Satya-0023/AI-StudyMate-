# AI StudyMate Backend (Node.js)

This is the Node.js + Express version of the AI StudyMate backend. It replicates the functionality of the original FastAPI backend, using Mongoose for MongoDB and Hugging Face Inference API for AI content generation.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or a connection string)
- Hugging Face API Key


## Deployment Checklist

1.  **Environment Variables**: Ensure the following are set in your production environment (e.g., Render, Railway, Heroku, AWS):
    -   `HF_API_KEY`: Your Hugging Face API Token (Required for AI features).
    -   `MONGO_URL`: Connection string to your MongoDB Atlas (or other) database.
    -   `JWT_SECRET`: A strong, random string for signing tokens.
    -   `PORT`: (Optional) Defaults to 8000.

2.  **Production Build**:
    -   Run `npm install --omit=dev` to install only production dependencies.
    -   Start the server with `npm start` (which runs `node server.js`).

3.  **Frontend Configuration**:
    -   Update `frontend/.env` -> `EXPO_PUBLIC_BACKEND_URL` to point to your deployed backend URL (e.g., `https://my-backend-app.onrender.com`).

## Known Limitations

-   **AI Model Availability**: This project uses the free tier of Hugging Face Inference API. The model `HuggingFaceH4/zephyr-7b-beta` may occasionally be unavailable (Status 503 or 410) during high load.
    -   **Fallback**: The backend includes a fallback mechanism that returns a placeholder explanation if the model is unavailable (Status 410), ensuring the app doesn't crash.
    -   **Solution**: For production, consider upgrading to a dedicated Inference Endpoint or switching to OpenAI/Anthropic API (requires code adjustment).

## License
MIT

## Setup

1.  **Install Dependencies**
    ```bash
    cd backend-node
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the `backend-node` directory (copy from `.env.example`).
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your credentials:
    ```env
    MONGO_URL=mongodb://localhost:27017/studymate
    DB_NAME=studymate
    JWT_SECRET=your_secret_key
    HF_API_KEY=your_hugging_face_api_key
    PORT=8000
    ```

3.  **Run the Server**
    - Development (with hot reload):
      ```bash
      npm run dev
      ```
    - Production:
      ```bash
      npm start
      ```

## API Endpoints

The API endpoints are identical to the Python version:

## API Documentation

### 1. Authentication

**Register User**
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "created_at": "2023-..."
    }
  }
  ```

**Login User**
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**: Same as Register
- **Response**: Same as Register

### 2. Topics

**Generate Topic (AI)**
- **URL**: `/api/topics/generate`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "topic": "Python Basics",
    "difficulty": "beginner"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid-string",
    "topic": "Python Basics",
    "difficulty": "beginner",
    "explanation": "Python is a high-level...",
    "quiz": [
      {
        "question": "What is Python?",
        "options": ["A snake", "A language", "A car", "A food"],
        "correct_answer": "A language"
      }
    ]
  }
  ```

**Submit Quiz**
- **URL**: `/api/topics/submit-quiz`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "topic_id": "uuid-string",
    "answers": ["A language", "...", "...", "...", "..."]
  }
  ```

## Project Structure

-   `src/config`: Database connection
-   `src/controllers`: Request handlers
-   `src/middleware`: Authentication and error handling
-   `src/models`: Mongoose schemas (User, Topic)
-   `src/routes`: API route definitions
-   `src/utils`: Helper functions (AI service)
-   `app.js`: Express app setup
-   `server.js`: Entry point

## Testing

To verify the backend API endpoints, you can run the included test script:

```bash
node test_api.js
```

This script will:
1.  Register a new user
2.  Login
3.  Get user profile
4.  Generate a topic (requires valid `HF_API_KEY`)
5.  Submit a quiz
6.  Delete the test account

> **Note**: If `HF_API_KEY` is missing or invalid, the "Generate Topic" test will fail, but other tests should pass.

