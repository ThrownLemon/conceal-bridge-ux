---
name: Test Task
about: Create a testing task for unit, integration, or E2E tests
title: 'Add tests for '
labels: 'test'
assignees: ''
---

## Problem

Describe what is currently untested and why test coverage is needed.

## Acceptance Criteria

- [ ] Create test file: `*.spec.ts`
- [ ] Test happy path scenarios
- [ ] Test error handling
- [ ] Test edge cases
- [ ] Achieve >80% coverage for target component/service
- [ ] All tests pass in CI

## Test Scenarios

1. **Scenario 1**: Description
   - Given [context]
   - When [action]
   - Then [expected outcome]

2. **Scenario 2**: Description
   - Given [context]
   - When [action]
   - Then [expected outcome]

## Files Affected

- `src/app/path/to/component.ts`
- New: `src/app/path/to/component.spec.ts`

## Technical Notes

- Testing framework: Vitest
- Mocking requirements: [e.g., localStorage, HTTP calls]
- Use `fakeAsync` for async operations
- Mock dependencies: [list services/modules to mock]
