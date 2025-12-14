# Spec: Bridge Explorer / Swap History (Future Feature) — conceal Bridge UX

## Context / Current State

- The current UX is designed around a single “in-progress session”:
  - The swap page tracks `paymentId`, tx hashes, and completion state in-memory signals in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:400).
- There is no persistent history or account dashboard in the UI.
- A “bridge explorer” / history view is explicitly listed as a non-goal in the example spec:
  - see “A full ‘bridge explorer’…” in [`example.md`](conceal-bridge-ux/ai_spec/example.md:17).

## Goal

Add an optional, privacy-preserving “Swap History / Explorer” feature so users can:

- review recent swaps and their status
- re-open a swap by payment ID
- view tx hashes and destinations in a consistent way
- recover state after closing the tab (within reasonable constraints)

## Non-Goals

- Building a full blockchain explorer.
- Storing sensitive user data (emails, full wallet addresses) by default.
- Requiring wallet connection to use history (should be optional).

## UX Requirements

1. Add a new route and page:
   - `/history` (or `/explorer`) listing recent swaps
2. Each entry shows:
   - direction (CCX→EVM / EVM→CCX)
   - network (eth/bsc/plg)
   - amount
   - status (pending / processing / completed / failed)
   - payment ID (copyable)
   - tx hashes (copyable / link to explorers)
3. Search:
   - allow lookup by payment ID
4. Privacy:
   - do not show full wallet addresses by default (shorten/mask)
   - do not store user email in history

## Data Requirements (Decision Needed)

Choose one approach:

### A) Backend-provided history (recommended for accuracy)
- Backend exposes a read-only endpoint to fetch swap records by payment ID and/or by address (if feasible).
- UI stores only a list of recent payment IDs locally for convenience.

### B) Client-local history (privacy-first, limited)
- UI stores recent swap records in local storage:
  - paymentId
  - direction, network
  - timestamps
  - tx hashes (if available)
- UI revalidates status by calling existing status endpoints via [`BridgeApiService.checkSwapState()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:92).

## Security / Privacy Requirements

- Never persist secrets.
- Avoid persisting:
  - user email
  - full wallet addresses
- If local storage is used:
  - keep a strict retention policy (e.g., last 10 swaps or last 30 days)
  - provide a “Clear history” action

Align with guidance in:
- [`security.md`](conceal-bridge-ux/docs/security.md:1)

## Error Handling

- Use the established UI convention:
  - blocking error for page load failures
  - status messages for transient failures
Align with:
- [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:30)

## Testing Plan

- Unit tests:
  - storage retention rules
  - masking behavior
- E2E tests (once E2E framework exists):
  - navigate to history, view entries, open details
  - search by payment ID

See E2E approach:
- [`e2e_testing.md`](conceal-bridge-ux/ai_spec/e2e_testing.md:1)

## Implementation Steps (Work Breakdown)

1. Define data strategy (backend vs local).
2. Add route in [`app.routes.ts`](conceal-bridge-ux/src/app/app.routes.ts:3).
3. Implement `HistoryPage` UI and interactions.
4. Add service for persistence (if client-local).
5. Add tests (unit + E2E later).