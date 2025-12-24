---
description: Debugging strategies and tools for Angular, Web3, and browser issues
---

# Debug Workflow

> **Purpose**: Systematic approach to debugging issues in the Conceal Bridge application.

## Quick Debug Commands

```bash
# Development with source maps
npm start

# Build with source maps
npm run build -- --source-map

# Run single test in watch mode
npm test -- --watch <test-file>

# Playwright debug mode
npx playwright test --debug
```

## Browser DevTools

### Open DevTools

- **Chrome/Edge**: F12 or Ctrl+Shift+I (Cmd+Opt+I on Mac)
- **Firefox**: F12 or Ctrl+Shift+I (Cmd+Opt+I on Mac)

### Console Tab

**View JavaScript errors:**

```javascript
// Check for errors (red text)
console.error('Critical error');

// Add breakpoints in code
debugger;

// Log signal values
console.log('address:', this.address());

// Log observable emissions
observable$.subscribe((val) => console.log('value:', val));
```

**Clear console:**

```javascript
console.clear();
// or Ctrl+L
```

### Network Tab

**Debug API calls:**

1. Open Network tab
2. Filter by XHR/Fetch
3. Look for failed requests (red)
4. Click request to see:
   - Headers (check Authorization, Content-Type)
   - Payload (request body)
   - Response (error messages)
   - Timing (slow requests)

**Common issues:**

- CORS errors: Backend needs to allow origin
- 401 Unauthorized: Check API keys/tokens
- 404 Not Found: Check URL and endpoint
- 500 Server Error: Backend issue

### Sources Tab (Debugger)

**Set breakpoints:**

