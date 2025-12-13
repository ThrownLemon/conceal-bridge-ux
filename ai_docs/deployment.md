# Deployment Guide — Conceal Bridge UX

## Overview

This document provides comprehensive deployment instructions for the Conceal Bridge UX application. The app is a static Angular SPA that can be deployed to any static hosting provider.

## Current Deployment: GitHub Pages

The project is currently configured for automated deployment to GitHub Pages using `angular-cli-ghpages`.

## Automated Deployment (Recommended)

The project uses **GitHub Actions** for continuous deployment. Deployment happens automatically when you push to the `main` branch.

**Workflow:** `.github/workflows/deploy.yml`

**How it works:**
1. Push code to `main` branch
2. GitHub Actions automatically runs:
   - Tests
   - Production build
   - Deployment to GitHub Pages
3. Live site updates at https://thrownlemon.github.io/conceal-bridge-ux/

**Monitor deployment:**
- Go to your repository's **Actions** tab
- View workflow runs and logs

For detailed CI/CD documentation, see [ai_docs/ci_cd.md](ci_cd.md).

## Manual Deployment

If you need to deploy manually (e.g., from a feature branch or for testing):

### Quick Deploy

```bash
npm run deploy
```

This single command will:
1. Build the production bundle
2. Create a `404.html` file for SPA routing support
3. Push the build output to the `gh-pages` branch
4. Trigger GitHub Pages to update the live site

### Live URL

**Production:** https://thrownlemon.github.io/conceal-bridge-ux/

### Configuration Details

#### angular.json

The deploy target is configured in `angular.json`:

```json
{
  "architect": {
    "deploy": {
      "builder": "angular-cli-ghpages:deploy",
      "options": {}
    }
  }
}
```

#### package.json

A convenience script is provided:

```json
{
  "scripts": {
    "deploy": "ng deploy --base-href=/conceal-bridge-ux/"
  }
}
```

The `--base-href` flag is **critical** for GitHub Pages subdirectory hosting. It ensures:
- All asset paths are correctly prefixed with `/conceal-bridge-ux/`
- The Angular router's base URL is set correctly
- Fonts, images, and other static assets load properly

### First-Time Setup

After your first successful deployment:

1. Go to your GitHub repository
2. Navigate to **Settings > Pages**
3. Ensure the source is set to **Deploy from a branch**
4. Select the **gh-pages** branch
5. Click **Save**

GitHub Pages will automatically deploy whenever the `gh-pages` branch is updated.

### SPA Routing Support

GitHub Pages does not natively support SPA routing (client-side routing). The `angular-cli-ghpages` tool solves this by:

1. Creating a `404.html` file that is a copy of `index.html`
2. When a user navigates to a deep link (e.g., `/conceal-bridge-ux/swap/ccx-to-evm/eth`), GitHub Pages serves the `404.html`
3. The Angular app bootstraps and the router handles the client-side navigation

This is a standard workaround for SPAs on GitHub Pages.

### Security Headers

GitHub Pages does **not** support custom HTTP headers. To provide basic security, we use a `<meta>` tag in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

**Limitations:**
- `<meta>` CSP is less secure than HTTP header CSP
- Cannot set `Cache-Control` headers (GitHub Pages has default caching)
- Cannot set other security headers like `X-Content-Type-Options`, `Strict-Transport-Security`, etc.

For production deployments requiring stricter security, consider alternative hosting (see below).

### Asset Path Handling

The app uses **relative paths** for assets to support subdirectory hosting:

- **Fonts:** Referenced in `src/styles.css` as `../public/fonts/...` (Angular build bundles them)
- **Images:** Referenced in components as `images/...` (relative, not `/images/...`)

This ensures assets load correctly when the app is hosted under `/conceal-bridge-ux/` instead of the domain root.

### Troubleshooting

#### Assets not loading (404 errors)

**Symptom:** Fonts or images return 404 errors.

**Solution:** Ensure you're using the `--base-href` flag when deploying:
```bash
ng deploy --base-href=/conceal-bridge-ux/
```

#### Deep links return 404

**Symptom:** Refreshing a page like `/swap/ccx-to-evm/eth` returns a 404 error.

**Solution:** This should be handled automatically by the `404.html` file. If it's not working:
1. Check that `404.html` exists in the `gh-pages` branch
2. Verify GitHub Pages is serving from the `gh-pages` branch

#### Deployment fails

**Symptom:** Deployment fails (manual or automated).

**Common causes:**
- Git authentication issues (ensure you have push access to the repository)
- Build errors (run `npm run build` first to verify the build succeeds)
- Test failures (check GitHub Actions logs)
- Missing `angular-cli-ghpages` dependency (run `npm install`)

**Solution:**
1. **For automated deployment:** Check the GitHub Actions logs in the **Actions** tab
2. **For manual deployment:** Run `npm run build` and `npm run test` locally to identify issues
3. Verify you have push access to the repository
4. Ensure all dependencies are installed: `npm ci`

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
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
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
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
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

### Nginx

**Advantages:**
- Self-hosted
- Full control
- Custom headers and caching

**Configuration:**

```nginx
server {
    listen 80;
    server_name bridge.conceal.network;

    root /var/www/conceal-bridge-ux;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed assets
    location ~* \.(js|css)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';" always;
}
```

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

## Monitoring and Observability

### Client-Side Error Tracking

The app uses Angular's built-in error handling:

```typescript
provideBrowserGlobalErrorListeners()
```

**Recommendation:** Integrate a service like Sentry for production error tracking:

1. Install: `npm install @sentry/angular`
2. Configure in `app.config.ts`
3. Add Sentry DSN to environment files

### Analytics

**Recommendation:** Add Google Analytics or similar:

1. Add tracking script to `index.html`
2. Configure CSP to allow analytics domain

---

## Related Documentation

- **CI/CD Pipeline:** `ai_docs/ci_cd.md`
- **Deployment Spec:** `ai_spec/deployment_static_hosting.md`
- **Security Headers:** `ai_spec/security_headers_and_csp.md`
- **Environment Configuration:** `ai_spec/environment_configuration.md`
- **Build Guide:** `ai_docs/angular_build_guide.md`
- **CI/CD Spec:** `ai_spec/ci_cd_pipeline.md`

---

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review the deployment spec: `ai_spec/deployment_static_hosting.md`
3. Check GitHub Actions logs (if CI/CD is configured)
4. Verify build output: `npm run build`
