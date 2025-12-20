## 2025-12-20 - In-context Button Feedback

**Learning:** For simple actions like "Copy to Clipboard", users prefer immediate, in-context feedback (e.g. button text changing to "Copied!") over global status messages which can be distracting or disconnected from the action.
**Action:** Use local state (signals) to toggle button text for ~1.5s upon successful action, instead of triggering a global toast/banner.
