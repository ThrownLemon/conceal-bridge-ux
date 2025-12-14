# Deployment Guide — Conceal Bridge UX

## Overview

This document provides comprehensive deployment instructions for the Conceal Bridge UX application. The app is a static Angular SPA that can be deployed to any static hosting provider.

## Current Deployment: GitHub Pages (Native GitHub Actions)

The project uses **GitHub Actions** with the official `actions/deploy-pages` action for secure, automated deployment.

## Automated Deployment (Recommended)

Deployment happens automatically when you push to the `main` branch.

**Workflow:** `.github/workflows/deploy.yml`

**How it works:**

1. Push code to `main` branch
2. GitHub Actions automatically runs:
   - Tests
   - Production build
   - Deployment to GitHub Pages (using `actions/deploy-pages@v4`)
3. Live site updates at https://thrownlemon.github.io/conceal-bridge-ux/

**Monitor deployment:**

- Go to your repository's **Actions** tab
- View workflow runs and logs

For detailed CI/CD documentation, see [docs/ci_cd.md](ci_cd.md).

### Why Native GitHub Actions?

We use the official `actions/deploy-pages@v4` instead of third-party tools because:

✅ **Secure** - No third-party dependencies with vulnerabilities  
✅ **Official** - Maintained by GitHub  
✅ **Integrated** - Works seamlessly with GitHub Pages settings  
✅ **Simple** - No additional npm packages required  
✅ **Reliable** - Direct integration with GitHub infrastructure

**Previous approach (deprecated):** We previously used `angular-cli-ghpages`, but it has a critical security vulnerability (CVE in `gh-pages` < 5.0.0 - prototype pollution). The native GitHub Actions approach is more secure.

## Manual Deployment

There is **no manual deployment** with this setup. All deployments happen via GitHub Actions.

If you need to deploy from a branch other than `main`:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select your branch
5. Click **Run workflow**

## Configuration Details

### GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) has two jobs:

#### 1. Build Job

- Checks out code
- Sets up Node.js 20
- Installs dependencies (`npm ci`)
- Runs tests
- Builds production bundle
- Uploads build artifact to GitHub Pages

#### 2. Deploy Job

- Deploys the artifact using `actions/deploy-pages@v4`
- Runs after build job completes
- Uses `github-pages` environment

### Base HREF

The app is configured for subdirectory hosting with `--base-href=/conceal-bridge-ux/` in the build configuration.

This is set in `angular.json`:

```json
{
  "configurations": {
    "production": {
      "baseHref": "/conceal-bridge-ux/"
    }
  }
}
```

**Note:** You may need to add this configuration if it's not already present.

### Live URL

**Production:** https://thrownlemon.github.io/conceal-bridge-ux/

## First-Time Setup

After pushing the workflow file to your repository:

1. Go to your GitHub repository
2. Navigate to **Settings > Pages**
3. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Save (if needed)
5. Push to `main` branch to trigger the first deployment

GitHub will automatically deploy on every subsequent push to `master`.

## SPA Routing Support

The native GitHub Actions deployment automatically handles SPA routing correctly. When a user navigates to a deep link (e.g., `/conceal-bridge-ux/swap/ccx-to-evm/eth`), GitHub Pages serves the `index.html` and the Angular router handles the client-side navigation.

**No 404.html hack needed** - The `actions/deploy-pages` action handles this automatically.

## Security Headers

GitHub Pages does **not** support custom HTTP headers. To provide basic security, we use a `<meta>` tag in `index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
"
/>
```

**Limitations:**

- `<meta>` CSP is less secure than HTTP header CSP
- Cannot set `Cache-Control` headers (GitHub Pages has default caching)
- Cannot set other security headers like `X-Content-Type-Options`, `Strict-Transport-Security`, etc.

For production deployments requiring stricter security, consider alternative hosting (see below).

## Asset Path Handling

The app uses **relative paths** for assets to support subdirectory hosting:

- **Fonts:** Referenced in `src/styles.css` as `../public/fonts/...` (Angular build bundles them)
- **Images:** Referenced in components as `images/...` (relative, not `/images/...`)

This ensures assets load correctly when the app is hosted under `/conceal-bridge-ux/` instead of the domain root.

## Troubleshooting

### Deployment fails

**Symptom:** GitHub Actions workflow fails.

**Common causes:**

- Test failures
- Build errors
- Permissions issues

**Solution:**

