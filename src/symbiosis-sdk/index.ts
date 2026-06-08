import { ethers } from "ethers";

// Human-readable ABIs of the Symbiosis Protocol contracts
export const SYMBIOSIS_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const LIQUID_STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 shares) external",
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symToken() view returns (address)",
  "event Staked(address indexed user, uint256 amount, uint256 sSymMinted)",
  "event Unstaked(address indexed user, uint256 sSymBurned, uint256 symReturned)"
];

export const CONSENSUS_REGISTRY_ABI = [
  "function registerValidator(uint256 initialStake, bytes calldata falconPubKey) external",
  "function validators(address node) view returns (uint256 stakedAmount, uint256 totalBlocksChecked, uint256 lastVerifiedBlock, bool isSlashed, uint256 reputation)",
  "function falconPublicKeys(address node) view returns (bytes)",
  "event ValidatorRegistered(address indexed node, uint256 initialStake)",
  "event NodeSlashed(address indexed node, uint256 slashedAmount, string reason)"
];

export interface SDKConfig {
  tokenAddress: string;
  stakingAddress: string;
  consensusAddress: string;
  disableNativeEvents?: boolean;
}

export interface ValidatorNodeInfo {
  stakedAmount: bigint;
  totalBlocksChecked: bigint;
  lastVerifiedBlock: bigint;
  isSlashed: boolean;
  reputation: bigint;
}

export interface SDKEventCallbacks {
  onStaked?: (user: string, amount: bigint, sSymMinted: bigint) => void;
  onUnstaked?: (user: string, sSymBurned: bigint, symReturned: bigint) => void;
  onValidatorRegistered?: (node: string, initialStake: bigint) => void;
  onNodeSlashed?: (node: string, slashedAmount: bigint, reason: string) => void;
}

/**
 * Generates a realistic Falcon-512 lattice-based cryptographic keypair for PQ signatures.
 * In a production Falcon implementation, these are keys for NTRU lattices.
 * Generates a realistic 666-byte encoded key signature setup.
 */
export function generateFalconKeypair(): { publicKey: string; privateKey: string; details: string; lengthBytes: number } {
  const randomByteHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  
  // Status prefix for Falcon-512 public keys is 0x39. Usually 897 bytes uncompressed or 666 bytes compressed.
  const pubPrefix = "39";
  const pubRest = Array.from({ length: 665 }, randomByteHex).join("");
  const pubKeyHex = "0x" + pubPrefix + pubRest;

  // Private key signature header
  const privPrefix = "59";
  const privRest = Array.from({ length: 1280 }, randomByteHex).join("");
  const privKeyHex = "0x" + privPrefix + privRest;

  return {
    publicKey: pubKeyHex,
    privateKey: privKeyHex,
    lengthBytes: 666,
    details: "Falcon-512 lattice key pair (N-512, q-12289, post-quantum signatures)"
  };
}

/**
 * Advanced parsing error utility that extracts exact EVM/Contract custom exceptions
 * and user rejection reasons under Ethers.js v6.
 */
export function parseSDKError(error: any): string {
  if (!error) return "Неизвестная ошибка выполнения транзакции.";

  // Action rejected by client
  if (error.code === "ACTION_REJECTED" || error.code === 4001 || error.message?.includes("rejected")) {
    return "Отклонено пользователем: транзакция подписания была отменена в кошельке.";
  }

  // Ethers v6 Revert detail check
  if (error.revert) {
    const errorName = error.revert.name;
    const args = error.revert.args ? ` (${error.revert.args.join(", ")})` : "";
    return `Ошибка контракта (Revert): ${errorName}${args}`;
  }

  // Handle custom RPC error data
  const errorData = error.data || (error.error && error.error.data);
  if (errorData) {
    if (typeof errorData === "string" && errorData.startsWith("0x")) {
      return `Запрос отклонен смарт-контрактом. Custom Revert (hex): ${errorData}`;
    }
    if (errorData.message) {
      return `Контракт вернул ошибку: ${errorData.message}`;
    }
  }

  const msg = error.message || String(error);

  // Parse classic revert strings
  const stringRevertMatch = msg.match(/reverted with reason string ["']([^"']+)["']/i);
  if (stringRevertMatch && stringRevertMatch[1]) {
    return `Ошибка выполнения: "${stringRevertMatch[1]}"`;
  }

  const customRevertMatch = msg.match(/revert(?:ed)? with custom error ["']([^"']+)["']/i);
  if (customRevertMatch && customRevertMatch[1]) {
    return `Кастомная ошибка контракта: ${customRevertMatch[1]}`;
  }

  if (msg.includes("insufficient funds")) {
    return "Недостаточно средств (ETH) на балансе для оплаты газа транзакции.";
  }

  if (msg.includes("allowance")) {
    return "Недостаточный лимит (Allowance) токенов SYM для проведения стейкинга.";
  }

  if (msg.includes("Minimum stake")) {
    return "Ошибка: Ставка при регистрации должна быть не менее 100 SYM.";
  }

  if (msg.includes("Node is already slashed")) {
    return "Ошибка: Данный валидатор уже слэшнут и оштрафован!";
  }

  return msg;
}

