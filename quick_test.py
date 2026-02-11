#!/usr/bin/env python3
"""
Quick Backend Test Summary for AI StudyMate
"""

import requests
import json
import uuid

BASE_URL = "https://study-ai-assist-4.preview.emergentagent.com/api"

def test_basic_endpoints():
    """Test basic functionality"""
    results = []
    
    # Test 1: Register a user
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    try:
        response = requests.post(f"{BASE_URL}/auth/register", 
                               json={"email": test_email, "password": "SecurePass123!"}, 
                               timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            results.append(("✅ User Registration", "Working"))
        else:
            results.append(("❌ User Registration", f"Failed: {response.status_code}"))
            return results
    except Exception as e:
        results.append(("❌ User Registration", f"Error: {str(e)}"))
        return results
    
    # Test 2: Login
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json={"email": test_email, "password": "SecurePass123!"}, 
                               timeout=10)
        if response.status_code == 200:
            results.append(("✅ User Login", "Working"))
        else:
            results.append(("❌ User Login", f"Failed: {response.status_code}"))
    except Exception as e:
        results.append(("❌ User Login", f"Error: {str(e)}"))
    
    # Test 3: Get user info
    try:
        response = requests.get(f"{BASE_URL}/auth/me", 
                              headers={"Authorization": f"Bearer {token}"}, 
                              timeout=10)
        if response.status_code == 200:
            results.append(("✅ Get User Info", "Working"))
        else:
            results.append(("❌ Get User Info", f"Failed: {response.status_code}"))
    except Exception as e:
        results.append(("❌ Get User Info", f"Error: {str(e)}"))
    
    # Test 4: Generate topic (beginner)
    try:
        response = requests.post(f"{BASE_URL}/topics/generate", 
                               json={"topic": "Python Basics", "difficulty": "beginner"},
                               headers={"Authorization": f"Bearer {token}"}, 
                               timeout=30)
        if response.status_code == 200:
            topic_data = response.json()
            results.append(("✅ AI Topic Generation", f"Working - Generated {len(topic_data.get('quiz', []))} questions"))
            topic_id = topic_data.get("id")
        else:
            results.append(("❌ AI Topic Generation", f"Failed: {response.status_code}"))
            return results
    except Exception as e:
        results.append(("❌ AI Topic Generation", f"Error: {str(e)}"))
        return results
    
    # Test 5: Get topic history
    try:
        response = requests.get(f"{BASE_URL}/topics/history", 
                              headers={"Authorization": f"Bearer {token}"}, 
                              timeout=10)
        if response.status_code == 200:
            history = response.json()
            results.append(("✅ Topic History", f"Working - {len(history)} topics"))
        else:
            results.append(("❌ Topic History", f"Failed: {response.status_code}"))
    except Exception as e:
        results.append(("❌ Topic History", f"Error: {str(e)}"))
    
    # Test 6: Submit quiz
    try:
        # Get correct answers
        correct_answers = [q["correct_answer"] for q in topic_data["quiz"]]
        response = requests.post(f"{BASE_URL}/topics/submit-quiz", 
                               json={"topic_id": topic_id, "answers": correct_answers},
                               headers={"Authorization": f"Bearer {token}"}, 
                               timeout=10)
        if response.status_code == 200:
            quiz_result = response.json()
            results.append(("✅ Quiz Submission", f"Working - Score: {quiz_result.get('score')}/{quiz_result.get('total')}"))
        else:
            results.append(("❌ Quiz Submission", f"Failed: {response.status_code}"))
    except Exception as e:
        results.append(("❌ Quiz Submission", f"Error: {str(e)}"))
    
    # Test 7: Delete account
    try:
        response = requests.delete(f"{BASE_URL}/auth/delete-account", 
                                 headers={"Authorization": f"Bearer {token}"}, 
                                 timeout=10)
        if response.status_code == 200:
            results.append(("✅ Account Deletion", "Working"))
        else:
            results.append(("❌ Account Deletion", f"Failed: {response.status_code}"))
    except Exception as e:
        results.append(("❌ Account Deletion", f"Error: {str(e)}"))
    
    return results

if __name__ == "__main__":
    print("🚀 AI StudyMate Backend Quick Test")
    print("=" * 40)
    
    results = test_basic_endpoints()
    
    passed = sum(1 for r in results if r[0].startswith("✅"))
    failed = sum(1 for r in results if r[0].startswith("❌"))
    
    for test_name, status in results:
        print(f"{test_name}: {status}")
    
    print("\n" + "=" * 40)
    print(f"📊 SUMMARY: {passed} passed, {failed} failed")
    print(f"Success Rate: {(passed/(passed+failed)*100):.1f}%")