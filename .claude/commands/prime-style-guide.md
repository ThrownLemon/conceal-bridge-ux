# Context for — UI / Style Guide (Tailwind v4, Dark-first)

> Purpose: load the minimum context to make UI changes that match the existing Conceal Bridge look-and-feel (Angular 21 + Tailwind v4).

## Key rules (read this before coding)

- **Tailwind-first**: default to utility classes in templates; add custom CSS only when reuse is high.
- **Dark-first UI**: keep surfaces dark (`slate` palette); avoid light panels.
- **Amber/yellow is reserved for primary CTAs + focus** (don’t use yellow for errors).
- **Error vs status surfaces**:
  - errors are red-toned banners
  - progress/status is neutral/translucent
- **Accessibility**: don’t remove focus rings; keep keyboard interaction usable.

## Read the following files

docs/style_guide.md
docs/angular_best_practices.md
docs/error_handling.md
docs/security.md

src/styles.css
src/index.html

src/app/app.html
src/app/app.css

src/app/pages/swap/swap.page.ts
src/app/shared/wallet/wallet-button.component.ts
