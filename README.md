# AI StudyMate 🧠

> **AI-Powered Personalized Learning Companion**

AI StudyMate is a full-stack mobile application that transforms any topic into an interactive learning experience. Originally built with FastAPI, it has been migrated to a robust **Node.js** architecture to provide scalable, real-time content generation.

## 🚀 Features

- **🤖 AI Content Generation**: Instantly generates clear explanations and 5-question quizzes for any subject using Hugging Face's LLMs.
- **📚 Adaptive Learning**: Supports multiple difficulty levels (Beginner, Intermediate, Advanced).
- **🛡️ Secure Authentication**: Full JWT-based user authentication system.
- **📱 Offline Mode**: Smart fallback mechanism ensures the app never crashes, even without API access.
- **📊 Progress Tracking**: Saves quiz history and scores to track learning over time.

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (JSON Web Tokens) & Bcrypt
- **AI Engine**: Hugging Face Inference API (`Zephyr-7B-Beta`)

### Frontend
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Http Client**: Fetch API

## 🏗 Architecture

```mermaid
graph TD
    User[Mobile App (React Native)] -->|Auth Request| Auth[Auth Controller]
    User -->|Generate Topic| Content[Topic Controller]
    
    Auth -->|Verify| DB[(MongoDB Users)]
    Content -->|Check History| DB[(MongoDB Topics)]
    
    Content -->|Prompt| AI[AI Service]
    AI -->|Request| HF[Hugging Face API]
    HF -->|JSON Response| AI
    
    subgraph "Fallback Mechanism"
    AI -- API Fail --> Mock[Structured Fallback Data]
    end
```

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB URI
- Hugging Face API Token (Free)

### 1. Backend Setup
```bash
cd backend-node
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:5000
npm start
```

## 📱 Build for Android

To generate a standalone APK:

```bash
cd frontend
npm install -g eas-cli
eas build -p android --profile preview
```

## 🔒 Security

- **No Hardcoded Secrets**: All keys managed via `.env`.
- **Password Hashing**: Bcrypt used for user passwords.
- **Strict Parsing**: AI responses are validated and sanitized before reaching the client.

## 📄 License
This project is licensed under the MIT License.