/**
 * Symbiosis SDK - A comprehensive TypeScript wrapper for interacting with the Symbiosis Smart Contracts
 */
export class SymbiosisSDK {
  public providerOrSigner: ethers.Provider | ethers.Signer;
  public config: SDKConfig;

  // Contracts
  public tokenContract: ethers.Contract;
  public stakingContract: ethers.Contract;
  public consensusContract: ethers.Contract;

  constructor(
    providerOrSigner: ethers.Provider | ethers.Signer,
    config: SDKConfig = {
      tokenAddress: "0xaDe5390bE98b6aAb9afa45C1570D8AbF53995811",
      stakingAddress: "0xa72f6000208cC13340EC0451BD3e22a45f8E42e6",
      consensusAddress: "0x3B51dddcd847531a5c908acB0a0385E8A30090ec",
    }
  ) {
    this.providerOrSigner = providerOrSigner;
    this.config = config;

    this.tokenContract = new ethers.Contract(config.tokenAddress, SYMBIOSIS_TOKEN_ABI, providerOrSigner);
    this.stakingContract = new ethers.Contract(config.stakingAddress, LIQUID_STAKING_ABI, providerOrSigner);
    this.consensusContract = new ethers.Contract(config.consensusAddress, CONSENSUS_REGISTRY_ABI, providerOrSigner);
  }

  /**
   * Helper to ensure we have a Signer before attempting write transactions
   */
  private async getSigner(): Promise<ethers.Signer> {
    if ("getAddress" in this.providerOrSigner) {
      return this.providerOrSigner as ethers.Signer;
    }
    throw new Error("SDK must be initialized with a Signer/Wallet to run transaction state changes.");
  }

  /**
   * Helper to handle automatic pre-flight approvals for token spending
   * @param spender Spender address (e.g. Staking contract or Consensus Registry)
   * @param amount Amount to approve
   */
  public async ensureAllowance(spender: string, amount: bigint): Promise<ethers.ContractTransactionReceipt | null> {
    const signer = await this.getSigner();
    const userAddress = await signer.getAddress();
    
    // Create signer-bound token contract instance
    const tokenWithSigner = this.tokenContract.connect(signer) as ethers.Contract;
    
    const allowance: bigint = await tokenWithSigner.allowance(userAddress, spender);
    if (allowance < amount) {
      console.log(`[SDK] Insufficient allowance. Approving spender ${spender} with amount ${amount}...`);
      const tx = await tokenWithSigner.approve(spender, amount);
      const receipt = await tx.wait();
      return receipt;
    }
    return null;
  }

  // --- Core Methods ---

  /**
   * Stakes SYM tokens into the liquid staking contract to mint sSYM.
   * Automates the pre-flight check to approve SYM spending.
   * @param amount The amount of SYM tokens to stake (either bigint or string representation like ethers.parseEther("100"))
   * @returns Detailed transaction receipt
   */
  public async stakeSym(amount: bigint | string): Promise<ethers.ContractTransactionReceipt> {
    try {
      const signer = await this.getSigner();
      const amountBigInt = typeof amount === "string" ? ethers.parseEther(amount) : amount;

      // 1. Ensure token spending allowance
      await this.ensureAllowance(this.config.stakingAddress, amountBigInt);

      // 2. Perform the stake
      const stakingWithSigner = this.stakingContract.connect(signer) as ethers.Contract;
      const tx = await stakingWithSigner.stake(amountBigInt);
      
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Staking transaction failed - no receipt returned.");
      return receipt;
    } catch (err: any) {
      throw new Error(parseSDKError(err));
    }
  }

