# Proposal: Demo Data & Polish Sprint

## Intent

The system is functionally complete but demo-unready: empty dashboards, hardcoded stats, no real email delivery, and reservations missing parking spot selection. The Friday July 3rd presentation risks being underwhelming without realistic live data and smooth user flows.

## Scope

### In Scope
- Rich demo seed: 50 parking spots, 10 users, 30 reservations (mixed statuses), 15 vehicles, activity logs (30 days)
- Reservation spot selection: vehicle-type-filtered spot picker integrated into ReservationForm
- Real email: Nodemailer + Resend integration replacing console.log for verification and password reset
- Live landing data: replace hardcoded availability fallbacks (8/20, 7/20, 3/10) and static "24 visitas" badge with API-driven values
- Empty-state handling: show "No data yet" placeholders when API returns empty instead of stale defaults

### Out of Scope
- Hardware (cameras, LED, barriers, sensors)
- Real ePayco payments (stays sandbox/mock)
- SMS/Twilio, AI/ML (Flux AI stays docs-only)
- Mobile app (Expo) verification or build
- Production credentials for email or payments

## Capabilities

### New Capabilities
- `demo-seed-data`: Rich seeder generating spots, users, vehicles, reservations, and activity logs for demo readiness
- `email-service`: Nodemailer + Resend integration for transactional emails (verification, password reset)

### Modified Capabilities
- `reservations`: Add parking spot selection to reservation form — vehicle-type filtered, real-time availability
- `landing`: Connect availability stats to live API data; remove hardcoded `??` fallback defaults; add empty-state handling
- `user-panel`: Bind membership badge progress bar and visit count to real reservation history stats

## Approach

Incremental, no breaking changes. Priority order:
1. **Seeder upgrade** — expand `seeder.js` to generate spots, users, vehicles, reservations, activity logs
2. **Email service** — add `nodemailer` + Resend SDK, create `emailService.js`, wire into authController
3. **Spot selection** — add `spotId` field to ReservationForm props/state, filter spots by vehicle type, show availability
4. **Landing data** — remove `??` hardcoded defaults from AvailabilitySection, add empty-state handling, bind membership stats to reservation count

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/utils/seeder.js` | Modified | Expanded demo seed data generation |
| `backend/src/services/emailService.js` | New | Email delivery service (Nodemailer + Resend) |
| `backend/src/controllers/authController.js` | Modified | Wire email service into verification + password reset |
| `src/components/ReservationForm.tsx` | Modified | Add spotId field, spot selector UI |
| `src/sections/AvailabilitySection.tsx` | Modified | Remove hardcoded `??` defaults; add empty states |
| `src/pages/UserDashboard.tsx` | Modified | Live membership badge stats |
| `src/pages/LandingPage.tsx` | Modified | Error/empty-state handling |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Render cold start kills demo (free tier hibernation) | High | Pre-warm 30 min before; local backup on dev laptop |
| Email provider rate limits block during demo | Low | Pre-verify test accounts; keep console.log fallback |
| Seeder data exceeds MongoDB M0 512MB limit | Low | Cap at 30 reservations, 30-day logs; validate post-seed |

## Rollback Plan

- Seed revert: `node seeder.js --down` restores minimal seed
- Email: env-flag `EMAIL_ENABLED=false` falls back to console.log
- Frontend: revert 3 component files; no DB migration

## Dependencies

- Resend API key (free tier: 100 emails/day) → `.env` as `RESEND_API_KEY`
- `nodemailer` + `resend` npm packages in backend `package.json`

## Success Criteria

- [ ] Landing page shows live availability numbers matching actual DB state
- [ ] User dashboard shows real visit count from reservation history
- [ ] Reservation form includes spot selector filtered by vehicle type
- [ ] Email verification sends real email (visible in Resend dashboard)
- [ ] Fresh seed → register → verify → reserve → admin view walkthrough works (no console.log fallbacks)
- [ ] `npm run build` passes with zero TypeScript errors
