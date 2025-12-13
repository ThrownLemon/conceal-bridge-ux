# Context for — Security (Frontend + Hosting/CSP)
> Purpose: load the minimum security context so changes don’t introduce fund-risk, secret leakage, or web security regressions (CSP/headers).

## Key rules (read this before coding)
- **Never handle secrets** (no keys/seed phrases; no logging of sensitive objects/config).
- **Backend-provided config is untrusted input** (validate addresses/chainId/confirmations before use).
- **No unsafe DOM patterns**: do not introduce raw HTML rendering or bypass Angular sanitization.
- **No unsafe retries** of non-idempotent operations (swap init/exec).
- **External links** must use `target="_blank"` + `rel="noopener"` (prevent tab-nabbing).
- **CSP/headers**: if you add a new external host (images, fonts, APIs), update the CSP spec accordingly.

## Read the following files

ai_docs/security.md
ai_docs/error_handling.md
ai_docs/wallets.md

ai_spec/security_headers_and_csp.md
ai_spec/observability_and_client_logging.md
ai_spec/runtime_config.md

src/app/pages/home/home.page.ts
src/app/pages/swap/swap.page.ts
src/app/core/evm-wallet.service.ts
src/app/core/bridge-api.service.ts