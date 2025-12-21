---
description: Deploy the application to GitHub Pages with pre-deployment checks
---

# Deploy Workflow

> **Purpose**: Safely deploy the Conceal Bridge to GitHub Pages with verification.

## Automatic Deployment (Recommended)

The project uses GitHub Actions for automatic deployment.

### Trigger Deployment

Simply push to `master`:

```bash
git push origin master
```

GitHub Actions will automatically:
1. Run linting checks
2. Run unit tests
3. Build production bundle
4. Deploy to GitHub Pages

### Monitor Deployment

View deployment status:
- GitHub repo → **Actions** tab
- Or: https://github.com/ThrownLemon/conceal-bridge-ux/actions

**Live URLs:**
- Production: https://bridge.conceal.network
- GitHub Pages: https://thrownlemon.github.io/conceal-bridge-ux/

## Manual Deployment (If Needed)

### Prerequisites

Ensure GitHub Pages is configured:
1. Repo Settings → Pages
2. Source: **GitHub Actions**

### 1. Pre-Deployment Checks

```bash
# Run all quality gates
npm run lint
npm test
npm run build
```

All must pass before deploying.

### 2. Verify Production Build Locally

```bash
npm run build

# Serve the built app locally
npx http-server dist/conceal-bridge-ux/browser -p 8080
```

Open http://localhost:8080 and verify:
- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] Swap interface functions
- [ ] Transaction history works
- [ ] All routes load correctly

### 3. Manual Deploy with gh-pages (If Automated Fails)

```bash
# Install gh-pages if not present
npm install -D gh-pages

# Build and deploy
npm run build
npx gh-pages -d dist/conceal-bridge-ux/browser
```

## 4. Post-Deployment Verification

After deployment completes:

### Check Live Site

Visit: https://thrownlemon.github.io/conceal-bridge-ux/

Verify:
- [ ] Site loads
- [ ] No console errors (F12 → Console)
- [ ] Connect wallet button works
- [ ] Routes work (navigate to /swap, back to home)
- [ ] Assets load (images, fonts)

### Check Production Site (If Different)

Visit: https://bridge.conceal.network

Same verification as above.

### Monitor for Issues

Check:
- Browser console for errors
- Network tab for failed requests
- Performance (Lighthouse score)

## 5. Rollback Procedure (If Deployment Breaks)

### Option A: Revert Last Commit

```bash
git revert HEAD
git push origin master
```

This will trigger a new deployment with the reverted changes.

### Option B: Force Deploy Previous Version

```bash
# Find the last working commit
git log --oneline

# Build and deploy from that commit
git checkout <commit-hash>
npm run build
npx gh-pages -d dist/conceal-bridge-ux/browser

# Return to master
git checkout master
```

### Option C: Disable Deployment Workflow

If deployment is completely broken:

1. Go to repo Settings → Pages
2. Change Source to **None**
3. Fix issues
4. Re-enable deployment

## 6. Deployment Checklist

Before major deployments:

- [ ] All tests passing (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Bundle size acceptable (check build output)
- [ ] Local testing complete
- [ ] Environment variables correct
- [ ] Backend API URLs correct (check `src/environments/`)
- [ ] Feature flags configured (if any)
- [ ] Analytics working (if applicable)
- [ ] Error tracking configured (if applicable)

## 7. Deployment Configuration Files

**GitHub Actions Workflow:**
- `.github/workflows/deploy.yml`

**Angular Build Config:**
- `angular.json` (production configuration)
- `src/environments/environment.ts` (production environment)

**Important Settings:**
- Base href: `/conceal-bridge-ux/` (for GitHub Pages subdirectory)
- Output path: `dist/conceal-bridge-ux/browser`

## 8. Troubleshooting

### Deployment Fails - Build Error

Check GitHub Actions logs for error details. Common issues:
- TypeScript errors
- Missing dependencies
- Build budget exceeded

### Site Loads But Routes Don't Work

Check `baseHref` in `angular.json`:
```json
{
  "configurations": {
    "production": {
      "baseHref": "/conceal-bridge-ux/"
    }
  }
}
```

### Assets Not Loading (404s)

Verify asset paths are relative, not absolute.

### Environment Variables Wrong

Check `src/environments/environment.ts` is being used for production build.

## Quick Reference

```bash
# Automatic deployment
git push origin master

# Manual verification
npm run lint && npm test && npm run build
npx http-server dist/conceal-bridge-ux/browser

# Manual deploy (if needed)
npm run build
npx gh-pages -d dist/conceal-bridge-ux/browser

# Rollback
git revert HEAD && git push origin master
```

## Related Documentation

- [docs/deployment.md](../../docs/deployment.md) - Detailed deployment guide
- [docs/ci_cd.md](../../docs/ci_cd.md) - CI/CD pipeline documentation
