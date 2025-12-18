## 2025-12-18 - [Data Loading] Large 3rd Party Metadata

**Learning:** The app fetches a huge list of chains from LI.FI just to use 3 EVM chains. This delays TTI on slow networks.
**Action:** Cache filtered results in localStorage to avoid repeated large fetches.
