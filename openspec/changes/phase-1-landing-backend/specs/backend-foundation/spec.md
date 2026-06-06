# Backend Foundation Specification

## Purpose

Scaffold the Node.js + Express backend project with a clean layered architecture: controllers, models, routes, middleware, config, and entry points. The backend SHALL be a standalone Express application under `backend/`.

## Requirements

### Requirement: Project Structure

The backend project MUST follow a layered structure with clear separation of concerns.

#### Scenario: Directory layout matches convention

- GIVEN the backend is initialized
- WHEN inspecting the `backend/` directory
- THEN it SHALL contain `src/` with subdirectories: `controllers/`, `models/`, `routes/`, `middleware/`, `config/`
- AND `src/app.js` SHALL configure Express middleware and mount routes
- AND `src/server.js` SHALL start the HTTP server

### Requirement: Environment Configuration

The backend MUST load configuration from environment variables via a centralized config module with sensible defaults for development.

#### Scenario: Config loads from env vars

- GIVEN a `.env` file with `PORT=4000`, `MONGODB_URI=mongodb://localhost:27017/punto-park-u`, `JWT_SECRET=dev-secret`
- WHEN `config/index.js` loads
- THEN `require('./config').port` SHALL be `4000`
- AND `require('./config').jwtSecret` SHALL be `dev-secret`

#### Scenario: Missing env vars use defaults

- GIVEN no `.env` file exists
- WHEN the server starts
- THEN `PORT` SHALL default to `3000`
- AND `MONGODB_URI` SHALL default to `mongodb://127.0.0.1:27017/punto-park-u`

### Requirement: Express Middleware Stack

The Express app MUST include standard middleware for JSON parsing, CORS, logging, and error handling.

#### Scenario: JSON body parsing works

- GIVEN a POST request with `Content-Type: application/json`
- WHEN the request reaches any route handler
- THEN `req.body` SHALL contain the parsed JSON object

#### Scenario: CORS allows frontend origin

- GIVEN the frontend runs on `http://localhost:5173`
- WHEN a cross-origin request is made from the frontend
- THEN the server SHALL respond with `Access-Control-Allow-Origin: http://localhost:5173`

#### Scenario: Global error handler catches unhandled errors

- GIVEN a route handler throws an uncaught error
- WHEN the error propagates to Express
- THEN the global error middleware SHALL return `{ error: "Internal server error" }` with status 500

### Requirement: MongoDB Connection

The server MUST connect to MongoDB Atlas on startup and expose the connection status.

#### Scenario: Successful connection on startup

- GIVEN a valid `MONGODB_URI` is configured
- WHEN `server.js` starts
- THEN Mongoose SHALL connect to MongoDB
- AND the console SHALL log "MongoDB connected"

#### Scenario: Connection failure handled gracefully

- GIVEN MongoDB is unreachable
- WHEN `server.js` attempts to connect
- THEN the server SHALL log the error and continue running
- AND the process SHALL NOT crash

### Requirement: Route Registration

All route modules MUST be mounted under their API prefix in `app.js`.

#### Scenario: Auth routes mounted

- GIVEN the Express app is configured
- WHEN a request hits `/api/auth/register`
- THEN the request SHALL be routed to `routes/auth.js`

#### Scenario: Public routes mounted

- GIVEN the Express app is configured
- WHEN a request hits `/api/tariffs`
- THEN the request SHALL be routed to `routes/public.js`

### Acceptance Criteria

- [ ] `backend/src/{controllers,models,routes,middleware,config}` directories exist
- [ ] `backend/src/app.js` configures Express with JSON, CORS, logging middleware
- [ ] `backend/src/server.js` starts the server and connects to MongoDB
- [ ] `backend/package.json` includes `express`, `mongoose`, `cors`, `dotenv`
- [ ] Global error handler returns consistent JSON error responses
- [ ] MongoDB connection failure does not crash the process

### Dependencies

- Node.js 18+ locally
- npm packages: `express`, `mongoose`, `cors`, `dotenv`, `morgan`
- MongoDB Atlas M0 cluster (env: `MONGODB_URI`)