1. Open Sources tab
2. Find your TypeScript file (webpack:// → src/)
3. Click line number to set breakpoint
4. Reload page or trigger action
5. Execution pauses at breakpoint

**Debug controls:**

- Resume (F8): Continue execution
- Step Over (F10): Next line
- Step Into (F11): Enter function
- Step Out (Shift+F11): Exit function

**Watch expressions:**

```javascript
this.wallet.address();
this.chainId();
this.isConnected();
```

### Application Tab

**Check local storage:**

```javascript
// View all storage
Application → Storage → Local Storage

// Check stored data
localStorage.getItem('conceal_bridge_wallet_disconnected')
localStorage.getItem('transaction_history')
```

**Clear storage:**

```javascript
localStorage.clear();
sessionStorage.clear();
```

## Angular-Specific Debugging

### Angular DevTools

Install: [Chrome](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)

**Features:**

- Component tree inspector
- Signal value viewer
- Profiler for performance
- Dependency injection tree

### Signal Debugging

```typescript
// Log when signal changes
effect(() => {
  console.log('Address changed:', this.address());
});

// Track computed signals
const value = computed(() => {
  console.log('Computing...');
  return this.data() * 2;
});
```

### Change Detection Issues

```typescript
// Force change detection
import { ChangeDetectorRef } from '@angular/core';

constructor() {
  const cdr = inject(ChangeDetectorRef);
  cdr.detectChanges();
}
```

### Router Debugging

Enable router tracing:

```typescript
// app.config.ts
provideRouter(routes, withDebugTracing());
```

## Web3 / Wallet Debugging

### Check Wallet Connection

```javascript
// In browser console
ethereum.isMetaMask;
ethereum.selectedAddress;
ethereum.chainId;
```

### Debug Viem Calls

```typescript
// Add logging to EvmWalletService
async connect() {
  console.log('Connecting wallet...');
  const accounts = await walletClient.requestAddresses();
  console.log('Accounts:', accounts);
  return accounts[0];
}
```

### Common Wallet Issues

**User rejected request:**

- User clicked "Cancel" in MetaMask
- Check error message

**Chain mismatch:**

```typescript
// Check current chain
const chainId = await publicClient.getChainId();
console.log('Current chain:', chainId);

// Expected chain
console.log('Expected:', mainnet.id);
```

**Insufficient funds:**

- Check wallet balance
- Check gas estimation

## Performance Debugging

### Chrome DevTools Performance

1. Open Performance tab
2. Click Record
3. Perform action
4. Stop recording
5. Analyze:
   - Long tasks (yellow)
   - Large style recalcs
   - Heavy JavaScript

### Angular Performance

```typescript
// Check for unnecessary re-renders
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush // Add this
})
```

### Lighthouse Audit

1. Open DevTools
2. Lighthouse tab
3. Select categories
4. Generate report
5. Fix issues

## Memory Leaks

### Detect Leaks

1. Chrome DevTools → Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare snapshots
6. Look for detached DOM nodes

### Common Causes

**Unsubscribed observables:**

```typescript
// Bad
ngOnInit() {
  this.service.data$.subscribe(data => {
    // Never unsubscribes!
  });
}

// Good
ngOnInit() {
  this.service.data$
    .pipe(takeUntilDestroyed())
    .subscribe(data => {
      // Automatically unsubscribes
    });
}
```

**Effect cleanup:**

```typescript
effect((onCleanup) => {
  const timer = setInterval(() => {}, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });
});
```

## Common Issues & Solutions

### Issue: "ExpressionChangedAfterItHasBeenCheckedError"

**Cause:** Signal/state changed during change detection

**Solution:**

```typescript
// Use setTimeout to defer change
setTimeout(() => {
  this.value.set(newValue);
});

// Or use effect
effect(() => {
  // This runs after change detection
  this.derivedValue.set(this.source());
});
```

### Issue: "Cannot read property of undefined"

**Cause:** Data not loaded yet

**Solution:**

```typescript
// Use optional chaining
{{ wallet.address()?.slice(0, 6) }}

// Or @if guard
@if (wallet.address()) {
  {{ wallet.address() }}
}
```

### Issue: Infinite loop

**Cause:** Signal updates triggering themselves

**Solution:**

```typescript
// Bad
effect(() => {
  this.counter.set(this.counter() + 1); // Infinite loop!
});

// Good
button.click(() => {
  this.counter.update((c) => c + 1);
});
```

### Issue: HTTP call not returning

**Check:**

1. Network tab - is request sent?
2. Request URL correct?
3. CORS headers present?
4. Backend running?

```typescript
// Add error handling
this.http
  .get('/api/data')
  .pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);
      return throwError(() => error);
    }),
  )
  .subscribe();
```

## Testing Debugging

### Debug Unit Tests

```typescript
// Add fit/fdescribe to run only one test
fit('should work', () => {
  // Only this test runs
});

// Add debugger
it('should work', () => {
  debugger; // Execution pauses here
  expect(true).toBe(true);
});
```

Run with inspect:

```bash
npm test -- --inspect
```

### Debug E2E Tests

```bash
# Run in headed mode
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Pause on failure
npx playwright test --pause-on-failure
```

## Logging Best Practices

```typescript
// Development logging
if (!environment.production) {
  console.log('Debug info:', data);
}

// Structured logging
console.group('Wallet Connection');
console.log('Provider:', provider);
console.log('Address:', address);
console.log('ChainId:', chainId);
console.groupEnd();

// Error logging
console.error('Failed to connect:', error);
console.trace(); // Show call stack
```

## Quick Reference

```bash
# Browser debugging
F12 → Console → Check errors
F12 → Network → Check API calls
F12 → Sources → Set breakpoints

# Angular debugging
ng serve --source-map
Use Angular DevTools extension

# Test debugging
npm test -- --watch <file>
npx playwright test --debug

# Performance
F12 → Performance → Record
F12 → Lighthouse → Generate report
```

## Related Tools

- **Angular DevTools**: <https://angular.io/guide/devtools>
- **Chrome DevTools**: <https://developer.chrome.com/docs/devtools/>
- **Playwright Inspector**: <https://playwright.dev/docs/debug>
- **Viem Docs**: <https://viem.sh/docs/>
