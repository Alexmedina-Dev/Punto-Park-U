# Landing Sections Specification

## Purpose

Complete all 10 landing-page sections matching the vanilla `index.html` reference at visual parity. This spec covers the 5 sections NOT yet implemented: Hero (with bg image overlay), Mission/Vision cards, Flux AI 3-step numbered process, WhatsApp floating button, and Scroll-to-top button.

## Requirements

### Requirement: Hero Section with Background Image

The landing page Hero section MUST render a full-viewport background image with a dark overlay and centered title text.

#### Scenario: Hero renders with background and overlay

- GIVEN the user loads the landing page
- WHEN the Hero section is in viewport
- THEN the system SHALL display the hero background image (`hero-background.png`) with a semi-transparent dark overlay on top
- AND the title "PUNTO PARK U" and subtitle "Estacionamiento Fácil y Sencillo" SHALL be centered over the overlay

#### Scenario: Hero image fails to load

- GIVEN the hero background image is unavailable
- WHEN the browser cannot load the image
- THEN the overlay SHALL still render with the title text
- AND the section SHALL NOT appear broken

### Requirement: Mission and Vision Cards

The About section MUST include two side-by-side cards: Mission and Vision, matching the vanilla layout.

#### Scenario: Dual cards render in About section

- GIVEN the user scrolls to the About (`#about`) section
- WHEN the section renders
- THEN a "Nuestra Misión" card with rocket icon SHALL appear
- AND a "Nuestra Visión" card with visibility icon SHALL appear next to it
- AND both cards MUST contain the exact text from the vanilla reference

#### Scenario: Responsive layout on mobile

- GIVEN the viewport is narrower than 768px
- WHEN the About section renders
- THEN Mission and Vision cards SHALL stack vertically

### Requirement: Flux AI 3-Step Numbered Process

The Flux AI section MUST render a numbered 3-step process (1-2-3) with titles and descriptions matching the vanilla reference exactly.

#### Scenario: Steps render in order

- GIVEN the user navigates to the Flux AI (`#flux-AI`) section
- WHEN the section is rendered
- THEN step "1 — Visión Computacional" SHALL appear first
- AND step "2 — Asignación Inteligente" SHALL appear second
- AND step "3 — Analítica Predictiva" SHALL appear third
- AND each step SHALL display its description text from the vanilla reference

#### Scenario: Latency badge displays

- GIVEN the Flux AI section is visible
- WHEN the latency badge renders
- THEN it SHALL display "Latencia Flux" with value "0.8 seg"

### Requirement: WhatsApp Floating Button

A fixed WhatsApp button MUST float at the bottom-right corner of every page and link to the business WhatsApp number.

#### Scenario: Button links to WhatsApp

- GIVEN the WhatsApp float button is visible
- WHEN the user clicks the button
- THEN the browser SHALL open `https://wa.me/573101234567` with a pre-filled message in a new tab
- AND the button SHALL display the WhatsApp SVG icon from vanilla

#### Scenario: Button stays fixed on scroll

- GIVEN the user scrolls down the page
- WHEN the page position changes
- THEN the WhatsApp button SHALL remain fixed at the bottom-right corner

### Requirement: Scroll-to-Top Button

A scroll-to-top button MUST appear after the user scrolls 300px down and scroll smoothly back to the top on click.

#### Scenario: Button appears after scrolling

- GIVEN the page is scrolled less than 300px from top
- WHEN checking the ScrollTop button
- THEN the button SHALL be hidden

- GIVEN the user scrolls more than 300px from top
- WHEN the scroll position exceeds the threshold
- THEN the button SHALL become visible with a transition

#### Scenario: Click scrolls to top

- GIVEN the scroll-to-top button is visible
- WHEN the user clicks the button
- THEN the page SHALL scroll smoothly to the top (`window.scrollY = 0`)
- AND the scroll behavior MUST be "smooth"

### Acceptance Criteria

- [ ] Landing page renders all 10 sections matching vanilla `index.html` visually
- [ ] Hero background image loads with dark overlay
- [ ] Mission/Vision cards appear side-by-side (stack on mobile)
- [ ] Flux AI shows 3 numbered steps (1, 2, 3) with descriptions
- [ ] WhatsApp float button links to correct number with SVG icon
- [ ] Scroll-to-top button appears at 300px and scrolls smoothly to top

### Migration Delta

| Vanilla | React |
|---------|-------|
| HTML `<section>` with inline `<img>` | React components: `HeroSection`, `MissionVision`, `FluxAISteps` |
| WhatsApp `<a>` outside `<main>` | `WhatsAppFloat` component rendered in `Layout` shell |
| ScrollTop `<button>` outside `<main>` | `ScrollTopButton` component rendered in `Layout` shell |
| Static Flux AI description (vanilla parity) | Component with explicit step numbering |

### Dependencies

- Phase 0: Vite + React 18 + Tailwind CSS + Zustand + React Router
- `src/components/layout/Layout.tsx` — WhatsApp float + ScrollTop render here
- `src/pages/LandingPage.tsx` — Hero, Mission/Vision, Flux AI sections integrate here
- Reference: `C:\Projects\Punto-Park-U-Web\index.html` lines 112-123, 196-221, 396-458, 548-566
