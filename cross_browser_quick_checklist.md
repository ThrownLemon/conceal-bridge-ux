# Cross-Browser Testing Quick Checklist
## Loading Animation Feature

**Purpose:** Quick-reference guide for manual cross-browser testing
**Feature:** Visual polling/loading animation during deposit wait
**Last Updated:** 2026-01-07

---

## 📋 Quick Reference

### What to Test
1. Spinner appears during step 1 (polling)
2. Spinner rotates smoothly (2-second period)
3. Spinner disappears when step completes
4. Visual quality is consistent across browsers

### Browsers to Test
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest, macOS only)
- ✅ Edge (latest, Windows only)

### Time Required
- **Per Browser:** ~10 minutes
- **Total:** ~40 minutes

---

## 🚀 Quick Start

### Setup
1. Start dev server: `npm start`
2. Open browser: `http://localhost:4200`
3. Open DevTools: `F12` (Windows) or `Cmd+Option+I` (Mac)
4. Clear cache: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`

### Test Flow (Per Browser)

#### Step 1: Test CCX-to-EVM Direction ⏱️ 5 min
```
1. Select "CCX to EVM"
2. Enter amount, click "Initialize Swap"
3. Pay gas, confirm tx
4. Wait for step 1 card
```

**Check:**
- [ ] Spinner appears next to "Step 2 — Send CCX with payment ID"
- [ ] Spinner rotates clockwise (2-second period)
- [ ] Color is amber (#fbbf24)
- [ ] Rotation is smooth (no stuttering)
- [ ] Monitored for 30 seconds (continuous rotation)

#### Step 2: Test EVM-to-CCX Direction ⏱️ 5 min
```
1. Select "EVM to CCX"
2. Enter amount, click "Initialize Swap"
3. Pay gas, confirm tx
4. Wait for step 1 card
```

**Check:**
- [ ] Spinner appears next to "Processing"
- [ ] Spinner rotates clockwise (2-second period)
- [ ] Color is amber (#fbbf24)
- [ ] Rotation is smooth (no stuttering)
- [ ] Monitored for 30 seconds (continuous rotation)

---

## ✅ Pass Criteria

A browser **PASSES** if all criteria are met:

- ✅ Spinner icon appears
- ✅ Spinner rotates continuously
- ✅ Rotation is smooth (no stuttering)
- ✅ Color is amber (#fbbf24)
- ✅ Positioning is correct (inline with title)
- ✅ Spinner disappears on completion
- ✅ No console errors

---

## ❌ Fail Criteria

A browser **FAILS** if any issue occurs:

- ❌ Spinner does not appear
- ❌ Spinner is static (no rotation)
- ❌ Rotation is stuttering (FPS <24)
- ❌ Color is wrong/missing
- ❌ Spinner doesn't disappear
- ❌ Console errors present

---

## 🔧 Troubleshooting

### Issue: Spinner not appearing
**Check:**
1. Step state is 1 (polling phase)
2. No console errors
3. Component is mounted

### Issue: Spinner not rotating
**Check:**
1. Hardware acceleration enabled in browser
2. CSS animations not disabled
3. No animation overrides in DevTools

### Issue: Stuttering animation
**Check:**
1. Close other tabs (free up GPU)
2. Disable browser extensions
3. Enable hardware acceleration

---

## 📊 Test Results Template

Copy this template for each browser:

### Chrome (Version ___)
- [ ] CCX-to-EVM spinner test: PASS / FAIL
- [ ] EVM-to-CCX spinner test: PASS / FAIL
- [ ] Visual quality: ⭐⭐⭐⭐⭐ (1-5)
- [ ] Performance (FPS): ___
- [ ] Issues: _____________________
- [ ] Overall: PASS / FAIL

### Firefox (Version ___)
- [ ] CCX-to-EVM spinner test: PASS / FAIL
- [ ] EVM-to-CCX spinner test: PASS / FAIL
- [ ] Visual quality: ⭐⭐⭐⭐⭐ (1-5)
- [ ] Performance (FPS): ___
- [ ] Issues: _____________________
- [ ] Overall: PASS / FAIL

### Safari (Version ___)
- [ ] CCX-to-EVM spinner test: PASS / FAIL
- [ ] EVM-to-CCX spinner test: PASS / FAIL
- [ ] Visual quality: ⭐⭐⭐⭐⭐ (1-5)
- [ ] Performance (FPS): ___
- [ ] Issues: _____________________
- [ ] Overall: PASS / FAIL

### Edge (Version ___)
- [ ] CCX-to-EVM spinner test: PASS / FAIL
- [ ] EVM-to-CCX spinner test: PASS / FAIL
- [ ] Visual quality: ⭐⭐⭐⭐⭐ (1-5)
- [ ] Performance (FPS): ___
- [ ] Issues: _____________________
- [ ] Overall: PASS / FAIL

---

## 🎯 Expected Visual Reference

### What You Should See

**Spinner Icon:**
- Circular ring with segmented sections
- Amber color (#fbbf24)
- Inline with card title (left side)
- 2px gap between spinner and text

**Animation:**
- Continuous clockwise rotation
- 360° rotation over 2 seconds
- Smooth, linear motion
- No pauses or jumps

**Placement:**
```
[🔄] Step 2 — Send CCX with payment ID
     ↑
   Spinner
```

---

## 💡 Tips

### For Accurate Testing
1. **Use fresh browser session** (clear cache first)
2. **Disable extensions** (can interfere with animations)
3. **Use DevTools** to verify animation is playing
4. **Monitor for 30 seconds** (ensure continuous rotation)
5. **Test both directions** (CCX-to-EVM and EVM-to-CCX)

### Checking Performance
**Chrome/Edge:**
1. DevTools → Performance → Record
2. Let run for 10 seconds
3. Check FPS (should be ~60)

**Firefox:**
1. DevTools → Performance → Start recording
2. Let run for 10 seconds
3. Check FPS (should be ~60)

**Safari:**
1. DevTools → Timeline → Record
2. Let run for 10 seconds
3. Check FPS (should be ~60)

---

## 📝 Additional Notes

### Browser-Specific Considerations

**Chrome/Edge:**
- Most consistent rendering
- Best GPU acceleration
- Reference implementation

**Firefox:**
- WebRender provides excellent performance
- Slight color variation possible (color profile)

**Safari:**
- Core Animation is highly optimized
- Best performance on macOS/iOS
- Color may appear warmer (Apple color profile)

**Edge:**
- Same as Chrome (Chromium-based)
- Tested on Windows only

---

## 🚨 Known Issues

**Expected Minor Variations:**
- Slight color differences (browser color profiles)
- 1-2px positioning differences (browser rounding)
- Occasional frame drops (FPS 50-59) - acceptable

**Not Acceptable:**
- Static spinner (no rotation)
- Severe stuttering (FPS <24)
- Missing or wrong color
- Console errors

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify browser version (must be modern)
3. Try clearing cache and restarting browser
4. Check `cross_browser_testing_4.3.md` for detailed troubleshooting
5. Report issues with browser version, OS, and screenshot/video

---

**Quick Checklist Version:** 1.0
**Comprehensive Guide:** `cross_browser_testing_4.3.md`
**Last Updated:** 2026-01-07
