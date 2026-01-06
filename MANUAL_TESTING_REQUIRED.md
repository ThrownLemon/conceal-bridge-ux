# ⚠️ Manual Testing Required - AI Agent Cannot Complete This Task

## Quick Summary

**Task:** Subtask 3.2 - Manual testing of QR code dark mode improvements
**Status:** ✅ Implementation Complete | ⏳ Manual Verification Pending
**AI Capability:** ❌ Cannot complete - requires human verification

---

## 🎯 What You Need To Do (5-10 Minutes)

### Step 1: Access the Application
The dev server is already running:
- **URL:** http://localhost:4200/
- **Page:** Navigate to `/swap`

### Step 2: Test Light Mode
1. Ensure app is in light mode
2. Initiate a swap to generate a QR code
3. Verify: Dark QR modules on light background with subtle border

### Step 3: Test Dark Mode ⚠️ CRITICAL
1. Toggle to dark mode
2. View the QR code
3. **Verify:** NO jarring bright white rectangle (the original issue!)
4. **Verify:** Light QR modules on dark background (inverted)

### Step 4: Test Scannability 📱 REQUIRED
1. Use your mobile phone to scan the QR code in **light mode**
2. Scan the same or new QR code in **dark mode**
3. Confirm both scan successfully and return correct data

### Step 5: Complete Checklist
Open and complete: `.auto-claude/specs/012-improve-qr-code-dark-mode-appearance/manual-testing-checklist.md`

### Step 6: Update Plan
After testing, edit: `.auto-claude/specs/012-improve-qr-code-dark-mode-appearance/implementation_plan.json`
- Find subtask 3.2
- Change `"status": "pending"` to `"status": "completed"`
- Add notes documenting your test results

---

## 🤖 What AI Has Already Done

### ✅ Verified Implementation
- Theme-aware background: `bg-card` (replaces `bg-white`)
- Theme-aware fill: `fill-foreground` (replaces hardcoded color)
- Added border: `border border-border`
- Improved shadow: `shadow-md`

### ✅ Verified Tests
All 9 unit tests passing (186ms):
- Component creation ✓
- QR generation ✓
- Styling classes applied correctly ✓

### ✅ Verified Server
Dev server running on port 4200, ready for testing

### ✅ Created Documentation
- AI_AGENT_MANUAL_TESTING_REPORT.md - Detailed technical report
- TESTING_INSTRUCTIONS.md - Quick testing guide
- manual-testing-checklist.md - Step-by-step checklist
- This file - Quick reference

---

## ❌ What AI Cannot Do

1. **Cannot view browser** - No way to see rendered QR code
2. **Cannot toggle theme** - No access to UI interactions
3. **Cannot scan QR codes** - No physical mobile device
4. **Cannot assess visuals** - No subjective judgment capability
5. **Cannot test responsive** - No way to resize browser

**Result:** Manual testing by a human is mandatory.

---

## 📱 Critical Test: QR Code Scannability

**Why This Matters:**
QR codes with inverted colors (light on dark) are less common. It's critical to verify that mobile scanners can read the dark mode QR code successfully.

**How to Test:**
1. Open your phone's camera or QR scanner app
2. Point it at the computer screen showing the QR code
3. Try both light and dark modes
4. Verify the correct address/data is captured
5. Test from 6-12 inches away at slight angles

**Expected:** Both modes should scan successfully. Modern QR readers handle inverted QR codes well if contrast is sufficient (which it should be with our implementation).

---

## 🎨 Expected Visual Results

### Light Mode
```
┌─────────────────┐
│ ░░░░░░░░░░░░░░░ │  ← Light background (bg-card)
│ ░██░██░░░██░██░ │  ← Dark QR modules (fill-foreground)
│ ░██░░░██░░░░██░ │
│ ░░░██░░██░██░░░ │
│ ░██░░░██░██░██░ │  Subtle border & shadow
│ ░░░░░░░░░░░░░░░ │
└─────────────────┘
```

### Dark Mode (Inverted)
```
┌─────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Dark background (bg-card)
│ ▓░░▓░░▓▓▓░░▓░░▓ │  ← Light QR modules (fill-foreground)
│ ▓░░▓▓▓░░▓▓▓▓░░▓ │
│ ▓▓▓░░▓▓░░▓░░▓▓▓ │  **NO bright white rectangle!**
│ ▓░░▓▓▓░░▓░░▓░░▓ │  Subtle themed border
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────┘
```

---

## 🚦 After Testing

### ✅ If Everything Works
1. Complete the checklist
2. Update `implementation_plan.json` - mark subtask 3.2 as `"completed"`
3. Add notes: "Manual testing complete. QR codes display correctly in both light and dark modes. Scannability verified with mobile device. Original issue (white rectangle) resolved."
4. The AI agent can then proceed to Phase 4 (quality gates)

### ❌ If You Find Issues
1. Document specific problems in the checklist
2. Note them in `implementation_plan.json`
3. Create fix subtasks if needed
4. Do NOT mark as complete

---

## 📊 Implementation Details

**Changed File:** `src/app/shared/qr-code/qr-code.component.ts`

**Before (hardcoded, breaks in dark mode):**
```typescript
class="block rounded-lg bg-white p-2 shadow-sm"
fill="#0f172a"
```

**After (theme-aware):**
```typescript
class="block rounded-lg bg-card p-2 shadow-md border border-border"
class="fill-foreground"  // on path element
```

**Why This Works:**
- `bg-card` - Tailwind semantic token, automatically: white in light mode, dark in dark mode
- `fill-foreground` - Tailwind semantic token, automatically: dark in light mode, light in dark mode
- `border-border` - Themed border color, adapts to current theme
- `shadow-md` - Improved shadow, appropriate for both themes

---

## 🔍 Troubleshooting

### Dev Server Not Running?
```bash
npm start
```
Wait for "Application bundle generation complete" then go to http://localhost:4200/

### Can't See QR Code?
You need to initiate a swap transaction on the `/swap` page to generate a QR code

### Theme Toggle Not Working?
Look for a sun/moon icon in the app header to switch themes

### QR Won't Scan?
- Increase screen brightness
- Move phone closer (6-8 inches)
- Ensure room has adequate lighting
- Try a different QR scanner app

---

## ℹ️ Additional Context

**Original Issue:**
User reported that QR codes have a "jarring bright white rectangle in dark mode" due to hardcoded `bg-white` class.

**Solution:**
Replace hardcoded colors with Tailwind semantic tokens that automatically adapt to the current theme.

**Why Manual Testing is Critical:**
1. Must confirm visual integration is acceptable
2. Must verify the original issue is truly resolved
3. Must test QR scannability with actual mobile device (inverted QR codes are less common)
4. Must assess subjective quality ("subtle", "soft", "integrated")

---

## 📞 Questions?

**Technical Details:**
- See: `AI_AGENT_MANUAL_TESTING_REPORT.md` (comprehensive technical report)

**Testing Steps:**
- See: `TESTING_INSTRUCTIONS.md` (quick guide)
- See: `manual-testing-checklist.md` (detailed checklist)

**Implementation:**
- See: `src/app/shared/qr-code/qr-code.component.ts` (the actual code)
- See: `src/app/shared/qr-code/qr-code.component.spec.ts` (unit tests)

---

**Created:** 2026-01-06
**Dev Server:** 🟢 http://localhost:4200/
**Status:** ⏳ Awaiting manual verification
**Estimated Time:** 5-10 minutes

**Thank you for completing the manual testing!** 🙏
