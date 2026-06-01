import { ValidatorNode, SimulatedBlock, SimulationConfig, SimulationStats, NodeType, BlockStatus } from './types';

// Initial state generators
export const generateInitialNodes = (count: number): ValidatorNode[] => {
  const nodes: ValidatorNode[] = [];
  const roles = ['producer', 'attester'] as const;

  for (let i = 0; i < count; i++) {
    const isProducer = i === 0; // Node 0 is block producer for simplification
    const role = isProducer ? 'producer' : 'attester';
    
    // Distribute node types:
    // First node is honest block producer.
    // Rest are attesters: 60% standard honest, 35% rational/lazy, 5% malicious/adversarial
    let type: NodeType = 'honest';
    if (!isProducer) {
      const rand = Math.random();
      if (rand < 0.6) type = 'honest';
      else if (rand < 0.95) type = 'lazy';
      else type = 'malicious';
    }

    // Positions nodes circular layout for a beautiful map representation
    let x = 50;
    let y = 50;
    if (!isProducer) {
      const angle = ((2 * Math.PI) / (count - 1)) * (i - 1);
      const radius = 35; // % of viewport
      x = 50 + radius * Math.cos(angle);
      y = 50 + radius * Math.sin(angle);
    }

    const repScore = isProducer
      ? 100
      : type === 'honest'
      ? 95 + Math.floor(Math.random() * 6) // 95-100
      : type === 'lazy'
      ? 70 + Math.floor(Math.random() * 16) // 70-85
      : 30 + Math.floor(Math.random() * 31); // 30-60

    nodes.push({
      id: `node-${i}`,
      name: isProducer ? 'Block Producer' : `Validator Node #${i}`,
      role,
      type,
      stake: isProducer ? 5000 : 1000 + Math.floor(Math.random() * 2000),
      balance: 1000,
      isSlashed: false,
      lastAction: 'idle',
      lastActionTime: 0,
      x,
      y,
      cpuUsage: 0,
      blocksChecked: 0,
      blocksLazySigned: 0,
      slashesCount: 0,
      reputationScore: repScore
    });
  }
  return nodes;
};

// Generate a mock hash for block identification with optional Falcon prefix
export const generateBlockHash = (height: number, falcon: boolean = false): string => {
  const prefix = falcon ? '0x[Falcon]' : '0x';
  return prefix + height.toString(16).padStart(4, '0') + Math.random().toString(16).substring(2, 10);
};

// Evaluate the game-theoretic expected utility and equilibrium
// Returns the expected utilities for checking vs lazy signing
export const calculateExpectedUtilities = (config: SimulationConfig) => {
  const p = config.puzzleRate;         // Puzzle frequency
  const r_block = 1.0;                 // Base block reward
  const s_slash = config.slashingPenalty;
  
  // 1. Gas-back subsidy (85% discount on verifying costs)
  let actualVerifyCost = config.gasBackEnabled ? config.verificationCost * 0.15 : config.verificationCost;
  
  // Phase 3: Sentinel AI co-processing adds 15% efficiency discount to verification costs
  if (config.sentinelAiEnabled) {
    actualVerifyCost = actualVerifyCost * 0.85;
  }

  // Phase 3: Falcon Quantum-Resistant signatures add 35% HSM-hardware acceleration discount
  if (config.quantumFalconEnabled) {
    actualVerifyCost = actualVerifyCost * 0.65;
  }

  // 2. Rotating commit latency cost inclusion
  const actualLatencyCost = config.rotatingCommitteesEnabled 
    ? ((config.networkLatencyMs || 120) / 100) / 4 
    : ((config.networkLatencyMs || 120) / 100);
  const totalIncurredCost = actualVerifyCost + actualLatencyCost;

  // 3. PID Tuning dynamic reward regulator
  const pidSubsidy = config.pidTuningEnabled 
    ? Math.max(0, totalIncurredCost - (r_block + p * config.rewardPerPuzzle) + 1.25)
    : 0;
  const finalRewardPerPuzzle = config.rewardPerPuzzle + (pidSubsidy * 12);

  // Expected Utility of Diligent Checking
  // U = (1-p)*r_block + p*r_puzzle - c_verify
  const expectedDiligent = (1 - p) * r_block + p * finalRewardPerPuzzle - actualVerifyCost;

  // Expected Utility of Lazy Signing
  // U = (1-p)*r_block - p*s_slash
  const expectedLazy = (1 - p) * r_block - p * s_slash;

  // Crossover Puzzle Probability: p > actualVerifyCost / (r_puzzle + s_slash)
  const crossoverRate = actualVerifyCost / (finalRewardPerPuzzle + s_slash);
  const isSatisfied = p > crossoverRate;

  return {
    expectedDiligent,
    expectedLazy,
    crossoverRate,
    isSatisfied,
    adjustedRewardPerPuzzle: finalRewardPerPuzzle
  };
};

