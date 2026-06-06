# UI Primitives Specification

## Purpose

Shared component library (Button, Input, Card, Badge, Modal) built with Tailwind CSS and typed TypeScript props. Every future phase and page consumes these base components. Visuals must match the vanilla reference when ported design tokens are applied.

## Requirements

| # | Requirement | Strength | Migration Delta |
|---|------------|----------|-----------------|
| R1 | Button: variants `primary | secondary | outline | ghost`; sizes `sm | md | lg`; `disabled` and `loading` states | MUST | New — vanilla used raw `<button>` with CSS classes |
| R2 | Button renders with `data-testid="btn-{variant}"` attribute | MUST | New |
| R3 | Input: `label`, `error` message, `type` variants, `disabled`, controlled via `value`/`onChange` | MUST | New — vanilla used plain `<input>` |
| R4 | Card: `padding` sizes, optional `title`, children slot, `variant: default | glass` | MUST | Ports vanilla card patterns (`.why-card`, `.rate-card`) |
| R5 | Badge: variants `success | warning | error | info`, optional `dot` indicator, children for text | MUST | New — replaces vanilla inline badge markup |
| R6 | Modal: `open`/`onClose` props, title, children body, optional footer, backdrop click to close | MUST | New — vanilla had no modal component |
| R7 | All components accept standard HTML props via `className` override and `...rest` spread | MUST | New |
| R8 | All components typed with TypeScript interfaces (no `any` for public props) | MUST | New |

### Scenario: Primary button renders
- GIVEN `<Button variant="primary">Reservar</Button>`
- WHEN rendered
- THEN button has primary background (`bg-primary`), white text, rounded corners
- AND `data-testid="btn-primary"` is present

### Scenario: Button disabled
- GIVEN `<Button disabled>Submit</Button>`
- WHEN rendered
- THEN button has reduced opacity, `cursor-not-allowed`
- AND click handler does not fire

### Scenario: Input with error
- GIVEN `<Input label="Email" error="Invalid email" />`
- WHEN rendered
- THEN label displays "Email"
- AND red error text "Invalid email" appears below
- AND input has red border

### Scenario: Modal open and close
- GIVEN `<Modal open={true} onClose={fn} title="Confirm">...</Modal>`
- WHEN rendered
- THEN modal overlay is visible
- AND backdrop click calls `onClose`
- AND Escape key calls `onClose`

### Scenario: Badge with dot
- GIVEN `<Badge variant="success" dot>Active</Badge>`
- WHEN rendered
- THEN green dot indicator appears before "Active" text

### Scenario: Card with glass variant
- GIVEN `<Card variant="glass" title="Info">Content</Card>`
- WHEN rendered
- THEN card has glassmorphism styling matching theme `.glass` utility
- AND title "Info" renders above children

## Dependencies

- Tailwind CSS v3.4 (theme tokens from theme-system spec)
- React 18, TypeScript 5.x
- All components in `src/components/ui/`
