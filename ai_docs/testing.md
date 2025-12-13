# Testing Guide — Concael Bridge UX (AI Agent)

This guide defines **how to test this project** (Angular 21 + Vitest + viem) and how the AI agent should structure tests so they are reliable in CI and do not depend on real wallets or real chains.

Core references:
- Unit test runner & scripts: [`package.json`](concael-bridge-ux/package.json:4), Angular test builder: [`angular.json`](concael-bridge-ux/angular.json:70)
- Vitest globals typing: [`tsconfig.spec.json`](concael-bridge-ux/tsconfig.spec.json:4)
- Existing baseline test style: [`app.spec.ts`](concael-bridge-ux/src/app/app.spec.ts:1)
- Swap flow under test: [`SwapPage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:400)
- Wallet integration: [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:34)
- API client: [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13)
- E2E plan: [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:1)

---

## 1) Testing stack in this repo (current reality)

- Unit tests run via the Angular CLI test builder [`@angular/build:unit-test`](concael-bridge-ux/angular.json:71), invoked by the test script in [`package.json`](concael-bridge-ux/package.json:9).
- The repo includes Vitest and configures global types via [`vitest/globals`](concael-bridge-ux/tsconfig.spec.json:7).
- Current unit tests use Angular’s [`TestBed`](concael-bridge-ux/src/app/app.spec.ts:1) and standard spec structure (see the suite in [`describe()`](concael-bridge-ux/src/app/app.spec.ts:5)).

**Rule:** keep unit tests **deterministic** and runnable without:
- external HTTP
- real wallet extensions
- real chain RPC calls

---

## 2) Test layers & what belongs where

### 2.1 “Pure” unit tests (fastest, most stable)
Use for:
- parsing helpers / validation helpers (e.g. address regex logic in [`SwapPage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:19))
- any deterministic mapping/formatting you add

**Rule:** these tests should not use DOM, Angular DI, or network.

### 2.2 Service tests (Angular DI, no DOM rendering)
Use for:
- [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13) URL building and request shapes
- [`EvmChainMetadataService`](concael-bridge-ux/src/app/core/evm-chain-metadata.service.ts:23) behavior when remote metadata fails (it already swallows failures via [`catchError()`](concael-bridge-ux/src/app/core/evm-chain-metadata.service.ts:45))
- [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:34) behavior around provider selection and error handling

**Rule:** do not hit real networks; use Angular HTTP testing utilities for HttpClient-based services and provider fakes for wallet integration.

### 2.3 Component tests (Angular rendering)
Use for:
- template + user interaction + signal state assertions
- primary example is already in [`app.spec.ts`](concael-bridge-ux/src/app/app.spec.ts:1)

**Rule:** for component tests, mock dependencies at DI boundaries rather than trying to mock low-level viem internals.

### 2.4 E2E (browser-level, but fully mocked dependencies)
This repo does not currently ship an E2E framework (see the “no E2E framework by default” note in [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:5)).

**Rule:** E2E tests must:
- inject a fake EIP-1193 provider (so wallet UI works without real extensions)
- intercept backend requests from [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13)
- validate flows and routing without real blockchain transactions

---

## 3) Unit testing patterns for Web3-heavy UI (SwapPage & wallet UI)

### 3.1 Prefer “test the orchestration,” not the chain
The goal is to test:
- UI validation messages
- step transitions
- error handling (`isBusy`, `statusMessage`, `pageError`)
- correct calls into service boundaries

For the swap flow, the “public contract” is:
- UI state signals like [`step`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:438), [`isBusy`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:439), [`statusMessage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:446)
- the backend call sequencing in [`startCcxToEvm()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:598) and [`startEvmToCcx()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:720)

**Rule:** for component tests, stub:
- [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13) methods (returning Observables)
- [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:34) methods like [`connect()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:134), [`ensureChain()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:205), [`waitForReceipt()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:265), and [`getClients()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:234)

This avoids having to simulate actual viem behavior for most tests.

### 3.2 Pattern: build test data from real types
Use real types/interfaces from:
- [`BridgeChainConfig`](concael-bridge-ux/src/app/core/bridge-types.ts:8)
- swap responses like [`BridgeInitSwapResponse`](concael-bridge-ux/src/app/core/bridge-types.ts:39)

**Rule:** avoid “any” in fixtures when possible; keep test payloads aligned to real types so refactors don’t silently break tests.

---

## 4) Mocking viem clients (when you truly need to)

### 4.1 Default approach: mock at `EvmWalletService` boundary
Most tests should not mock viem directly. Instead:
- provide a fake [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:34) via Angular DI
- have its [`getClients()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:234) return a fake `{ publicClient, walletClient }`

This is typically sufficient to test:
- “insufficient wCCX” branch (see the check in [`startEvmToCcx()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:789))
- successful transfer branch (see contract write in [`startEvmToCcx()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:794))

