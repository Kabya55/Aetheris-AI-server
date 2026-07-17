# Aetheris AI App Server 📡

The robust backend API for Aetheris AI, engineered with Node.js, Express, TypeScript, and MongoDB. It hosts conversational agent endpoints, parses travel tickets using Large Language Models, generates structured itineraries, and manages user authentication.

---

## 🚀 Backend Capabilities

- **AI Agent Orchestrator**: Wraps Google Gemini models for context-aware conversational planning.
- **Structured Database Models**: Mongoose schemas for User sessions, Chats, and Trip Itineraries.
- **Auth Service**: Token-based security and custom routes for user login and registration.
- **Automated Ticket Extraction**: API routes configured to receive booking structures and output cleanly parsed schedules.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js & TypeScript (`tsx` for execution, `tsc` for builds)
- **Framework**: Express.js (v5)
- **Database**: MongoDB Atlas via Mongoose ORM
- **AI Integration**: `@google/generative-ai` (Gemini API)
- **Authentication**: JWT & custom bcrypt security hashes
- **Deployment**: Vercel Serverless ready (`vercel.json`)

---

## 📂 Server Structure

```filepath
Aetheris-AI-server/
├── src/
│   ├── config/       # Connection parameters for MongoDB & Auth
│   ├── controllers/  # Core request logic (AI parsing, auth execution, trip operations)
│   ├── middleware/   # JWT session validation middleware
│   ├── models/       # Mongoose schemas (User, Trip, Chat)
│   ├── routes/       # Explicit Express router interfaces
│   ├── services/     # Gemini service logic & prompt generation
│   └── index.ts      # App setup & conditional Vercel exports
├── package.json      # Dependencies and execution commands
├── vercel.json       # Vercel deployment routes and builds
└── tsconfig.json     # Compiler rules for production tsc builds
```

---

## ⚙️ Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

---

## ☁️ Deploying to Vercel

This server is preconfigured for deployment on **Vercel** as a serverless function:
- All routes matching `/(.*)` are processed by the `@vercel/node` builder targeting `src/index.ts`.
- Set environment variables (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`) in the Vercel project settings dashboard prior to deployment.