1. Check the GitHub Actions logs in the **Actions** tab
2. Look for errors in the "Run tests" or "Build production bundle" steps
3. Run locally to reproduce: `npm ci && npm run test && npm run build`
4. Verify GitHub Pages is enabled in repository settings
5. Ensure the repository has Pages enabled (Settings > Pages > Source: GitHub Actions)

### Assets not loading (404 errors)

**Symptom:** Fonts or images return 404 errors.

**Solution:**

1. Verify the build includes the assets: check `dist/conceal-bridge-ux/` after building
2. Ensure asset paths are relative (not absolute with leading `/`)
3. Check that `angular.json` has `baseHref` set correctly

### Deep links return 404

**Symptom:** Refreshing a page like `/swap/ccx-to-evm/eth` returns a 404 error.

**Solution:** This should be handled automatically by GitHub Actions deployment. If it's not working:

1. Verify you're using `actions/deploy-pages@v4` in the workflow
2. Check that GitHub Pages source is set to "GitHub Actions" (not "Deploy from a branch")
3. Review the deployment logs in the Actions tab

### Permissions errors

**Symptom:** Workflow fails with permissions error.

**Solution:**

1. Verify the workflow has the correct permissions:
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```
2. Check repository settings: Settings > Actions > General > Workflow permissions
3. Ensure "Read and write permissions" is enabled

---

## Alternative Deployment Options

While GitHub Pages is the current configured target, the app can be deployed to any static hosting provider.

### Netlify

**Advantages:**

- Custom HTTP headers support (CSP, caching, etc.)
- Automatic HTTPS
- Branch previews
- Better performance (global CDN)

**Configuration:**

Create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist/conceal-bridge-ux"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache"
```

**Deploy:**

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist/conceal-bridge-ux`
4. Deploy

### Vercel

**Advantages:**

- Optimized for SPAs
- Automatic HTTPS
- Edge network
- Custom headers support

**Configuration:**

Create a `vercel.json` file:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/conceal-bridge-ux",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/(.*\\.js|.*\\.css)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/index.html",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ]
}
```

**Deploy:**

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### AWS S3 + CloudFront

**Advantages:**

- Full control over infrastructure
- Custom domain support
- Advanced caching rules
- Lambda@Edge for custom headers

**Steps:**

1. **Build the app:**

   ```bash
   npm run build
   ```

2. **Create S3 bucket:**
   - Enable static website hosting
   - Upload contents of `dist/conceal-bridge-ux/`

3. **Create CloudFront distribution:**
   - Origin: Your S3 bucket
   - Default root object: `index.html`
   - Error pages: Configure 404 to serve `index.html` with 200 status

4. **Configure caching:**
   - Create cache behaviors for `*.js` and `*.css` with long TTL
   - Set `index.html` to no-cache

5. **Add custom headers** (via Lambda@Edge or CloudFront Functions)

---

## Environment-Specific Deployments

The app supports build-time environment configuration via Angular environment files.

### Production Build

```bash
npm run build
```

This uses `src/environments/environment.ts` (production backend URL).

### Development/Testing Build

```bash
ng build --configuration development
```

This uses `src/environments/environment.development.ts` (testing backend URL).

### Deploying Different Environments

**Option 1: Separate deployments**

- Deploy production build to `bridge.conceal.network`
- Deploy development build to `test-bridge.conceal.network`

**Option 2: Runtime configuration** (not currently implemented)

- See `ai_spec/runtime_config.md` for details on implementing runtime config
- Deploy the same bundle to multiple environments
- Vary only the `config.json` file per environment

---

## Deployment Checklist

Before deploying to production:

- [ ] Run tests: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Verify environment configuration (backend URL, etc.)
- [ ] Test locally: `npm run start`
- [ ] Review security headers (CSP)
- [ ] Verify asset paths are correct
- [ ] Test deep linking (refresh on a sub-route)
- [ ] Check browser console for errors
- [ ] Verify wallet connections work
- [ ] Test swap flows end-to-end

---

## Related Documentation

- **CI/CD Pipeline:** `docs/ci_cd.md`
- **Deployment Spec:** `ai_spec/deployment_static_hosting.md`
- **Security Headers:** `ai_spec/security_headers_and_csp.md`
- **Environment Configuration:** `ai_spec/environment_configuration.md`
- **Build Guide:** `docs/build_guide.md`
- **CI/CD Spec:** `ai_spec/ci_cd_pipeline.md`

---

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs in the **Actions** tab
3. Review the deployment spec: `ai_spec/deployment_static_hosting.md`
4. Verify build output: `npm run build`
