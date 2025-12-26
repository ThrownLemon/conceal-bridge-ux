---
description: Workflow for committing changes, creating PRs, and merging to master
---

# Submit Workflow

> **Purpose**: Complete work by pushing to remote and creating a PR. Work is NOT complete until the PR is merged.

## 1. Verify You're on the Right Branch

```bash
git branch --show-current
```

**Branching rules:**

- ❌ Do NOT commit directly to `master` (except docs-only changes)
- ✅ Feature work: `feature/your-feature-name`
- ✅ Bug fixes: `fix/issue-description`
- ✅ Hotfixes: `hotfix/critical-fix` (see `hotfix.md`)

**If on master, create a branch:**

```bash
git checkout -b feature/your-feature-name
```

## 2. Run Quality Gates

Before committing, ALL gates must pass:

```bash
npm run lint        # Fix with: npm run lint:fix
npm run format      # Prettier formatting
npm test            # All tests must pass
npm run build       # Production build must succeed
```

**Note**: These are automatically enforced by Husky pre-commit hooks. If any check fails, the commit will be blocked.

**CRITICAL**: Run `npm run format` BEFORE `npm run build`. Formatting changes can trigger new lint/build errors.

### STRICTLY FORBIDDEN - Quality Gate Anti-Patterns

❌ **NEVER modify lint rules** to make code pass - fix the code instead
❌ **NEVER add inline eslint-disable** comments to bypass errors
❌ **NEVER modify eslint.config.js** or tsconfig.json to silence errors
❌ **NEVER use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`**
❌ **NEVER skip quality gates** to "save time"
❌ **NEVER commit with failing tests** - fix the test or the code
❌ **NEVER assume a build error is "harmless"** - all errors must be resolved

### When Quality Gates Fail

1. Read the error message carefully
2. Understand **why** the rule exists (security, maintainability, consistency)
3. Fix the actual code to satisfy the rule
4. If the rule seems wrong for this case, discuss with the team first - don't disable it

### Examples of Correct vs Incorrect Approaches

| Incorrect (Shortcut)                      | Correct (Proper Fix)                        |
| ----------------------------------------- | ------------------------------------------- |
| Add `// eslint-disable-next-line`         | Change code to satisfy the rule             |
| Modify `eslint.config.js` to disable rule | Fix the underlying code issue               |
| Cast with `as any`                        | Use proper type (`unknown`, `Record`, etc.) |
| `@ts-ignore` on a line                    | Fix the type error properly                 |

## 3. Stage and Commit

```bash
git status                    # Check what changed
git add .                     # Stage all (or specify files)
git diff --cached             # Review staged changes
git commit -m "feat: description"
```

**Conventional Commits format:** `<type>(<scope>): <subject>`

| Type       | Use for                          |
| ---------- | -------------------------------- |
| `feat`     | New functionality                |
| `fix`      | Bug fixes                        |
| `docs`     | Documentation only               |
| `chore`    | Dependencies, tooling            |
| `refactor` | Code changes without feature/fix |
| `test`     | Adding/updating tests            |
| `ci`       | CI/CD changes                    |

## 4. Push Branch to Remote

```bash
git push -u origin $(git branch --show-current)
```

## 5. Create Pull Request

PRs are required for all code changes (not optional):

```bash
gh pr create --title "feat: your change" --body "Description of changes"
```

**Why PRs for solo work?**

- CI runs lint/test/build before merge is allowed
- Self-review in PR diff view catches mistakes
- Clean revert path via merge commits

## 6. Merge PR (After CI Passes)

> [!IMPORTANT]
> The task is NOT complete until the code is in the `master` branch and your local repo is synced.

```bash
gh pr merge --squash --delete-branch
git checkout master
git pull origin master
```

**Why merge immediately?**

- Prevents branch rot and stale PRs.
- Ensures the next task starts from a clean, up-to-date `master`.
- Validates the final squashed commit in the main history.

Or merge via GitHub web UI, then manually sync your local `master`.

## 7. Update Issue Status (bd)

```bash
bd close <issue-id> --reason "Merged in PR #123"
```

## What "Complete" Means

| Task Type | Complete When                                 |
| --------- | --------------------------------------------- |
| Feature   | PR merged to master                           |
| Bug fix   | PR merged to master                           |
| Hotfix    | PR merged and verified on production          |
| Docs only | Push directly to master                       |
| Release   | Push directly to master (version + changelog) |

## Critical Rules

- ❌ NEVER stop before pushing - work stranded locally is lost work
- ❌ NEVER say "ready to push when you are" - YOU must push
- ❌ NEVER skip the PR for code changes - CI validation matters
- ❌ NEVER leave a PR open - merge it as soon as CI passes
- ✅ Work is complete when PR is merged (not just pushed)
- ✅ If CI fails, fix locally and push again

> [!CAUTION]
> **Husky & Tests**: Ensure `npm test` in `.husky/pre-commit` runs with `--no-watch` (or `--watch=false`).
> If it runs in watch mode, the commit process will hang indefinitely in autonomous environments.

## Quick Reference

```bash
# Code changes (feature/fix) - requires PR
git checkout -b feature/my-feature
npm run lint && npm test && npm run build
git add . && git commit -m "feat: description"
git push -u origin feature/my-feature
gh pr create --title "feat: description" --body "Details"
gh pr merge --squash --delete-branch
bd close <id>

# Docs only (direct to master)
git add docs/
git commit -m "docs: update guide"
git push origin master

# Release (direct to master)
npm version patch  # or minor/major
git push origin master --follow-tags
```

## Related Workflows

- [hotfix.md](./hotfix.md) - Emergency production fixes
- [review.md](./review.md) - Code review checklist
- [cleanup.md](./cleanup.md) - Pre-commit verification
