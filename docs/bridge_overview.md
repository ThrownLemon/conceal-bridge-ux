# Conceal Network Bridge Guide

## Overview

The Conceal Network Bridge enables seamless conversion between native ₡CCX and Wrapped Conceal ($wCCX) across multiple blockchain ecosystems. This bridge serves as the gateway for Conceal Network users to access DeFi applications while maintaining the option to return to the privacy-focused Conceal Network.

**Bridge URL:** https://bridge.conceal.network

## What is Wrapped Conceal ($wCCX)?

Wrapped Conceal ($wCCX) is a tokenized representation of ₡CCX on bridged blockchain ecosystems. Key characteristics:

- **1:1 Peg:** One $wCCX always equals one ₡CCX
- **Fully Backed:** Every $wCCX is backed by native ₡CCX held in reserve
- **Verifiable:** All reserves are auditable on the Conceal Network blockchain
- **Maximum Supply:** Will never exceed 200M (Conceal Network's maximum emission)

## Supported Ecosystems

The Conceal Bridge currently supports three blockchain ecosystems:

### Ethereum

- **Maximum Supply:** 500,000 $wCCX
- **Token Contract:** `0x21686f8ce003a95c99acd297e302faacf742f7d4`
- **Explorer:** https://etherscan.io/token/0x21686f8ce003a95c99acd297e302faacf742f7d4

### Binance Smart Chain (BSC)

- **Maximum Supply:** 350,000 $wCCX
- **Token Contract:** `0x988c11625472340b7B36FF1534893780E0d8d841`
- **Explorer:** https://bscscan.com/token/0x988c11625472340b7B36FF1534893780E0d8d841

### Polygon (Matic)

- **Maximum Supply:** 500,000 $wCCX
- **Token Contract:** `0x137Ee749f0F8c2eD34cA00dE33BB59E3dafA494A`
- **Explorer:** https://explorer-mainnet.maticvigil.com/tokens/0x137Ee749f0F8c2eD34cA00dE33BB59E3dafA494A/token-transfers

## How the Bridge Works

### Wrapping: ₡CCX → $wCCX

**Process to convert native ₡CCX to $wCCX:**

1. **Deposit:** Send native ₡CCX from your Conceal Wallet to the secure custodial address managed by the Conceal Bridge
2. **Verification:** The bridge detects and verifies your transaction on the Conceal Network
3. **Minting:** Once confirmed, the bridge's smart contract mints an equivalent amount of $wCCX on your chosen ecosystem
4. **Delivery:** $wCCX is sent to your specified wallet address (e.g., MetaMask)
5. **Reserve:** Your original ₡CCX is held securely in reserve, backing the newly minted $wCCX

### Unwrapping: $wCCX → ₡CCX

**Process to convert $wCCX back to native ₡CCX:**

1. **Initiate:** Start the unwrap process on the Conceal Bridge by sending $wCCX to the bridge's smart contract
2. **Burn:** The smart contract permanently destroys (burns) the received $wCCX, removing them from circulation
3. **Release:** Simultaneously, the bridge releases the equivalent amount of native ₡CCX from its reserves
4. **Delivery:** ₡CCX is sent to your specified Conceal Wallet address

## Use Cases for $wCCX

### DeFi Integration

- Trade on decentralized exchanges (Uniswap, SushiSwap, PancakeSwap)
- Provide liquidity to liquidity pools and earn trading fees
- Participate in yield farming opportunities
- Use as collateral for lending/borrowing protocols

### Privacy Gateway

- **Untraceable Entry/Exit:** Move from traceable ecosystem tokens to untraceable ₡CCX
- First Cryptonote coin to bridge multiple networks
- Maintain privacy while accessing DeFi opportunities

### Enhanced Liquidity

- Access to millions of users across Ethereum, BSC, and Polygon
- Increased trading volume and market stability
- Broader exposure for the Conceal Network ecosystem

## Verifying Reserves

To ensure transparency and trust, you can verify the ₡CCX reserves backing $wCCX:

1. Visit the swapping wallet explorer: https://explorer.conceal.network/index.html#funds
2. Click "Verify"
3. Select the specific ecosystem (Ethereum, BSC, or Polygon)
4. Confirm that reserves match circulating $wCCX supply

**Current Supply:** The supply of $wCCX in each ecosystem equals the amount of ₡CCX deposited in each swapping wallet.

## Setting Up Your Wallet

### MetaMask Setup

To use $wCCX, you'll need to configure MetaMask for the appropriate network:

**For Binance Smart Chain:**

- Guide: https://medium.com/stakingbits/setting-up-metamask-for-binance-smart-chain-bsc-921d9a2625fd

**For Polygon:**

- Guide: https://medium.com/stakingbits/setting-up-metamask-for-polygon-matic-network-838058f6d844

**For Ethereum:**

- MetaMask is configured for Ethereum by default

### Adding $wCCX Token to MetaMask

After setting up the correct network:

1. Open MetaMask and ensure you're on the correct network
2. Click "Import tokens"
3. Enter the contract address for your chosen ecosystem (see above)
4. Token symbol and decimals should auto-populate
5. Click "Add Custom Token"

## Security and Trust

### Core Principles

**1:1 Backing**

- Every $wCCX is fully backed by native ₡CCX held in reserve
- Reserves are auditable on the Conceal Network blockchain
- No $wCCX can exist without corresponding ₡CCX in custody

**Custodial Security**

- Industry-standard security practices protect bridge reserves
- Multi-signature controls for custodial wallets
- Regular security audits

**Transparency**

- All transactions are publicly verifiable on respective blockchains
- Real-time reserve verification available
- Open and auditable process

## Important Considerations

### Before Using the Bridge

1. **Ensure correct wallet setup:** Verify you're using the correct network in MetaMask
2. **Check contract addresses:** Always verify you're interacting with official Conceal contracts
3. **Transaction fees:** Be aware of gas fees on the destination network
4. **Processing time:** Bridge transactions require confirmations on both networks

### Best Practices

- Start with small test transactions
- Always verify reserve balances before large conversions
- Keep records of all bridge transactions
- Use official links and contract addresses only
- Never share private keys or seed phrases

## Additional Resources

**Official Documentation:**

- The Anatomy of Wrapped CCX: https://concealnetwork.medium.com/the-anatomy-of-wrapped-ccx-97b2a8c008d9

**Official Links:**

- Conceal Network Bridge: https://bridge.conceal.network
- Explorer: https://explorer.conceal.network

## Key Benefits

1. **Access to DeFi:** Participate in Ethereum, BSC, and Polygon DeFi ecosystems
2. **Privacy Options:** Maintain ability to convert back to untraceable ₡CCX
3. **Enhanced Liquidity:** Trade on major DEXs with increased volume
4. **Flexibility:** Choose the ecosystem that best fits your needs
5. **Security:** Fully backed, transparent, and auditable system

## Conclusion

The Conceal Network Bridge represents a strategic evolution for the Conceal ecosystem, extending reach and utility without sacrificing core privacy principles. By enabling seamless conversion between ₡CCX and $wCCX, the bridge empowers users with:

- Greater financial freedom
- Access to cutting-edge DeFi applications
- A unique privacy gateway between traceable and untraceable ecosystems
- Path for broader adoption and integration

As the first Cryptonote coin to bridge multiple networks, Conceal Network is pioneering the intersection of privacy and DeFi accessibility.

## Related docs/specs in this repo

- [`docs/bridge_user_guide.md`](./bridge_user_guide.md)
- [`docs/bridge_architecture.md`](./bridge_architecture.md)
- [`docs/wallets.md`](./wallets.md)
- [`docs/web3_integrations.md`](./web3_integrations.md)
- [`docs/backend_api.md`](./backend_api.md)
- [`docs/smart_contracts.md`](./smart_contracts.md)
- [`docs/error_handling.md`](./error_handling.md)
- [`docs/security.md`](./security.md)
