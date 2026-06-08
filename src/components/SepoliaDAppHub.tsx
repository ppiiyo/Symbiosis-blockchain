import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Award, 
  CheckCircle2, 
  ArrowRightLeft, 
  Globe, 
  Sliders,
  AlertTriangle,
  Cpu,
  Zap,
  Copy,
  Terminal,
  Check,
  Shield,
  Lock,
  Key,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { ValidatorNode, SimulationConfig } from '../types';
import { generateFalconKeypair } from '../symbiosis-sdk/index';
import { OffChainValidatorDaemon, NodeAgentStats } from '../utils/node-agent-sim';

interface SepoliaDAppHubProps {
  nodes: ValidatorNode[];
  userBalance: number;
  onChangeUserBalance: (bal: number) => void;
  userStakedNodes: { [nodeId: string]: number };
  onDelegate: (nodeId: string, amount: number) => void;
  onClaimRewards: () => void;
  onUnstake: (amount?: number) => void;
  userClaimableRewards: number;
  addLog: (msg: string) => void;
  patchedVulnerabilities?: { [id: string]: boolean };
}

export const SepoliaDAppHub: React.FC<SepoliaDAppHubProps> = ({
  nodes,
  userBalance,
  onChangeUserBalance,
  userStakedNodes,
  onDelegate,
  onClaimRewards,
  onUnstake,
  userClaimableRewards,
  addLog,
  patchedVulnerabilities = {} as { [id: string]: boolean }
}) => {
  // SDK Tab selection: 'stake' | 'register_validator' | 'lazy_slashing'
  const [activeSubTab, setActiveSubTab] = useState<'stake' | 'register_validator' | 'lazy_slashing'>('stake');

  // Input states
  const [stakeAmount, setStakeAmount] = useState<string>('500');
  const [unstakeShares, setUnstakeShares] = useState<string>('250');
  const [validatorStake, setValidatorStake] = useState<string>('150');
  const [customFalconKey, setCustomFalconKey] = useState<string>('');
  const [targetSlashedAddress, setTargetSlashedAddress] = useState<string>('');
  const [slashingReason, setSlashingReason] = useState<string>('double_sign');

  // Key Pair Generator state
  const [generatedKeyPair, setGeneratedKeyPair] = useState<{
    publicKey: string;
    privateKey: string;
    lengthBytes: number;
    details: string;
  } | null>(null);
  const [copiedKeyText, setCopiedKeyText] = useState<'pub' | 'priv' | null>(null);

  // Connection & execution loading states
  const [sepoliaConnected, setSepoliaConnected] = useState<boolean>(true);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [executing, setExecuting] = useState<boolean>(false);
  const [sdkLogs, setSdkLogs] = useState<string[]>([
    "[SYSTEM_INIT] Подключено к провайдеру Sepolia Proof-of-Stake...",
    "[SDK_STATUS] Контракт SymbiosisToken обнаружен по адресу: 0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "[SDK_STATUS] Контракт LiquidStakingSsym обнаружен по адресу: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "[SDK_STATUS] Контракт NashConsensusRegistry обнаружен по адресу: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "[SDK_STATUS] Контракт ZkProverRegistry обнаружен по адресу: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  ]);
  const [lastTxHash, setLastTxHash] = useState('');

  // Off-chain Node Validator Daemon state
  const [daemonActive, setDaemonActive] = useState<boolean>(false);
  const [daemonStats, setDaemonStats] = useState<NodeAgentStats | null>(null);
  const daemonRef = React.useRef<OffChainValidatorDaemon | null>(null);

  const toggleDaemon = () => {
    if (daemonActive) {
      if (daemonRef.current) {
        daemonRef.current.stop();
      }
      setDaemonActive(false);
      addConsoleLog("🛑 Остановлен оффчейн ZK-Rollup Node-Validator.");
    } else {
      const activeAddr = walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const daemon = new OffChainValidatorDaemon(activeAddr, (stats) => {
        setDaemonStats(stats);
        if (stats.logs.length > 0) {
          const latestLog = stats.logs[0];
          // Extrapolate logic message output to the main container terminal
          addConsoleLog(`[NODE_AGENT] ${latestLog.substring(latestLog.indexOf(']') + 2)}`);
        }
      });
      daemonRef.current = daemon;
      daemon.start();
      setDaemonActive(true);
      addConsoleLog("🚀 Оффчейн ZK-Rollup Node-Validator запущен. Начат непрерывный процессинг L2 блоков...");
    }
  };

  useEffect(() => {
    return () => {
      if (daemonRef.current) {
        daemonRef.current.stop();
      }
    };
  }, []);

  const [selectedNetwork, setSelectedNetwork] = useState<'localhost' | 'baseSepolia' | 'arbitrumSepolia'>('localhost');

  const networkAddresses = {
    localhost: {
      name: "Localhost (Hardhat Node)",
      token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      staking: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      consensus: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      zkProver: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      explorer: "http://127.0.0.1:8545",
      explorerName: "Local RPC"
    },
    baseSepolia: {
      name: "Base Sepolia Testnet",
      token: "0x9E751Dbf02DAdc4fAF9EFDF8ee9df8450f38bBD4",
      staking: "0xc9074F96f9C00dB9E323aAAd8FdCe73f1dDdc44e",
      consensus: "0x6a0d01b50e0d17dc79C85078dbb4c106972e399b",
      zkProver: "0x1Cf7Ed3AccA5a467e9e704C703E8D87F634fB0992",
      explorer: "https://sepolia.basescan.org/address/",
      explorerName: "Basescan"
    },
    arbitrumSepolia: {
      name: "Arbitrum Sepolia Testnet",
      token: "0x23aAAd8FdCe73f1dDdc44e59074F96f9C00dB9E9c",
      staking: "0x573f1dDdc44e59074F96f9C052acae73f1dDdc44e",
      consensus: "0x8e704C703E8D87F634fB0Fc91Cf7Ed3AccA5a467",
      zkProver: "0xd9a65f0992f2272de9f3c7fa6e0Cf7Ed3AccA5a4",
      explorer: "https://sepolia.arbiscan.io/address/",
      explorerName: "Arbiscan"
    }
  };

  const deployedAddresses = networkAddresses[selectedNetwork];

  useEffect(() => {
    addConsoleLog(`🌐 Переключено на API-провайдер: ${networkAddresses[selectedNetwork].name}`);
    addConsoleLog(`[SDK_STATUS] Контракт SymbiosisToken обнаружен: ${networkAddresses[selectedNetwork].token}`);
    addConsoleLog(`[SDK_STATUS] Контракт LiquidStakingSsym обнаружен: ${networkAddresses[selectedNetwork].staking}`);
    addConsoleLog(`[SDK_STATUS] Контракт NashConsensusRegistry обнаружен: ${networkAddresses[selectedNetwork].consensus}`);
    addConsoleLog(`[SDK_STATUS] Контракт ZkProverRegistry обнаружен: ${networkAddresses[selectedNetwork].zkProver}`);
  }, [selectedNetwork]);

  const connectWeb3Wallet = async () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress('');
      addConsoleLog("🔌 Веб3-кошелек успешно отключен.");
      return;
    }
    
    addConsoleLog("🔌 Запуск авторизации Web3-кошелька (Wagmi Core / RainbowKit)...");
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
          addConsoleLog(`✅ Web3 кошелек подключен успешно! Адрес: ${accounts[0]}`);
          addLog(`🔑 [WAGMI/META_CONNECTED] Подключен кошелек: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`);
        }
      } catch (err: any) {
        // Fallback to auto-simulated address
        simulateWallet();
      }
    } else {
      simulateWallet();
    }
  };

  const simulateWallet = () => {
    const mockAddr = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setWalletConnected(true);
    setWalletAddress(mockAddr);
    addConsoleLog(`✅ Подключен виртуальный dApp-провайдер Web3 (MetaMask/WalletConnect). Адрес: ${mockAddr}`);
    addLog(`🔑 [WAGMI_CONNECTED] Пользователь подключил кошелек к Base/Arbitrum Sepolia: ${mockAddr.slice(0,6)}...${mockAddr.slice(-4)}`);
  };

  const addConsoleLog = (msg: string) => {
    const stamp = new Date().toLocaleTimeString();
    setSdkLogs(prev => [...prev, `[${stamp}] ${msg}`]);
  };

  const handleCopy = (text: string, type: 'pub' | 'priv') => {
    navigator.clipboard.writeText(text);
    setCopiedKeyText(type);
    setTimeout(() => setCopiedKeyText(null), 1500);
  };

  const triggerFalconGeneration = () => {
    const keys = generateFalconKeypair();
    setGeneratedKeyPair(keys);
    setCustomFalconKey(keys.publicKey);
    addConsoleLog(`🛠️ Сгенерирована решетчатая пара ключей PQ Falcon-512. Размер открытого ключа: ${keys.lengthBytes} байт.`);
  };

  const executeSDKCall = async (method: string, bodyArgs: any) => {
    setExecuting(true);
    addConsoleLog(`📡 [START] Отправка вызова метода '${method}' на серверный контроллер (EVM Sepolia Smart Contract Proxier)...`);
    
    // 🛡️ Live Audit Patches virtual execution filters
    if (method === 'slash') {
      if (patchedVulnerabilities.unrestricted_slashing) {
        setTimeout(() => {
          addConsoleLog(`🛡️ [SECURED REVERT] Сбой выполнения транзакции на контракте NashConsensusRegistry!`);
          addConsoleLog(`❌ Ошибка EVM (Revert): "triggerLazySlashing is locked. Invalid Double-Signing cryptographic evidence."`);
          addConsoleLog(`💡 Подсказка: Патч №1 (Неограниченный слэшинг) успешно заблокировал вызов слэшинга без доказательств double-signing!`);
          setExecuting(false);
        }, 1200);
        return;
      }
    }

    if (method === 'stake') {
      if (patchedVulnerabilities.first_depositor) {
        addConsoleLog(`🛡️ [SECURED COMPLIANCE] Проверка формулы пула благополучно завершена. Патч первого вкладчика заблокировал округление к нулю через сгорание MINIMUM_LIQUIDITY.`);
      } else {
        const poolShares = userStakedNodes['pool-ssym'] || 0;
        if (poolShares === 0) {
          addConsoleLog(`⚠️ [WARN: VULNERABLE POOL] ВНИМАНИЕ! Вы выполняете первый депозит в пул sSYM, в то время как патч инфляции выключен. Система уязвима к краже долей через прямые пожертвования SYM!`);
        }
      }
    }

    if (method === 'registerValidator') {
      if (patchedVulnerabilities.mock_signature) {
        addConsoleLog(`🛡️ [EMV SECURED] Окружение валидировано: стабы длины 99 байт заблокированы. Инициирована честная верификация через ассемблерные PQ-генераторы.`);
      } else {
        addConsoleLog(`⚠️ [WARN: UNSECURED] ВНИМАНИЕ! Магический обход signature.length = 99 активен. Любой валидатор может зарегистрироваться фиктивным ключом!`);
      }
    }

    try {
      const response = await fetch('/api/sdk-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method,
          tokenAddress: deployedAddresses.token,
          stakingAddress: deployedAddresses.staking,
          consensusAddress: deployedAddresses.consensus,
          ...bodyArgs
        })
      });

      const data = await response.json();
      if (data.success) {
        setLastTxHash(data.txHash);
        if (data.logs) {
          const splitLogs = data.logs.split('\n');
          splitLogs.forEach((l: string) => addConsoleLog(l));
        }
        addConsoleLog(`🎉 [SUCCESS] Операция '${method}' успешно финализирована! Хэш транзакции: ${data.txHash}`);
        addLog(`⛓️ [EVM REAL-CHAIN] Подтверждена транзакция: ${method} в блоке Sepolia!`);
        
        // Update user state based on the method
        if (method === "stake" && bodyArgs.amount) {
          onDelegate('pool-ssym', Number(bodyArgs.amount));
        } else if (method === "unstake" && bodyArgs.shares) {
          onUnstake(Number(bodyArgs.shares));
        } else if (method === "registerValidator" && bodyArgs.stake) {
          onChangeUserBalance(userBalance - Number(bodyArgs.stake));
        }
      } else {
        addConsoleLog(`❌ [FAIL] Ошибка выполнения: ${data.error || 'Неизвестная ошибка смарт-контракта'}`);
      }
    } catch (err: any) {
      addConsoleLog(`❌ [FATAL] Ошибка сетевого соединения с RPC сервером: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  // Pre-fill target slashing address with a random lazy validator for immersive gameplay
  useEffect(() => {
    const lazyNodes = nodes.filter(n => n.type === 'lazy' && !n.isSlashed);
    if (lazyNodes.length > 0 && !targetSlashedAddress) {
      const randomLazyAddress = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      setTargetSlashedAddress(randomLazyAddress);
    }
  }, [nodes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="sepolia-dapp-hub">
      
      {/* LEFT SECTION: SMART CONTRACT DEPLOYMENTS & LIVE PLAYGROUND ACTIONS */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        
        {/* CONTRACT STATUS BOARD */}
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-[#121215] to-[#09090b] relative overflow-hidden backdrop-blur-md shadow-lg shadow-black/80 group">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all duration-500 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/80 pb-4 mb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <h2 className="text-xs font-extrabold tracking-widest text-[#a855f7] font-mono uppercase">
                Реестр смарт-контрактов L2 Rollup
              </h2>
            </div>
            
            {/* Network Selector Tabs */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1">
              <button
                onClick={() => setSelectedNetwork('localhost')}
                className={`px-2 py-1 text-[9px] font-mono tracking-wider font-bold rounded-lg transition-all ${
                  selectedNetwork === 'localhost'
                    ? 'bg-[#181126] text-purple-400 border border-purple-500/20 font-black'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Local Node
              </button>
              <button
                onClick={() => setSelectedNetwork('baseSepolia')}
                className={`px-2 py-1 text-[9px] font-mono tracking-wider font-bold rounded-lg transition-all ${
                  selectedNetwork === 'baseSepolia'
                    ? 'bg-[#181126] text-purple-400 border border-purple-500/20 font-black'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Base L2
              </button>
              <button
                onClick={() => setSelectedNetwork('arbitrumSepolia')}
                className={`px-2 py-1 text-[9px] font-mono tracking-wider font-bold rounded-lg transition-all ${
                  selectedNetwork === 'arbitrumSepolia'
                    ? 'bg-[#181126] text-purple-400 border border-purple-500/20 font-black'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Arbitrum L2
              </button>
            </div>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            {/* Token */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d10] border border-zinc-800/60 hover:border-indigo-500/30 transition-all duration-300 group/item">
              <div className="truncate pr-4">
                <span className="text-zinc-500 block text-[9px] font-bold uppercase tracking-wider mb-1">SYM Token Ledger (ERC-20)</span>
                <span className="text-zinc-300 select-all group-hover/item:text-indigo-300 transition-colors font-mono block truncate">{deployedAddresses.token}</span>
              </div>
              <a 
                href={selectedNetwork === 'localhost' ? '#' : `${deployedAddresses.explorer}${deployedAddresses.token}`}
                target={selectedNetwork === 'localhost' ? '' : '_blank'} 
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-indigo-400 font-bold border border-zinc-800 hover:border-indigo-500/40 bg-zinc-900/60 hover:bg-slate-950/20 px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {selectedNetwork === 'localhost' ? 'Local' : deployedAddresses.explorerName}
              </a>
            </div>

            {/* sSYM Staking */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d10] border border-zinc-800/60 hover:border-indigo-500/30 transition-all duration-300 group/item">
              <div className="truncate pr-4">
                <span className="text-zinc-500 block text-[9px] font-bold uppercase tracking-wider mb-1">Liquid Staking (sSYM) Pool</span>
                <span className="text-zinc-300 select-all group-hover/item:text-indigo-300 transition-colors font-mono block truncate">{deployedAddresses.staking}</span>
              </div>
              <a 
                href={selectedNetwork === 'localhost' ? '#' : `${deployedAddresses.explorer}${deployedAddresses.staking}`}
                target={selectedNetwork === 'localhost' ? '' : '_blank'} 
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-indigo-400 font-bold border border-zinc-800 hover:border-indigo-500/40 bg-zinc-900/60 hover:bg-slate-950/20 px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {selectedNetwork === 'localhost' ? 'Local' : deployedAddresses.explorerName}
              </a>
            </div>

            {/* Nash Consensus */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d10] border border-zinc-800/60 hover:border-indigo-500/30 transition-all duration-300 group/item">
              <div className="truncate pr-4">
                <span className="text-zinc-500 block text-[9px] font-bold uppercase tracking-wider mb-1">Nash Consensus Signature Registry</span>
                <span className="text-zinc-300 select-all group-hover/item:text-indigo-300 transition-colors font-mono block truncate">{deployedAddresses.consensus}</span>
              </div>
              <a 
                href={selectedNetwork === 'localhost' ? '#' : `${deployedAddresses.explorer}${deployedAddresses.consensus}`}
                target={selectedNetwork === 'localhost' ? '' : '_blank'} 
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-indigo-400 font-bold border border-zinc-800 hover:border-indigo-500/40 bg-zinc-900/60 hover:bg-slate-950/20 px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {selectedNetwork === 'localhost' ? 'Local' : deployedAddresses.explorerName}
              </a>
            </div>

            {/* ZkProver Registry */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d10] border border-zinc-800/60 hover:border-[#a855f7]/30 transition-all duration-300 group/item">
              <div className="truncate pr-4">
                <span className="text-zinc-500 block text-[9px] font-bold uppercase tracking-wider mb-1">ZkProver cryptographic registry (ZK-Cops)</span>
                <span className="text-zinc-300 select-all group-hover/item:text-indigo-400 transition-colors font-mono block truncate">{deployedAddresses.zkProver}</span>
              </div>
              <a 
                href={selectedNetwork === 'localhost' ? '#' : `${deployedAddresses.explorer}${deployedAddresses.zkProver}`}
                target={selectedNetwork === 'localhost' ? '' : '_blank'} 
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-indigo-400 font-bold border border-zinc-800 hover:border-indigo-500/40 bg-zinc-900/60 hover:bg-slate-950/20 px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {selectedNetwork === 'localhost' ? 'Local' : deployedAddresses.explorerName}
              </a>
            </div>
          </div>

          {/* Web3 Wallet connection bar */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${walletConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-zinc-400 font-sans text-xs">
                {walletConnected 
                  ? `Разблокирован кошелек: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
                  : 'RainbowKit / Wagmi не подсоединен'}
              </span>
            </div>
            <button
              onClick={connectWeb3Wallet}
              className={`text-[10.5px] font-bold font-sans tracking-wide px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                walletConnected 
                  ? 'bg-red-950/20 hover:bg-red-900/20 text-red-400 border-red-900/40' 
                  : 'bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-400 border-indigo-900/60'
              }`}
            >
              {walletConnected ? 'Отключить Web3 Кошелек' : 'Подключить Web3 Кошелек'}
            </button>
          </div>
        </div>

        {/* OPERATIONS PLAYGROUND */}
        <div className="border border-zinc-800/80 bg-gradient-to-b from-[#121215] to-[#09090b] rounded-2xl overflow-hidden flex flex-col min-h-[380px] shadow-lg shadow-black/80">
          
          {/* Navigation Controls bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-zinc-850 bg-zinc-950/90 p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setActiveSubTab('stake')}
              className={`py-2 text-[10.5px] font-bold font-sans tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg ${
                activeSubTab === 'stake'
                  ? 'bg-zinc-900 text-indigo-400 border border-zinc-800 shadow-inner font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-250 border border-transparent'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-indigo-400" /> Ликвидный стейкинг (sSYM)
            </button>
            <button
              onClick={() => setActiveSubTab('register_validator')}
              className={`py-2 text-[10.5px] font-bold font-sans tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg ${
                activeSubTab === 'register_validator'
                  ? 'bg-zinc-900 text-indigo-400 border border-zinc-800 font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-250 border border-transparent'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" /> Пост-квантовый реестр
            </button>
            <button
              onClick={() => setActiveSubTab('lazy_slashing')}
              className={`py-2 text-[10.5px] font-bold font-sans tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg relative ${
                activeSubTab === 'lazy_slashing'
                  ? 'bg-zinc-900 text-indigo-400 border border-zinc-800 font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-250 border border-transparent'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-pink-400" /> Слэшинг ленивых
              <span className="absolute -top-1 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('node_daemon' as any)}
              className={`py-2 text-[10.5px] font-bold font-sans tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg relative ${
                (activeSubTab as any) === 'node_daemon'
                  ? 'bg-zinc-900 text-indigo-400 border border-zinc-800 font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-250 border border-transparent'
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${daemonActive ? 'text-emerald-400 animate-spin' : 'text-[#a855f7]'}`} /> Оффчейн-нода
              {daemonActive && (
                <span className="absolute -top-1 -right-0.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {/* SUBTAB 1 : LIQUID STAKING (SYM -> sSYM) */}
            {activeSubTab === 'stake' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-950/20 text-indigo-400 p-2.5 rounded-lg border border-indigo-900/30 shrink-0">
                    <ArrowRightLeft className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-zinc-150 font-bold font-sans text-xs">Ликвидное Делегирование SYM за sSYM акции</h3>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                      Инвестируйте свободные токены SYM в пул для автоматического начисления долей. Вы моментально получаете ликвидный токен sSYM, который можно использовать в управлении DAO!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                  <div className="bg-[#0b0b0d] border border-zinc-850 rounded-xl p-4 transition-all hover:bg-zinc-950 hover:border-zinc-800">
                    <span className="text-[9.5px] text-zinc-500 block font-mono font-bold uppercase">Ваш свободный баланс</span>
                    <div className="text-white font-extrabold text-lg font-mono mt-0.5">
                      {userBalance.toLocaleString()} <span className="text-indigo-400 text-sm">SYM</span>
                    </div>
                  </div>
                  <div className="bg-[#0b0b0d] border border-zinc-850 rounded-xl p-4 text-right transition-all hover:bg-zinc-950 hover:border-zinc-800">
                    <span className="text-[9.5px] text-zinc-500 block font-mono font-bold uppercase">Делегировано в пул sSYM</span>
                    <div className="text-white font-extrabold text-lg font-mono mt-0.5">
                      {(userStakedNodes['pool-ssym'] || 0).toLocaleString()} <span className="text-pink-400 text-sm">sSYM</span>
                    </div>
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Left Column: Stake SYM */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Сумма стейкинга:</span>
                      <span className="text-zinc-500">Мин: 10 SYM</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-purple-800 px-3.5 py-2.5 rounded-lg font-mono text-zinc-200 text-xs focus:outline-none"
                        placeholder="SYM для стейка"
                      />
                      <button 
                        onClick={() => setStakeAmount(String(Math.floor(userBalance * 0.5)))}
                        className="absolute right-2 top-2 bg-zinc-900 hover:bg-zinc-850 text-[9px] uppercase font-mono font-bold px-1.5 py-1 rounded text-zinc-400 cursor-pointer"
                      >
                        50%
                      </button>
                    </div>
                    <button
                      onClick={() => executeSDKCall('stake', { amount: stakeAmount })}
                      disabled={executing || Number(stakeAmount) <= 0 || Number(stakeAmount) > userBalance}
                      className="w-full mt-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:from-zinc-900 disabled:to-zinc-900 text-white font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border border-purple-500/10"
                    >
                      {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5 text-purple-300" />} 
                      Депозит в пул & Минт
                    </button>
                  </div>

                  {/* Right Column: Unstake sSYM */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Сумма вывода (Unstake):</span>
                      <span className="text-zinc-500">Доступно: {(userStakedNodes['pool-ssym'] || 0).toLocaleString()}</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number"
                        value={unstakeShares}
                        onChange={(e) => setUnstakeShares(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-purple-800 px-3.5 py-2.5 rounded-lg font-mono text-zinc-200 text-xs focus:outline-none"
                        placeholder="sSYM для вывода"
                      />
                      <button 
                        onClick={() => setUnstakeShares(String(userStakedNodes['pool-ssym'] || 0))}
                        className="absolute right-2 top-2 bg-zinc-900 hover:bg-zinc-850 text-[9px] uppercase font-mono font-bold px-1.5 py-1 rounded text-zinc-400 cursor-pointer"
                      >
                        MAX
                      </button>
                    </div>
                    <button
                      onClick={() => executeSDKCall('unstake', { shares: unstakeShares })}
                      disabled={executing || Number(unstakeShares) <= 0 || Number(unstakeShares) > (userStakedNodes['pool-ssym'] || 0)}
                      className="w-full mt-1.5 bg-zinc-900 hover:bg-zinc-850 disabled:bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 disabled:text-zinc-750 disabled:border-zinc-950 font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />} 
                      Вывести из пула
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2 : REGISTER FALCON VALIDATOR */}
            {activeSubTab === 'register_validator' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-teal-950/20 text-teal-400 p-2 rounded-lg border border-teal-900/30 shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-zinc-100 font-bold font-sans text-xs">Регистрация Валидатора с Пост-Квантовым Ключом</h3>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                      Чтобы присоединиться к проверке Nash-консенсуса, вам необходимо развернуть ноду и заблокировать в залог минимум <strong>100 SYM</strong>. А также привязать 666-байтный открытый ключ <strong>Falcon-512</strong>, устойчивый к криптоанализу на квантовых компьютерах.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-900 p-3.5 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-450">Генератор Falcon-512 Ключей</span>
                    <button
                      onClick={triggerFalconGeneration}
                      className="text-[10px] text-teal-400 hover:border-teal-500 bg-teal-950/20 border border-teal-900/30 px-3 py-1 rounded transition-colors font-bold cursor-pointer"
                    >
                      Генерировать Пару Ключей
                    </button>
                  </div>

                  {generatedKeyPair ? (
                    <div className="space-y-2 text-[10px] font-mono leading-tight">
                      <div className="flex items-center justify-between bg-black/40 border border-zinc-900 rounded p-2">
                        <div className="truncate max-w-[280px]">
                          <span className="text-teal-400 block text-[8px] uppercase tracking-wider mb-0.5">PUBLIC KEY (Falcon-512, NTRU 666 bytes)</span>
                          <span className="text-zinc-300">{generatedKeyPair.publicKey}</span>
                        </div>
                        <button 
                          onClick={() => handleCopy(generatedKeyPair.publicKey, 'pub')}
                          className="text-zinc-500 hover:text-zinc-300 px-1 py-0.5"
                        >
                          {copiedKeyText === 'pub' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-black/40 border border-zinc-900 rounded p-2">
                        <div className="truncate max-w-[280px]">
                          <span className="text-pink-400 block text-[8px] uppercase tracking-wider mb-0.5">PRIVATE KEY (NTRU 1280 bytes secret)</span>
                          <span className="text-zinc-350">{generatedKeyPair.privateKey}</span>
                        </div>
                        <button 
                          onClick={() => handleCopy(generatedKeyPair.privateKey, 'priv')}
                          className="text-zinc-500 hover:text-zinc-300 px-1 py-0.5"
                        >
                          {copiedKeyText === 'priv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 border border-dashed border-zinc-900 text-center rounded text-zinc-500 text-xs font-sans">
                      Нажмите кнопку генерации, чтобы выпустить аппаратный ключ Falcon.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[9.5px] mb-1">Сумма залога (Stake):</span>
                    <input 
                      type="number"
                      value={validatorStake}
                      onChange={(e) => setValidatorStake(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-lg text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => executeSDKCall('registerValidator', { stake: validatorStake, falconPubKey: customFalconKey })}
                      disabled={executing || !customFalconKey || Number(validatorStake) < 100 || Number(validatorStake) > userBalance}
                      className="bg-teal-600 hover:bg-teal-500 disabled:bg-zinc-900 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} 
                      Регистрация ноды
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900/40 mt-4">
                  <span className="text-zinc-500 block text-[9.5px] uppercase tracking-wider mb-2 font-bold font-sans">Очередь вывода валидатора (Validator Exit Queue)</span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <button
                      onClick={() => executeSDKCall('initiateValidatorExit', {})}
                      disabled={executing}
                      className="bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 text-amber-400 font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Инициировать выход
                    </button>
                    <button
                      onClick={() => executeSDKCall('withdrawValidatorStake', {})}
                      disabled={executing}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Вывести 100+ SYM
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3 : WHISTLEBLOWER LAZY SLASHING TRIGGER */}
            {activeSubTab === 'lazy_slashing' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-950/20 text-pink-400 p-2 rounded-lg border border-pink-900/30 shrink-0">
                    <ShieldAlert className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-zinc-100 font-bold font-sans text-xs">Триггер Заявления Охотника за Головами (Slasher)</h3>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                      Вы нашли ленивого валидатора, который одобряет блоки не верифицируя байткод EVM? Отправьте в контракт NashConsensusRegistry доказательство отсутствия его криптографической Falcon-подписи на оригинальных метаданных блока. Контракт спишет <strong>15% от его залога</strong>: 7.5% вы получите как Whistleblower, а 7.5% будет сожжено!
                    </p>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[9.5px] mb-1">Зарегистрированный адрес ленивого валидатора:</span>
                    <input 
                      type="text"
                      value={targetSlashedAddress}
                      onChange={(e) => setTargetSlashedAddress(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 focus:border-pink-900 px-3 py-2 rounded-lg text-zinc-200 font-mono text-xs focus:outline-none placeholder-zinc-800"
                      placeholder="0x9aE46736... (Укажите адрес нарушителя)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] mb-1">Свидетельство нарушения:</span>
                      <select
                        value={slashingReason}
                        onChange={(e) => setSlashingReason(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-lg text-zinc-300 font-mono text-xs"
                      >
                        <option value="double_sign">Двойная подпись блока (Double signing)</option>
                        <option value="lazy_check">Систематический пропуск верификации (Lazy-check)</option>
                        <option value="fake_evidence">Симуляция Red-Herring саботажа</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        onClick={() => {
                          executeSDKCall('slash', { node: targetSlashedAddress, reason: slashingReason });
                        }}
                        disabled={executing || !targetSlashedAddress}
                        className="bg-pink-700 hover:bg-pink-650 disabled:bg-zinc-900 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />} 
                        Запустить слэшинг
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-900/50 flex items-start gap-2.5 text-[10.5px] text-pink-400 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <strong>Правило игры:</strong> За ложное обвинение честной ноды с вас спишется штраф 50 SYM для предотвращения спама в реестре! Пожалуйста, выбирайте цели для слэшинга аккуратно.
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4 : OFF-CHAIN NODE DAEMON DEPLOYER */}
            {(activeSubTab as any) === 'node_daemon' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-950/20 text-emerald-400 p-2.5 rounded-lg border border-emerald-900/30 shrink-0">
                    <Cpu className={`w-5 h-5 ${daemonActive ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-zinc-150 font-bold font-sans text-xs">Автономный Оффчейн-Демон Node-Validator (ZK-Cops)</h3>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                      Запустите децентрализованную симуляцию работы ноды-верификатора. Демон в реальном времени мониторит транзакции L2, генерирует криптографические доказательства <strong>ZK-Cops</strong>, подписывает их с помощью <strong>Falcon-512</strong> и шлет транзакции на контракт <code>ZkProverRegistry</code>!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={toggleDaemon}
                    className={`w-full py-2.5 rounded-xl border font-bold text-xs font-sans tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      daemonActive 
                        ? 'bg-red-950/20 hover:bg-red-900/10 text-red-400 border-red-900/50' 
                        : 'bg-emerald-950/20 hover:bg-emerald-900/10 text-emerald-400 border-emerald-900/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${daemonActive ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
                    {daemonActive ? 'ОСТАНОВИТЬ ДЕМОН НОДЫ' : 'ЗАПУСТИТЬ ОФФЧЕЙН-ДЕМОН'}
                  </button>

                  <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-2.5 flex items-center justify-between font-mono text-[10.5px]">
                    <div>
                      <span className="text-zinc-500 block text-[8px] uppercase tracking-wider font-bold">Текущий тариф репутации</span>
                      <span className="text-indigo-400 font-bold text-xs">{daemonStats ? `${daemonStats.currentReputation}/200` : '100/200'} REP</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block text-[8px] uppercase tracking-wider font-bold">Буст APY наград</span>
                      <span className="text-yellow-500 font-bold text-xs">{daemonStats ? `${(daemonStats.currentReputation/100).toFixed(1)}x` : '1.0x'} Yield</span>
                    </div>
                  </div>
                </div>

                {/* Live Daemon Logs / Statistics Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                    <span className="text-zinc-500 block text-[8.5px] uppercase tracking-wider font-mono font-bold">Блоков обработано</span>
                    <span className="text-white font-extrabold text-sm font-mono mt-1 block">
                      {daemonStats ? daemonStats.blocksProcessed : '0'}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                    <span className="text-zinc-500 block text-[8.5px] uppercase tracking-wider font-mono font-bold text-teal-400">Доказательств ZK</span>
                    <span className="text-teal-400 font-extrabold text-sm font-mono mt-1 block">
                      {daemonStats ? daemonStats.proofsGenerated : '0'}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                    <span className="text-zinc-500 block text-[8.5px] uppercase tracking-wider font-mono font-bold text-indigo-400">Награда (SYM)</span>
                    <span className="text-yellow-400 font-extrabold text-sm font-mono mt-1 block">
                      {daemonStats ? `+${daemonStats.accumulatedRewards.toFixed(1)}` : '0.0'}
                    </span>
                  </div>
                </div>

                {/* Additional Node System Metadata Box */}
                <div className="p-3 py-2.5 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-between text-[10px] font-sans">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${daemonActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                    <span className="text-zinc-450 font-mono">Sovereign Falcon Verification Engine:</span>
                  </div>
                  <span className="text-zinc-300 font-mono">
                    {daemonActive ? 'Connected & Validating' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: GLOWING CYBER-STANDBOX TERMINAL CONSOLE */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="border border-zinc-900 bg-black rounded-xl overflow-hidden flex flex-col h-full min-h-[400px] shadow-lg shadow-purple-950/5">
          
          <div className="bg-zinc-950/80 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h3 className="text-zinc-100 font-bold font-sans text-xs">
                Консоль Эмуляции & CLI Вызов (Sepolia Proofs)
              </h3>
            </div>
            
            <button
              onClick={() => {
                setSdkLogs([`[CONSOLE_CLEANED] Очистка буфера логов в ${new Date().toLocaleTimeString()}`]);
              }}
              className="text-[9.5px] font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-900 hover:border-zinc-800 px-2.5 py-0.5 rounded cursor-pointer"
            >
              Сброс
            </button>
          </div>

          <div className="p-4 flex-1 font-mono text-[10px] space-y-1.5 overflow-y-auto custom-scrollbar bg-black/90 text-zinc-300">
            {sdkLogs.map((log, index) => {
              if (typeof log !== 'string') return null;
              let textClass = "text-zinc-300";
              if (log.includes("[SUCCESS]") || log.includes("[🎉 SDK")) {
                textClass = "text-emerald-400 font-bold bg-emerald-950/10 p-1 rounded border border-emerald-900/20 my-1 block";
              } else if (log.includes("[FAIL]") || log.includes("❌")) {
                textClass = "text-pink-400 font-bold bg-pink-950/10 p-1 rounded border border-pink-900/20 my-1 block";
              } else if (log.includes("[START]")) {
                textClass = "text-indigo-400 font-bold";
              } else if (log.includes("🛠️") || log.includes("📡")) {
                textClass = "text-teal-400";
              }
              return (
                <div key={index} className={`${textClass} leading-relaxed break-all`}>
                  {log}
                </div>
              );
            })}
          </div>

          {lastTxHash && (
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 px-4 text-[10.5px] font-mono flex items-center justify-between">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase">Последняя транзакция (Sepolia)</span>
                <span className="text-purple-400 block truncate max-w-[240px]">{lastTxHash}</span>
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300 border border-pink-900/40 hover:bg-pink-950/20 px-2 py-0.5 rounded text-[10px]"
              >
                Etherscan
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