// Simulation tick execution
// Processes proposed blocks, signatures, slashing, and statistics update
export const processSimulationTick = (
  nodes: ValidatorNode[],
  config: SimulationConfig,
  height: number,
  forcedAttack: 'none' | 'double_spend' | 'lazy_takeover' | 'sybil' = 'none'
): {
  updatedNodes: ValidatorNode[];
  newBlock: SimulatedBlock;
  statsDelta: Partial<SimulationStats>;
} => {
  // Determine block type based on probability or forced attack
  let blockType: any = 'valid';
  let txCount = 50 + Math.floor(Math.random() * 150);

  if (forcedAttack === 'double_spend') {
    blockType = 'malicious_attack';
    txCount = 1; // Single double spend transaction block
  } else {
    blockType = Math.random() < config.puzzleRate ? 'puzzle' : 'valid';
  }

  const hash = generateBlockHash(height, config.quantumFalconEnabled);
  const producer = nodes.find(n => n.role === 'producer') || nodes[0];
  
  // Simulation utilities
  const gameUtility = calculateExpectedUtilities(config);
  const rewardPerPuzzle = gameUtility.adjustedRewardPerPuzzle;
  const actualVerificationCost = config.gasBackEnabled ? config.verificationCost * 0.15 : config.verificationCost;
  
  // We simulate checkers behavior based on node type and current utility state:
  // - Honest nodes ALWAYS verify blocks (diligent)
  // - Lazy / Rational nodes will verify ONLY if gameUtility.isSatisfied is true!
  //   Otherwise, they act lazily and approve blindly.
  // - Malicious/adversarial nodes:
  //     If standard block: behave normally (either check or lazy depending on profits)
  //     If malicious attack: they actively sign invalid blocks to attempt safety breach.

  let votesNeeded = Math.ceil((nodes.length - 1) * 0.67); // 67% consensus requirement
  let signatures: { [nodeId: string]: 'sign' | 'reject' | 'lazy' } = {};
  let votesReceived = 0;
  let slashedNodes: string[] = [];
  let totalSlashedAmt = 0;
  let totalRewardsAmt = 0;
  let maliciousCaught = 0;

  const currentTimestamp = Date.now();

  const updatedNodes = nodes.map(node => {
    if (node.role === 'producer') {
      return {
        ...node,
        lastAction: 'signing' as const,
        lastActionTime: currentTimestamp,
        cpuUsage: 15
      };
    }

    if (node.isSlashed) {
      return node; // Slashed nodes remain offline
    }

    let nodeAction: any = 'idle';
    let balanceDelta = 0;
    let nodeCheckedCount = node.blocksChecked;
    let nodeLazySignedCount = node.blocksLazySigned;
    let nodeSlashesCount = node.slashesCount;
    let isSlashedNow = false;
    let slashedReason = '';

    // Decide if this node checks (verifies) the block
    let performsVerification = false;

    if (node.id.startsWith('sybil-')) {
      performsVerification = false; // Sybil spoofers always blind-sign to save computational power
    } else if (node.type === 'honest') {
      performsVerification = true;
    } else if (node.type === 'lazy') {
      // Lazy/Rational nodes follow the economic incentive
      performsVerification = gameUtility.isSatisfied;

      // Phase 3: Sentinel AI Guard dynamically alerts rational validators about suspicious puzzle blocks, bypassing lazy-signing risk
      if (!performsVerification && config.sentinelAiEnabled && (blockType === 'puzzle' || blockType === 'malicious_attack')) {
        // AI Sentinel detects structural anomaly on the p2p level and alerts the node
        performsVerification = true; // AI-override forces audit
      }
    } else if (node.type === 'malicious') {
      // Malicious, behaves lazily or actively colludes
      performsVerification = false;
    }

    // Force lazy behavior if simulated "lazy_takeover" attack is on
    if (forcedAttack === 'lazy_takeover' && node.type !== 'honest') {
      performsVerification = false;
    }

    // Cost of computer resources
    if (performsVerification) {
      balanceDelta -= actualVerificationCost;
      nodeCheckedCount++;
      nodeAction = 'verifying';
    } else {
      nodeLazySignedCount++;
    }

    // Dynamic actions and consequences based on block type
    if (blockType === 'valid') {
      // Valid block - normal processing
      signatures[node.id] = performsVerification ? 'sign' : 'lazy';
      // Pay small reward for participating signature
      balanceDelta += 1.0;
      nodeAction = 'signing';
    } 
    else if (blockType === 'puzzle') {
      // INTENTIONALLY INVALID synthetic puzzle!
      if (performsVerification) {
        // Diligent node caught the red herring!
        signatures[node.id] = 'reject';
        balanceDelta += rewardPerPuzzle;
        nodeAction = 'rewarded';
        totalRewardsAmt += rewardPerPuzzle;
      } else {
        // Node signed blindly. Gosh, caught! Slashed!
        signatures[node.id] = 'lazy';
        isSlashedNow = true;
        slashedReason = 'Approved synthetic puzzle (Red Herring) without verification';
        balanceDelta -= config.slashingPenalty;
        nodeSlashesCount++;
        nodeAction = 'slashed';
        totalSlashedAmt += config.slashingPenalty;
        slashedNodes.push(node.id);
      }
    } 
    else if (blockType === 'malicious_attack') {
      // Actual malicious double spend attack
      if (performsVerification) {
        // Detected the actual hack attempt!
        signatures[node.id] = 'reject';
        balanceDelta += rewardPerPuzzle * 2; // Extra reward for catching actual bad actor
        nodeAction = 'rewarded';
        totalRewardsAmt += rewardPerPuzzle * 2;
        maliciousCaught = 1;
      } else {
        // Blindly approved a hack! Slashed!
        signatures[node.id] = 'lazy';
        isSlashedNow = true;
        slashedReason = 'Approved simulated double-spend malicious attack vector';
        balanceDelta -= config.slashingPenalty * 1.5; // Double penalty for real safety failure
        nodeSlashesCount++;
        nodeAction = 'slashed';
        totalSlashedAmt += config.slashingPenalty * 1.5;
        slashedNodes.push(node.id);
      }
    }

    const newBalance = Math.max(0, node.balance + balanceDelta);
    let newStake = node.stake;
    if (isSlashedNow) {
      const slashFactor = node.type === 'lazy' ? 0.3 : 0.5;
      newStake = Math.max(100, Math.floor(node.stake * (1 - slashFactor)));
    }

    // Calculate dynamic reputation score adjustments based on performance:
    let newReputation = node.reputationScore;
    if (isSlashedNow) {
      newReputation = 0;
    } else if (performsVerification) {
      // Falcon signatures accelerate reputation certification speeds (2.4 instead of 1.2 per success)
      const repIncrement = config.quantumFalconEnabled ? 2.4 : 1.2;
      newReputation = Math.min(100, Math.round((node.reputationScore + repIncrement) * 10) / 10);
    } else {
      newReputation = Math.max(10, Math.round((node.reputationScore - 2.5) * 10) / 10);
    }

    return {
      ...node,
      balance: newBalance,
      stake: newStake,
      cpuUsage: performsVerification ? 80 : 5,
      lastAction: nodeAction,
      lastActionTime: currentTimestamp,
      blocksChecked: nodeCheckedCount,
      blocksLazySigned: nodeLazySignedCount,
      slashesCount: nodeSlashesCount,
      isSlashed: isSlashedNow,
      slashedReason: slashedReason || node.slashedReason,
      reputationScore: newReputation
    };
  });

  // Check consensus status:
  // Using Proof of Stake & Fidelity-Weighted voting metrics!
  const activeValidators = updatedNodes.filter(n => n.role !== 'producer' && !n.isSlashed);
  let totalWeight = 0;
  let approvedWeight = 0;
  let rejectedWeight = 0;

  activeValidators.forEach(v => {
    // Weight = Stake * (Reputation / 100)
    const w = v.stake * (v.reputationScore / 100);
    totalWeight += w;
    const sig = signatures[v.id];
    if (sig === 'sign' || sig === 'lazy') {
      approvedWeight += w;
    } else if (sig === 'reject') {
      rejectedWeight += w;
    }
  });

  const approvalRate = totalWeight > 0 ? (approvedWeight / totalWeight) : 0;
  const rejectionRate = totalWeight > 0 ? (rejectedWeight / totalWeight) : 0;

  let blockStatus: BlockStatus = 'pending';
  
  // Rotating committees decreases standard finality latency by 4x
  const baseLatency = config.rotatingCommitteesEnabled ? (config.networkLatencyMs / 4) : config.networkLatencyMs;
  let finalityTimeMs = Math.round(baseLatency + Math.floor(Math.random() * 30));
  let errorMessage = '';

  votesReceived = Math.round(approvalRate * 105);
  // Cap at 100%
  if (votesReceived > 100) votesReceived = 100;
  votesNeeded = 67; // 67% consensus weight threshold required

  if (blockType === 'valid') {
    if (votesReceived >= votesNeeded) {
      blockStatus = 'finalized';
    } else {
      blockStatus = 'rejected'; // Not enough valid voters (exceptional)
      errorMessage = 'Consensus failure: insufficient validation signatures';
    }
  } 
  else if (blockType === 'puzzle') {
    // Red herring blocks SHOULD be caught by diligent validators, thus REJECTED.
    // If caught, consensus rejects it -> security success.
    // In weighted voting, if rejection score is > 33% (meaning approval cannot reach BFT 67% threshold),
    // the puzzle block is successfully filtered out.
    if (rejectionRate > 0.33) {
      blockStatus = 'rejected';
      errorMessage = 'Red Herring puzzle caught & neutralized!';
    } else {
      blockStatus = 'failed_to_catch';
      errorMessage = 'Security Breach: Red Herring block blindly committed!';
    }
  } 
  else if (blockType === 'malicious_attack') {
    if (rejectionRate > 0.33) {
      blockStatus = 'rejected';
      errorMessage = 'Malicious double spend attack detected & blocked by attesters!';
    } else {
      blockStatus = 'failed_to_catch';
      errorMessage = 'FATAL ERROR: Double-spend committed to main ledger!';
    }
  }

  // Phase 3 Bitcoin Time-Locking / Anchoring interceptor:
  if (config.btcAnchoringEnabled && blockStatus === 'failed_to_catch') {
    blockStatus = 'rejected';
    errorMessage = blockType === 'malicious_attack'
      ? 'Critical double-spend intercepted by BTC Time-Lock Anchor!'
      : 'Red Herring anomaly intercepted by BTC Time-Lock Anchor!';
  }

  const newBlock: SimulatedBlock = {
    height,
    hash,
    producerId: producer.id,
    timestamp: currentTimestamp,
    type: blockType,
    txCount,
    status: blockStatus,
    votesNeeded,
    votesReceived,
    signatures,
    slashedNodes,
    finalityTimeMs,
    errorMessage
  };

  // Deltas for stats
  const statsDelta: Partial<SimulationStats> = {
    currentHeight: height,
    finalizedCount: blockStatus === 'finalized' ? 1 : 0,
    puzzleCount: blockType === 'puzzle' ? 1 : 0,
    maliciousCaught: blockType === 'malicious_attack' && blockStatus === 'rejected' ? 1 : 0,
    totalSlashedCount: slashedNodes.length,
    totalTokensSlashed: totalSlashedAmt,
    totalRewardsDistributed: totalRewardsAmt,
    avgFinalityTimeMs: finalityTimeMs,
    realtimeTPS: Math.round((txCount / (finalityTimeMs / 1000)) * 10) / 10
  };

  return {
    updatedNodes,
    newBlock,
    statsDelta
  };
};