### 4.2 If you must mock module-level viem helpers
If you add new code that calls viem module functions directly and you need module-mocking, follow the Vitest mocking pattern already documented in [`web3_integrations.md`](concael-bridge-ux/ai_docs/web3_integrations.md:1014).

**Rule:** keep module mocks narrow; prefer returning minimal fakes that cover only the methods you call.

---

## 5) Testing wallet connections (in unit/component tests)

### 5.1 Understand what the app expects from the provider
The wallet service expects an EIP-1193 provider shape:
- `request({ method })` and event handlers (see the provider type and flags in [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:15))
- it attaches listeners in [`#setProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:359)

The connect flow uses:
- [`walletClient.requestAddresses()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:141) via viem wallet client
- error conditions surfaced through the wallet UI helper [`friendlyError()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466)

### 5.2 Unit testing strategy options
Pick one depending on what you are testing:

1) **Testing UI components (recommended):**
   - provide a stubbed wallet service that simulates:
     - connected state: [`isConnected`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:69)
     - address: [`address`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:41)
     - connector: [`connector`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:50)

2) **Testing `EvmWalletService` itself (more involved):**
   - inject a fake `window.ethereum` provider (and optionally `window.BinanceChain`) consistent with detection in [`hasInjectedProvider`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:55) / [`hasBinanceProvider`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:58)
   - implement enough provider behavior so calls from [`hydrate()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:114) and [`ensureChain()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:205) can execute deterministically

**Rule:** never rely on a real wallet extension in unit tests.

---

## 6) Testing smart contract interactions (without real chain RPC)

The swap page performs two kinds of contract operations:
- read: [`publicClient.readContract()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:782)
- write: [`walletClient.writeContract()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:794)

### 6.1 Unit test what you control
Focus tests on:
- correct behavior when read returns “insufficient”
- correct sequencing when write returns a hash and receipt confirms via [`waitForReceipt()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:265)

**Rule:** do not attempt to validate ERC-20 behavior in unit tests; just validate the app’s reaction to the expected client responses.

---

## 7) Component testing with Vitest + Angular TestBed

### 7.1 Use existing conventions
Follow the pattern used in:
- configuring test module: [`TestBed.configureTestingModule()`](concael-bridge-ux/src/app/app.spec.ts:7)
- creating a component: [`TestBed.createComponent()`](concael-bridge-ux/src/app/app.spec.ts:14)
- waiting for stabilization: [`fixture.whenStable()`](concael-bridge-ux/src/app/app.spec.ts:21)
- asserting DOM output: [`expect()`](concael-bridge-ux/src/app/app.spec.ts:23)

### 7.2 Recommendations for new component tests
- Prefer stubbing dependencies through DI rather than patching internals.
- Avoid time-based waits. If you need to validate polling-related UI, structure the code under test so time can be controlled deterministically (see polling implementation in [`startPolling()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:845)).

---

## 8) E2E testing for bridge flows (recommended approach)

Use the plan in [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:1). Key project-specific requirements:

1. **Mock backend requests** generated by [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13) (routes listed in [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:45)).
2. **Inject a fake provider** implementing the methods enumerated in [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:72) so [`connect()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:134) works without a real wallet.
3. **Verify swap completion via polling** (the polling success condition is `r.result === true` in [`startPolling()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:853)).

**Rule:** E2E should validate routing + UX behavior, not real chain finality.

---

## 9) AI agent checklist (before adding/adjusting tests)

- Tests do not call real external endpoints (backend, LI.FI metadata, chain RPC).
- Web3 tests mock at the boundary (`EvmWalletService` or provider) unless a smaller unit requires mocking viem (see [`web3_integrations.md`](concael-bridge-ux/ai_docs/web3_integrations.md:1014)).
- Test fixtures match actual interfaces (see [`bridge-types.ts`](concael-bridge-ux/src/app/core/bridge-types.ts:1)).
- Component tests follow current patterns in [`app.spec.ts`](concael-bridge-ux/src/app/app.spec.ts:1).
- E2E plan (if implemented) follows [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:1).

---

## Related docs/specs in this repo

- Error states to validate (busy gating, status messages, retries): [`error_handling.md`](concael-bridge-ux/ai_docs/error_handling.md:1)
- Backend endpoints to mock and their real response shapes: [`backend_api.md`](concael-bridge-ux/ai_docs/backend_api.md:1)
- Wallet integration behaviors (connectors, chain switching, error codes): [`wallets.md`](concael-bridge-ux/ai_docs/wallets.md:1)
- Smart contract interaction/verification patterns (ERC-20, unit scaling): [`smart_conctracts.md`](concael-bridge-ux/ai_docs/smart_conctracts.md:1)
- E2E framework plan and mocks to implement: [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:1)
- HTTP behavior and retry/timeout guidance (for test realism): [`http_and_error_handling.md`](concael-bridge-ux/ai_spec/http_and_error_handling.md:1)
- Security constraints that affect test doubles (no secrets, CSP assumptions): [`security.md`](concael-bridge-ux/ai_docs/security.md:1)