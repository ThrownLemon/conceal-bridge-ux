---
description: Version release workflow including versioning, tagging, and changelog generation
---

# Release Workflow

> **Purpose**: Create official version releases with proper versioning, tagging, and documentation.

## Release Types

Following Semantic Versioning (semver):

- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features (backwards compatible)
- **Patch (1.0.0 → 1.0.1)**: Bug fixes

## Pre-Release Checklist

- [ ] All planned features/fixes merged to master
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No known critical bugs
- [ ] Dependencies up to date
- [ ] Security audit clean

## Release Process

### 1. Determine Version Number

Review changes since last release:

```bash
git log v1.0.0..HEAD --oneline
```

Decide version bump based on changes:

- Breaking changes? → Major
- New features? → Minor
- Only bug fixes? → Patch

### 2. Update Version in package.json

#### Option A: Manual

Edit `package.json`:

```json
{
  "version": "1.1.0"
}
```

#### Option B: npm version command

```bash
# Patch: 1.0.0 → 1.0.1
npm version patch

# Minor: 1.0.0 → 1.1.0
npm version minor

# Major: 1.0.0 → 2.0.0
npm version major
```

This automatically:

- Updates package.json
- Creates git commit
- Creates git tag

### 3. Generate Changelog

Create or update `CHANGELOG.md`:

```markdown
# Changelog

## [1.1.0] - 2025-12-21

### Added

- Transaction history modal with local storage persistence
- Chain configuration caching to reduce API calls
- Copy feedback animations for wallet addresses

### Changed

- Improved wallet connection state management
- Updated Angular to v21.0.6

### Fixed

- Chain switching bug in MetaMask
- QR code generation performance
- Input validation edge cases

### Security

- Updated dependencies with security patches
```

**Automated with conventional-changelog (if configured):**

```bash
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

### 4. Update Documentation

Update version numbers in:

- [ ] `README.md` (if version is shown)
- [ ] `docs/project_history.md` (major releases)
- [ ] `package.json` (already done)

### 5. Commit Release Changes

If you used manual versioning:

```bash
git add package.json CHANGELOG.md docs/
git commit -m "chore: release v1.1.0

- Update version to 1.1.0
- Update CHANGELOG
- Update documentation"
```

If you used `npm version`, commit is already created.

### 6. Create Git Tag

If not using `npm version`:

```bash
git tag -a v1.1.0 -m "Release v1.1.0

- Transaction history feature
- Performance improvements
- Bug fixes"
```

### 7. Push to Remote

```bash
git push origin master
git push origin v1.1.0
```

Or push all tags:

```bash
git push origin master --follow-tags
```

### 8. Create GitHub Release

#### Option A: GitHub Web UI

1. Go to: <https://github.com/ThrownLemon/conceal-bridge-ux/releases>
2. Click "Draft a new release"
3. Choose tag: v1.1.0
4. Release title: v1.1.0 - [Short Description]
5. Description: Copy from CHANGELOG.md
6. Click "Publish release"

#### Option B: GitHub CLI

```bash
gh release create v1.1.0 \
  --title "v1.1.0 - Transaction History & Performance" \
  --notes "$(cat CHANGELOG.md | sed -n '/## \[1.1.0\]/,/## \[/p' | sed '1d;$d')"
```

### 9. Verify Release

Check:

- [ ] Release appears on GitHub: <https://github.com/ThrownLemon/conceal-bridge-ux/releases>
- [ ] Tag is visible: `git tag -l`
- [ ] Deployment successful (if auto-deploy configured)
- [ ] Live site running new version

### 10. Announce Release (Optional)

If you have a changelog or blog:

- Post release notes
- Announce new features
- Thank contributors

## Post-Release

### Update bd Issues

Close all issues included in this release:

```bash
bd close <issue-id> --comment "Released in v1.1.0"
```

### Monitor for Issues

Watch for:

- User reports
- Error monitoring alerts
- GitHub issues

## Hotfix Releases

For critical bugs after release:

```bash
# From master
git checkout -b hotfix/critical-bug
# Fix bug
npm version patch  # 1.1.0 → 1.1.1
git push origin master --follow-tags
```

See [hotfix.md](./hotfix.md) for full hotfix workflow.

## Release Cadence

Recommended schedule:

- **Major releases**: Every 6-12 months (breaking changes)
- **Minor releases**: Every 2-4 weeks (new features)
- **Patch releases**: As needed (bug fixes)
- **Hotfixes**: Immediately (critical issues)

## Version History Maintenance

Keep clean git history:

```bash
# View all releases
git tag -l

# View specific release
git show v1.1.0

# Compare releases
git log v1.0.0..v1.1.0 --oneline
```

## Quick Reference

```bash
# Standard release
git log v1.0.0..HEAD --oneline  # Review changes
npm version minor                # Bump version
# Update CHANGELOG.md manually
git push origin master --follow-tags
gh release create v1.1.0 --notes "Release notes"

# Quick patch release
npm version patch
git push origin master --follow-tags
```

## Troubleshooting

### Forgot to Push Tag

```bash
git push origin v1.1.0
```

### Wrong Version Number

```bash
# Delete tag locally
git tag -d v1.1.0

# Delete remote tag
git push origin :refs/tags/v1.1.0

# Re-create with correct version
git tag -a v1.1.1 -m "Release v1.1.1"
git push origin v1.1.1
```

### Need to Undo Release

```bash
# Delete remote tag
git push origin :refs/tags/v1.1.0

# Delete GitHub release via web UI or
gh release delete v1.1.0

# Revert version commit
git revert HEAD
git push origin master
```

## Related Documentation

- [hotfix.md](./hotfix.md) - Emergency hotfix process
- [deploy.md](./deploy.md) - Deployment workflow
- [docs/project_history.md](../../docs/project_history.md) - Version history
