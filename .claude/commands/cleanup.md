# Verification & Cleanup Routine

> Purpose: Standardize the process of finalizing a task. Run this checklist before marking a user request as "Complete" to ensure quality and documentation consistency.

## 1. Verification (Code Quality)

> Goal: Ensure no regressions or errors were introduced.

1. **Linting**:
   - Run `npm run lint` to check for code style and potential errors.
   - **Action**: Fix any errors found. If they are auto-fixable, use `npm run lint:fix`.

2. **Formatting**:
   - Run `npm run format` to ensure all code follows Prettier standards.

3. **Unit Tests**:
   - **Check**: Inspect `package.json` to determine the test runner (Vitest vs Karma).
   - **Command**:
     - **Vitest**: `npm test` (adding `--watch=false` if needed).
     - **Karma**: `npm run test -- --watch=false --browsers=ChromeHeadless`.
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

## 2. Documentation & Spec Management

> Goal: Keep docs and AI specs in sync with the code.

1. **Spec Lifecycle**:
   - **Requirement**: If you worked on a feature defined in `ai_spec/`:
     - Move the spec file to `ai_spec/complete/`: `mv ai_spec/my-feature.md ai_spec/complete/`.
     - Update references if necessary (though usually independent).

2. **Search & Update**:
   - Use `grep` to find references to modified components/logic in `docs/`, `ai_spec/`, and `.claude/`.
   - **Key Files to Check**:
     - `README.md` (Setup instructions, features)
     - `docs/build_guide.md` (Architecture, dependencies)
     - `docs/backend_api.md` (If API calls changed)
     - `docs/*.md` (General check for any related docs)
     - `ai_spec/` (Update specs if implementation diverged from plan)

3. **Update Agent Context**:
   - If you added new tools or patterns, update `.claude/commands/prime.md` or other context files.
   - **Project History**:
     - If you made a _major_ change (arch/refactor/feature), append a bullet point to `docs/project_history.md`.
     - _Criteria_: Would a future agent need to know this to understand why the code looks this way?

## 3. Artifact Finalization

> Goal: Leave a clear trail of work for the user and future agents.

1. **Task List**:
   - Update `task.md` to reflect all completed items.

2. **Walkthrough**:
   - Update `walkthrough.md`.
   - Include:
     - Summary of changes.
     - Proof of verification (e.g., "Build passed", "Tests passed").
     - Screenshots/Videos if UI was touched.
