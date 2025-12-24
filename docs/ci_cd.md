# CI/CD Pipeline — Conceal Bridge UX

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Conceal Bridge UX application.

## Current Implementation: GitHub Actions

The project uses **GitHub Actions** for automated testing, building, and deployment to GitHub Pages.

### Workflow File

**Location:** `.github/workflows/deploy.yml`

### Triggers

The workflow runs automatically on:

- **Push to `main` branch** — Automatically deploys to production
- **Manual workflow dispatch** — Can be triggered manually from the GitHub Actions tab

### Pipeline Stages

The workflow has two separate jobs for better organization and security:

#### Job 1: Build

1. **Checkout** - Uses `actions/checkout@v4` to check out the repository code
2. **Setup Node.js** - Uses `actions/setup-node@v4` with Node.js 20 and npm caching
3. **Install Dependencies** - Runs `npm ci` for deterministic builds
4. **Run Tests** - Runs `npm run test -- --run --reporter=verbose`
5. **Build Production Bundle** - Runs `npm run build`
6. **Setup Pages** - Configures GitHub Pages using `actions/configure-pages@v4`
7. **Upload Artifact** - Uploads the build output using `actions/upload-pages-artifact@v3`

#### Job 2: Deploy

1. **Deploy to GitHub Pages** - Uses `actions/deploy-pages@v4` to deploy the artifact
   - Runs after the build job completes successfully
   - Uses the `github-pages` environment
   - Outputs the deployment URL

This two-job structure provides:

- ✅ Better separation of concerns
- ✅ Clearer logs and debugging
- ✅ Ability to retry deployment without rebuilding
- ✅ Integration with GitHub's deployment environments

### Permissions

The workflow requires the following permissions:

- `contents: read` — Read repository contents
- `pages: write` — Write to GitHub Pages
- `id-token: write` — Required for GitHub Pages deployment

### Concurrency

```yaml
concurrency:
  group: 'pages'
  cancel-in-progress: false
```

This ensures that only one deployment runs at a time, preventing race conditions.

## Environment Variables

The workflow uses:

- `GITHUB_TOKEN` — Automatically provided by GitHub Actions for authentication

No additional secrets are required for the current setup.

## Workflow Execution

### Automatic Deployment

1. Developer pushes code to `main` branch
2. GitHub Actions workflow is triggered automatically
3. Tests run → Build executes → Deployment to GitHub Pages
4. Live site updates at: https://thrownlemon.github.io/conceal-bridge-ux/

### Manual Deployment

1. Go to **Actions** tab in GitHub repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow** button

## Monitoring

### Viewing Workflow Runs

1. Go to the **Actions** tab in your GitHub repository
2. Click on a workflow run to see details
3. Expand each step to view logs

### Build Status

The workflow status is visible:

- On the repository homepage (badge can be added)
- In the Actions tab
- In pull requests (if configured)

### Notifications

GitHub sends notifications for:

- Failed workflow runs (via email/GitHub notifications)
- Successful deployments (optional, can be configured)

## Troubleshooting

### Build Fails

**Check:**

1. Review the workflow logs in the Actions tab
2. Look for test failures in the "Run tests" step
3. Check for build errors in the "Build production bundle" step

**Common causes:**

- Test failures
- TypeScript compilation errors
- Missing dependencies

**Solution:**
Run locally to reproduce:

```bash
npm ci
npm run test
npm run build
```

### Deployment Fails

**Check:**

1. Review the "Deploy to GitHub Pages" step logs
2. Verify GitHub Pages is enabled in repository settings
3. Check that the `gh-pages` branch exists

**Common causes:**

- Insufficient permissions
- GitHub Pages not enabled
- Repository visibility (must be public for free GitHub Pages)

**Solution:**

1. Ensure repository **Settings > Pages** is configured
2. Verify the workflow has `pages: write` permission
3. Check that the repository is public (or you have GitHub Pro/Enterprise)

