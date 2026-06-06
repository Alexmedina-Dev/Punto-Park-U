# Domain: API (Backend)

## Source
- **New feature** — vanilla project uses localStorage only

## Endpoints (planned)

### Auth
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login (returns JWT)
- `POST /api/auth/admin/login` — Admin login
- `POST /api/auth/refresh` — Refresh JWT token
- `GET /api/auth/me` — Current user profile

### Users
- `GET /api/users` — List users (admin)
- `GET /api/users/:id` — User details
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user (admin)

### Vehicles
- `GET /api/vehicles` — User's vehicles
- `POST /api/vehicles` — Register vehicle
- `PUT /api/vehicles/:id` — Update vehicle
- `DELETE /api/vehicles/:id` — Delete vehicle

### Reservations
- `GET /api/reservations` — List reservations
- `POST /api/reservations` — Create reservation
- `PUT /api/reservations/:id` — Update/extend
- `DELETE /api/reservations/:id` — Cancel
- `GET /api/reservations/availability` — Current availability

### Parking
- `GET /api/parking/spots` — List all spots
- `PUT /api/parking/spots/:id` — Update spot (admin)
- `GET /api/parking/stats` — Occupancy statistics

### Admin
- `GET /api/admin/reports` — Generate reports
- `PUT /api/admin/tariffs` — Update pricing
- `PUT /api/admin/schedule` — Update hours
- `GET /api/admin/activity` — Recent activity log

## Tech Stack
- Node.js + Express
- MongoDB Atlas (M0 free tier, 512MB)
- Mongoose ODM
- JWT + bcryptjs
- socket.io for real-time
- Deploy: Railway free tier
