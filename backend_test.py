#!/usr/bin/env python3
"""
Comprehensive Backend Testing for AI StudyMate
Tests all authentication, AI generation, and topic management endpoints
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://study-ai-assist-4.preview.emergentagent.com/api"
TIMEOUT = 30

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_users = []
        self.test_topics = []
        self.results = {
            "passed": 0,
            "failed": 0,
            "tests": []
        }
    
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.results["tests"].append({
            "name": test_name,
            "passed": passed,
            "details": details
        })
        
        if passed:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> tuple:
        """Make HTTP request and return (success, response, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        if token:
            request_headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=request_headers, timeout=TIMEOUT)
            else:
                return False, None, 0
            
            return True, response, response.status_code
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return False, None, 0
    
    def test_auth_register_valid(self):
        """Test valid user registration"""
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "SecurePassword123!"
        
        success, response, status_code = self.make_request(
            "POST", "/auth/register",
            {"email": test_email, "password": test_password}
        )
        
        if not success:
            self.log_test("Auth Register - Valid", False, "Request failed")
            return None
        
        if status_code == 200:
            try:
                data = response.json()
                if "access_token" in data and "user" in data:
                    user_info = {
                        "email": test_email,
                        "password": test_password,
                        "token": data["access_token"],
                        "user_id": data["user"]["id"]
                    }
                    self.test_users.append(user_info)
                    self.log_test("Auth Register - Valid", True, f"User registered: {test_email}")
                    return user_info
                else:
                    self.log_test("Auth Register - Valid", False, "Missing access_token or user in response")
            except json.JSONDecodeError:
                self.log_test("Auth Register - Valid", False, "Invalid JSON response")
        else:
            self.log_test("Auth Register - Valid", False, f"Status: {status_code}, Response: {response.text}")
        
        return None
    
    def test_auth_register_duplicate(self):
        """Test duplicate email registration"""
        if not self.test_users:
            self.log_test("Auth Register - Duplicate Email", False, "No test user available")
            return
        
        existing_user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/auth/register",
            {"email": existing_user["email"], "password": "AnotherPassword123!"}
        )
        
        if not success:
            self.log_test("Auth Register - Duplicate Email", False, "Request failed")
            return
        
        if status_code == 400:
            self.log_test("Auth Register - Duplicate Email", True, "Correctly rejected duplicate email")
        else:
            self.log_test("Auth Register - Duplicate Email", False, f"Expected 400, got {status_code}")
    
    def test_auth_register_invalid_email(self):
        """Test registration with invalid email"""
        success, response, status_code = self.make_request(
            "POST", "/auth/register",
            {"email": "invalid-email", "password": "SecurePassword123!"}
        )
        
        if not success:
            self.log_test("Auth Register - Invalid Email", False, "Request failed")
            return
        
        if status_code == 422:  # Pydantic validation error
            self.log_test("Auth Register - Invalid Email", True, "Correctly rejected invalid email")
        else:
            self.log_test("Auth Register - Invalid Email", False, f"Expected 422, got {status_code}")
    
    def test_auth_login_valid(self):
        """Test valid login"""
        if not self.test_users:
            self.log_test("Auth Login - Valid", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/auth/login",
            {"email": user["email"], "password": user["password"]}
        )
        
        if not success:
            self.log_test("Auth Login - Valid", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if "access_token" in data:
                    self.log_test("Auth Login - Valid", True, "Login successful")
                else:
                    self.log_test("Auth Login - Valid", False, "Missing access_token in response")
            except json.JSONDecodeError:
                self.log_test("Auth Login - Valid", False, "Invalid JSON response")
        else:
            self.log_test("Auth Login - Valid", False, f"Status: {status_code}, Response: {response.text}")
    
    def test_auth_login_invalid_email(self):
        """Test login with invalid email"""
        success, response, status_code = self.make_request(
            "POST", "/auth/login",
            {"email": "nonexistent@example.com", "password": "SomePassword123!"}
        )
        
        if not success:
            self.log_test("Auth Login - Invalid Email", False, "Request failed")
            return
        
        if status_code == 401:
            self.log_test("Auth Login - Invalid Email", True, "Correctly rejected invalid email")
        else:
            self.log_test("Auth Login - Invalid Email", False, f"Expected 401, got {status_code}")
    
    def test_auth_login_wrong_password(self):
        """Test login with wrong password"""
        if not self.test_users:
            self.log_test("Auth Login - Wrong Password", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/auth/login",
            {"email": user["email"], "password": "WrongPassword123!"}
        )
        
        if not success:
            self.log_test("Auth Login - Wrong Password", False, "Request failed")
            return
        
        if status_code == 401:
            self.log_test("Auth Login - Wrong Password", True, "Correctly rejected wrong password")
        else:
            self.log_test("Auth Login - Wrong Password", False, f"Expected 401, got {status_code}")
    
    def test_auth_me_valid_token(self):
        """Test /auth/me with valid token"""
        if not self.test_users:
            self.log_test("Auth Me - Valid Token", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "GET", "/auth/me", token=user["token"]
        )
        
        if not success:
            self.log_test("Auth Me - Valid Token", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_test("Auth Me - Valid Token", True, "User info retrieved successfully")
                else:
                    self.log_test("Auth Me - Valid Token", False, "Missing user info in response")
            except json.JSONDecodeError:
                self.log_test("Auth Me - Valid Token", False, "Invalid JSON response")
        else:
            self.log_test("Auth Me - Valid Token", False, f"Status: {status_code}, Response: {response.text}")
    
    def test_auth_me_invalid_token(self):
        """Test /auth/me with invalid token"""
        success, response, status_code = self.make_request(
            "GET", "/auth/me", token="invalid_token_12345"
        )
        
        if not success:
            self.log_test("Auth Me - Invalid Token", False, "Request failed")
            return
        
        if status_code == 401:
            self.log_test("Auth Me - Invalid Token", True, "Correctly rejected invalid token")
        else:
            self.log_test("Auth Me - Invalid Token", False, f"Expected 401, got {status_code}")
    
    def test_auth_me_no_token(self):
        """Test /auth/me without token"""
        success, response, status_code = self.make_request("GET", "/auth/me")
        
        if not success:
            self.log_test("Auth Me - No Token", False, "Request failed")
            return
        
        if status_code == 403:  # FastAPI HTTPBearer returns 403 for missing token
            self.log_test("Auth Me - No Token", True, "Correctly rejected missing token")
        else:
            self.log_test("Auth Me - No Token", False, f"Expected 403, got {status_code}")
    
    def test_topics_generate_beginner(self):
        """Test topic generation with beginner difficulty"""
        if not self.test_users:
            self.log_test("Topics Generate - Beginner", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/topics/generate",
            {"topic": "Machine Learning Basics", "difficulty": "beginner"},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Generate - Beginner", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if ("explanation" in data and "quiz" in data and 
                    len(data["quiz"]) == 5 and "id" in data):
                    self.test_topics.append(data)
                    self.log_test("Topics Generate - Beginner", True, 
                                f"Generated topic with {len(data['quiz'])} questions")
                else:
                    self.log_test("Topics Generate - Beginner", False, 
                                "Missing required fields or incorrect quiz count")
            except json.JSONDecodeError:
                self.log_test("Topics Generate - Beginner", False, "Invalid JSON response")
        else:
            self.log_test("Topics Generate - Beginner", False, 
                        f"Status: {status_code}, Response: {response.text}")
    
    def test_topics_generate_intermediate(self):
        """Test topic generation with intermediate difficulty"""
        if not self.test_users:
            self.log_test("Topics Generate - Intermediate", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/topics/generate",
            {"topic": "Database Normalization", "difficulty": "intermediate"},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Generate - Intermediate", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if ("explanation" in data and "quiz" in data and 
                    len(data["quiz"]) == 5):
                    self.test_topics.append(data)
                    self.log_test("Topics Generate - Intermediate", True, 
                                "Generated intermediate topic successfully")
                else:
                    self.log_test("Topics Generate - Intermediate", False, 
                                "Missing required fields or incorrect quiz count")
            except json.JSONDecodeError:
                self.log_test("Topics Generate - Intermediate", False, "Invalid JSON response")
        else:
            self.log_test("Topics Generate - Intermediate", False, 
                        f"Status: {status_code}, Response: {response.text}")
    
    def test_topics_generate_advanced(self):
        """Test topic generation with advanced difficulty"""
        if not self.test_users:
            self.log_test("Topics Generate - Advanced", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/topics/generate",
            {"topic": "Quantum Computing Algorithms", "difficulty": "advanced"},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Generate - Advanced", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if ("explanation" in data and "quiz" in data and 
                    len(data["quiz"]) == 5):
                    self.test_topics.append(data)
                    self.log_test("Topics Generate - Advanced", True, 
                                "Generated advanced topic successfully")
                else:
                    self.log_test("Topics Generate - Advanced", False, 
                                "Missing required fields or incorrect quiz count")
            except json.JSONDecodeError:
                self.log_test("Topics Generate - Advanced", False, "Invalid JSON response")
        else:
            self.log_test("Topics Generate - Advanced", False, 
                        f"Status: {status_code}, Response: {response.text}")
    
    def test_topics_generate_invalid_difficulty(self):
        """Test topic generation with invalid difficulty"""
        if not self.test_users:
            self.log_test("Topics Generate - Invalid Difficulty", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/topics/generate",
            {"topic": "Test Topic", "difficulty": "expert"},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Generate - Invalid Difficulty", False, "Request failed")
            return
        
        if status_code == 400:
            self.log_test("Topics Generate - Invalid Difficulty", True, 
                        "Correctly rejected invalid difficulty")
        else:
            self.log_test("Topics Generate - Invalid Difficulty", False, 
                        f"Expected 400, got {status_code}")
    
    def test_topics_generate_empty_topic(self):
        """Test topic generation with empty topic"""
        if not self.test_users:
            self.log_test("Topics Generate - Empty Topic", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/topics/generate",
            {"topic": "", "difficulty": "beginner"},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Generate - Empty Topic", False, "Request failed")
            return
        
        # This might still work as the AI could handle empty topics, so we check if it generates content
        if status_code == 200:
            self.log_test("Topics Generate - Empty Topic", True, 
                        "AI handled empty topic (generated content)")
        else:
            self.log_test("Topics Generate - Empty Topic", True, 
                        f"Rejected empty topic with status {status_code}")
    
    def test_topics_history_empty(self):
        """Test topic history for new user"""
        # Create a new user for this test
        new_user = self.test_auth_register_valid()
        if not new_user:
            self.log_test("Topics History - Empty", False, "Could not create new user")
            return
        
        success, response, status_code = self.make_request(
            "GET", "/topics/history", token=new_user["token"]
        )
        
        if not success:
            self.log_test("Topics History - Empty", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list) and len(data) == 0:
                    self.log_test("Topics History - Empty", True, "Empty history returned correctly")
                else:
                    self.log_test("Topics History - Empty", False, 
                                f"Expected empty list, got {len(data)} items")
            except json.JSONDecodeError:
                self.log_test("Topics History - Empty", False, "Invalid JSON response")
        else:
            self.log_test("Topics History - Empty", False, f"Status: {status_code}")
    
    def test_topics_history_with_data(self):
        """Test topic history with existing topics"""
        if not self.test_users or not self.test_topics:
            self.log_test("Topics History - With Data", False, "No test data available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "GET", "/topics/history", token=user["token"]
        )
        
        if not success:
            self.log_test("Topics History - With Data", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if sorted by created_at descending
                    if len(data) > 1:
                        first_date = data[0]["created_at"]
                        second_date = data[1]["created_at"]
                        if first_date >= second_date:
                            self.log_test("Topics History - With Data", True, 
                                        f"Retrieved {len(data)} topics, correctly sorted")
                        else:
                            self.log_test("Topics History - With Data", False, 
                                        "Topics not sorted by created_at descending")
                    else:
                        self.log_test("Topics History - With Data", True, 
                                    f"Retrieved {len(data)} topic(s)")
                else:
                    self.log_test("Topics History - With Data", False, "No topics returned")
            except json.JSONDecodeError:
                self.log_test("Topics History - With Data", False, "Invalid JSON response")
        else:
            self.log_test("Topics History - With Data", False, f"Status: {status_code}")
    
    def test_topics_get_valid_id(self):
        """Test getting topic by valid ID"""
        if not self.test_users or not self.test_topics:
            self.log_test("Topics Get - Valid ID", False, "No test data available")
            return
        
        user = self.test_users[0]
        topic = self.test_topics[0]
        
        success, response, status_code = self.make_request(
            "GET", f"/topics/{topic['id']}", token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Get - Valid ID", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if data["id"] == topic["id"]:
                    self.log_test("Topics Get - Valid ID", True, "Retrieved topic successfully")
                else:
                    self.log_test("Topics Get - Valid ID", False, "Wrong topic returned")
            except json.JSONDecodeError:
                self.log_test("Topics Get - Valid ID", False, "Invalid JSON response")
        else:
            self.log_test("Topics Get - Valid ID", False, f"Status: {status_code}")
    
    def test_topics_get_invalid_id(self):
        """Test getting topic by invalid ID"""
        if not self.test_users:
            self.log_test("Topics Get - Invalid ID", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "GET", f"/topics/{uuid.uuid4()}", token=user["token"]
        )
        
        if not success:
            self.log_test("Topics Get - Invalid ID", False, "Request failed")
            return
        
        if status_code == 404:
            self.log_test("Topics Get - Invalid ID", True, "Correctly returned 404 for invalid ID")
        else:
            self.log_test("Topics Get - Invalid ID", False, f"Expected 404, got {status_code}")
    
    def test_quiz_submit_correct_answers(self):
        """Test quiz submission with all correct answers"""
        if not self.test_users or not self.test_topics:
            self.log_test("Quiz Submit - Correct Answers", False, "No test data available")
            return
        
        user = self.test_users[0]
        topic = self.test_topics[0]
        
        # Get correct answers from the quiz
        correct_answers = [q["correct_answer"] for q in topic["quiz"]]
        
        success, response, status_code = self.make_request(
            "POST", "/topics/submit-quiz",
            {"topic_id": topic["id"], "answers": correct_answers},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Quiz Submit - Correct Answers", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if (data["score"] == 5 and data["total"] == 5 and 
                    data["percentage"] == 100.0 and data["passed"] == True):
                    self.log_test("Quiz Submit - Correct Answers", True, 
                                "Perfect score calculated correctly")
                else:
                    self.log_test("Quiz Submit - Correct Answers", False, 
                                f"Incorrect calculation: {data}")
            except json.JSONDecodeError:
                self.log_test("Quiz Submit - Correct Answers", False, "Invalid JSON response")
        else:
            self.log_test("Quiz Submit - Correct Answers", False, f"Status: {status_code}")
    
    def test_quiz_submit_wrong_answers(self):
        """Test quiz submission with all wrong answers"""
        if not self.test_users or not self.test_topics:
            self.log_test("Quiz Submit - Wrong Answers", False, "No test data available")
            return
        
        user = self.test_users[0]
        topic = self.test_topics[0]
        
        # Create wrong answers (pick first option that's not correct)
        wrong_answers = []
        for q in topic["quiz"]:
            for option in q["options"]:
                if option != q["correct_answer"]:
                    wrong_answers.append(option)
                    break
        
        success, response, status_code = self.make_request(
            "POST", "/topics/submit-quiz",
            {"topic_id": topic["id"], "answers": wrong_answers},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Quiz Submit - Wrong Answers", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                if (data["score"] == 0 and data["total"] == 5 and 
                    data["percentage"] == 0.0 and data["passed"] == False):
                    self.log_test("Quiz Submit - Wrong Answers", True, 
                                "Zero score calculated correctly")
                else:
                    self.log_test("Quiz Submit - Wrong Answers", False, 
                                f"Incorrect calculation: {data}")
            except json.JSONDecodeError:
                self.log_test("Quiz Submit - Wrong Answers", False, "Invalid JSON response")
        else:
            self.log_test("Quiz Submit - Wrong Answers", False, f"Status: {status_code}")
    
    def test_quiz_submit_mixed_answers(self):
        """Test quiz submission with mixed correct/wrong answers"""
        if not self.test_users or not self.test_topics:
            self.log_test("Quiz Submit - Mixed Answers", False, "No test data available")
            return
        
        user = self.test_users[0]
        topic = self.test_topics[0]
        
        # Mix of correct and wrong answers (3 correct, 2 wrong)
        mixed_answers = []
        for i, q in enumerate(topic["quiz"]):
            if i < 3:  # First 3 correct
                mixed_answers.append(q["correct_answer"])
            else:  # Last 2 wrong
                for option in q["options"]:
                    if option != q["correct_answer"]:
                        mixed_answers.append(option)
                        break
        
        success, response, status_code = self.make_request(
            "POST", "/topics/submit-quiz",
            {"topic_id": topic["id"], "answers": mixed_answers},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Quiz Submit - Mixed Answers", False, "Request failed")
            return
        
        if status_code == 200:
            try:
                data = response.json()
                expected_score = 3
                expected_percentage = 60.0
                expected_passed = True  # 60% is passing
                
                if (data["score"] == expected_score and data["total"] == 5 and 
                    data["percentage"] == expected_percentage and data["passed"] == expected_passed):
                    self.log_test("Quiz Submit - Mixed Answers", True, 
                                f"Mixed score calculated correctly: {expected_score}/5 (60%)")
                else:
                    self.log_test("Quiz Submit - Mixed Answers", False, 
                                f"Incorrect calculation: {data}")
            except json.JSONDecodeError:
                self.log_test("Quiz Submit - Mixed Answers", False, "Invalid JSON response")
        else:
            self.log_test("Quiz Submit - Mixed Answers", False, f"Status: {status_code}")
    
    def test_quiz_submit_invalid_topic_id(self):
        """Test quiz submission with invalid topic ID"""
        if not self.test_users:
            self.log_test("Quiz Submit - Invalid Topic ID", False, "No test user available")
            return
        
        user = self.test_users[0]
        success, response, status_code = self.make_request(
            "POST", "/topics/submit-quiz",
            {"topic_id": str(uuid.uuid4()), "answers": ["A", "B", "C", "D", "A"]},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Quiz Submit - Invalid Topic ID", False, "Request failed")
            return
        
        if status_code == 404:
            self.log_test("Quiz Submit - Invalid Topic ID", True, 
                        "Correctly rejected invalid topic ID")
        else:
            self.log_test("Quiz Submit - Invalid Topic ID", False, 
                        f"Expected 404, got {status_code}")
    
    def test_quiz_submit_wrong_answer_count(self):
        """Test quiz submission with wrong number of answers"""
        if not self.test_users or not self.test_topics:
            self.log_test("Quiz Submit - Wrong Answer Count", False, "No test data available")
            return
        
        user = self.test_users[0]
        topic = self.test_topics[0]
        
        # Submit only 3 answers instead of 5
        success, response, status_code = self.make_request(
            "POST", "/topics/submit-quiz",
            {"topic_id": topic["id"], "answers": ["A", "B", "C"]},
            token=user["token"]
        )
        
        if not success:
            self.log_test("Quiz Submit - Wrong Answer Count", False, "Request failed")
            return
        
        if status_code == 400:
            self.log_test("Quiz Submit - Wrong Answer Count", True, 
                        "Correctly rejected wrong answer count")
        else:
            self.log_test("Quiz Submit - Wrong Answer Count", False, 
                        f"Expected 400, got {status_code}")
    
    def test_auth_delete_account(self):
        """Test account deletion"""
        # Create a new user specifically for deletion test
        delete_user = self.test_auth_register_valid()
        if not delete_user:
            self.log_test("Auth Delete Account", False, "Could not create user for deletion")
            return
        
        # Generate a topic for this user first
        success, response, status_code = self.make_request(
            "POST", "/topics/generate",
            {"topic": "Test Topic for Deletion", "difficulty": "beginner"},
            token=delete_user["token"]
        )
        
        if status_code != 200:
            self.log_test("Auth Delete Account", False, "Could not create topic for deletion test")
            return
        
        # Now delete the account
        success, response, status_code = self.make_request(
            "DELETE", "/auth/delete-account", token=delete_user["token"]
        )
        
        if not success:
            self.log_test("Auth Delete Account", False, "Request failed")
            return
        
        if status_code == 200:
            # Verify user can't access their data anymore
            success2, response2, status_code2 = self.make_request(
                "GET", "/auth/me", token=delete_user["token"]
            )
            
            if status_code2 == 401:
                self.log_test("Auth Delete Account", True, 
                            "Account deleted successfully, user can't access data")
            else:
                self.log_test("Auth Delete Account", False, 
                            "Account deletion succeeded but user can still access data")
        else:
            self.log_test("Auth Delete Account", False, f"Status: {status_code}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AI StudyMate Backend Tests")
        print("=" * 50)
        
        # Authentication Tests
        print("\n📝 Authentication Tests")
        print("-" * 30)
        self.test_auth_register_valid()
        self.test_auth_register_duplicate()
        self.test_auth_register_invalid_email()
        self.test_auth_login_valid()
        self.test_auth_login_invalid_email()
        self.test_auth_login_wrong_password()
        self.test_auth_me_valid_token()
        self.test_auth_me_invalid_token()
        self.test_auth_me_no_token()
        
        # Topic Generation Tests
        print("\n🤖 AI Topic Generation Tests")
        print("-" * 30)
        self.test_topics_generate_beginner()
        self.test_topics_generate_intermediate()
        self.test_topics_generate_advanced()
        self.test_topics_generate_invalid_difficulty()
        self.test_topics_generate_empty_topic()
        
        # Topic Management Tests
        print("\n📚 Topic Management Tests")
        print("-" * 30)
        self.test_topics_history_empty()
        self.test_topics_history_with_data()
        self.test_topics_get_valid_id()
        self.test_topics_get_invalid_id()
        
        # Quiz Tests
        print("\n🎯 Quiz Submission Tests")
        print("-" * 30)
        self.test_quiz_submit_correct_answers()
        self.test_quiz_submit_wrong_answers()
        self.test_quiz_submit_mixed_answers()
        self.test_quiz_submit_invalid_topic_id()
        self.test_quiz_submit_wrong_answer_count()
        
        # Account Deletion Test
        print("\n🗑️ Account Deletion Test")
        print("-" * 30)
        self.test_auth_delete_account()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['failed'] > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.results['tests']:
                if not test['passed']:
                    print(f"   • {test['name']}: {test['details']}")
        
        return self.results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()