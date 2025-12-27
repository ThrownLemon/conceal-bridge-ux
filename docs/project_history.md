# Project History

> Purpose: A high-level log of major architectural changes, feature additions, and significant refactors. This helps future agents understand the evolution of the codebase without reading every commit.

## 2025-12-26

- **Refactor**: Improved `ZardDebounceEventManagerPlugin` to correctly handle dotted event names (custom events) and updated `ZardEventManagerPlugin` to support single-key aliases (enter, escape, space) for better developer ergonomics.
- **Testing**: Added comprehensive unit tests for custom Angular Event Manager plugins in `src/app/shared/core/provider/event-manager-plugins/`.
