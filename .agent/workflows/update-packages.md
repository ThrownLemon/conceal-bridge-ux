---
description: Safe workflow for updating npm packages with testing and verification
---

# Update Packages Workflow

> **Purpose**: Safely update npm dependencies while ensuring no breaking changes are introduced.

## Prerequisites

Ensure you have `npm-check-updates` installed globally:

```bash
npm install -g npm-check-updates
```

## 1. Check for Available Updates

```bash
ncu
```

This shows available updates without making changes.

**Review the output:**

- 🟢 **Patch updates** (1.0.0 → 1.0.1) - Usually safe
- 🟡 **Minor updates** (1.0.0 → 1.1.0) - Generally safe, check changelog
- 🔴 **Major updates** (1.0.0 → 2.0.0) - Breaking changes, review carefully

## 2. Review Changelogs (Critical for Major Updates)

For major version updates:

```bash
npm view <package-name> dist-tags
npm view <package-name>@latest
```

Or visit package on npmjs.com to read CHANGELOG/migration guides.

**Key packages to watch:**

- `@angular/*` - Major Angular updates require migration guides
- `viem` - Web3 library, check for breaking API changes
- `tailwindcss` - CSS framework updates may affect utilities

## 3. Update Strategy

### Option A: Update All (Careful!)

```bash
ncu -u
npm install
```

### Option B: Update Selectively (Recommended)

```bash
# Update specific packages
ncu -u <package-name>
npm install

# Update only patch versions (safest)
ncu -u --target patch
npm install

# Update only minor versions
ncu -u --target minor
npm install
```

### Option C: Interactive Mode

```bash
ncu -i
```

Select which packages to update interactively.

## 4. Verify After Update

### Run Quality Gates

```bash
# Lint
npm run lint

# Type check + build
npm run build

# Unit tests
npm test

# E2E tests (if applicable)
npm run e2e
```

### Test Critical Paths

Start the dev server and manually test:

```bash
npm start
```

**Check:**

- [ ] App loads without console errors
- [ ] Wallet connection works
- [ ] Main swap flow functions
- [ ] Transaction history displays

## 5. Handle Breaking Changes

If tests fail or app breaks:

1. **Check package changelog** for migration steps
2. **Revert if needed**:

   ```bash
   git restore package.json package-lock.json
   npm install
   ```

3. **Update incrementally** - Update one major package at a time

## 6. Commit Changes

```bash
git add package.json package-lock.json
git commit -m "chore: update npm dependencies

- Update <package> from X.Y.Z to A.B.C
- [List other major updates]
- All tests passing
- Manual testing verified"
```

## 7. Document Major Updates

For significant updates (especially Angular), update:

- `docs/project_history.md` - Log the update
- `README.md` - Update version numbers if shown
- `AGENTS.md` - Update if tech stack versions mentioned

## Common Issues

### Peer Dependency Warnings

```bash
npm install --legacy-peer-deps
```

Or update peer dependencies to compatible versions.

### Lock File Conflicts

```bash
rm package-lock.json node_modules -rf
npm install
```

### Angular Updates

Use Angular's official migration tool:

```bash
ng update @angular/core @angular/cli
```

## Quick Reference

```bash
# Safe update workflow
ncu                           # Check updates
ncu -u --target minor         # Update minor versions
npm install                   # Install updates
npm run lint && npm test && npm run build  # Verify
git commit -m "chore: update dependencies"
```
