# Style Guide — conceal Bridge UX (AI Agent)

This guide defines **UI style conventions** for conceal Bridge UX (Angular 21 + Tailwind v4). It is designed to inform AI-assisted work so new UI matches the product’s current look and the Conceal brand.

Key implementation references:
- Tailwind entrypoint import: [`@import`](conceal-bridge-ux/src/styles.css:3)
- Global dark preference: [`color-scheme`](conceal-bridge-ux/src/styles.css:6)
- App shell styling: [`app.html`](conceal-bridge-ux/src/app/app.html:1)
- Primary CTA and focus ring examples: [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:185), [`WalletButtonComponent`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:30)
- Tailwind v4 CSS primitives: [`@layer`](conceal-bridge-ux/node_modules/tailwindcss/index.css:1), [`@theme`](conceal-bridge-ux/node_modules/tailwindcss/index.css:4)

---

## 0) Conceal brand direction (visual identity)

Brand description (provided):
- Darkened/obscured backgrounds
- Foreground text in greys/white for legibility
- A rich “deep yellow” used sparingly for emphasis/CTAs/borders
- Additional brand colors:
  - neutral gray: `#808080`
  - accent cyan: `#00F0FF`
  - black: `#000000`
- Fonts: Poppins, Lora, Montserrat

**How this maps to the current app:**
- The UI is already “dark-first” (see `bg-slate-950` usage in [`app.html`](conceal-bridge-ux/src/app/app.html:1)).
- Accent “deep yellow” is currently represented via Tailwind “amber” utilities (e.g. CTA button in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:185)).
- Secondary text already uses slate greys (`text-slate-300/400`) across pages (examples in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:76)).

**Rule:** keep yellow accents *intentional* (primary actions, focus rings, key highlights). Do not overuse.

---

## 1) Styling approach in this repo (Tailwind-first)

### 1.1 Tailwind v4 is imported via CSS (no config file required)
The app uses Tailwind v4 via a simple CSS import:
- [`@import`](conceal-bridge-ux/src/styles.css:3)

And PostCSS is configured to run Tailwind via:
- [`@tailwindcss/postcss`](conceal-bridge-ux/.postcssrc.json:3)

**Rule:** default to Tailwind utility classes in templates. Only introduce custom CSS when utilities become unreadable or repeated across many templates.

### 1.2 Where styles should live
- Global rules and design tokens: [`styles.css`](conceal-bridge-ux/src/styles.css:1)
- Component-scoped CSS: use `styleUrl` only when necessary (currently [`app.css`](conceal-bridge-ux/src/app/app.css:1) is intentionally empty)
- Templates: most styling is inline utility classes (see [`app.html`](conceal-bridge-ux/src/app/app.html:1))

**Rule:** do not create large custom stylesheet systems per-component; keep the Tailwind-first approach consistent.

---

## 2) Component styling patterns (project conventions)

The UI uses a small set of repeatable “patterns” composed from utilities. Prefer reusing these patterns over inventing new ones.

### 2.1 App shell
- Page background: dark, with subtle borders and blur in header
- Header/footer use thin, translucent borders (examples in [`app.html`](conceal-bridge-ux/src/app/app.html:2) and [`app.html`](conceal-bridge-ux/src/app/app.html:16))

Pattern:
- `bg-slate-950`
- `border-white/10`
- `backdrop-blur` for sticky header overlays

### 2.2 “Card / panel” surfaces
Common pattern across pages:
- border: `border border-white/10`
- surface: `bg-white/5` or `bg-slate-950/40`
- radius: `rounded-2xl` / `rounded-xl`
- padding: `p-4` / `p-5`

Example: step panels in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:102).

**Rule:** use low-contrast surfaces; avoid pure-white panels in the main dark UI.

### 2.3 Primary action button (“deep yellow”)
Primary CTAs use amber:
- Example: “Start swap” button in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:185)

Common pattern:
- background: `bg-amber-500`
- hover: `hover:bg-amber-400`
- text: `text-black` (high contrast on yellow)
- disabled: `disabled:opacity-50` or `disabled:opacity-60`

