/**
 * Symbiosis Network Consensus Simulator Types
 */

export type NodeType = 'honest' | 'lazy' | 'malicious';
export type NodeRole = 'producer' | 'attester';
export type NodeAction = 'idle' | 'verifying' | 'signing' | 'flagged' | 'slashed' | 'rewarded';

export interface ValidatorNode {
  id: string;
  name: string;
  role: NodeRole;
  type: NodeType;
  stake: number;          // Total tokens staked
  balance: number;        // Accumulated rewards/penalties
  isSlashed: boolean;     // Slashed status
  slashedReason?: string;
  lastAction: NodeAction;
  lastActionTime: number; // For visual fadeout of animation
  x: number;              // Screen coordinate x
  y: number;              // Screen coordinate y
  cpuUsage: number;       // Current computational work %
  blocksChecked: number;
  blocksLazySigned: number;
  slashesCount: number;
  reputationScore: number;  // 0 to 100 representing node's reliability index
}

export type BlockType = 'valid' | 'puzzle' | 'malicious_attack';
export type BlockStatus = 'pending' | 'checking' | 'finalized' | 'rejected' | 'failed_to_catch';

export interface SimulatedBlock {
  height: number;
  hash: string;
  producerId: string;
  timestamp: number;
  type: BlockType;
  txCount: number;
  status: BlockStatus;
  votesNeeded: number;
  votesReceived: number;
  signatures: { [nodeId: string]: 'sign' | 'reject' | 'lazy' };
  slashedNodes: string[];
  finalityTimeMs: number;
  errorMessage?: string; // e.g. "Double Spend Transaction Detected" or "Attester Slashing Triggered"
}

export interface SimulationConfig {
  nodeCount: number;
  blockIntervalMs: number;
  puzzleRate: number;      // 0.0 to 0.1 (0% to 10%)
  lazyRatio: number;       // 0.0 to 1.0 (portion of validators operating in lazy mode)
  slashingPenalty: number; // Tokens slashed
  rewardPerPuzzle: number; // Tokens rewarded
  verificationCost: number;// Computation cost in tokens
  networkLatencyMs: number;// Simulated network latency
  isPaused: boolean;
  gasBackEnabled?: boolean;
  rotatingCommitteesEnabled?: boolean;
  pidTuningEnabled?: boolean;
  sentinelAiEnabled?: boolean;
  btcAnchoringEnabled?: boolean;
  quantumFalconEnabled?: boolean;
}

export interface SimulationStats {
  currentHeight: number;
  finalizedCount: number;
  puzzleCount: number;
  maliciousCaught: number;
  totalSlashedCount: number;
  totalTokensSlashed: number;
  totalRewardsDistributed: number;
  realtimeTPS: number;
  avgFinalityTimeMs: number;
  diligenceIndex: number; // Percentage of honest checks happening right now
  nashEquilibrium: boolean; // Is checking mathematically optimal?
}

export interface ChartDatapoint {
  tick: number;
  tps: number;
  latency: number;
  diligence: number;
  slashedAmt: number;
}

export interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  type: 'transfer' | 'nft_mint' | 'swap_contract' | 'puzzle_test';
  status: 'mempool' | 'processing' | 'committed' | 'failed';
  gasUsed: number;
  timestamp: number;
  payload?: string;
}

