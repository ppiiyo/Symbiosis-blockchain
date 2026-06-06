# Symbiosis Protocol Developer Portal (symbiosis-sdk)

Welcome to the **Symbiosis Protocol Developer Portal**. This repository contains the core smart contracts, decentralized governance tools, and the official `@symbiosis-protocol/symbiosis-sdk` used to build, secure, and monitor the post-quantum liquid-staking and Nash Consensus validator network.

---

## 🚀 Overview

Symbiosis is a consensus-enforcing liquid-staking middleware platform featuring:
* **Nash Consensus Validation**: Multi-node validator setups that pledge collateral while verifying network state securely.
* **PQ Falcon-512 Security**: Advanced post-quantum security enforcing signature verification of transactions and state checkpoints using modern precompiles (`0xF9`).
* **Liquid Staking Integration (sSYM)**: High-efficiency token mechanics allowing stakers to pool capital, preserve token liquidity, and yield gas recycle incentives seamlessly.
* **EVM Reactive Subscriptions (SSE)**: Near zero-latency telemetry to sync dApps with decentralized state events without exhausting RPC limits through WebSockets or Server-Sent Events backups.

### 🌐 Sepolia Testnet Deployments

* **SYM Token**: `0x320A6DDbE72151787c16b4D2000474Ba3fc02F7B`
* **sSYM (Liquid Staking)**: `0xAF8F7DE32A0d419Bdc4eDabEc9da6F2190e8f3BC`
* **Nash Consensus Registry**: `0x9938DE81d35201dbF37c19A9a79771da4e827455`

---

## 📦 Installation & Setup

Install the official companion SDK package to integrate PQ liquid staking dashboards:

```bash
npm install @symbiosis-protocol/symbiosis-sdk
```

Ensure your `.ENV` configurations conform to the standard layout:

```env
# Sepolia Public RPC provider credentials
SEPOLIA_RPC_URL="https://rpc.ankr.com/eth_sepolia"
HOLESKY_RPC_URL="https://rpc.ankr.com/eth_holesky"

# Deployer multi-sig account credentials
DEPLOYER_PRIVATE_KEY="0x..."
ETHERSCAN_API_KEY="your-etherscan-api-key"
```

---

## 💡 Developer Usage Patterns

Here are the essential patterns to build responsive applications using `@symbiosis-protocol/symbiosis-sdk`.

### 1. Initializing the SDK
The SDK supports standard provider-signer patterns utilizing modern **ethers.js v6**:

```typescript
import { ethers } from "ethers";
import { SymbiosisSDK } from "@symbiosis-protocol/symbiosis-sdk";

// Initialize JsonRpcProvider or standard injected MetaMask Window Provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

// Smart Contracts addresses configuration
const config = {
  tokenAddress: "0x320A6DDbE72151787c16b4D2000474Ba3fc02F7B",
  stakingAddress: "0xAF8F7DE32A0d419Bdc4eDabEc9da6F2190e8f3BC",
  consensusAddress: "0x9938DE81d35201dbF37c19A9a79771da4e827455",
  disableNativeEvents: false // Toggle true if RPC does not support standard WS websocket events
};

const sdk = new SymbiosisSDK(signer, config);
```

---

### 2. Post-Quantum Falcon-512 Keypair Generation
Avoid EVM precompile (`0xF9`) processing bottlenecks by generating secure, audit-ready post-quantum signature pairs client-side:

```typescript
import { generateFalconKeypair } from "@symbiosis-protocol/symbiosis-sdk";

// Generate secure PQ key pairs
const keypair = generateFalconKeypair();

console.log("Falcon Public Key (Hex):", keypair.publicKey);
console.log("Falcon Private Key (Hex):", keypair.privateKey);
```

---

### 3. Registering Validator Node with Falcon Keys
Commit minimum staking requirements along with your post-quantum key registration directly to the consensus ledger:

```typescript
// Minimum staking requirement: 100 SYM
const stakeAmount = "150"; 
const falconPublicKey = keypair.publicKey;

try {
  const result = await sdk.registerValidator(stakeAmount, falconPublicKey);
  console.log("🎉 Validator Registred! Transaction Hash:", result.txHash);
} catch (error) {
  console.error("Failed to register validator node of consensus registry:", error);
}
```

---

### 4. Direct sSYM Liquid Staking
Pool utility SYM tokens to mint derivative sSYM liquid-staking shares:

```typescript
// Stake SYM tokens to receive sSYM yield-derivatives
const tx = await sdk.stakeSym("250");
console.log("Staking completed! sSYM Shares minted:", tx);
```

---

### 5. Reactive Subscription for Telemetry Events
Implement native EVM pub-sub streaming or built-in, low-latency Server-Sent Events (SSE) stream backoffs to update UI metrics dynamically, eliminating standard HTTP polling loops:

```typescript
// Listen to all validator state & staking events concurrently
const unsubscribe = sdk.subscribeToEvents({
  onStaked: (user, amount, sSymMinted) => {
    console.log(`🔔 Staked Event: User ${user} deposited ${ethers.formatEther(amount)} SYM.`);
  },
  onUnstaked: (user, sSymBurned, symReturned) => {
    console.log(`🔔 Unstaked Event: User ${user} reclaimed ${ethers.formatEther(symReturned)} SYM.`);
  },
  onValidatorRegistered: (node, initialStake) => {
    console.log(`🔔 ValidatorRegistered Event: Validator ${node} pledged ${ethers.formatEther(initialStake)} SYM.`);
  },
  onNodeSlashed: (node, slashedAmount, reason) => {
    console.error(`🚨 Slashing Alert! Node ${node} was slashed for ${ethers.formatEther(slashedAmount)} SYM. Reason: ${reason}`);
  }
});

// Run this cleanup during component lifecycle tear-downs
// unsubscribe();
```

---

## 🛠️ Infrastructure Operations

### 1. Compile Contracts
Compile smart-contracts using hardhat framework:
```bash
npx hardhat compile
```

### 2. Deploy Locally
Initialize a local Hardhat node and deploy all core Symbiosis smart contracts with pre-funded test accounts:
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## 🛡️ External Audit Checklist
Prior to final code freeze and mainnet launch, we ensure strict compliance with the following:
* [x] **NatSpec Documentation**: Complete 100% NatSpec inline coverage explaining parameters, returns, and notices.
* [x] **Strict Dependency Locking**: High-integrity lock of external contract dependencies in standard `package.json`.
* [x] **Reentrancy Protections**: Standard multi-entrance `nonReentrant` modifiers armed during liquidity operations.
* [x] **Precompile Fallbacks**: Hardhat and standard Localhost development nodes fallback simulation setups.
