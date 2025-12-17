## 2024-05-23 - Status Messages Accessibility

**Learning:** Using `aria-live` regions for dynamic status updates is critical for screen reader users to be aware of errors or success messages that appear without page reloads.
**Action:** When adding status messages (like form errors or success notifications), always wrap them in an element with `role="alert"` or `aria-live="polite"`.