**Rule:** reserve the yellow button style for the *primary* action on a screen/step.

### 2.4 Inputs (forms)
Inputs are dark, with subtle borders and amber focus:
- Example: address input in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:111)

Pattern:
- `border border-white/10`
- dark background `bg-slate-950/40`
- focus border/ring amber

**Rule:** always show a clear focus state for keyboard users (do not remove focus rings).

### 2.5 Status and error banners
The swap page uses two message surfaces:
- errors: red-toned banner (see message block around [`pageError`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:86))
- status: neutral translucent banner (see block around [`statusMessage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:92))

**Rule:** keep error surfaces red and status surfaces neutral; do not use yellow for errors.

---

## 3) Color palette & design tokens

### 3.1 Practical palette (as implemented today)
The app’s “effective palette” is Tailwind’s slate + amber:

- Background: `slate-950` (app shell, see [`app.html`](conceal-bridge-ux/src/app/app.html:1))
- Primary text: `slate-100` / `slate-50`
- Secondary/muted text: `slate-300` / `slate-400`
- Borders: `white/10` (thin separators)
- Accent / CTA: amber (`bg-amber-500`, focus rings `amber-400/40`)

### 3.2 Conceal brand colors (recommended usage)
Based on your brand guidelines:

- **Black** `#000000`:
  - Use as the underlying “void” (we approximate this with `bg-slate-950` for better tonal range).
- **Grey** `#808080`:
  - Use for muted text and secondary labels (current `text-slate-400` is close in intent).
- **Deep yellow** (existing app uses Tailwind amber):
  - Use sparingly for: primary CTAs, focus indicators, and key highlights.
- **Cyan** `#00F0FF`:
  - Use sparingly for: “info” highlights, subtle link accents, or secondary emphasis (avoid using it as a primary CTA color to keep yellow as “action”).

**Rule:** do not introduce many new accent colors. Keep: dark neutrals + amber CTA + optional cyan “info”.

### 3.3 CSS Custom Properties (Tokens)
Implemented in [`:root`](conceal-bridge-ux/src/styles.css:5). Use these for consistent theming:

```css
/* Colors */
--cb-color-bg        /* #000000 */
--cb-color-surface   /* #101010 */
--cb-color-border    /* #808080 */
--cb-color-text      /* #ffffff */
--cb-color-muted     /* #9CA3AF */
--cb-color-accent    /* #f59e0b */
--cb-color-accent-2  /* #00F0FF */
```

---

## 4) Typography (fonts & usage)

### 4.1 Implemented Fonts (Local)
The app serves fonts locally from [`public/fonts/`](conceal-bridge-ux/public/fonts:1) and defines them in global CSS.

- **Poppins** (`--cb-font-ui`): Main UI font.
- **Montserrat** (`--cb-font-heading`): Headings.
- **Lora** (`--cb-font-serif`): Editorials.

These map to Tailwind's default theme via `@theme`:
- `font-sans` → Poppins
- `font-display` → Montserrat
- `font-serif` → Lora

---

## 5) Utility class conventions

### 5.1 Prefer utility composition in templates
This repo uses “utility-first” composition extensively (e.g. layout and spacing in [`app.html`](conceal-bridge-ux/src/app/app.html:3)).

Guidelines:
- Keep class lists readable (line breaks in templates are fine)
- Group roughly by:
  1) layout/position (`flex`, `grid`, `sticky`)
  2) sizing (`max-w-*`, `min-h-*`)
  3) spacing (`p-*`, `gap-*`, `mt-*`)
  4) typography (`text-*`, `font-*`, `tracking-*`)
  5) colors (`bg-*`, `border-*`)
  6) state variants (`hover:*`, `focus:*`, `disabled:*`)

**Rule:** do not create arbitrary semantic CSS classes unless reuse is high.

### 5.2 If you must create custom classes, keep them minimal and prefixed
If repeated patterns show up many times, define a small number of component classes using Tailwind layers (see [`@layer`](conceal-bridge-ux/node_modules/tailwindcss/index.css:1)):

