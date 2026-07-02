# Design: Demo Data & Polish Sprint

## Technical Approach

Expand the existing seeder with a `--demo` flag, introduce an email provider abstraction over Resend, extend the public spots endpoint with time-range overlap filtering, and replace frontend hardcoded defaults with live Zustand store data plus a 30-second polling loop.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Seeder structure | Single file, functions per entity, `--demo` flag | Separate `demoSeeder.js` | Keeps one entry point; avoids confusing existing `--down` |
| Email provider | Resend SDK + Console fallback via factory | Nodemailer SMTP | Resend SDK is less config, gives dashboard visibility; Console keeps local dev frictionless |
| Spot availability | Extend `GET /api/public/parking/spots` with `date/startTime/endTime` | New `/spots/available` route | Reuses existing controller/route; no new public surface area |
| Landing polling | `useEffect` + `setInterval(30s)` in `LandingPage` | React Query / WebSocket | Zustand already owns data; avoids adding a dependency |
| Membership badge | Derive from `reservationStats.completed` | New dedicated endpoint | Stats endpoint already exists; zero backend work |

## Data Flow

```
Seeder --creates--> MongoDB
LandingPage --30s--> appStore.fetchAvailability --> publicController.getAvailability --> MongoDB
ReservationForm --vehicle selected--> SpotSelector
  --> getParkingSpotsService(type,date,time) --> GET /public/parking/spots --> MongoDB
AuthController --> emailService.send*() --> Resend API (or console)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/utils/seeder.js` | Modify | Add `seedDemo()`, entity helpers, `--demo` flag. Keep existing minimal seed as default. |
| `backend/src/services/emailService.js` | Create | `EmailProvider` interface, `ResendProvider`, `ConsoleProvider`, factory based on `RESEND_API_KEY`. |
| `backend/src/services/emailTemplates.js` | Create | HTML string templates: verification link, password reset. |
| `backend/src/controllers/authController.js` | Modify | Replace `console.log` mocks with `emailService.sendVerificationEmail()` / `sendPasswordResetEmail()`. |
| `backend/src/controllers/publicController.js` | Modify | Extend `getParkingSpots` to accept `date`, `startTime`, `endTime` and exclude overlapping reservations. |
| `backend/src/config/index.js` | Modify | Add `resendApiKey` and `emailFrom` fields. |
| `backend/package.json` | Modify | Add `resend` dependency. |
| `packages/shared-api/src/parking.service.ts` | Modify | `getParkingSpotsService` accepts optional `{ type?, date?, startTime?, endTime? }` and forwards as query params. |
| `src/components/SpotSelector.tsx` | Create | Grid of spots with states: available, occupied, selected. Shows zone label. |
| `src/components/ReservationForm.tsx` | Modify | Add `spotId` to form state; render `SpotSelector` after vehicle selection; pass vehicle type as filter. |
| `src/sections/AvailabilitySection.tsx` | Modify | Remove `??` hardcoded defaults; show "--" / "Sin datos" when `stats` missing. |
| `src/pages/LandingPage.tsx` | Modify | Add `useEffect` interval (30s) calling `fetchAvailability()`; cleanup on unmount. |
| `src/pages/UserDashboard.tsx` | Modify | Bind membership badge visit count to `reservationStats?.completed`; progress bar = `min(100, (completed / 30) * 100)`. |

## Interfaces / Contracts

### Extended public spots query
```
GET /api/public/parking/spots?type=car&date=2025-07-01&startTime=09:00&endTime=12:00
```
Returns spots of the requested type that do **not** have a `pending` or `active` reservation overlapping the requested window.

### Email provider contract (plain JS)
```js
class EmailProvider {
  async send({ to, subject, html }) { /* ... */ }
}
```
Factory returns `ResendProvider` when `RESEND_API_KEY` is present, otherwise `ConsoleProvider`. Failures are caught, logged, and never block the auth response.

### SpotSelector props
```ts
interface SpotSelectorProps {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  onSelect: (spotId: string) => void;
  vehicleType: VehicleType;
  isLoading: boolean;
}
```

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Integration | Seeder `--demo` produces expected counts | Run `node seeder.js --demo`, assert DB counts |
| Integration | Email factory falls back to console when key missing | Run register with `RESEND_API_KEY` unset |
| E2E | Full demo walkthrough | Seed → register → verify email → create reservation with spot → landing stats reflect DB state |

## Migration / Rollout

No database migration. The seeder is idempotent (checks `email`, `plate`, `code` before insert). Email degrades to console fallback if `RESEND_API_KEY` is absent. Reverting seeder data: run `node seeder.js --down`.

## Open Questions

- [ ] Should `--down` also remove demo-generated users, vehicles, and reservations? (Recommended: yes, extend `down()` to clean all seeded entities.)
- [ ] Should `SpotSelector` block submission if no spot is selected, or is spot optional? (Recommended: make it required for the demo flow.)