### Tests Fail in CI but Pass Locally

**Possible causes:**

- Environment differences
- Timing issues in tests
- Missing environment variables

**Solution:**

1. Run tests with the same flags as CI: `npm run test -- --run`
2. Check for hardcoded paths or environment-specific code
3. Review test logs in the Actions tab

## Adding Additional Checks

### Linting

Add a lint step:

```yaml
- name: Run linter
  run: npm run lint
```

Add this **before** the "Run tests" step.

### Type Checking

Add an explicit TypeScript type check:

```yaml
- name: Type check
  run: npx tsc --noEmit
```

### Build Size Analysis

Add a step to check bundle size:

```yaml
- name: Analyze bundle size
  run: npm run build -- --stats-json
```

## Branch Strategy

### Current Setup

- **`main` branch** → Production deployment (automatic)

### Recommended Enhancement

For larger teams, consider:

- **`main` branch** → Production deployment (automatic)
- **`develop` branch** → Staging deployment (automatic to a separate GitHub Pages site or Netlify preview)
- **Feature branches** → No automatic deployment (manual testing only)

### Pull Request Checks

To add PR checks without deploying, create a separate workflow:

**`.github/workflows/pr-check.yml`:**

```yaml
name: PR Checks

on:
  pull_request:
    branches:
      - main

jobs:
  test-and-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --run
      - run: npm run build
```

This runs tests and builds on every PR without deploying.

## Deployment Environments

### Production

- **Branch:** `main`
- **URL:** https://thrownlemon.github.io/conceal-bridge-ux/
- **Environment file:** `src/environments/environment.ts`
- **Backend:** Production backend URL

### Staging/Testing (Future)

To add a staging environment:

1. Create a separate GitHub repository or use Netlify/Vercel
2. Add a workflow that deploys `develop` branch to staging
3. Use `src/environments/environment.development.ts`

## Security Considerations

### Secrets Management

- **Never commit secrets** to the repository
- Use GitHub Secrets for sensitive values
- Access secrets in workflows via `${{ secrets.SECRET_NAME }}`

### Dependency Security

Add a security scanning step:

```yaml
- name: Run security audit
  run: npm audit --audit-level=high
```

This fails the build if high-severity vulnerabilities are found.

### GITHUB_TOKEN Permissions

The workflow uses the automatically provided `GITHUB_TOKEN`. This token:

- Has limited permissions (only what's specified in the workflow)
- Expires after the workflow run
- Cannot access other repositories

## Performance Optimization

### Caching

The workflow already uses npm caching:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

This caches `node_modules` between runs, speeding up the "Install dependencies" step.

### Parallel Jobs

For larger projects, consider splitting into parallel jobs:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      -  # ... test steps

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      -  # ... build and deploy steps
```

This runs tests and builds in sequence but allows for future parallelization.

## Metrics and Monitoring

### Build Time

Monitor workflow execution time in the Actions tab. Typical times:

- Install dependencies: ~30-60 seconds (with cache)
- Run tests: ~10-30 seconds
- Build: ~20-40 seconds
- Deploy: ~10-20 seconds

**Total:** ~1-2 minutes per deployment

### Success Rate

Track deployment success rate over time. If failures increase:

1. Review recent changes
2. Check for flaky tests
3. Verify external dependencies (npm registry, GitHub Pages)

## Related Documentation

- **Deployment Guide:** `docs/deployment.md`
- **Build Guide:** `docs/build_guide.md`
- **Testing Guide:** `docs/testing.md`

## Future Enhancements

### Planned Improvements

1. **Lighthouse CI** for performance monitoring
2. **Automated release notes** generation
3. **Slack/Discord notifications** for deployment status

### Alternative CI/CD Platforms

While GitHub Actions is the current choice, the app can be deployed via:

- **GitLab CI** (`.gitlab-ci.yml`)
- **CircleCI** (`.circleci/config.yml`)
- **Travis CI** (`.travis.yml`)