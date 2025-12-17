---
description: Standardize the process of finalizing a task. Run this checklist before marking a user request as "Complete"
---

# Verification & Cleanup Routine

> Purpose: Standardize the process of finalizing a task. Run this checklist before marking a user request as "Complete" to ensure quality and documentation consistency.

## 1. Code Quality Verification

> Goal: Ensure no regressions or errors were introduced.

1. **Linting**:
   - Run `npm run lint` to check for code style and potential errors.
   - **Action**: Fix any errors found. If they are auto-fixable, use `npm run lint:fix`.

2. **Formatting**:
   - Run `npm run format` to ensure all code follows Prettier standards.
   - **Optimization**: You can often just run `npm run format` (which writes fixes) instead of just checking.

3. **Compilation**:
   - Run `npm run build` (or `ng build`) to ensure the application compiles AOT without error. Typescript errors often show up here that linter misses.

4. **Unit Tests**:
   - Run `npm test` to verify logic.
   - **Note**: If the project uses Karma, this might launch a browser. If so, use `npm run test -- --watch=false --browsers=ChromeHeadless` for CI-like execution.

## 2. Documentation Updates

> Goal: Keep documentation in sync with code changes.

1. **Project History**:
   - Update `docs/project_history.md` if you added a major feature, changed architecture, or performed significant refactoring.
   - Log the date, change summary, and impact.

2. **Specific Docs**:
   - Did you change how the Bridge works? Update `docs/bridge_*.md`.
   - Did you change API integration? Update `docs/backend_api.md`.
   - **Check**: `ls docs/` to remind yourself what documentation exists.

## 3. Artifact Cleanup

1. **Unused Files**:
   - Delete any temporary files created during development (e.g., `.tmp`, debug scripts).

2. **Console Cleanliness**:
   - Remove temporary `console.log` statements used for debugging.

## 4. Final Sanity Check

- [ ] Does the solution fully address the user's prompt?
- [ ] Are all new files strictly typed?
- [ ] Is the UI cleanly styled (if applicable)?

---
*Run this checklist silently or summarized before handing off control to the user.*