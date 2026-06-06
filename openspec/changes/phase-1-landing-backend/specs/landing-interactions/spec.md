# Landing Interactions Specification

## Purpose

Implement all interactive behaviors from the vanilla landing page: animated hamburger menu with SVG vehicle morphing, IntersectionObserver-based nav highlighting, smooth scroll with header offset, counter animations, and a live timestamp updating every second.

## Requirements

### Requirement: Animated Hamburger Menu with SVG Vehicle Morphing

The mobile menu toggle button MUST display three SVG vehicle icons (car → moto → bike) that alternate on each toggle click, cycling through the sequence.

#### Scenario: Hamburger opens and shows first vehicle icon

- GIVEN the viewport is mobile-width and the hamburger menu is closed
- WHEN the user clicks the hamburger button
- THEN the mobile overlay SHALL slide in
- AND the SVG SHALL show the "car" icon on first open
- AND body scroll SHALL be locked

#### Scenario: Hamburger cycles vehicle icons on toggle

- GIVEN the hamburger shows the "car" icon
- WHEN the user clicks to close and re-open
- THEN the SVG SHALL show the "moto" icon
- AND on the next toggle cycle, the SVG SHALL show the "bike" icon

#### Scenario: Mobile link closes overlay

- GIVEN the mobile overlay is open
- WHEN the user clicks any `.mobile-link`
- THEN the overlay SHALL close
- AND body scroll SHALL be restored

### Requirement: Smooth Scroll with Header Offset

All anchor links (`#section`) MUST scroll smoothly to their target with an offset equal to the header height plus 15px buffer.

#### Scenario: Desktop nav link scrolls to section

- GIVEN the user is on the landing page
- WHEN the user clicks a desktop nav link (e.g., `#pricing`)
- THEN the page SHALL scroll smoothly to the target section
- AND the scroll position SHALL account for the header offset

#### Scenario: Mobile nav link closes overlay then scrolls

- GIVEN the mobile overlay is open
- WHEN the user clicks a mobile nav link
- THEN the overlay SHALL close first
- AND after the close animation (520ms), the page SHALL scroll to the target section

### Requirement: IntersectionObserver Nav Highlighting

The active nav link MUST highlight (change to primary color) when its corresponding section enters the viewport at 35% threshold.

#### Scenario: Nav highlights on section enter

- GIVEN the user scrolls the landing page
- WHEN a section (e.g., `#pricing`) enters the viewport with ≥35% visibility
- THEN the corresponding nav link SHALL change color to `var(--primary)`
- AND all other nav links SHALL revert to their default color

#### Scenario: Multiple sections partially visible

- GIVEN two sections are partially in viewport
- WHEN IntersectionObserver fires
- THEN only the section with the highest intersection ratio SHALL trigger its nav link highlight

### Requirement: Live Timestamp in Footer

The footer MUST display the current time in `es-CO` locale that updates every second.

#### Scenario: Timestamp updates every second

- GIVEN the landing page is loaded
- WHEN 1 second passes
- THEN the `current-time` element SHALL update to `new Date().toLocaleTimeString("es-CO")`
- AND the update SHALL continue every second while the page is mounted

#### Scenario: Timestamp cleans up on unmount

- GIVEN the timestamp interval is running
- WHEN the component unmounts (user navigates away)
- THEN the interval SHALL be cleared to prevent memory leaks

### Requirement: Counter Animations for Availability Stats

Availability stat numbers SHALL animate from 0 to their target value when scrolled into view.

#### Scenario: Counter animates on scroll-into-view

- GIVEN an availability stat shows "9/20" for cars
- WHEN the Availability section enters the viewport
- THEN the number "9" SHALL animate from 0 to 9 over ~800ms
- AND the animation SHALL use an easing function

### Acceptance Criteria

- [ ] Animated hamburger cycles SVG icons (car → moto → bike) on toggle
- [ ] Mobile overlay opens/closes with slide transition and body scroll lock
- [ ] Desktop nav links scroll smoothly with header offset
- [ ] Active nav link highlights on scroll via IntersectionObserver
- [ ] Live timestamp updates every second in footer and cleans up on unmount
- [ ] Counter numbers animate on Availability section scroll-into-view

### Migration Delta

| Vanilla | React |
|---------|-------|
| `setInterval` in `<script>` tag | `useEffect` + `useRef` hooks, cleanup on unmount |
| Vanilla `IntersectionObserver` on DOM | Custom `useScrollSpy` hook |
| `element.classList.toggle("active")` | Zustand `appStore.isMobileMenuOpen` + Framer Motion |
| Vanilla scroll event + threshold | `useCounter` hook with IntersectionObserver trigger |
| Direct `<svg>` tags in HTML | SVG path data ported verbatim into React component |
| `window.addEventListener("scroll")` | `useScrollSpy` + `useEffect` with cleanup |

### Dependencies

- Phase 0: React 18, Tailwind CSS, Zustand, Framer Motion
- `src/stores/appStore.ts` — `isMobileMenuOpen` state
- `src/components/layout/Header.tsx` — hamburger integration
- `src/components/layout/Footer.tsx` — live timestamp
- Custom hooks: `useScrollSpy`, `useCounter`, `useLiveClock`
- Reference: `C:\Projects\Punto-Park-U-Web\index.html` lines 74-90, 570-697
