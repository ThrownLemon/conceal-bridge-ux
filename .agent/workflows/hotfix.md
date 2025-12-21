---
description: Emergency hotfix workflow for critical production issues
---

# Hotfix Workflow

> **Purpose**: Quickly fix and deploy critical production bugs with minimal process overhead.

## When to Use This Workflow

Use hotfix workflow when:

- ✅ Production site is broken or severely degraded
- ✅ Security vulnerability discovered
- ✅ Data loss or corruption risk
- ✅ Critical feature completely broken

**Do NOT use for:**

- ❌ Minor bugs
- ❌ UI polish
- ❌ Performance improvements
- ❌ New features

## Hotfix Process

### 1. Assess Severity

**Critical (Deploy ASAP):**

- Site won't load
- Wallet connection completely broken
- Transactions failing
- Security vulnerability
- Data loss

**High (Deploy within hours):**

- Major feature broken
- Error affecting >50% of users
- Workaround available but poor UX

**Medium (Can wait for normal cycle):**

- Minor bug with workaround
- UI glitch
- Non-critical feature broken

### 2. Create Hotfix Branch from Master

```bash
# Ensure master is up to date
git checkout master
git pull origin master

# Create hotfix branch
git checkout -b hotfix/describe-the-fix

# Example
git checkout -b hotfix/wallet-connection-error
```

### 3. Make Minimal Changes

**Key principle:** Change ONLY what's necessary to fix the issue.

- ❌ Don't refactor
- ❌ Don't add features
- ❌ Don't update dependencies (unless that's the fix)
- ✅ Fix the immediate problem
- ✅ Add regression test if possible

### 4. Fast-Track Testing

Run critical tests only:

```bash
# Lint the changed files only
npm run lint -- <changed-file>.ts

# Run affected tests only
npm test -- <test-file>.spec.ts

# Quick build check
npm run build
```

### 5. Manual Verification

Test the specific bug fix:

```bash
npm start
```

Verify:

- [ ] The specific bug is fixed
- [ ] No new errors in console
- [ ] Core functionality still works
- [ ] No obvious regressions

### 6. Commit with Hotfix Tag

```bash
git add .
git commit -m "hotfix: fix wallet connection error

Critical fix for production issue where wallet connection
fails in MetaMask due to incorrect chain ID validation.

Fixes: #<issue-number>
Severity: Critical"
```

### 7. Push and Deploy

```bash
# Push hotfix branch
git push -u origin hotfix/describe-the-fix

# Merge to master immediately
git checkout master
git merge hotfix/describe-the-fix --no-ff
git push origin master
```

This triggers automatic deployment via GitHub Actions.

### 8. Monitor Deployment

Watch GitHub Actions:

```text
https://github.com/ThrownLemon/conceal-bridge-ux/actions
```

Verify live site within 5 minutes:

```text
https://thrownlemon.github.io/conceal-bridge-ux/
```

### 9. Post-Hotfix Actions

After deployment:

1. **Verify Fix Live:**
   - Test on production site
   - Check error monitoring (if available)
   - Confirm with user who reported (if applicable)

2. **Create Retrospective Issue:**

   ```bash
   bd create "Retrospective: <hotfix-name>" --priority P2
   ```

3. **Document in Project History:**
   Add entry to `docs/project_history.md`:

   ```markdown
   - **2025-12-21**: Hotfix - Fixed wallet connection error affecting MetaMask users
   ```

4. **Clean Up Branch:**

   ```bash
   git branch -d hotfix/describe-the-fix
   git push origin --delete hotfix/describe-the-fix
   ```

## Hotfix Checklist

- [ ] Issue is truly critical
- [ ] Created hotfix branch from master
- [ ] Made minimal necessary changes
- [ ] Ran fast-track tests
- [ ] Manually verified fix
- [ ] Committed with "hotfix:" prefix
- [ ] Merged to master
- [ ] Deployment successful
- [ ] Verified fix live
- [ ] Created retrospective issue
- [ ] Documented in project history
- [ ] Cleaned up branch

## Common Hotfix Scenarios

### Wallet Connection Broken

1. Check `EvmWalletService`
2. Verify chain configurations in `evm-networks.ts`
3. Test with MetaMask, Trust Wallet, Binance Wallet

### API Calls Failing

1. Check `BridgeApiService`
2. Verify environment variables
3. Check backend status (<https://github.com/ConcealNetwork/conceal-wswap>)

### Build Failing on Deploy

1. Check GitHub Actions logs
2. Verify dependencies in `package.json`
3. Test build locally: `npm run build`

### Routes Not Working

1. Check `app.routes.ts`
2. Verify lazy loading
3. Check for typos in route paths

## Rollback Plan

If hotfix makes things worse:

```bash
# Revert the merge commit
git checkout master
git log --oneline -5  # Find the hotfix merge commit
git revert <merge-commit-hash>
git push origin master
```

This triggers re-deployment of previous working version.

## Quick Reference

```bash
# Hotfix workflow
git checkout master && git pull
git checkout -b hotfix/issue-name
# Make minimal fix
npm run lint && npm test -- <file>
git commit -m "hotfix: description"
git push -u origin hotfix/issue-name
git checkout master
git merge hotfix/issue-name --no-ff
git push origin master
# Monitor deployment, verify live, document
```

## Related Workflows

- [deploy.md](./deploy.md) - Full deployment process
- [test.md](./test.md) - Testing strategies
- [submit.md](./submit.md) - Normal commit workflow
