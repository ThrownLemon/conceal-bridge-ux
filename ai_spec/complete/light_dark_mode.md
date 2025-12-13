# Spec: Light/Dark Mode — conceal Bridge UX

> [!NOTE]
> **Status: Implemented**

## Context
- The app is currently **dark-only** (`color-scheme: dark` in `:root`).
- Conceal branding tokens were recently introduced in `styles.css`.
- Tailwind v4 is used for styling.
- User wants to support both Light and Dark modes.

## Goal
Implement a robust Light/Dark mode system that:
1.  Defaults to **system preference** but allows **user override**.
2.  Persists user preference (localStorage).
3.  Maps existing Conceal brand tokens to appropriate Light mode values.
4.  Updates the UI to include a Theme Toggle switch (likely in the header).

## Token Mapping Strategy

The existing dark tokens need semantic opposites for light mode.

| Token | Dark (Current) | Light (Proposed) | Intent |
| :--- | :--- | :--- | :--- |
| `--cb-color-bg` | `#000000` (Black) | `#ffffff` (White) | App background |
| `--cb-color-surface` | `#101010` (Off-black) | `#f3f4f6` (Gray-100) | Cards/Panels |
| `--cb-color-border` | `#808080` (Gray) | `#e5e7eb` (Gray-200) | Borders |
| `--cb-color-text` | `#ffffff` (White) | `#0f172a` (Slate-900) | Primary text |
| `--cb-color-muted` | `#9CA3AF` (Gray-400) | `#64748b` (Slate-500) | Secondary text |
| `--cb-color-accent` | `#f59e0b` (Amber-500) | `#d97706` (Amber-600) | Primary CTA (darker in light mode for contrast) |
| `--cb-color-accent-2` | `#00F0FF` (Cyan) | `#0891b2` (Cyan-600) | Secondary accent (darker in light mode) |

## Implementation Strategy

### 1. CSS Variables via `@media (prefers-color-scheme)` and `.dark` class
- Move default token definitions into a `:root` block that uses light values by default (or keeps dark if we want dark default).
- Actually, better:
    - Use Tailwind's `darkMode: 'selector'` strategy (class-based).
    - Define variables for `:root` (Light default) and `.dark` (Dark override).
    - **Decision**: Use standard CSS variables updated by a `.dark` class check on `<html>`. This allows manual toggling.

### 2. Theme Service (`ThemeService`)
- **State**: `signal<Theme>('system' | 'light' | 'dark')`
- **Effect**:
    - On init: Read localStorage -> check system pref -> apply class to `<html>`.
    - On change: Update localStorage -> update class.
    - Syncs `color-scheme` property in CSS.

### 3. UI Component (`ThemeToggleComponent`)
- A simple button/icon switch.
- Placed in `HeaderComponent` (or existing layout in `app.html`).

## Documentation Updates (Required)
- `ai_docs/style_guide.md`: Update "Dark mode" section to reflect dual-mode support and explain the token mapping.
- `ai_docs/angular_best_practices.md`: Update "State Management" example if we use a new service pattern? (Probably not needed).
- `ai_spec/light_dark_mode.md`: This file, mark as Implemented when done.

## Risks
- **Contrast**: Light mode needs careful checking of "white text on yellow buttons" (might need black text) vs "dark text on yellow buttons".
    - *Mitigation*: The `accent` token in light mode is `amber-600`. We need to ensure text on buttons uses a contrast-safe color.
    - *Refactor*: We likely need to find and replace `bg-slate-950` with a bg token helper.

## Verification
- Manual toggle test.
- Check persistence after reload.
- Visual inspection of contrast.
