# PWA Manual Testing Guide

Quick guide to manually verify PWA installability and offline functionality.

## Prerequisites

```bash
# Serve the production build
npx serve dist/conceal-bridge-ux/browser -p 3000
```

## Step 1: Service Worker Registration (2 minutes)

1. Open http://localhost:3000 in **Chrome** (or Chromium-based browser)
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Application** tab → **Service Workers**

**Expected:**
- ✅ Service worker shows "Activated and running" with green status indicator
- ✅ Source shows `ngsw-worker.js`
- ✅ "Update on reload" and "Bypass for network" checkboxes available

## Step 2: Manifest Verification (1 minute)

In DevTools **Application** tab → **Manifest**

**Expected:**
- ✅ Name: "Conceal Bridge"
- ✅ Short name: "CCX Bridge"
- ✅ Start URL: "/"
- ✅ Display: "standalone"
- ✅ Theme color: #ffa500 (orange badge)
- ✅ Two icons visible (192x192, 512x512)

## Step 3: Install Prompt (1 minute)

**Desktop Chrome:**
- Look for install icon (⊕ or ⬇) in address bar
- OR DevTools → Application → Manifest → "Add to homescreen" button

**Mobile Chrome:**
- Three-dot menu → "Add to Home screen" or "Install app"

**Expected:**
- ✅ Install prompt appears with app name and icon
- ✅ App can be installed successfully

## Step 4: Offline Functionality (3 minutes)

1. Visit http://localhost:3000 and wait for full page load
2. Navigate to a few routes (/, /swap)
3. In DevTools → **Network** tab:
   - Check "Offline" checkbox
4. Reload the page (Cmd+R or Ctrl+R)
5. Try navigating between routes

**Expected:**
- ✅ Page loads successfully while offline
- ✅ All static assets (JS, CSS, icons) load from cache
- ✅ App shell displays properly
- ✅ Navigation works between cached routes
- ⚠️ API calls may fail (expected - show appropriate error messages)

## Step 5: Cache Storage (2 minutes)

In DevTools **Application** tab → **Cache Storage**

**Expected:**
- ✅ Multiple ngsw caches visible:
  - `ngsw:/conceal-bridge-ux:cache`
  - `ngsw:/conceal-bridge-ux:db:control`
  - `ngsw:/conceal-bridge-ux:db:ngsw:...`
- ✅ App shell files cached (index.html, main JS chunks, styles)
- ✅ Icons and manifest cached

## Step 6: Update Detection (Optional - 5 minutes)

1. While app is running, make a small change to a source file
2. Run `npm run build`
3. Wait 30-60 seconds or trigger update in DevTools

**Expected:**
- ✅ Service worker detects new version
- ✅ Toast notification: "App update available"
- ✅ Clicking update reloads app with new version

## Quick Checklist

Copy this to verify all items:

```
Service Worker Registration
[ ] Service worker activated and running
[ ] Source: ngsw-worker.js
[ ] Green status indicator

Manifest
[ ] Correct name, short name, icons
[ ] Display: standalone
[ ] Theme color visible

Install
[ ] Install prompt appears
[ ] App can be installed

Offline
[ ] App loads when offline
[ ] Static assets from cache
[ ] Navigation works offline

Cache Storage
[ ] ngsw caches present
[ ] App shell cached
[ ] Assets cached
```

## Common Issues

### Service worker not registering
- Ensure you're on localhost (treated as secure origin)
- Check DevTools Console for errors
- Verify `ngsw-worker.js` and `ngsw.json` exist in build

### Install prompt not appearing
- Some browsers require HTTPS (localhost is OK)
- Manifest may need multiple visits before showing prompt
- Check DevTools → Application → Manifest for installability criteria

### Offline mode not working
- Ensure you visited the app while online first (initial cache)
- Clear cache and reload once while online
- Check service worker status is "activated"

## Success Criteria

All checks above should pass. The app should:
1. ✅ Register service worker
2. ✅ Show install prompt
3. ✅ Work offline after first visit
4. ✅ Cache app shell and assets
5. ✅ Notify on updates (if tested)

## Report Results

After testing, update `subtask-5-2` in the implementation plan with findings.

---

**Testing Time:** ~10 minutes
**Browser:** Chrome/Chromium recommended
**Environment:** localhost:3000 (production build)
