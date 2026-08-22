# Studybound

> **Accountability and shared knowledge feed each other.**  
> An open, anonymous notes database paired with Google-Meet-style focus rooms and synchronized Pomodoro sessions.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+) & npm

### Running Locally
```powershell
# 1. Run both backend and frontend concurrently
npm run dev
```

The application will be accessible at:
- **Frontend App**: `http://localhost:5173/`
- **Backend API & WebSockets**: `http://localhost:4000/`

---

## 🛠️ Architecture

- **Frontend**: Vite + React 19 + Lucide Icons + Socket.IO Client + Web Audio API synthesizer + CSS Glassmorphic Design System.
- **Backend**: Node.js + Express + Socket.IO + In-memory/File-backed atomic storage + Input Sanitization & Rate Limiting.
- **Video/Audio Layer**: Embedded Jitsi Meet External API integration + native WebRTC camera/microphone controls.

---

## 🧪 Testing

```powershell
cd server
npm test
```
Runs both unit API tests and end-to-end multi-client Socket.IO synchronization tests.
