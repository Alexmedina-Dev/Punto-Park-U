# Domain: Reservations

## Source
- **New feature** — not fully implemented in vanilla (uses static data with localStorage)

## Features
1. **Real-time Availability** — Live parking spot status
   - Cars: 20 spots (tracked)
   - Motorcycles: 20 spots (tracked)
   - Bicycles: 10 spots (tracked)
2. **Spot Assignment** — Intelligent assignment algorithm (Flux AI Module 2)
   - Filter by vehicle type
   - Score by proximity, size match, covered/shaded
3. **Reservation Flow** — User selects duration → system assigns spot → confirm
4. **Active Reservations** — View, extend, or cancel
5. **History** — Past reservations with details

## Migration Notes
- Build from scratch in React + TypeScript
- Implement WebSocket (socket.io) for real-time updates
- Create Zustand store for reservation state
- Connect to backend API for reservation CRUD
- Visualize availability with live gauge components
