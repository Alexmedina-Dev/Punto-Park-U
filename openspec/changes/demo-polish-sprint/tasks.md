# Tasks: Demo Data & Polish Sprint

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550–750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: seeder, email service, spot availability API | PR 1 | `backend/` only |
| 2 | Frontend: spot selector + form wiring | PR 2 | Depends on Unit 1 API contract |
| 3 | Live landing/dashboard + integration | PR 3 | Depends on Units 1–2 |

## Phase 1: Foundation — Demo Seed Data & Email Service

- [ ] 1.1 Add `resend` dep and env vars (`RESEND_API_KEY`, `emailFrom`) in `backend/package.json` and `backend/src/config/index.js`. Effort: S. Deps: none.
- [ ] 1.2 Create `backend/src/services/emailService.js` (ResendProvider / ConsoleProvider factory) and `emailTemplates.js`. Effort: M. Deps: 1.1.
- [ ] 1.3 Wire `emailService` into `backend/src/controllers/authController.js` for verification + reset. Effort: S. Deps: 1.2.
- [ ] 1.4 Extend `backend/src/controllers/publicController.js` `getParkingSpots` with `date/startTime/endTime` overlap filter. Effort: M. Deps: none.
- [ ] 1.5 Update `packages/shared-api/src/parking.service.ts` to pass time-range query params. Effort: S. Deps: 1.4.
- [ ] 1.6 Add `--demo` flag and entity helpers to `backend/src/utils/seeder.js`. Effort: L. Deps: none.
- [ ] 1.7 Add idempotency checks (`email`, `plate`, `code`) and `--down` cleanup for demo entities only. Effort: S. Deps: 1.6.

## Phase 2: Core — Reservation Spot Selection

- [x] 2.1 Create `src/components/SpotSelector.tsx` grid with available/occupied/selected states and vehicle-type filter. Effort: M. Deps: 1.4, 1.5.
- [x] 2.2 Add `spotId` to `src/components/ReservationForm.tsx` state and render `SpotSelector` after vehicle pick. Effort: S. Deps: 2.1.
- [x] 2.3 Connect `SpotSelector` to `getParkingSpotsService(type, date, startTime, endTime)`. Effort: S. Deps: 1.5, 2.2.

## Phase 3: Integration — Live Landing Data

- [ ] 3.1 Remove `??` defaults from `src/sections/AvailabilitySection.tsx`; add "— / No hay datos" empty state. Effort: S. Deps: none.
- [ ] 3.2 Add 30s `setInterval` polling to `src/pages/LandingPage.tsx` for `fetchAvailability` with cleanup. Effort: S. Deps: 3.1.
- [ ] 3.3 Bind `src/pages/UserDashboard.tsx` membership badge to `reservationStats.completed`; progress bar = `(completed/30)*100`. Effort: S. Deps: none.

## Phase 4: Verification — Integration & Deploy

- [ ] 4.1 Run `node backend/src/utils/seeder.js --demo` and assert DB counts. Effort: S. Deps: 1.7.
- [ ] 4.2 Verify real email delivery via Resend dashboard on register. Effort: S. Deps: 1.3.
- [ ] 4.3 E2E walkthrough: seed → register → verify → reserve with spot → landing stats match DB. Effort: M. Deps: 1.7, 1.3, 2.3, 3.2, 3.3.
- [ ] 4.4 Run `npm run build` with zero TypeScript errors. Effort: S. Deps: 2.3, 3.2, 3.3.
