# UX & Styling Expert Mental Model

> **Context**: This file represents the "expert knowledge" for User Experience and Design within the Conceal Bridge project.

## Design System (Conceal Brand)

### 1. Tailwind Configuration

- **Version**: Tailwind CSS v4.
- **Mental Model**: Utility-first. Only extract to `@apply` if the class string exceeds ~5-6 utilities and is reused >3 times.

### 2. Color Palette

- **Theme**: "Space Dark" / "Cyberpunk Lite".
- **Primary Background**: `bg-slate-950` (Not pure black).
- **Surface**: `bg-slate-900` or `bg-white/5` (Glassmorphism).
- **Primary CTA**: `amber-500` (Deep Yellow).
- **Text**:
  - Headings: `text-white` or `text-slate-100`.
  - Body: `text-slate-300`.
  - Muted: `text-slate-500`.

### 3. Interactive Elements

- **Rule**: All interactive elements (buttons, links) MUST have a hover state and a focus state.
- **Pattern**: `hover:bg-amber-400 transition-colors duration-200`.
- **Keyboard Nav**: Ensure `focus-visible:ring` is present (Tailwind usually handles this, but don't remove outline without replacement).

## Components

### Wallet Button

- **State**: Needs to handle:
  - Disconnected (Connect)
  - Connecting (Spinner)
  - Connected (Show Address shortened + Avatar/Identicon)
  - Wrong Network (Red/Warning)

### Modals

- **Backdrop**: usage `backdrop-blur-sm bg-black/50`.
- **Animation**: Fade in/out.

## Assets

- Use SVG for icons (embedded or via a library like `lucide-angular` or `heroicons`).
- Avoid large PNGs.
