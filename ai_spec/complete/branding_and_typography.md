# Spec: Conceal Branding, Typography & Design Tokens — conceal Bridge UX

> [!NOTE]
> **Status: Implemented**

## Context / Current State

> Fonts are self-hosted in `public/fonts/` and configured in `styles.css`.
> Tokens are defined in `:root`.

- The UI is “dark-first” with Conceal branding applied.


- The UI is already “dark-first”:
  - global preference: [`color-scheme`](conceal-bridge-ux/src/styles.css:6)
  - app shell uses dark neutrals: [`bg-slate-950`](conceal-bridge-ux/src/app/app.html:1)
- Tailwind v4 is enabled via CSS import:
  - [`@import`](conceal-bridge-ux/src/styles.css:3)
- There is currently **no explicit font loading** in HTML/CSS:
  - minimal head in [`index.html`](conceal-bridge-ux/src/index.html:1)
  - minimal global CSS in [`styles.css`](conceal-bridge-ux/src/styles.css:1)
- The style guide recommends adopting Conceal fonts (Poppins, Montserrat, Lora), but they are not implemented yet:
  - see typography section in [`style_guide.md`](conceal-bridge-ux/docs/style_guide.md:146)
- Deployment security is expected to include strict CSP/headers, which will affect how fonts are hosted/loaded:
  - [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:41)

## Goal

Implement Conceal’s branding foundation in the frontend in a way that is:

- consistent with current dark-first UI
- compatible with CSP and static hosting
- easy to apply consistently across new components
- minimal in external dependencies (prefer local assets)

Specifically:
- add official fonts (Poppins, Montserrat, Lora)
- define design tokens (colors, typography scale) for stable reuse
- optionally theme WalletConnect/AppKit UI to match Conceal branding (font family + accent color)

## Non-Goals

- Redesigning UX layouts or changing component structure.
- Introducing a full “design system” framework beyond Tailwind + a small token layer.
- Adding a light theme (separate spec; can be derived later from the token work).

## Requirements

1. **Fonts**
   - Support the Conceal font set:
     - Poppins (primary UI)
     - Montserrat (headings / navigation)
     - Lora (quotes / editorial)
   - Fonts must be available in production without relying on third-party CDNs by default.

2. **Color tokens**
   - Support brand colors (provided):
     - `#000000` black
     - `#808080` gray
     - `#00F0FF` cyan
     - “deep yellow” accent (current UI uses Tailwind amber; map to a chosen hex value or keep as Tailwind palette).

3. **Tailwind compatibility**
   - Keep Tailwind utility-first templates intact (see patterns in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:185)).
   - Token layer must be additive and not require a Tailwind config file.

4. **CSP compatibility**
   - Any font loading must be compatible with the hosting CSP plan in [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:41).

## Proposed Solution

### A) Self-host fonts in `public/`

Add fonts under:
- [`conceal-bridge-ux/public/fonts/`](conceal-bridge-ux/public:1)

Recommended formats:
- `woff2` (primary)
- optionally `woff` (fallback) if needed for legacy browsers

Font files to include (example naming; align to license/source):
- `Poppins-Regular.woff2`, `Poppins-SemiBold.woff2`
- `Montserrat-SemiBold.woff2`
- `Lora-Regular.woff2`, `Lora-Italic.woff2`

### B) Define `@font-face` in global CSS

Add `@font-face` blocks in:
- [`styles.css`](conceal-bridge-ux/src/styles.css:1)

Guidelines:
- Use `font-display: swap` for perceived performance.
- Keep weights minimal (avoid shipping the entire family unless needed).

### C) Define design tokens as CSS custom properties

Define tokens in:
- [`:root`](conceal-bridge-ux/src/styles.css:5)

Recommended token set (names are examples; keep stable):
- Colors:
  - `--cb-color-bg` (base background)
  - `--cb-color-surface` (panel background)
  - `--cb-color-border` (thin borders)
  - `--cb-color-text` (primary text)
  - `--cb-color-muted` (secondary text)
  - `--cb-color-accent` (deep yellow / CTA)
  - `--cb-color-accent-2` (cyan)
- Typography:
  - `--cb-font-ui` (Poppins stack)
  - `--cb-font-heading` (Montserrat stack)
  - `--cb-font-serif` (Lora stack)

### D) Wire tokens into Tailwind v4’s CSS theme layer (optional but recommended)

Tailwind v4 supports CSS-first theming via:
- [`@theme`](conceal-bridge-ux/node_modules/tailwindcss/index.css:4)

Proposed approach:
- In [`styles.css`](conceal-bridge-ux/src/styles.css:1), add a small `@layer theme` / `@theme` block that sets:
  - the default font family to `--cb-font-ui`
  - optionally map accent colors to Tailwind variables if desired

Notes:
- This keeps templates using Tailwind utilities but lets the default typography align to brand.

### E) Optional: theme WalletConnect/AppKit UI

WalletConnect’s UI stack (AppKit) supports theme variables like:
- `--w3m-font-family`
- `--w3m-accent`

These variables appear in the dependency tree:
- see `--w3m-font-family` references in [`@reown/appkit-ui`](conceal-bridge-ux/node_modules/@reown/appkit-ui/dist/esm/src/utils/ThemeHelperUtil.js:84)

If feasible with the current integration path (WalletConnect provider initialized in [`#resolveProvider()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:298)), we should set the modal’s theme variables to:
- match Poppins (font)
- match Conceal deep yellow (accent)

**Important:** this is optional and must be verified in-browser; it may require provider options or global CSS overrides.

## Acceptance Criteria

1. Fonts are served locally and used by default for UI typography.
2. Color tokens exist and are documented; core screens still render correctly.
3. No CSP violations related to fonts in production (see rollout plan in [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:150)).
4. The visual identity matches the Conceal branding direction:
   - dark/obscured backgrounds
   - grey/white text
   - sparing deep yellow accent

## Testing Plan

- Manual:
  - Verify fonts render correctly in Chromium/Firefox/Safari.
  - Verify `font-display: swap` behavior does not cause layout shift issues.
  - Verify no blocked font requests under CSP Report-Only (see [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:45)).
- Automated:
  - Optional: add an E2E smoke test that asserts computed font-family contains `Poppins` on key pages.

## Risks / Considerations

- Adding multiple font weights increases bundle size; keep minimal.
- If fonts are loaded from a CDN, CSP must allow that host; prefer self-hosting.
- WalletConnect modal theming may be constrained by the upstream component implementation; treat as best-effort.

## Implementation Steps (Work Breakdown)

1. Add font files to [`public/fonts/`](conceal-bridge-ux/public:1).
2. Add `@font-face` rules and base font stacks to [`styles.css`](conceal-bridge-ux/src/styles.css:1).
3. Add CSS custom properties for tokens in [`:root`](conceal-bridge-ux/src/styles.css:5).
4. (Optional) Add Tailwind v4 theme wiring via [`@theme`](conceal-bridge-ux/node_modules/tailwindcss/index.css:4) in global CSS.
5. Validate CSP in report-only mode and update allowlists if needed per [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:150).
6. (Optional) Research/implement WalletConnect modal theming and validate across mobile + desktop wallets.