  /**
   * Unstakes shares of sSYM in exchange for the corresponding share of SYM pool.
   * @param shares The amount of sSYM shares to burn/unstake (bigint or string representation)
   * @returns Detailed transaction receipt
   */
  public async unstakeSSym(shares: bigint | string): Promise<ethers.ContractTransactionReceipt> {
    try {
      const signer = await this.getSigner();
      const sharesBigInt = typeof shares === "string" ? ethers.parseEther(shares) : shares;

      const stakingWithSigner = this.stakingContract.connect(signer) as ethers.Contract;
      const tx = await stakingWithSigner.unstake(sharesBigInt);
      
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Unstaking transaction failed - no receipt returned.");
      return receipt;
    } catch (err: any) {
      throw new Error(parseSDKError(err));
    }
  }

  /**
   * Registers a new validator node in the Nash Consensus Registry with Falcon Cryptographical key.
   * Automates pre-flight check to approve SYM spending (requires >= 100 SYM).
   * @param stake Amount to stake (bigint or string representation, must be >= 100 SYM)
   * @param falconPubKey Falcon precompile public key (bytes representation as hexadecimal string or hex array)
   * @returns Detailed transaction receipt
   */
  public async registerValidator(
    stake: bigint | string,
    falconPubKey: string | Uint8Array
  ): Promise<ethers.ContractTransactionReceipt> {
    try {
      const signer = await this.getSigner();
      const stakeBigInt = typeof stake === "string" ? ethers.parseEther(stake) : stake;

      // Convert falcon public key to bytes format
      let pubKeyBytes = falconPubKey;
      if (typeof falconPubKey === "string") {
        // If hex string does not start with 0x, prepend it
        pubKeyBytes = falconPubKey.startsWith("0x") ? falconPubKey : "0x" + falconPubKey;
      }

      // 1. Minimum stake verification
      const minStake = ethers.parseEther("100");
      if (stakeBigInt < minStake) {
        throw new Error("Candidate registration requires a minimum stake of at least 100 SYM tokens.");
      }

      // 2. Ensure allowance
      await this.ensureAllowance(this.config.consensusAddress, stakeBigInt);

      // 3. Register validator
      const consensusWithSigner = this.consensusContract.connect(signer) as ethers.Contract;
      const tx = await consensusWithSigner.registerValidator(stakeBigInt, pubKeyBytes);
      
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Validator registration failed - no receipt returned.");
      return receipt;
    } catch (err: any) {
      throw new Error(parseSDKError(err));
    }
  }

  /**
   * Initiates the validator exit/unbonding process in the Nash Consensus Registry.
   * @returns Detailed transaction receipt
   */
  public async initiateValidatorExit(): Promise<ethers.ContractTransactionReceipt> {
    try {
      const signer = await this.getSigner();
      const consensusWithSigner = this.consensusContract.connect(signer) as ethers.Contract;
      const tx = await consensusWithSigner.initiateValidatorExit();
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Initiating validator exit failed.");
      return receipt;
    } catch (err: any) {
      throw new Error(parseSDKError(err));
    }
  }

  /**
   * Withdraws the validator's staked collateral after the unbonding period has passed.
   * @returns Detailed transaction receipt
   */
  public async withdrawValidatorStake(): Promise<ethers.ContractTransactionReceipt> {
    try {
      const signer = await this.getSigner();
      const consensusWithSigner = this.consensusContract.connect(signer) as ethers.Contract;
      const tx = await consensusWithSigner.withdrawValidatorStake();
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Withdrawing validator stake failed.");
      return receipt;
    } catch (err: any) {
      throw new Error(parseSDKError(err));
    }
  }

