## 2024-05-23 - Status Messages Accessibility

**Learning:** Using `aria-live` regions for dynamic status updates is critical for screen reader users to be aware of errors or success messages that appear without page reloads.
**Action:** When adding status messages (like form errors or success notifications), always wrap them in an element with `role="alert"` or `aria-live="polite"`.

## 2025-12-17 - Button Action Feedback

**Learning:** Immediate in-context feedback (like changing "Copy" to "Copied!") is superior to global status messages for simple actions, as it confirms the specific interaction directly where the user's focus is.
**Action:** For copy buttons or similar micro-interactions, temporarily update the button text or icon to indicate success before closing any associated menus.
