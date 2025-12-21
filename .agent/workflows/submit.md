---
description: Complete workflow for committing changes, running quality gates, and pushing to remote (aligned with AGENTS.md "Landing the Plane").
---

# Submit Workflow

> **Purpose**: Streamline the process of completing work and pushing to remote, following the "Landing the Plane" workflow from AGENTS.md.

## 1. Verify You're on the Right Branch

1. **Check Current Branch**:
   - Run `git branch --show-current` to confirm the current branch.
   - **Rule**: Do NOT commit directly to `master`. If on master, create a feature branch:

     ```bash
     git checkout -b feature/your-feature-name
     ```

## 2. Run Quality Gates (If Code Changed)

Before committing, ensure code quality:

1. **Linting**:

   ```bash
   npm run lint
   ```

   - Fix any errors with `npm run lint:fix`

2. **Unit Tests**:

   ```bash
   npm test
   ```

   - All tests must pass

3. **Build Check**:

   ```bash
   npm run build
   ```

   - Production build must succeed

## 3. Stage and Commit Changes

1. **Check Status**:

   ```bash
   git status
   ```

2. **Stage Files**:

   ```bash
   git add .
   ```

   - Or specify files if partial commit is desired

3. **Review Changes**:

   ```bash
   git diff --cached
   ```

4. **Commit with Conventional Commits**:
   - Format: `<type>(<scope>): <subject>`
   - Types: feat, fix, docs, chore, refactor, test, ci
   - Examples:

     ```bash
     git commit -m "feat: add transaction history modal"
     git commit -m "fix: resolve chain switching bug"
     git commit -m "docs: update AGENTS.md workflows"
     ```

## 4. Update Issue Status (bd)

If working on a bd issue:

```bash
bd close <issue-id>  # If fully complete
# or
bd update <issue-id> --status done  # Mark as done but not closed
```

## 5. Push to Remote (MANDATORY)

This is the critical "Landing the Plane" step from AGENTS.md:

```bash
git pull --rebase
bd sync  # If using bd for issue tracking
git push origin <current-branch>
git status  # MUST show "up to date with origin"
```

**If upstream not set:**

```bash
git push -u origin <current-branch>
```

## 6. Verify Push Succeeded

```bash
git status
```

Should show: "Your branch is up to date with 'origin/\<branch>'"

## 7. Create Pull Request (Optional)

If you want to open a PR:

```bash
gh pr create --title "Your PR title" --body "Description"
```

Or use GitHub web interface.

## Critical Rules

- ❌ **NEVER** stop before pushing - that leaves work stranded locally
- ❌ **NEVER** say "ready to push when you are" - YOU must push
- ✅ Work is NOT complete until `git push` succeeds
- ✅ If push fails, resolve conflicts and retry until it succeeds

## Quick Reference

```bash
# Full workflow
npm run lint && npm test && npm run build
git add .
git commit -m "feat: your change"
bd close <id>
git pull --rebase && bd sync && git push
git status
```
