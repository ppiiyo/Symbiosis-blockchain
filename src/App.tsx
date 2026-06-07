import React, { useState, useEffect, useRef } from 'react';
import { 
  ValidatorNode, 
  SimulatedBlock, 
  SimulationConfig, 
  SimulationStats, 
  ChartDatapoint,
  Transaction
} from './types';
import { 
  generateInitialNodes, 
  processSimulationTick, 
  calculateExpectedUtilities 
} from './simulationEngine';
import { NetworkGrid } from './components/NetworkGrid';
import { ChainFlow } from './components/ChainFlow';
import { GameTheoryPanel } from './components/GameTheoryPanel';
import { ControlPanel } from './components/ControlPanel';
import { MetricsDashboard } from './components/MetricsDashboard';
import { GovernanceDaoHub } from './components/GovernanceDaoHub';
import { SepoliaDAppHub } from './components/SepoliaDAppHub';
import { LightNodeMinerGame } from './components/LightNodeMinerGame';
import { SymbiosisRoadmap } from './components/SymbiosisRoadmap';
import { 
  Shield, 
  ShieldAlert, 
  Coins, 
  Cpu, 
  Zap, 
  Users, 
  Terminal, 
  HelpCircle, 
  Lock, 
  Undo,
  Info,
  Activity,
  Database,
  Vote,
  Globe,
  Smartphone,
  TrendingUp
} from 'lucide-react';

