---
description: Verification & Cleanup Routine
---

# Cleanup Workflow

> **Purpose**: Standardize the process of finalizing a task.

## 1. Verification (Code Quality)

> Goal: Ensure no regressions or errors were introduced.

1. **Linting**:
   - Run `npm run lint` to check for code style and potential errors.
   - **Action**: Fix any errors found. If they are auto-fixable, use `npm run lint:fix`.

2. **Formatting**:
   - Run `npm run format` to ensure all code follows Prettier standards.

3. **Unit Tests**:
   - **Command**: `npm test`
   - **Action**: Fix any failing tests immediately. Ensure strict type changes (e.g., `any` -> `unknown`) didn't break implementation logic.

4. **Build Check (Performance & Integrity)**:
   - **CRITICAL**: Run this _after_ lint/format fixes to catch missing imports or broken types.
   - Run `npm run build` to verify the production build succeeds.
   - **Action**: Address any build errors.
   - **Check**: Verify bundle budgets are met (no warnings). If warned, investigate enabling more tree-shaking or lazy-loading.

5. **Runtime Check**:
   - If UI changes were made, verify them in the browser or via `npm start`.
   - **Check**: Ensure no console errors appear during basic navigation.
   - **Accessibility**: Run a quick keyboard navigation test (Tab through interactive elements) to ensure focus states are visible and logical.

## 2. Documentation

> Goal: Keep docs in sync with the code.

1. **Search**:
   - Use `grep` to find references to modified components/logic in `docs/`
   - **Key Files to Check**:
     - `README.md` Setup instructions, features
     - `AGENTS.md` Agent instructions
     - `.agent\workflows\*` Agent workflows and commands

2. **Update**:
   - Update all references that were discovered

## 3. Project History

> Goal: Keep a record of important changes for future reference

1. **Update History**:
   - If you made a _major_ change (arch/refactor/feature), append a bullet point to `docs/project_history.md`.
   - _Criteria_: Would a future agent need to know this to understand why the code looks this way?
