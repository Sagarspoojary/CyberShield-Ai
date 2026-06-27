# Aether - Premium Hackathon Starter Template

A production-ready hackathon template using **React + Vite + Tailwind CSS v4** for the frontend and **Node.js (Express)** for the backend.

## Project Structure

```
project/
├── frontend/             # Vite + React Client App
│   ├── src/
│   │   ├── components/   # Glassmorphic Apple Vision Pro UI components
│   │   ├── config/       # Firebase config
│   │   ├── context/      # Theme, Toast, and Auth contexts
│   │   └── pages/        # Dashboard (Bento layout), Landing, Login, Profile
│   └── .env.example
├── backend/              # Express JS REST Server
│   ├── src/
│   │   ├── config/       # Firebase Admin config
│   │   ├── controllers/  # API router endpoints business logic
│   │   ├── middleware/   # JWT verify auth & error handling middlewares
│   │   ├── routes/       # Auth routes path registry
│   │   └── utils/        # Success/Error standard response helpers
│   └── .env.example
└── README.md
```

## Features

1. **Spatial UI (Apple Vision Pro inspired)**: Glassmorphism layout grids, spring-tilt 3D effects (`framer-motion`), and blurred gradient mesh.
2. **Generative Particles**: Ambient, floating glowing nodes and slow organic blobs.
3. **Kinetic Typography**: Non-distracting, infinite-scrolling marquees in the background.
4. **Dual Authentication Pipeline**:
   - Out-of-the-box support for **Firebase Auth** (Email + Google Sign In).
   - **Mock Auth Fallback Bypass**: Runs immediately without Firebase API keys configured for instant interface previewing.
5. **Secure Express Backend**: Configured with CORS, Helmet, Morgan, and Firebase Admin SDK token authentication validator.

---

## Getting Started

### 1. Backend Setup

1. Open terminal inside the `/backend` folder:
   ```bash
   cd backend
   npm install
   ```
2. Set up environment variables:
   Copy `.env.example` to `.env`
   - Adjust `PORT` if needed (default: `5000`).
   - Place your Firebase Service Account JSON file path in `FIREBASE_SERVICE_ACCOUNT_PATH` to enable remote Token verification.
3. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open terminal inside the `/frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Set up environment variables:
   Copy `.env.example` to `.env`
   - Paste your client-side Firebase API keys under `VITE_FIREBASE_*`.
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the web interface at `http://localhost:5173`.

---

## Mock Mode Bypass
If you do not have Firebase keys ready, you can start hacking immediately. Leaving client/server Firebase parameters blank activates **Mock Mode**.
- Login with any email/password (e.g., `hacker@domain.com` / `password123`) or click **Sign in with Google** to directly enter the interactive Bento Dashboard.
