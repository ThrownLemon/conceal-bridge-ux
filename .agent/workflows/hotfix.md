---
description: Emergency hotfix workflow for critical production bugs
---

# Hotfix Workflow

> **Purpose**: Emergency process for fixing critical bugs in production.

## When to Use

Use this workflow when:

- Production site is broken
- Critical security vulnerability discovered
- Data loss or corruption occurring
- Major user-facing functionality is broken

## Hotfix Process

### 1. Assess the Situation

```bash
# Check current production state
git log --oneline -5

# Identify the problematic commit (if recent deployment)
git log v1.0.0..HEAD --oneline
```

**Questions to answer:**

- [ ] What is broken?
- [ ] When did it start? (After which deployment?)
- [ ] How many users affected?
- [ ] Is rollback sufficient, or is a fix needed?

### 2. Quick Rollback (If Possible)

If the issue was introduced by a recent commit:

```bash
# Revert the problematic commit
git revert HEAD
git push origin master
```

This triggers automatic redeployment. Monitor GitHub Actions.

### 3. Create Hotfix Branch

If a code fix is needed:

```bash
# Create hotfix branch from master
git checkout master
git pull origin master
git checkout -b hotfix/describe-the-fix
```

### 4. Implement Fix

- **Focus**: Fix ONLY the critical issue
- **Avoid**: Refactoring, cleanup, or unrelated changes
- **Test**: Verify the fix locally

```bash
npm start  # Test in browser
npm test   # Run unit tests
```

### 5. Fast-Track Quality Gates

Minimal verification (speed over completeness):

```bash
npm run lint
npm run build
```

Skip E2E if the fix is obvious and low-risk.

### 6. Commit and Deploy

```bash
git add .
git commit -m "fix: critical hotfix for [issue description]"

# Bump patch version
npm version patch

# Push with tags
git push origin hotfix/describe-the-fix --follow-tags

# Create PR for fast merge
gh pr create --title "HOTFIX: [issue]" --body "Critical fix for production issue."
```

### 7. Merge and Monitor

```bash
# Merge immediately after CI passes (solo workflow)
gh pr merge --squash --delete-branch
```

1. Wait for CI to pass (or merge if confident)
2. Monitor GitHub Actions deployment
3. Verify fix on production: <https://bridge.conceal.network>

### 8. Post-Hotfix Tasks

After the fire is out:

```bash
# Update bd issue if one existed
bd close <issue-id> --reason "Hotfix deployed in v1.0.X"
```

- [ ] Create follow-up issue for proper fix (if hotfix was a workaround)
- [ ] Document in `docs/project_history.md`
- [ ] Conduct brief postmortem: What caused it? How to prevent?

## Hotfix vs Normal Fix

| Aspect   | Hotfix       | Normal Fix                  |
| -------- | ------------ | --------------------------- |
| Timeline | Hours        | Days                        |
| Testing  | Minimal      | Full suite                  |
| Review   | Expedited    | Standard                    |
| Scope    | Single issue | Can include related cleanup |
| Branch   | `hotfix/...` | `feature/...` or `fix/...`  |

## Quick Reference

```bash
# Emergency rollback (direct to master - exception for emergencies)
git revert HEAD && git push origin master

# Hotfix workflow
git checkout -b hotfix/fix-name
# ... make fix ...
npm run lint && npm run build
git add . && git commit -m "fix: critical hotfix"
npm version patch
git push origin hotfix/fix-name --follow-tags
gh pr create --title "HOTFIX: ..." --body "Critical fix"
gh pr merge --squash --delete-branch
```

## Related Documentation

- [deploy.md](./deploy.md) - Deployment workflow
- [release.md](./release.md) - Release workflow