export default function App() {
  // 1. Core State
  const [config, setConfig] = useState<SimulationConfig>({
    nodeCount: 16,
    blockIntervalMs: 1000,
    puzzleRate: 0.03, // 3%
    lazyRatio: 0.35,
    slashingPenalty: 500,
    rewardPerPuzzle: 30,
    verificationCost: 1.2,
    networkLatencyMs: 120,
    isPaused: false
  });

  const [nodes, setNodes] = useState<ValidatorNode[]>([]);
  const [blocks, setBlocks] = useState<SimulatedBlock[]>([]);
  const [stats, setStats] = useState<SimulationStats>({
    currentHeight: 0,
    finalizedCount: 0,
    puzzleCount: 0,
    maliciousCaught: 0,
    totalSlashedCount: 0,
    totalTokensSlashed: 0,
    totalRewardsDistributed: 0,
    realtimeTPS: 0,
    avgFinalityTimeMs: 0,
    diligenceIndex: 1.0,
    nashEquilibrium: true
  });
  
  const [chartData, setChartData] = useState<ChartDatapoint[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeAttack, setActiveAttack] = useState<'none' | 'double_spend' | 'lazy_takeover' | 'sybil'>('none');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'network' | 'sepolia' | 'governance_dao' | 'tap_to_verify' | 'roadmap'>('network');

  const [patchedVulnerabilities, setPatchedVulnerabilities] = useState<{ [id: string]: boolean }>({
    unrestricted_slashing: true,
    mock_signature: true,
    privilege_escalation: true,
    first_depositor: true,
    gas_recycling: true,
    withdrawal_exit: true,
    proposal_limits: true,
    token_rescuing: true,
    zero_governors: true,
    reentrancy: true,
  });

  const handleTogglePatch = (id: string) => {
    setPatchedVulnerabilities(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      const patchNames: { [k: string]: string } = {
        unrestricted_slashing: "Ограничение слэшинга (Добавление крипто-пруверов)",
        mock_signature: "Полная верификация PQ-подписей Falcon",
        privilege_escalation: "Защита ZK-реестра от захвата ролей",
        first_depositor: "Предотвращение инфляционной атаки первого депозитора",
        gas_recycling: "Рейт-лимиты и фильтрация утилизации газа",
        withdrawal_exit: "Вывод залога валидатора (Unbonding exit queue)",
        proposal_limits: "Лимиты на предложения казначейства",
        token_rescuing: "Спасение заблокированных токенов",
        zero_governors: "Ограничения на нулевой уровень губернаторов",
        reentrancy: "Анти-реентранси блокировки стейкинга"
      };
      addLog(`🛡️ БЕЗОПАСНОСТЬ: Ревизия патча '${patchNames[id] || id}' переведена в состояние [${updated[id] ? "АНКЕРОВАНО / ЗАЩИЩЕНО" : "ВЫКЛЮЧЕНО / УЯЗВИМО"}].`);
      return updated;
    });
  };

  const handleToggleAllPatches = (value: boolean) => {
    setPatchedVulnerabilities(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        updated[k] = value;
      });
      addLog(`🛡️ БЕЗОПАСНОСТЬ: Все 10 патчей смарт-контрактов ${value ? "УСПЕШНО ИНТЕГРИРОВАНЫ" : "ДEАКТИВИРОВАНЫ (Сеть возвращена в уязвимое состояние)"}!`);
      return updated;
    });
  };

  const [userBalance, setUserBalance] = useState<number>(12500); // Starting capital for investor simulation
  const [userStakedNodes, setUserStakedNodes] = useState<{ [nodeId: string]: number }>({});
  const [userClaimableRewards, setUserClaimableRewards] = useState<number>(0);
  const [forceZkProtection, setForceZkProtection] = useState<boolean>(false);
  const [gasBackEnabled, setGasBackEnabled] = useState<boolean>(true);
  const [rotatingCommitteesEnabled, setRotatingCommitteesEnabled] = useState<boolean>(true);
  const [pidTuningEnabled, setPidTuningEnabled] = useState<boolean>(true);
  const [sentinelAiEnabled, setSentinelAiEnabled] = useState<boolean>(true);
  const [btcAnchoringEnabled, setBtcAnchoringEnabled] = useState<boolean>(true);
  const [quantumFalconEnabled, setQuantumFalconEnabled] = useState<boolean>(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mempool, setMempool] = useState<Transaction[]>([]);

  // Pre-generate initial transactions for history ledger
  const generateInitialTransactions = (): Transaction[] => {
    const list: Transaction[] = [];
    const senderKeys = ["0x8A2f...39cE", "0x5FbD...8d2E", "0x3CbB...112C", "0x91da...4a12", "0x2Aef...76db"];
    const receiverKeys = ["0x12Ca...de44", "0x89Ab...218a", "0xCa92...33ee", "0x77de...a112", "0xbba9...00de"];
    const types: Array<'transfer' | 'nft_mint' | 'swap_contract'> = ['transfer', 'nft_mint', 'swap_contract'];
    const payloads = [
      "Transfer 50 SYM",
      "Mint Rare Symbiote NFT #6118",
      "Swap 120 SYM -> 14.5 USDT (Slippage: 0.1%)",
      "Transfer 10 SYM",
      "Mint Cosmic Element NFT #41"
    ];

    for (let i = 0; i < 15; i++) {
      const type = types[i % 3];
      list.push({
        id: `tx-${Math.random().toString(36).substring(2, 8)}`,
        sender: senderKeys[i % senderKeys.length],
        receiver: receiverKeys[i % receiverKeys.length],
        amount: Math.round(5 + Math.random() * 200),
        type,
        status: 'committed',
        gasUsed: type === 'transfer' ? 21000 : type === 'nft_mint' ? 45000 : 85000,
        timestamp: Date.now() - (15 - i) * 60000,
        payload: payloads[i % payloads.length]
      });
    }
    return list;
  };

  const blockHeightRef = useRef<number>(0);
  const tickCounterRef = useRef<number>(0);
  const nodesRef = useRef<ValidatorNode[]>([]);
  const mempoolRef = useRef<Transaction[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    mempoolRef.current = mempool;
  }, [mempool]);

  // 2. Initialize simulation values
  useEffect(() => {
    onReset();
  }, [config.nodeCount]);

  // Log function helper
  const addLog = (msg: string) => {
    const stamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [`[${stamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const onReset = () => {
    blockHeightRef.current = 0;
    tickCounterRef.current = 0;
    
    // Generate fresh validators
    let initialNodes = generateInitialNodes(config.nodeCount);
    
    setNodes(initialNodes);
    setBlocks([]);
    setChartData([]);
    setSelectedNodeId(initialNodes[1]?.id || null);
    setActiveAttack('none');
    setConsoleLogs([]);
    setTransactions(generateInitialTransactions());
    setMempool([]);
    setUserBalance(12500);
    setUserStakedNodes({});
    setUserClaimableRewards(0);
    setForceZkProtection(false);
    setGasBackEnabled(true);
    setRotatingCommitteesEnabled(true);
    setPidTuningEnabled(true);
    setSentinelAiEnabled(true);
    setBtcAnchoringEnabled(true);
    setQuantumFalconEnabled(true);
    
    const initialEffectiveConfig = {
      ...config,
      gasBackEnabled: true,
      rotatingCommitteesEnabled: true,
      pidTuningEnabled: true,
      sentinelAiEnabled: true,
      btcAnchoringEnabled: true,
      quantumFalconEnabled: true
    };
    const utils = calculateExpectedUtilities(initialEffectiveConfig);
    setStats({
      currentHeight: 0,
      finalizedCount: 0,
      puzzleCount: 0,
      maliciousCaught: 0,
      totalSlashedCount: 0,
      totalTokensSlashed: 0,
      totalRewardsDistributed: 0,
      realtimeTPS: 0,
      avgFinalityTimeMs: 0,
      diligenceIndex: 0.85,
      nashEquilibrium: utils.isSatisfied
    });

    addLog('Инициализация математического ядра Symbiosis Network осуществлена успешно.');
    addLog(`Запущено ${config.nodeCount} валидаторов с базовыми стеками.`);
  };

  // 3. Main Tick Engine
  const executeSimulationTick = () => {
    blockHeightRef.current += 1;
    tickCounterRef.current += 1;
    const currentHeight = blockHeightRef.current;

    const currentNodes = nodesRef.current;
    const currentMempool = mempoolRef.current;

    const effectiveConfig: SimulationConfig = {
      ...config,
      gasBackEnabled,
      rotatingCommitteesEnabled,
      pidTuningEnabled,
      sentinelAiEnabled,
      btcAnchoringEnabled,
      quantumFalconEnabled,
    };

    // Execute the tick calculation inside our pure engine
    const { updatedNodes, newBlock, statsDelta } = processSimulationTick(
      currentNodes,
      effectiveConfig,
      currentHeight,
      activeAttack
    );

    // Save blocks
    setBlocks(prevBlocks => [...prevBlocks, newBlock].slice(-50));

    // Update statistical metrics
    const checkCalculations = calculateExpectedUtilities(effectiveConfig);
    
    // Calculate real-time diligence ratio (nodes certifying / total non-slashed non-producers)
    const nonProducers = updatedNodes.filter(n => n.role !== 'producer' && !n.isSlashed);
    const verifyingCount = nonProducers.filter(n => n.lastAction === 'verifying').length;
    const currentDiligence = nonProducers.length > 0 ? (verifyingCount / nonProducers.length) : 0;

    setStats(prevStats => {
      const nextStats = {
        currentHeight,
        finalizedCount: prevStats.finalizedCount + (statsDelta.finalizedCount || 0),
        puzzleCount: prevStats.puzzleCount + (statsDelta.puzzleCount || 0),
        maliciousCaught: prevStats.maliciousCaught + (statsDelta.maliciousCaught || 0),
        totalSlashedCount: prevStats.totalSlashedCount + (statsDelta.totalSlashedCount || 0),
        totalTokensSlashed: prevStats.totalTokensSlashed + (statsDelta.totalTokensSlashed || 0),
        totalRewardsDistributed: prevStats.totalRewardsDistributed + (statsDelta.totalRewardsDistributed || 0),
        realtimeTPS: statsDelta.realtimeTPS || 0,
        avgFinalityTimeMs: statsDelta.avgFinalityTimeMs || 0,
        diligenceIndex: currentDiligence,
        nashEquilibrium: checkCalculations.isSatisfied
      };

      // Populate rolling chart history
      setChartData(prevChart => [
        ...prevChart,
        {
          tick: tickCounterRef.current,
          tps: nextStats.realtimeTPS,
          latency: nextStats.avgFinalityTimeMs,
          diligence: nextStats.diligenceIndex,
          slashedAmt: nextStats.totalTokensSlashed
        }
      ].slice(-30));

      return nextStats;
    });

    // Logging block outcomes to simulation console
    if (newBlock.type === 'puzzle') {
      if (newBlock.status === 'rejected') {
        addLog(`🧱 Block #${currentHeight}: Сгенерирован PUZZLE. Проверка выявила ошибку. Валидаторы с заблокированным стеком оштрафованы.`);
      } else {
        addLog(`🚨 Block #${currentHeight}: Сгенерирован PUZZLE. КАТАСТРОФА: все активные валидаторы лениво одобрили плохой блок!`);
      }
    } else if (newBlock.type === 'malicious_attack') {
      if (newBlock.status === 'rejected') {
        addLog(`🛑 Block #${currentHeight}: ATTACK DETECTED! Вброшен несанкционированный Double Spend. Атака успешно отражена!`);
      } else {
        addLog(`🔥 Block #${currentHeight}: ATTACK SUCCESS. Враждебный двойной сбор зафиксирован в основном реестре! Уязвимость структуры!`);
      }
    } else {
      // Valid block proposed
      if (newBlock.status === 'finalized') {
        addLog(`✅ Block #${currentHeight}: Предложен стандартный блок. Консенсус достигнут за ${newBlock.finalityTimeMs}мс. TPS: ${statsDelta.realtimeTPS}`);
      }
    }

    // Process transaction mempool & add simulated traffic
    let txsToCommit: Transaction[] = [];

    if (currentMempool.length > 0) {
      txsToCommit = currentMempool.map(t => ({
        ...t,
        status: 'committed' as const,
        timestamp: Date.now()
      }));
    }

    // Generate 1-3 random transactions to simulate live network traffic
    const extraCount = Math.floor(Math.random() * 3) + 1;
    const senderKeys = ["0x8A2f...39cE", "0x5FbD...8d2E", "0x3CbB...112C", "0x91da...4a12", "0x2Aef...76db"];
    const receiverKeys = ["0x12Ca...de44", "0x89Ab...218a", "0xCa92...33ee", "0x77de...a112", "0xbba9...00de"];
    const types: Array<'transfer' | 'nft_mint' | 'swap_contract'> = ['transfer', 'nft_mint', 'swap_contract'];
    const payloads = [
      "Transfer SYM",
      "Mint Symbiote Avatar",
      "Swap SYM -> USDT",
      "Dynamic puzzle solution verified",
      "Oracle execution completed successfully"
    ];

    for (let k = 0; k < extraCount; k++) {
      const type = types[Math.floor(Math.random() * types.length)];
      txsToCommit.push({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: senderKeys[Math.floor(Math.random() * senderKeys.length)],
        receiver: receiverKeys[Math.floor(Math.random() * receiverKeys.length)],
        amount: Math.round(1 + Math.random() * 50),
        type,
        status: 'committed',
        gasUsed: type === 'transfer' ? 21000 : type === 'nft_mint' ? 45000 : 85000,
        timestamp: Date.now(),
        payload: payloads[Math.floor(Math.random() * payloads.length)]
      });
    }

    setTransactions(prevTxs => [...prevTxs, ...txsToCommit].slice(-100));

    if (currentMempool.length > 0) {
      addLog(`📥 Обработано из Mempool: ${currentMempool.length} транзакций. Лимиты газа подтверждены.`);
    }

    // Process investor delegation rewards and slashing triggers
    setUserStakedNodes(prevStaked => {
      let isStakedDirty = false;
      const nextStaked = { ...prevStaked };

      Object.entries(nextStaked).forEach(([nodeId, stakedAmount]) => {
        const amt = stakedAmount as number;
        if (amt <= 0) return;
        const matchingNode = updatedNodes.find(n => n.id === nodeId);
        if (!matchingNode) return;

        // Check if the node is slashed or offline
        if (matchingNode.isSlashed) {
          if (forceZkProtection && matchingNode.type === 'lazy') {
            // Guarded by zk-SNARK Prover Shield
            isStakedDirty = true;
            nextStaked[nodeId] = amt; // Keep stake unharmed
            addLog(`🛡️ ZK-БРОНЯ АКТИВНА! Валидатор ${matchingNode.name} срезан за лень, но ваш стейк на 100% застрахован прувером zk-SNARK!`);
          } else {
            const slashFactor = matchingNode.type === 'lazy' ? 0.3 : 0.5; // 30% for laziness, 50% for malicious
            const amountLost = Math.floor(amt * slashFactor);
            const remainder = Math.max(0, amt - amountLost);
            nextStaked[nodeId] = 0; // Clear the position so it is not repeatedly slashed
            isStakedDirty = true;
            setUserBalance(prev => prev + remainder);
            addLog(`🚨 ШТРАФОВАННЫЙ СТЕЙК! Валидатор ${matchingNode.name} попался в ловушку. Срезано: -${amountLost} SYM. Остаток ${remainder} SYM успешно возвращен во внешнюю кассу.`);
          }
        } else {
          // Normal validation loop rewards
          const baseRewardRate = matchingNode.type === 'honest' ? 0.00045 : matchingNode.type === 'lazy' ? 0.0006 : 0.00075;
          const reputationFactor = matchingNode.reputationScore / 100;
          const rewardAccrued = amt * baseRewardRate * reputationFactor;
          
          if (rewardAccrued > 0) {
            setUserClaimableRewards(r => r + rewardAccrued);
          }
        }
      });

      return isStakedDirty ? nextStaked : prevStaked;
    });

    // Finally update nodes
    setNodes(updatedNodes);

    // Clear mempool
    setMempool([]);

    // Reset single-ticket attacks so they don't loop endlessly
    if (activeAttack === 'double_spend') {
      setActiveAttack('none');
    }
  };

  // 4. Set interval loop for live ticks
  useEffect(() => {
    if (config.isPaused) return;

    const interval = setInterval(() => {
      executeSimulationTick();
    }, config.blockIntervalMs);

    return () => clearInterval(interval);
  }, [config.isPaused, config.blockIntervalMs, activeAttack, config]);

  // Handle injected attacks
  const handleInjectAttack = (attackType: 'none' | 'double_spend' | 'lazy_takeover' | 'sybil') => {
    // Proactively clean up any previous sybil nodes if we are moving away from 'sybil' attack
    if (attackType !== 'sybil' && activeAttack === 'sybil') {
      setNodes(prev => prev.filter(n => !n.id.startsWith('sybil-')));
    }

    if (attackType === 'sybil') {
      if (activeAttack === 'sybil') {
        // Toggle off: remove sybil nodes, revert state
        setNodes(prev => prev.filter(n => !n.id.startsWith('sybil-')));
        setActiveAttack('none');
        addLog('Сибил-атака деактивирована. Внеочередные фейковые узлы отключены от пиринга.');
      } else {
        // Toggle on: clean up first and then inject 15 lazy nodes
        setActiveAttack('sybil');
        setNodes(prev => {
          const baseNodes = prev.filter(n => !n.id.startsWith('sybil-'));
          const sybils: ValidatorNode[] = [];
          for (let i = 1; i <= 15; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = 25 + Math.random() * 15;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            sybils.push({
              id: `sybil-${i}`,
              name: `Sybil Validator #${i}`,
              role: 'attester',
              type: 'lazy', // Sybils are always lazy/malicious and do no work
              reputationScore: 50, // Initial medium reputation (to be penalised quickly)
              stake: 120,    // Low stake
              balance: 120,
              isSlashed: false,
              lastAction: 'idle',
              lastActionTime: 0,
              x,
              y,
              cpuUsage: 0,
              blocksChecked: 0,
              blocksLazySigned: 0,
              slashesCount: 0
            });
          }
          addLog('💥 Запущена атака Сивиллы! В сеть внедрено 15 ленивых псевдо-нод с низким залогом.');
          return [...baseNodes, ...sybils];
        });
      }
    } else if (attackType === 'lazy_takeover') {
      if (activeAttack === 'lazy_takeover') {
        setActiveAttack('none');
        addLog('Саботаж остановлен. Часть рациональных валидаторов возвращаются к нормальному расчету.');
      } else {
        setActiveAttack('lazy_takeover');
        addLog('⚠️ Саботаж активен. Рациональные валидаторы сговорились экономить ресурсы и перешли в режим слепого подписания.');
      }
    } else {
      // double_spend single execution block
      setActiveAttack(attackType);
      addLog('⚔️ Инициирован вброс двойной траты в очередь следующего блока. Ожидание реакции верификаторов...');
    }
  };

  // Delegator actions for the Investor Hub integration
  const handleDelegateStake = (nodeId: string, amount: number) => {
    if (amount <= 0 || amount > userBalance) return;

    if (nodeId === 'pool-ssym') {
      setUserBalance(prev => prev - amount);
      setUserStakedNodes(prev => ({
        ...prev,
        [nodeId]: (prev[nodeId] || 0) + amount
      }));
      addLog(`💸 Вы успешно внесли ${amount} SYM в пул sSYM. Контракт ликвидного стейкинга выпустил вам sSYM.`);
      return;
    }

    const nodeObj = nodes.find(n => n.id === nodeId);
    if (!nodeObj || nodeObj.isSlashed) return;

    setUserBalance(prev => prev - amount);
    setUserStakedNodes(prev => ({
      ...prev,
      [nodeId]: (prev[nodeId] || 0) + amount
    }));

    // Dyn boost validator’s weight in visual grid
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, stake: n.stake + amount };
      }
      return n;
    }));

    addLog(`💸 Вы успешно делегировали ${amount} SYM валидатору ${nodeObj.name}. Его вес консенсуса вырос.`);
  };

  const handleClaimRewards = () => {
    if (userClaimableRewards <= 0) return;
    const reward = userClaimableRewards;
    setUserClaimableRewards(0);
    setUserBalance(prev => prev + reward);
    addLog(`✨ Награда разблокирована: +${reward.toFixed(4)} SYM зачислено на ваш баланс!`);
  };

  const handleUnstake = (amount?: number, nodeId: string = 'pool-ssym') => {
    if (amount !== undefined) {
      const currentStaked = userStakedNodes[nodeId] || 0;
      if (currentStaked <= 0 || amount <= 0 || amount > currentStaked) return;

      setUserBalance(prev => prev + amount);
      setUserStakedNodes(prev => {
        const next = { ...prev };
        next[nodeId] = Math.max(0, currentStaked - amount);
        if (next[nodeId] === 0) {
          delete next[nodeId];
        }
        return next;
      });

      if (nodeId !== 'pool-ssym') {
        setNodes(prev => prev.map(n => {
          if (n.id === nodeId) {
            return { ...n, stake: Math.max(100, n.stake - amount) };
          }
          return n;
        }));
      }

      addLog(`🔓 Успешный вывод средств: ${amount} SYM возвращено на ваш баланс из ${nodeId === 'pool-ssym' ? 'пула sSYM' : 'стейка валидатора'}.`);
    } else {
      const totalStakedSum = Object.values(userStakedNodes).reduce((a, b) => (a as number) + (b as number), 0) as number;
      if (totalStakedSum <= 0) return;

      setUserBalance(prev => prev + totalStakedSum);
      
      // Reverse validators stake
      setNodes(prev => prev.map(n => {
        const delegated = (userStakedNodes[n.id] as number) || 0;
        if (delegated > 0) {
          return { ...n, stake: Math.max(100, n.stake - delegated) };
        }
        return n;
      }));

      setUserStakedNodes({});
      addLog(`📥 Залоги отозваны: Полный возврат ${totalStakedSum} SYM на свободный адрес произведен.`);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none overflow-hidden" id="simulation-viewport">
      
      {/* 1. Header Area */}
      <header className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between bg-black shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 animate-pulse">
            <Zap className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white font-mono uppercase select-all">
                Symbiosis Network (SYM)
              </h1>
              <span className="text-[9px] border border-purple-900 bg-purple-950/20 text-purple-400 font-mono px-2 py-0.5 rounded animate-pulse">
                SYM Consensus Pipeline
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans tracking-wide">
              Сверхскоростной блокчейн с решением Дилеммы Верификатора черед Игры с Ошибками (Red Herring)
            </p>
          </div>
        </div>

        {/* Diagnostic controls */}
        <div className="flex items-center gap-3 font-mono">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-zinc-550 border border-zinc-900 bg-zinc-950 px-3 py-1 rounded-full uppercase">
            <span>Высота сети:</span>
            <span className="text-purple-400 font-bold">#{stats.currentHeight}</span>
          </div>
          
          <button
            onClick={onReset}
            className="text-[10.5px] border border-pink-900/30 bg-pink-950/10 text-pink-400 hover:bg-pink-950/20 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer font-bold"
          >
            <Undo className="w-3.5 h-3.5" /> Сбросить Кэш
          </button>
        </div>
      </header>

      {/* 2. Top Banner Statistics metrics dashboard */}
      <section className="bg-black border-b border-zinc-900 px-6 py-4 shrink-0">
        <MetricsDashboard stats={stats} chartData={chartData} />
      </section>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden min-h-0 bg-black">
        
        {/* Left Side: Map and block flows of the blockchain */}
        <div className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-900 p-5 gap-4">
          
          {/* Navigation Tab */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-900 pb-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('network')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'network'
                  ? 'bg-zinc-900 text-purple-400 border border-purple-900/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> 🛰️ Симуляция Консенсуса
            </button>

            <button
              onClick={() => setActiveTab('sepolia')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sepolia'
                  ? 'bg-zinc-900 text-purple-400 border border-purple-900/30'
                  : 'text-zinc-400 hover:text-zinc-150 hover:bg-zinc-950'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" /> ⛓️ Sepolia On-Chain Портал
            </button>

            <button
              onClick={() => setActiveTab('governance_dao')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 relative ${
                activeTab === 'governance_dao'
                  ? 'bg-zinc-900 text-purple-400 border border-purple-900/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
              }`}
            >
              <Vote className="w-3.5 h-3.5 text-purple-400" /> 🗳️ Управление & Аудит
              <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tap_to_verify')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 relative ${
                activeTab === 'tap_to_verify'
                  ? 'bg-zinc-900 text-orange-400 border border-purple-900/30'
                  : 'text-zinc-400 hover:text-orange-400 hover:bg-zinc-950'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-400" /> 🎮 Ловушки (Tap Game)
              <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roadmap'
                  ? 'bg-zinc-900 text-emerald-450 border border-emerald-900/30'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-950'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-450" /> 🗺️ Дорожная Карта
            </button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {activeTab === 'network' && (
              <div className="w-full h-full flex flex-col gap-4">
                {/* Visual grid / circles */}
                <div className="flex-1 min-h-0">
                  <NetworkGrid
                    nodes={nodes}
                    onSelectNode={(node) => setSelectedNodeId(node.id)}
                    selectedNodeId={selectedNodeId}
                  />
                </div>

                {/* Subsecond chain blocks flow history */}
                <div className="h-[145px] shrink-0">
                  <ChainFlow blocks={blocks} />
                </div>
              </div>
            )}

            {activeTab === 'sepolia' && (
              <div className="w-full h-full overflow-y-auto custom-scrollbar pr-1">
                <SepoliaDAppHub
                  nodes={nodes}
                  userBalance={userBalance}
                  onChangeUserBalance={setUserBalance}
                  userStakedNodes={userStakedNodes}
                  onDelegate={handleDelegateStake}
                  onClaimRewards={handleClaimRewards}
                  onUnstake={handleUnstake}
                  userClaimableRewards={userClaimableRewards}
                  addLog={addLog}
                  patchedVulnerabilities={patchedVulnerabilities}
                />
              </div>
            )}

            {activeTab === 'governance_dao' && (
              <div className="w-full h-full overflow-y-auto custom-scrollbar pr-1">
                <GovernanceDaoHub
                  nodes={nodes}
                  config={config}
                  onChangeConfig={setConfig}
                  userStakedNodes={userStakedNodes}
                  userBalance={userBalance}
                  onChangeUserBalance={setUserBalance}
                  addLog={addLog}
                  patchedVulnerabilities={patchedVulnerabilities}
                  onTogglePatch={handleTogglePatch}
                  onToggleAllPatches={handleToggleAllPatches}
                />
              </div>
            )}

            {activeTab === 'tap_to_verify' && (
              <div className="w-full h-full overflow-y-auto custom-scrollbar pr-1">
                <LightNodeMinerGame
                  userBalance={userBalance}
                  onChangeUserBalance={setUserBalance}
                  addLog={addLog}
                  nodes={nodes}
                />
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="w-full h-full overflow-y-auto custom-scrollbar pr-1">
                <SymbiosisRoadmap />
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Controllers and Game Theory Calculations */}
        <div className="col-span-12 lg:col-span-4 flex flex-col overflow-y-auto custom-scrollbar p-5 gap-4">
          
          {/* Controls Sliders info */}
          <ControlPanel
            config={config}
            onChangeConfig={setConfig}
            onTick={executeSimulationTick}
            onReset={onReset}
            onInjectAttack={handleInjectAttack}
            currentAttack={activeAttack}
          />

          {/* Theoretical Nash math calculation panel */}
          <GameTheoryPanel config={config} />

          {/* Selected Node Inspector cards */}
          {selectedNode ? (
            <div className="p-4 rounded-xl border border-zinc-900 bg-[#09090b] flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs font-bold text-zinc-100 font-sans tracking-tight">
                  Аудит Узла: {selectedNode.name}
                </span>
                <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
                  selectedNode.isSlashed
                    ? 'border-red-900 bg-red-950/40 text-red-500'
                    : selectedNode.type === 'honest'
                    ? 'border-emerald-930 bg-emerald-950/30 text-emerald-400'
                    : selectedNode.type === 'lazy'
                    ? 'border-amber-930 bg-amber-950/20 text-amber-500'
                    : 'border-indigo-930 bg-indigo-950/30 text-indigo-400'
                }`}>
                  {selectedNode.type} {selectedNode.role}
                </span>
              </div>

              {selectedNode.isSlashed ? (
                <div className="p-2.5 bg-red-950/30 border border-red-900/30 rounded text-red-400 text-xs font-sans leading-relaxed">
                  <div className="font-bold flex items-center gap-1 mb-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> ВНИМАНИЕ: Validator Slashed!
                  </div>
                  <div>Причина: {selectedNode.slashedReason}</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                    <span className="text-[#a1a1aa] block text-[9px] font-sans">Баланс узла:</span>
                    <span className="text-zinc-100 font-bold">{selectedNode.balance.toFixed(0)} SYM</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                    <span className="text-[#a1a1aa] block text-[9px] font-sans">Стейк узла:</span>
                    <span className="text-zinc-100 font-bold">{selectedNode.stake.toLocaleString()} SYM</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-900/50">
                    <span className="text-[#a1a1aa] block text-[9px] font-sans">Честные проверки:</span>
                    <span className="text-emerald-400 font-bold">{selectedNode.blocksChecked} блоков</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-900/50">
                    <span className="text-[#a1a1aa] block text-[9px] font-sans">Ленивые подписи:</span>
                    <span className="text-amber-500 font-bold">{selectedNode.blocksLazySigned} блоков</span>
                  </div>
                </div>
              )}

              {/* Node logs history simulated */}
              <div className="bg-zinc-950 rounded border border-zinc-900/80 p-2 text-[9.5px] font-mono text-zinc-500 max-h-[85px] overflow-y-auto">
                <div className="text-zinc-400 uppercase tracking-widest text-[8px] mb-1 font-bold">След аудита (Audit trails)</div>
                <div>• Первичное подключение к пир группе. Стабильно.</div>
                {selectedNode.blocksChecked > 0 && (
                  <div>• Полноценный расчет EVM-переходов: PASS ({selectedNode.blocksChecked})</div>
                )}
                {selectedNode.blocksLazySigned > 0 && (
                  <div>• Быстрая ленивая подпись заголовка: SKIP ({selectedNode.blocksLazySigned})</div>
                )}
                {selectedNode.isSlashed && (
                  <div className="text-red-500 font-bold">• Заблокирован блокчейном. Штраф списан.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-zinc-900 bg-[#09090b] text-center text-xs text-zinc-500 font-mono">
              Выберите валидатор для детального разбора
            </div>
          )}

          {/* Interactive Live Log Terminal */}
          <div className="flex-1 min-h-[140px] bg-[#09090b] border border-zinc-900 rounded-xl p-3 flex flex-col">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 mb-2 text-zinc-400 text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Терминал консенсуса</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9.5px] text-zinc-400 space-y-1 pr-1" id="terminal-logs-view">
              {consoleLogs.length === 0 ? (
                <div className="text-zinc-650 text-center py-5">Ожидание событий реестра...</div>
              ) : (
                consoleLogs.map((log, i) => (
                  <div key={i} className="leading-normal hover:bg-zinc-900/40 rounded px-1 transition-colors">{log}</div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
