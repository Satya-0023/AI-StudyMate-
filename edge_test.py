#!/usr/bin/env python3
"""
Edge Case Tests for AI StudyMate Backend
"""

import requests
import json
import uuid

BASE_URL = "https://study-ai-assist-4.preview.emergentagent.com/api"

def test_edge_cases():
    """Test edge cases and error conditions"""
    results = []
    
    # Create a test user first
    test_email = f"edgetest_{uuid.uuid4().hex[:8]}@example.com"
    response = requests.post(f"{BASE_URL}/auth/register", 
                           json={"email": test_email, "password": "SecurePass123!"}, 
                           timeout=10)
    token = response.json().get("access_token")
    
    # Test 1: Invalid token
    try:
        response = requests.get(f"{BASE_URL}/auth/me", 
                              headers={"Authorization": "Bearer invalid_token"}, 
                              timeout=10)
        if response.status_code == 401:
            results.append(("✅ Invalid Token Rejection", "Working"))
        else:
            results.append(("❌ Invalid Token Rejection", f"Expected 401, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Invalid Token Rejection", f"Error: {str(e)}"))
    
    # Test 2: No Authorization header
    try:
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        if response.status_code == 403:
            results.append(("✅ Missing Token Rejection", "Working"))
        else:
            results.append(("❌ Missing Token Rejection", f"Expected 403, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Missing Token Rejection", f"Error: {str(e)}"))
    
    # Test 3: Duplicate email registration
    try:
        response = requests.post(f"{BASE_URL}/auth/register", 
                               json={"email": test_email, "password": "AnotherPass123!"}, 
                               timeout=10)
        if response.status_code == 400:
            results.append(("✅ Duplicate Email Rejection", "Working"))
        else:
            results.append(("❌ Duplicate Email Rejection", f"Expected 400, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Duplicate Email Rejection", f"Error: {str(e)}"))
    
    # Test 4: Invalid email format
    try:
        response = requests.post(f"{BASE_URL}/auth/register", 
                               json={"email": "invalid-email", "password": "SecurePass123!"}, 
                               timeout=10)
        if response.status_code == 422:
            results.append(("✅ Invalid Email Format Rejection", "Working"))
        else:
            results.append(("❌ Invalid Email Format Rejection", f"Expected 422, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Invalid Email Format Rejection", f"Error: {str(e)}"))
    
    # Test 5: Wrong password login
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json={"email": test_email, "password": "WrongPassword123!"}, 
                               timeout=10)
        if response.status_code == 401:
            results.append(("✅ Wrong Password Rejection", "Working"))
        else:
            results.append(("❌ Wrong Password Rejection", f"Expected 401, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Wrong Password Rejection", f"Error: {str(e)}"))
    
    # Test 6: Invalid difficulty level
    try:
        response = requests.post(f"{BASE_URL}/topics/generate", 
                               json={"topic": "Test Topic", "difficulty": "expert"},
                               headers={"Authorization": f"Bearer {token}"}, 
                               timeout=10)
        if response.status_code == 400:
            results.append(("✅ Invalid Difficulty Rejection", "Working"))
        else:
            results.append(("❌ Invalid Difficulty Rejection", f"Expected 400, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Invalid Difficulty Rejection", f"Error: {str(e)}"))
    
    # Test 7: Generate topic and test invalid topic ID
    try:
        # First generate a valid topic
        response = requests.post(f"{BASE_URL}/topics/generate", 
                               json={"topic": "Test Topic", "difficulty": "beginner"},
                               headers={"Authorization": f"Bearer {token}"}, 
                               timeout=30)
        topic_data = response.json()
        
        # Test invalid topic ID
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/topics/{fake_id}", 
                              headers={"Authorization": f"Bearer {token}"}, 
                              timeout=10)
        if response.status_code == 404:
            results.append(("✅ Invalid Topic ID Rejection", "Working"))
        else:
            results.append(("❌ Invalid Topic ID Rejection", f"Expected 404, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Invalid Topic ID Rejection", f"Error: {str(e)}"))
    
    # Test 8: Wrong number of quiz answers
    try:
        response = requests.post(f"{BASE_URL}/topics/submit-quiz", 
                               json={"topic_id": topic_data["id"], "answers": ["A", "B", "C"]},  # Only 3 answers instead of 5
                               headers={"Authorization": f"Bearer {token}"}, 
                               timeout=10)
        if response.status_code == 400:
            results.append(("✅ Wrong Answer Count Rejection", "Working"))
        else:
            results.append(("❌ Wrong Answer Count Rejection", f"Expected 400, got {response.status_code}"))
    except Exception as e:
        results.append(("❌ Wrong Answer Count Rejection", f"Error: {str(e)}"))
    
    # Test 9: Test different difficulty levels work
    difficulties = ["beginner", "intermediate", "advanced"]
    difficulty_results = []
    
    for difficulty in difficulties:
        try:
            response = requests.post(f"{BASE_URL}/topics/generate", 
                                   json={"topic": f"Test {difficulty.title()} Topic", "difficulty": difficulty},
                                   headers={"Authorization": f"Bearer {token}"}, 
                                   timeout=30)
            if response.status_code == 200:
                data = response.json()
                if len(data.get("quiz", [])) == 5:
                    difficulty_results.append(f"✅ {difficulty.title()}")
                else:
                    difficulty_results.append(f"❌ {difficulty.title()} (wrong quiz count)")
            else:
                difficulty_results.append(f"❌ {difficulty.title()} ({response.status_code})")
        except Exception as e:
            difficulty_results.append(f"❌ {difficulty.title()} (error)")
    
    results.append(("🎯 All Difficulty Levels", " | ".join(difficulty_results)))
    
    return results

if __name__ == "__main__":
    print("🔍 AI StudyMate Backend Edge Case Tests")
    print("=" * 45)
    
    results = test_edge_cases()
    
    for test_name, status in results:
        print(f"{test_name}: {status}")
    
    print("\n" + "=" * 45)