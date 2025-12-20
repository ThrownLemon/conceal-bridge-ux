## 2025-12-20 - [LocalStorage Caching for Static Data]
**Learning:** Initializing services that fetch large static datasets (like chain metadata) can significantly delay startup or "loaded" states. Caching this data in localStorage is a simple, effective pattern to improve perceived performance on subsequent visits.
**Action:** When working with static or semi-static API data, always consider localStorage caching with a TTL.
