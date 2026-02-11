// Using native fetch (Node 18+)

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'password123'
};

async function runTests() {
    console.log('--- Starting Backend Tests ---');

    // 1. Register
    try {
        console.log(`\n1. Testing Register (${testUser.email})...`);
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Register Success');
            authToken = data.access_token;
        } else {
            console.error('❌ Register Failed:', data);
            return;
        }
    } catch (e) {
        console.error('❌ Register Error:', e.message);
        return;
    }

    // 2. Login
    try {
        console.log('\n2. Testing Login...');
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Login Success');
            authToken = data.access_token; // Refresh token
        } else {
            console.error('❌ Login Failed:', data);
        }
    } catch (e) {
        console.error('❌ Login Error:', e.message);
    }

    // 3. Get Me
    try {
        console.log('\n3. Testing Get Me...');
        const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Get Me Success');
            if (data._id) console.error('❌ FAIL: _id exposed in user object');
            if (!data.id) console.error('❌ FAIL: id missing in user object');
        } else {
            console.error('❌ Get Me Failed:', data);
        }
    } catch (e) {
        console.error('❌ Get Me Error:', e.message);
    }

    // 4. Generate Topic (Mocking AI part if needed, but we'll try real call if env is set)
    // Note: If no API key, this might fail. We'll verify it handles failure gracefully or check if env is set.
    try {
        console.log('\n4. Testing Generate Topic (Node.js vs Basic Math)...');
        const res = await fetch(`${BASE_URL}/topics/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ topic: 'Basic Math', difficulty: 'beginner' })
        });
        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Generate Topic Success');
            console.log(`   - Topic ID: ${data.id}`);
            console.log(`   - Explanation: ${data.explanation.substring(0, 50)}...`);

            // 5. Submit Quiz
            await testQuiz(data.id, data.quiz);
        } else {
            console.warn('⚠️ Generate Topic Failed (Expected if NO HF_API_KEY):', data);
        }
    } catch (e) {
        console.error('❌ Generate Topic Error:', e.message);
    }

    // 6. Delete Account
    try {
        console.log('\n6. Testing Delete Account...');
        const res = await fetch(`${BASE_URL}/auth/delete-account`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Delete Account Success');
        } else {
            console.error('❌ Delete Account Failed:', data);
        }
    } catch (e) {
        console.error('❌ Delete Account Error:', e.message);
    }
}

async function testQuiz(topicId, quiz) {
    console.log('\n5. Testing Submit Quiz...');
    // Create correct answers
    const answers = quiz.map(q => q.correct_answer);

    try {
        const res = await fetch(`${BASE_URL}/topics/submit-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ topic_id: topicId, answers })
        });
        const data = await res.json();

        if (res.status === 200 && data.score === 5) {
            console.log('✅ Submit Quiz Success (Perfect Score)');
        } else {
            console.error('❌ Submit Quiz Failed:', data);
        }
    } catch (e) {
        console.error('❌ Submit Quiz Error:', e.message);
    }
}

runTests();
