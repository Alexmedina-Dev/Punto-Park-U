# Theme System Specification

## Purpose

Tailwind CSS v3.4 configuration with a custom dark-mode theme ported from vanilla `Styles.css` CSS custom properties. Provides color tokens, glassmorphism/brutal-shadow/neon-glow utilities, custom fonts (Manrope, Space Grotesk), and Material Symbols integration.

## Requirements

| # | Requirement | Strength | Migration Delta |
|---|------------|----------|-----------------|
| R1 | Tailwind `darkMode: "class"` — toggled via `.dark` on `<html>` | MUST | Replaces OS-level `color-scheme: dark`; now user-controllable |
| R2 | Color tokens in `theme.extend.colors` matching all vanilla `:root` variables | MUST | Direct port — `--bg` → `bg`, `--primary` → `primary`, `--surface-high` → `surface-high`, etc. |
| R3 | Font families: `font-headline` (Manrope), `font-body` (Manrope), `font-label` (Space Grotesk) | MUST | Direct port |
| R4 | Border radius tokens: `radius-sm`, `radius-md`, `radius-lg`, `radius-full` | MUST | Direct port |
| R5 | Glassmorphism utility: `glass` class with `bg-white/3`, `backdrop-blur`, white border | MUST | Direct port of `.glass` |
| R6 | Shadow utilities: `shadow-brutal`, `shadow-glow` (neon glow) | MUST | Direct port of `--shadow-brutal` / `--glow-primary` |
| R7 | Animation utilities: `animate-pulse-red`, `animate-spin` | SHOULD | Ported from `@keyframes pulse-red` and `@keyframes spin` |
| R8 | CSS reset: box-sizing, margin/padding reset, smooth scroll, selection color | MUST | Ported from vanilla `*` and `html`/`body` reset |
| R9 | Material Symbols loaded via Google Fonts CDN with `font-variation-settings` | MUST | Direct port |
| R10 | Dark mode toggle persists preference in `localStorage` | SHOULD | New — vanilla had no persistence |

### Scenario: Tailwind tokens match vanilla visually
- GIVEN a component uses `bg-bg text-on-bg border-outline`
- WHEN rendered in a browser
- THEN colors visually match the vanilla `Styles.css` reference at `C:\Projects\Punto-Park-U-Web`
- AND all surface variants (`surface-low`, `surface-container`, `surface-high`, `surface-highest`) render correctly

### Scenario: Dark mode toggle
- GIVEN the `<html>` element has no `.dark` class (light mode)
- WHEN user triggers dark mode toggle
- THEN `.dark` class is added to `<html>`
- AND Tailwind `dark:` variants activate

### Scenario: Glass component renders
- GIVEN a `<div className="glass">` element
- WHEN rendered
- THEN element has translucent white background, backdrop blur, and subtle white border
- AND visual matches vanilla `.glass` reference

### Scenario: Custom font applies
- GIVEN an element with `font-label` class
- WHEN rendered
- THEN text uses "Space Grotesk" with uppercase, wide letter-spacing styling

## Dependencies

- Tailwind CSS v3.4, PostCSS, autoprefixer
- Reference: `C:\Projects\Punto-Park-U-Web/Styles.css` (lines 1–32, 92–105, 106–158)
- Google Fonts: Manrope (400,600,700,900), Space Grotesk (400,700)
