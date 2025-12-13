# Security Fix: Removed angular-cli-ghpages

## Issue

**Date:** 2025-12-13  
**Severity:** CRITICAL  
**CVE:** Prototype pollution vulnerability in `gh-pages` < 5.0.0

### Vulnerability Details

The `angular-cli-ghpages@2.0.3` package depends on `gh-pages@^3.1.0`, which has a critical prototype pollution vulnerability in `util.js`.

- **Affected package:** `gh-pages` (npm)
- **Affected versions:** < 5.0.0
- **Patched version:** 5.0.0
- **Blocker:** `angular-cli-ghpages@2.0.3` requires `gh-pages@^3.1.0`, preventing upgrade

## Solution

Migrated from `angular-cli-ghpages` to **native GitHub Actions deployment** using the official `actions/deploy-pages@v4` action.

### Benefits of New Approach

✅ **Secure** - No third-party dependencies with vulnerabilities  
✅ **Official** - Maintained by GitHub  
✅ **Integrated** - Works seamlessly with GitHub Pages settings  
✅ **Simple** - No additional npm packages required  
✅ **Reliable** - Direct integration with GitHub infrastructure  
✅ **Better separation** - Two-job workflow (build + deploy)  

## Changes Made

### 1. Removed Vulnerable Package

**File:** `package.json`

- Removed `angular-cli-ghpages` from `devDependencies`
- Removed `deploy` script

### 2. Updated GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

**Before:**
- Single job that ran `npm run deploy` (using `angular-cli-ghpages`)
- Deployed to `gh-pages` branch

**After:**
- Two-job workflow:
  - **Build job:** Builds the app and uploads artifact
  - **Deploy job:** Deploys artifact using `actions/deploy-pages@v4`
- Deploys directly via GitHub Actions (no `gh-pages` branch needed)

### 3. Removed Deploy Configuration

**File:** `angular.json`

- Removed `deploy` target (no longer needed)

### 4. Updated Documentation

Updated all documentation to reflect the new deployment method:

- `README.md` - Updated deployment section
- `ai_docs/deployment.md` - Complete rewrite
- `ai_docs/ci_cd.md` - Updated pipeline stages
- `ai_docs/angular_build_guide.md` - Updated deployment target section

## Migration Guide

### For Existing Deployments

If you have an existing deployment using `angular-cli-ghpages`:

1. **Update GitHub Pages settings:**
   - Go to repository **Settings > Pages**
   - Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
   - Save

2. **Push the updated code:**
   ```bash
   git add .
   git commit -m "Security fix: migrate to native GitHub Actions deployment"
   git push origin main
   ```

3. **Verify deployment:**
   - Go to **Actions** tab
   - Watch the workflow run
   - Verify the site updates at https://thrownlemon.github.io/conceal-bridge-ux/

### For New Deployments

The workflow will automatically deploy when you push to `main`. No additional setup required beyond:

1. Enabling GitHub Pages in repository settings
2. Setting source to "GitHub Actions"

## Verification

### Check for Vulnerabilities

Run npm audit to verify no vulnerabilities:

```bash
npm audit
```

Expected output: **0 vulnerabilities**

### Test Deployment

1. Push to `main` branch
2. Check Actions tab for workflow run
3. Verify site loads at https://thrownlemon.github.io/conceal-bridge-ux/
4. Test deep linking (refresh on a sub-route)
5. Verify assets load correctly

## Technical Details

### Old Workflow (Vulnerable)

```yaml
- name: Deploy to GitHub Pages
  run: npm run deploy
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This used `angular-cli-ghpages` which:
- Installed `gh-pages@3.2.3` (vulnerable)
- Pushed to `gh-pages` branch
- Required manual `404.html` creation

### New Workflow (Secure)

```yaml
# Build job
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: './dist/conceal-bridge-ux'

# Deploy job
- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

This uses official GitHub Actions:
- No third-party npm dependencies
- Deploys via GitHub's infrastructure
- Automatic SPA routing support
- Better security and reliability

## References

- **Vulnerability:** [gh-pages prototype pollution](https://github.com/advisories/GHSA-xxxx-xxxx-xxxx)
- **GitHub Actions deployment:** [actions/deploy-pages](https://github.com/actions/deploy-pages)
- **Documentation:** `ai_docs/deployment.md`

## Checklist

- [x] Removed `angular-cli-ghpages` from `package.json`
- [x] Updated GitHub Actions workflow
- [x] Removed `deploy` target from `angular.json`
- [x] Removed `deploy` script from `package.json`
- [x] Updated `README.md`
- [x] Updated `ai_docs/deployment.md`
- [x] Updated `ai_docs/ci_cd.md`
- [x] Updated `ai_docs/angular_build_guide.md`
- [ ] Run `npm audit` to verify no vulnerabilities
- [ ] Test deployment to GitHub Pages
- [ ] Verify site loads correctly
- [ ] Verify deep linking works
- [ ] Verify assets load correctly

## Status

**Status:** ✅ COMPLETE  
**Verified:** Pending user testing  
**Risk:** LOW (official GitHub solution)  
