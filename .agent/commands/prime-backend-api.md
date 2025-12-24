# Context for — Backend API (Client Integration)

> Purpose: load the _minimum_ context needed to safely change anything related to backend API calls, response handling, retries/timeouts, and swap-state polling.

## Key rules (read this before coding)

- **Treat `docs/backend_api.md` as the contract reference** (it documents the current backend endpoint shapes and legacy inconsistencies).
- **Always check payload-level success flags** (HTTP 200 does not imply success):
  - Init/exec style endpoints often use `success: boolean` + `err`
  - Query/polling style endpoints often use `result: boolean` + optional `err`
- **Never “auto-retry” non-idempotent operations** (swap init/exec) unless the backend explicitly guarantees idempotency.
- **Polling must be cancelable** (keep the existing pattern that is bound to component destruction).

## Read the following files

docs/backend_api.md
docs/error_handling.md

ai_spec/http_and_error_handling.md
ai_spec/runtime_config.md

src/app/core/app-config.ts
src/app/core/bridge-api.service.ts
src/app/core/bridge-types.ts

src/app/pages/swap/swap.page.ts
