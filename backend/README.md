# Punto Park U — Backend API

REST API for Punto Park U parking management system.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Database:** MongoDB Atlas (M0 free tier) via Mongoose
- **Auth:** JWT (access + refresh tokens) with bcryptjs

## Prerequisites

- Node.js 18+
- MongoDB Atlas M0 cluster (or local MongoDB)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server (with nodemon)
npm run dev

# Start production server
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/        # Environment configuration
│   ├── controllers/   # Route handlers
│   ├── middleware/     # Auth, rate limiting, error handling
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express route definitions
│   ├── utils/         # Helper functions
│   ├── app.js         # Express middleware and route setup
│   └── server.js      # Entry point (HTTP server + MongoDB)
├── .env.example       # Environment variable template
├── .gitignore
└── package.json
```

## API Endpoints

| Route                     | Method | Auth     | Description              |
|---------------------------|--------|----------|--------------------------|
| `/api/health`             | GET    | No       | Health check             |
| `/api/auth/register`      | POST   | No       | Create user              |
| `/api/auth/login`         | POST   | No       | Authenticate user        |
| `/api/auth/me`            | GET    | Yes      | Current user profile     |
| `/api/auth/refresh`       | POST   | No       | Refresh access token     |
| `/api/tariffs`            | GET    | No       | Parking rates            |
| `/api/schedule`           | GET    | No       | Operating hours          |
| `/api/parking/availability` | GET  | No       | Spot availability stats  |

## Environment Variables

| Variable            | Default                                          | Description            |
|---------------------|--------------------------------------------------|------------------------|
| `PORT`              | `3000`                                           | Server port            |
| `NODE_ENV`          | `development`                                    | Environment            |
| `MONGODB_URI`       | `mongodb://127.0.0.1:27017/punto-park-u`         | MongoDB connection URI |
| `JWT_SECRET`        | —                                                | JWT signing secret     |
| `JWT_REFRESH_SECRET`| —                                                | Refresh token secret   |
| `CORS_ORIGIN`       | `http://localhost:5173`                           | Allowed CORS origin    |
| `VAPID_PUBLIC_KEY`  | —                                                | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | —                                                | Web Push VAPID private key |
| `VAPID_SUBJECT`     | `mailto:admin@puntoparku.com`                    | VAPID subject (contact) |

### Generating VAPID Keys

Push notifications require VAPID keys. Generate them once and add to `.env`:

```bash
npx web-push generate-vapid-keys
```

Copy the output values into `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in your `.env` file.

## Scripts

```bash
npm run dev    # Start with nodemon (auto-restart on changes)
npm start     # Start in production mode
```
