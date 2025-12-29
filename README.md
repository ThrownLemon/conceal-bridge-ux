# Conceal Bridge UX

[![CI](https://github.com/ThrownLemon/conceal-bridge-ux/actions/workflows/deploy.yml/badge.svg)](https://github.com/ThrownLemon/conceal-bridge-ux/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Angular 21 SPA for bridging native ₡CCX and wrapped $wCCX on EVM networks.

**[Use the Bridge](https://bridge.conceal.network)** | [GitHub Pages Mirror](https://thrownlemon.github.io/conceal-bridge-ux/) | [Backend API](https://github.com/ConcealNetwork/conceal-wswap)

## What It Does

Seamless 1:1 conversions between privacy-focused ₡CCX and DeFi-compatible $wCCX tokens.

| Network  | Max Supply | Contract                                                                                        |
| -------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Ethereum | 500k wCCX  | [View on Etherscan](https://etherscan.io/token/0x21686f8ce003a95c99acd297e302faacf742f7d4)      |
| BSC      | 350k wCCX  | [View on BscScan](https://bscscan.com/token/0x988c11625472340b7B36FF1534893780E0d8d841)         |
| Polygon  | 500k wCCX  | [View on PolygonScan](https://polygonscan.com/token/0x137Ee749f0F8c2eD34cA00dE33BB59E3dafA494A) |

**Supported Wallets**: MetaMask, Trust Wallet, Binance Wallet

## Quick Start

```bash
npm install
npm start         # Dev server at http://localhost:4200
```

**Prerequisites**: Node.js v22+

## Commands

| Command          | Purpose                    |
| ---------------- | -------------------------- |
| `npm start`      | Dev server with hot reload |
| `npm test`       | Unit tests (Vitest)        |
| `npm run e2e`    | E2E tests (Playwright)     |
| `npm run build`  | Production build           |
| `npm run lint`   | ESLint check               |
| `npm run format` | Prettier format            |

## Tech Stack

- **Framework**: Angular 21 (Standalone Components, Signals, OnPush)
- **UI Library**: ZardUI (Shadcn-like components for Angular)
- **Styling**: Tailwind CSS v4
- **Web3**: Viem
- **Testing**: Vitest + Playwright
- **Quality**: ESLint + Prettier + Husky (Pre-commit hooks)

## Project Structure

```
src/app/
├── core/       # Services: BridgeApiService, EvmWalletService
├── pages/      # Routes: home, swap, not-found
└── shared/     # Components: wallet, qr-code, transaction-history
```

See [docs/build_guide.md](docs/build_guide.md) for detailed architecture.

## Configuration

| Environment | Backend URL                              | File                                          |
| ----------- | ---------------------------------------- | --------------------------------------------- |
| Development | `bridge.conceal.network/testing/backend` | `src/environments/environment.development.ts` |
| Production  | `bridge.conceal.network/backend`         | `src/environments/environment.ts`             |

## Deployment

Deployment is automatic via GitHub Actions when changes reach `master`:

- **Code changes**: Merge PR to master
- **Docs/releases**: Push directly to master

See [docs/deployment.md](docs/deployment.md) for manual deployment and rollback procedures.

## Documentation

| Topic            | Link                                                       |
| ---------------- | ---------------------------------------------------------- |
| Architecture     | [docs/bridge_architecture.md](docs/bridge_architecture.md) |
| Backend API      | [docs/backend_api.md](docs/backend_api.md)                 |
| Web3 Integration | [docs/web3_integrations.md](docs/web3_integrations.md)     |
| Testing          | [docs/testing.md](docs/testing.md)                         |
| Security         | [docs/security.md](docs/security.md)                       |

## Contributing

- **Workflow**: Feature branches → PR → merge to master
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Issues**: GitHub Issues - `gh issue list` to see open work

For AI agents and developers: See [AGENTS.md](AGENTS.md) for critical rules and workflows.

## Related

- [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap) - Backend API
- [ConcealNetwork](https://github.com/ConcealNetwork) - Conceal ecosystem

## License

This project is licensed under the [MIT License](LICENSE).
