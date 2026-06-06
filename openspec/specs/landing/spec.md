# Domain: Landing Page

## Source
- Vanilla: `C:\Projects\Punto-Park-U-Web\index.html`
- Styles: `C:\Projects\Punto-Park-U-Web\Styles.css`

## Sections (from vanilla)
1. **Hero** — Background image, overlay, title "PUNTO PARK U", subtitle
2. **Why Us** (`#why`) — 4 cards: 24/7 Surveillance, Secure Spaces, Affordable Rates, Prime Location
3. **About** (`#about`) — History section with image, Mission & Vision cards
4. **Pricing** (`#pricing`) — Rate cards for Car ($3k/hr), Motorcycle ($1.5k/hr), SUV ($3.5k/hr), Bicycle ($1k/hr)
5. **Availability** (`#availability`) — Real-time gauge widgets for Cars, Motorcycles, Bicycles
6. **Flux AI** (`#flux-AI`) — Technology showcase with 3-step explanation
7. **Location** (`#locations`) — Address, schedule, map, directions button
8. **Footer** — Logo, brand, contact info, copyright
9. **WhatsApp Float** — Floating button with SVG icon
10. **Scroll Top** — Back-to-top button

## Key Behaviors
- Animated hamburger menu with SVG vehicle icons
- Mobile overlay with slide-in navigation
- Smooth scroll with header offset compensation
- Live timestamp update (every second)
- localStorage integration for pricing and schedule (from admin panel)
- Intersection Observer for nav highlight on scroll
- Auto-year in footer

## Migration Notes
- Refactor into React components by section
- Replace vanilla IntersectionObserver with React hooks
- Replace setInterval with useEffect + useRef
- Extract localStorage logic into Zustand store
- Use React Router for navigation links (Login, Admin)
- Keep all CSS variables and dark mode tokens
