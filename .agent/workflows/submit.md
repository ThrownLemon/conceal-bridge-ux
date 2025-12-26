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
npm test            # All tests must pass
npm run build       # Production build must succeed
```

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

```bash
gh pr merge --squash --delete-branch
```

Or merge via GitHub web UI.

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
- ✅ Work is complete when PR is merged (not just pushed)
- ✅ If CI fails, fix locally and push again

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
