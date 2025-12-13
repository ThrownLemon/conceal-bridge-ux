# GitHub Pages Setup Instructions

## ⚠️ IMPORTANT: One-Time Setup Required

After pushing the code, you need to update your GitHub Pages settings **once**:

### Steps:

1. **Go to your repository on GitHub:**
   https://github.com/ThrownLemon/conceal-bridge-ux

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Pages** in the left sidebar

3. **Change the Source:**
   - Under **Build and deployment**
   - Under **Source**, select **GitHub Actions** from the dropdown
   - (It may currently be set to "Deploy from a branch")

4. **Save:**
   - The setting saves automatically
   - You should see a message about GitHub Actions

5. **Verify:**
   - Go to the **Actions** tab
   - You should see the "Deploy to GitHub Pages" workflow running
   - Wait for it to complete (usually 1-2 minutes)

6. **Check the live site:**
   - Visit: https://thrownlemon.github.io/conceal-bridge-ux/
   - Verify the site loads correctly
   - Test navigation and deep linking

## What Changed

- ✅ Removed vulnerable `angular-cli-ghpages` package
- ✅ Implemented secure native GitHub Actions deployment
- ✅ Fixed branch name (master, not main)
- ✅ Fixed test command for Angular
- ✅ Updated all documentation

## Future Deployments

After this one-time setup, deployments will happen **automatically** whenever you push to `master`:

```bash
git push origin master
```

No manual deployment needed!

## Troubleshooting

### Workflow doesn't run
- Check that GitHub Pages source is set to "GitHub Actions"
- Verify the workflow file exists: `.github/workflows/deploy.yml`

### Deployment fails
- Check the Actions tab for error logs
- Common issues:
  - Test failures
  - Build errors
  - Permissions (should be automatic)

### Site doesn't update
- Wait a few minutes (GitHub Pages can take 1-2 minutes to update)
- Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
- Check the Actions tab to verify deployment completed

## Status

- [x] Code pushed to repository
- [ ] GitHub Pages settings updated (YOU NEED TO DO THIS)
- [ ] Workflow runs successfully
- [ ] Site loads at https://thrownlemon.github.io/conceal-bridge-ux/