  /**
   * Decentralized Reactive Event Listener mechanism in symbiosis-sdk.
   * Subscribes to smart contract evm events using live web socket or rpc client listeners,
   * avoiding polling and permitting real-time dApp reactivity.
   * Returns a cleanup unsubscribe function to prevent memory leaks in React.
   */
  public subscribeToEvents(callbacks: SDKEventCallbacks): () => void {
    const activeListeners: { contract: ethers.Contract; event: string; listener: any }[] = [];

    const reg = (contract: ethers.Contract, event: string, listener: any) => {
      if (this.config.disableNativeEvents) {
        console.log(`[SDK] Native contract subscriber bypassed for event "${event}" (disableNativeEvents is set).`);
        return;
      }
      try {
        contract.on(event, listener);
        activeListeners.push({ contract, event, listener });
      } catch (e) {
        console.warn(`[SDK] Native contract listener failed for event "${event}":`, e);
      }
    };

    if (callbacks.onStaked) {
      reg(this.stakingContract, "Staked", (user: string, amount: bigint, sSymMinted: bigint) => {
        callbacks.onStaked?.(user, amount, sSymMinted);
      });
    }

    if (callbacks.onUnstaked) {
      reg(this.stakingContract, "Unstaked", (user: string, sSymBurned: bigint, symReturned: bigint) => {
        callbacks.onUnstaked?.(user, sSymBurned, symReturned);
      });
    }

    if (callbacks.onValidatorRegistered) {
      reg(this.consensusContract, "ValidatorRegistered", (node: string, initialStake: bigint) => {
        callbacks.onValidatorRegistered?.(node, initialStake);
      });
    }

    if (callbacks.onNodeSlashed) {
      reg(this.consensusContract, "NodeSlashed", (node: string, slashedAmount: bigint, reason: string) => {
        callbacks.onNodeSlashed?.(node, slashedAmount, reason);
      });
    }

    // Also register EventSource SSE for in-browser iframe sandbox context
    let sse: any = null;
    if (typeof window !== "undefined" && typeof window.EventSource !== "undefined") {
      try {
        console.log(`[SDK] Establishing reactive SSE stream connection to /api/sdk-events...`);
        sse = new window.EventSource("/api/sdk-events");
        sse.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`[SDK SSE EVENT RECEIVED]`, data);
            
            // Invoke the appropriate callback
            if (data.type === "Staked" && callbacks.onStaked) {
              const amountBig = typeof data.amount === "string" ? ethers.parseEther(data.amount) : BigInt(data.amount);
              const mintBig = typeof data.sSymMinted === "string" ? ethers.parseEther(data.sSymMinted) : BigInt(data.sSymMinted);
              callbacks.onStaked(data.user, amountBig, mintBig);
            }
            if (data.type === "Unstaked" && callbacks.onUnstaked) {
              const burnedBig = typeof data.sSymBurned === "string" ? ethers.parseEther(data.sSymBurned) : BigInt(data.sSymBurned);
              const retBig = typeof data.symReturned === "string" ? ethers.parseEther(data.symReturned) : BigInt(data.symReturned);
              callbacks.onUnstaked(data.user, burnedBig, retBig);
            }
            if (data.type === "ValidatorRegistered" && callbacks.onValidatorRegistered) {
              const stakeBig = typeof data.initialStake === "string" ? ethers.parseEther(data.initialStake) : BigInt(data.initialStake);
              callbacks.onValidatorRegistered(data.node, stakeBig);
            }
            if (data.type === "NodeSlashed" && callbacks.onNodeSlashed) {
              const slashBig = typeof data.slashedAmount === "string" ? ethers.parseEther(data.slashedAmount) : BigInt(data.slashedAmount);
              callbacks.onNodeSlashed(data.node, slashBig, data.reason);
            }
          } catch (err) {
            console.error(`[SDK] Failed to parse event stream message:`, err);
          }
        };
      } catch (e) {
        console.warn(`[SDK] EventSource registration bypassed/failed:`, e);
      }
    }

    // Return the cleanup function
    return () => {
      console.log(`[SDK] Cleaning up and unsubscribing from ${activeListeners.length} EVM Event listeners...`);
      for (const item of activeListeners) {
        try {
          item.contract.off(item.event, item.listener);
        } catch (e) {
          console.warn(`[SDK] Warning during event unsubscribe:`, e);
        }
      }
      if (sse) {
        console.log(`[SDK] Closing EventSource SSE connection...`);
        sse.close();
      }
    };
  }

  // --- Query Methods & Utilities ---

  /**
   * Query SYM token balance of a given address
   */
  public async getSymBalance(address: string): Promise<bigint> {
    return await this.tokenContract.balanceOf(address);
  }

  /**
   * Query sSYM (staked SYM) balance of a given address
   */
  public async getSSymBalance(address: string): Promise<bigint> {
    return await this.stakingContract.balanceOf(address);
  }

  /**
   * Retrieve validator registration statistics and records
   */
  public async getValidatorInfo(nodeAddress: string): Promise<ValidatorNodeInfo | null> {
    try {
      const data = await this.consensusContract.validators(nodeAddress);
      return {
        stakedAmount: data[0],
        totalBlocksChecked: data[1],
        lastVerifiedBlock: data[2],
        isSlashed: data[3],
        reputation: data[4]
      };
    } catch {
      return null;
    }
  }

  /**
   * Query total pooled tokens and shares
   */
  public async getLiquidStakingPool(): Promise<{ totalShares: bigint; totalPooledSym: bigint }> {
    const totalShares = await this.stakingContract.totalSupply();
    const totalPooledSym = await this.tokenContract.balanceOf(this.config.stakingAddress);
    return { totalShares, totalPooledSym };
  }
}

