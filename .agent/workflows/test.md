---
description: Run tests with various options and configurations
---

# Test Workflow

> **Purpose**: Execute unit tests, E2E tests, and get coverage reports.

## Quick Commands

```bash
npm test              # Run all unit tests
npm run e2e           # Run E2E tests with Playwright
```

## 1. Unit Tests (Vitest)

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

Vitest will re-run tests when files change.

### Run Specific Test File

```bash
npm test -- src/app/core/bridge-api.service.spec.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "BridgeApiService"
```

### Run with Coverage

```bash
npm test -- --coverage
```

Coverage report will be in `coverage/` directory.

### Debug Tests

Add `debugger` statements in your test and run:

```bash
npm test -- --inspect
```

Then open Chrome DevTools (chrome://inspect).

## 2. E2E Tests (Playwright)

### Run All E2E Tests

```bash
npm run e2e
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Specific E2E Test File

```bash
npx playwright test e2e/swap.spec.ts
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Debug E2E Tests

```bash
npx playwright test --debug
```

### Run on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 3. Test Development Tips

### Writing Unit Tests

**Component Test Template:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent] // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Service Test Template:**

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

### Writing E2E Tests

**E2E Test Template:**

```typescript
import { test, expect } from '@playwright/test';

test('should load home page', async ({ page }) => {
  await page.goto('/');
  
  await expect(page).toHaveTitle(/Conceal Bridge/);
  await expect(page.locator('h1')).toContainText('Bridge');
});
```

## 4. Troubleshooting

### Tests Fail After Dependency Update

```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

### Playwright Browser Issues

```bash
npx playwright install --with-deps
```

### Test Timeout

Increase timeout in test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Mock HTTP Requests

```typescript
import { HttpTestingController } from '@angular/common/http/testing';

// In test
const httpMock = TestBed.inject(HttpTestingController);

service.getData().subscribe();

const req = httpMock.expectOne('/api/data');
expect(req.request.method).toBe('GET');
req.flush({ data: 'test' });

httpMock.verify();
```

## 5. CI/CD Testing

For headless CI environments:

```bash
npm test -- --run --reporter=verbose
npm run e2e -- --reporter=list
```

## Quick Reference

```bash
# Unit tests
npm test                    # Run all
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage

# E2E tests
npm run e2e                 # Run all
npx playwright test --ui    # Interactive mode
npx playwright test --debug # Debug mode
```