- Prefix custom classes with `cb-` (Conceal Bridge) to avoid collisions.
  - examples: `.cb-card`, `.cb-btn-primary`, `.cb-input`

**Rule:** keep custom classes as thin wrappers around utilities; don’t rebuild a second CSS framework.

---

## 6) Responsive design breakpoints (Tailwind defaults)

No custom breakpoint configuration exists in this repo today (no `tailwind.config.*`), so Tailwind defaults apply.

Evidence of `sm:` usage exists in templates:
- responsive footer layout in [`app.html`](conceal-bridge-ux/src/app/app.html:17)

Guidelines:
- Design mobile-first.
- Use `sm:` for small screens and above for layout changes (stack → row).
- Use `max-w-*` containers (`max-w-3xl`, `max-w-5xl`) as shown in [`app.html`](conceal-bridge-ux/src/app/app.html:3) to keep content readable.

---

## 7) Light/Dark Mode (Implemented)

The app now fully supports both Light and Dark modes, with **Dark Mode as the default**.

### 7.1 Implementation Strategy
- **Strategy:** Tailwind's `selector` strategy (`darkMode: 'selector'`).
- **Mechanism:** A `.dark` class is toggled on the `<html>` element by `ThemeService`.
- **Persistence:** User preference is saved to `localStorage` key `theme` ('light' | 'dark'). Defaults to 'dark' if unset.
- **Tokens:** CSS variables in `src/styles.css` handle the theming.
  - `:root` defines **Light Mode** values.
  - `:root.dark` overrides these with **Dark Mode** values.

### 7.2 Styling Rules
- **Use Tokens:** ALWAYS use the defined CSS variables (e.g., `bg-[var(--cb-color-surface)]`, `text-[var(--cb-color-text)]`) instead of hardcoded colors like `bg-slate-950` or `text-white`.
- **Hover States:** Use token-based opacities for hover states to ensure visibility in both modes (e.g., `hover:bg-[var(--cb-color-text)]/5` works for both dark and light text).
- **Default Theme:** The app initializes in Dark Mode. Light Mode is an opt-in user choice via the toggle in the header.

---

## 8) Brand assets (logos & icons)

Network/wallet images are served from [`public/`](conceal-bridge-ux/public:1), referenced directly by components.
Examples:
- Wallet icons used in connect modal (see `<img ... src="/images/wallets/...">` in [`WalletButtonComponent`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:256)).

**Rule:** keep assets local when possible to simplify CSP and avoid external dependencies.

---

## 9) Practical checklist for AI agent UI changes

When adding or editing UI:

- Use dark surfaces and muted borders consistent with [`app.html`](conceal-bridge-ux/src/app/app.html:1).
- Reserve amber/yellow for the primary CTA and focus rings (see [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:185)).
- Keep error states red, not yellow (see error banner in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:86)).
- Ensure responsive layout remains mobile-first (`sm:` patterns as in [`app.html`](conceal-bridge-ux/src/app/app.html:17)).
- Avoid custom CSS unless a pattern repeats across multiple components; if so, implement via Tailwind layers (see [`@layer`](conceal-bridge-ux/node_modules/tailwindcss/index.css:1)).

---

## Related docs/specs in this repo

- Error/status banner UX rules (pageError vs statusMessage): [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)
- Wallet UI patterns (connect modal, network menu) that must match styling: [`wallets.md`](conceal-bridge-ux/docs/wallets.md:1)
- Security constraints affecting styling/assets/fonts (CSP, external hosts): [`security.md`](conceal-bridge-ux/docs/security.md:1)
- CSP/headers deployment requirements (affects font hosting and external assets): [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1)
- Conceal branding + typography implementation plan: [`branding_and_typography.md`](conceal-bridge-ux/ai_spec/branding_and_typography.md:1)
- Testing guidance for UI assertions (components, wallet flows): [`testing.md`](conceal-bridge-ux/docs/testing.md:1)