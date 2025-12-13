# Conceal Bridge User Guide: Bridging $CCX and $wCCX

This guide will walk you through the process of transferring your assets between the native Conceal Network ($CCX) and Wrapped Conceal ($wCCX) on supported blockchain networks.

## What is Wrapped Conceal ($wCCX)?

$wCCX is a tokenized version of $CCX on another blockchain. Its value is always pegged 1:1, meaning one $wCCX will always represent and be redeemable for one $CCX.

## Currently Supported Networks

- Ethereum Mainnet
- Binance Smart Chain
- Polygon Network
- Avalanche

## Prerequisites

Before you begin, ensure you have the following:

### 1. MetaMask Wallet
You must have the MetaMask browser extension installed and properly configured.

- **Download MetaMask:** https://metamask.io/
- For help with installation or DApp interactions, visit the MetaMask FAQ

### 2. Conceal Wallet
You need a Conceal Wallet to hold your $CCX. Any official Conceal Wallet will work.

- **Download a Conceal Wallet:** https://conceal.network/#wallets

### 3. Sufficient Funds

**$CCX:** You must have the $CCX you wish to bridge in your Conceal Wallet

**$ETH (or native gas token):** Your MetaMask wallet must contain enough of the native token to pay for network transaction fees (gas):
- Ethereum: $ETH
- Binance Smart Chain: $BNB
- Polygon: $MATIC
- Avalanche: $AVAX

## Setting Up Your MetaMask Wallet

For a smooth experience, configure your MetaMask wallet before you start.

### Step 1: Backup Your Wallet
Upon installation, securely back up your MetaMask wallet using the provided Secret Recovery Phrase. This is critical for securing your funds.

### Step 2: Rename Your Account (Optional but Recommended)
To easily identify your wallet, consider renaming it:

1. Click the three dots next to your account name
2. Select "Account details"
3. Click the edit icon to rename the account (e.g., "Conceal-ETH")
4. This helps distinguish it from other accounts you may use for different networks

### Step 3: Fund Your Wallet
Purchase and transfer enough of the native gas token (ETH, BNB, MATIC, or AVAX) to your MetaMask wallet to cover gas fees for your transactions.

## How to Bridge $CCX to $wCCX

This example demonstrates bridging $CCX to $wCCX on Ethereum Mainnet. The process is similar for other supported networks.

### Step 1: Prepare Your Wallets

1. Open your MetaMask wallet and ensure it is set to the correct network (e.g., Ethereum Mainnet)
2. Open your Conceal Wallet (e.g., Conceal Cloud Wallet)

### Step 2: Navigate to the Conceal Bridge

Go to the official Conceal Bridge website: https://bridge.conceal.network/

### Step 3: Connect and Initiate the Transfer

1. On the bridge site, click **Continue**
2. MetaMask will prompt you to connect. Click **Next**, then **Connect**
3. You will see your wallet is now "Connected" in the top-left corner
4. Enter the **Amount of $CCX** you wish to swap
5. Enter your **$CCX Address** (the address you are sending from)
6. Enter your **Ethereum Address** (the MetaMask address where you will receive the $wCCX)
7. (Optional) Enter your email to receive a transaction receipt
8. Click **Continue**

### Step 4: Approve the Gas Fee

1. MetaMask will pop up, asking you to confirm the gas payment for the transaction
2. Review the fee and click **Confirm**

**Important:** After confirming, you can track the transaction in the "Activity" tab of MetaMask. Once submitted, do not attempt to "speed up" the transaction, as this will cause it to fail.

### Step 5: Send Your $CCX Deposit

1. The bridge will now display a unique **$CCX Address** and **Payment ID**
2. Copy both the address and the Payment ID
3. Go to your Conceal Wallet and send the exact amount of $CCX you specified in Step 3 to the provided address, including the Payment ID

**Note:** The Conceal Network requires 5-10 minutes for transaction confirmations. Please keep the browser window open and be patient. The time may vary depending on network traffic.

### Step 6: Add $wCCX to Your MetaMask Wallet

Once your deposit is confirmed, you will see a success screen. The final step is to make your $wCCX visible in MetaMask.

1. In MetaMask, click on **Assets** and then **Import tokens**
2. Select the **Custom Token** tab
3. Paste the $wCCX contract address into the field:
   - **Ethereum:** `0x21686f8ce003a95c99acd297e302faacf742f7d4`
   - **BSC:** `0x988c11625472340b7B36FF1534893780E0d8d841`
   - **Polygon:** `0x137Ee749f0F8c2eD34cA00dE33BB59E3dafA494A`
4. The Token Symbol and Decimals of Precision should auto-populate
5. Click **Next**, confirm the details, and click **Add Tokens**

You will now see your $wCCX balance in your MetaMask wallet.

## How to Bridge $wCCX back to $CCX

The process for converting your $wCCX back to native $CCX is nearly identical:

1. Follow the steps above, but on the bridge website, switch the direction of the swap from **$CCX → $wCCX** to **$wCCX → $CCX**
2. You will be prompted to send your $wCCX to a specific address
3. After confirmation, the corresponding $CCX will be sent to your Conceal Wallet

## Important Tips

### Transaction Processing Time
- **Conceal Network confirmations:** 5-10 minutes
- **Destination network confirmations:** Varies by network (typically 1-5 minutes)
- Keep the browser window open during the process

### Gas Fees
- Always ensure you have enough native tokens for gas fees
- Gas fees vary based on network congestion
- Budget extra for unexpected price fluctuations

### Do Not Speed Up Transactions
Once you've confirmed a transaction in MetaMask, do not use the "speed up" feature, as this can cause the bridge transaction to fail.

### Verify Contract Addresses
Always verify you're using the correct contract addresses:
- **Ethereum:** `0x21686f8ce003a95c99acd297e302faacf742f7d4`
- **BSC:** `0x988c11625472340b7B36FF1534893780E0d8d841`
- **Polygon:** `0x137Ee749f0F8c2eD34cA00dE33BB59E3dafA494A`

### Payment ID is Required
When sending $CCX to the bridge, always include the Payment ID provided by the bridge. Transactions without the correct Payment ID may be lost.

## Troubleshooting

### My $wCCX doesn't appear in MetaMask
Make sure you've added the custom token using the correct contract address for your network.

### My transaction is taking longer than expected
- Check the Conceal Network explorer to verify your transaction was sent with the correct Payment ID
- Network congestion can cause delays on both the Conceal Network and destination network
- Keep the bridge page open until confirmation

### I accidentally closed the bridge page
- If you sent the $CCX with the correct Payment ID, the transaction should still process
- Contact Conceal support with your transaction details if you have concerns

## Support and Resources

- **Conceal Bridge:** https://bridge.conceal.network/
- **Conceal Wallets:** https://conceal.network/#wallets
- **MetaMask:** https://metamask.io/
- **Community Support:** Join the Conceal Network community channels for assistance

## Security Reminders

- Never share your Secret Recovery Phrase or private keys
- Always verify you're on the official Conceal Bridge website
- Double-check all addresses before confirming transactions
- Start with small test amounts if you're new to the bridge
- Keep your MetaMask and Conceal Wallet software up to date