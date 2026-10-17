# FinLearn — Financial Literacy, Money Management & Safety Platform

FinLearn is a modern personal finance literacy and management platform tailored for students, salaried employees, and self-employed learners across India. The platform unites educational guidance, recurring commitment tracking, and AI-grounded explanations with transparent calculations.

---

## Architecture & Layout

FinLearn is built as an isolated full-stack system:

```text
FinLearn/
├── frontend/                     # React + Vite + Tailwind CSS (SPA)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Button, Input, Card, Badge, Loading, EmptyState, ErrorState
│   │   │   ├── layout/           # Header, Sidebar (responsive drawer)
│   │   │   └── dashboard/
│   │   ├── layouts/              # AppLayout shell
│   │   ├── pages/                # HomePage, PlaceholderPage
│   │   ├── services/             # Shared API client (VITE_API_BASE_URL)
│   │   ├── utils/                # INR paise formatting and currency utilities
│   │   ├── App.jsx               # React Router navigation
│   │   ├── main.jsx              # App entry point
│   │   └── index.css             # Tailwind directives & design tokens
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                      # Node.js + Express + Mongoose (REST API)
│   ├── src/
│   │   ├── config/               # Environment validation & MongoDB connection
│   │   ├── controllers/          # Health and domain controllers
│   │   ├── middleware/           # Centralized errorHandler, notFound, security headers
│   │   ├── routes/               # /api/v1/health and modular endpoints
│   │   ├── utils/                # JSON envelope responses
│   │   └── app.js                # Express app factory with Helmet, CORS & Rate Limiting
│   ├── tests/                    # Backend unit & integration test suites
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Server entry point with graceful shutdown
└── docs/                         # Comprehensive specification & implementation plans
    ├── FinLearn_SRS.md           # Product specification
    └── implementation_plans/     # Sequential phase plans & EDGE_CASES.md
```

---

## FinLearn Design System Palette

The application strictly implements the curated FinLearn brand palette:
- **Aubergine (`#321D35`):** Structural navigation, primary text, brand authority
- **Burnt Terracotta (`#D15C40`):** Primary action buttons, urgent badges, accents
- **Warm Ivory (`#FAF5EB`):** Background surfaces, card canvas, soft panels
- **Muted Brass (`#B88C56`):** Borders, secondary accents, highlights
- **Soft Lilac (`#D7C5D8`):** Subtle backgrounds, chips, decorative borders

*Note: Default blues and common greens are deliberately avoided as primary brand colors.*

---

## Prerequisites

- **Node.js:** v18.0.0 or later (v24.12.0 verified)
- **npm:** v9.0.0 or later (v11.6.2 verified)
- **MongoDB:** Local instance (`mongodb://127.0.0.1:27017/finlearn`) or MongoDB Atlas URI

---

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Verify or configure `backend/.env`:
```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/finlearn
FRONTEND_URL=http://localhost:5173
JWT_SECRET=finlearn_super_secure_jwt_secret_key_32_characters_minimum_2026_phase3
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE_DAYS=7
```

Run test suite:
```bash
npm test
```

Start the backend API server:
```bash
# Development mode with automatic watch
npm run dev

# Or production startup
npm start
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Verify or configure `frontend/.env`:
```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend development server:
```bash
npm run dev
```

Build frontend for production:
```bash
npm run build
```

---

## Verification & Health Check

The backend exposes a structured health endpoint:
```http
GET /api/v1/health
```

Sample JSON response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "uptimeSeconds": 124,
  "timestamp": "2026-10-13T11:55:39.816Z",
  "database": {
    "status": "connected",
    "connected": true,
    "error": null
  },
  "services": {
    "api": "operational",
    "securityMiddleware": "active"
  }
}
```

If MongoDB is temporarily unavailable or stopped, the endpoint accurately reports:
```json
"database": {
  "status": "disconnected",
  "connected": false,
  "error": "connect ECONNREFUSED 127.0.0.1:27017"
}
```
*FinLearn never silently uses an in-memory database to fabricate data persistence.*

---

## Common Startup Errors & Troubleshooting

1. **`connect ECONNREFUSED 127.0.0.1:27017`**:
   - MongoDB is not running locally. Start MongoDB via Windows Service (`Start-Service MongoDB`) or Docker (`docker run -d -p 27017:27017 mongo`), or configure a valid MongoDB Atlas URI in `backend/.env`.
2. **`Origin http://localhost:XXXX not allowed by CORS policy`**:
   - Ensure `FRONTEND_URL` in `backend/.env` matches your frontend port (defaults support ports 5173 and 5174).
3. **`PORT must be a valid port number`**:
   - Check `backend/.env` for invalid characters in `PORT`.

---

## Running Automated Tests

Run backend tests:
```bash
cd backend
npm test
```
Runs unit and integration tests using Node.js native test runner (`node:test`).
