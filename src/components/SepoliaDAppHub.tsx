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
  const [executing, setExecuting] = useState<boolean>(false);
  const [sdkLogs, setSdkLogs] = useState<string[]>([
    "[SYSTEM_INIT] Подключено к провайдеру Sepolia Proof-of-Stake...",
    "[SDK_STATUS] Контракт SymbiosisToken обнаружен по адресу: 0x320A6DDbE72151787c16b4D2000474Ba3fc02F7B",
    "[SDK_STATUS] Контракт LiquidStakingSsym обнаружен по адресу: 0xAF8F7DE32A0d419Bdc4eDabEc9da6F2190e8f3BC",
    "[SDK_STATUS] Контракт NashConsensusRegistry обнаружен по адресу: 0x9938DE81d35201dbF37c19A9a79771da4e827455"
  ]);
  const [lastTxHash, setLastTxHash] = useState<string>('');

  // Pre-loaded deployed addresses for Etherscan highlights
  const deployedAddresses = {
    token: "0x320A6DDbE72151787c16b4D2000474Ba3fc02F7B",
    staking: "0xAF8F7DE32A0d419Bdc4eDabEc9da6F2190e8f3BC",
    consensus: "0x9938DE81d35201dbF37c19A9a79771da4e827455"
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
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* CONTRACT STATUS BOARD */}
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 select-none opacity-5">
            <Globe className="w-48 h-48 text-purple-500" />
          </div>
          
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-extrabold tracking-tight text-white font-mono uppercase">
                Реестр Контрактов Sepolia L2 Rollup
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[10px]">sepolia-testnet</span>
            </div>
          </div>

          <div className="space-y-2.5 font-mono text-[11px]">
            {/* Token */}
            <div className="flex items-center justify-between p-2 rounded bg-black/60 border border-zinc-900/60 transition-colors hover:border-purple-900/30">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">SYM Token Ledger (ERC-20)</span>
                <span className="text-zinc-300 select-all">{deployedAddresses.token}</span>
              </div>
              <a 
                href={`https://sepolia.etherscan.io/address/${deployedAddresses.token}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-purple-400 hover:text-purple-300 border border-purple-900/40 hover:bg-purple-950/20 px-2 py-1 rounded"
              >
                Etherscan
              </a>
            </div>

            {/* sSYM Staking */}
            <div className="flex items-center justify-between p-2 rounded bg-black/60 border border-zinc-900/60 transition-colors hover:border-purple-900/30">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Liquid Staking (sSYM) Pool</span>
                <span className="text-zinc-300 select-all">{deployedAddresses.staking}</span>
              </div>
              <a 
                href={`https://sepolia.etherscan.io/address/${deployedAddresses.staking}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-purple-400 hover:text-purple-300 border border-purple-900/40 hover:bg-purple-950/20 px-2 py-1 rounded"
              >
                Etherscan
              </a>
            </div>

            {/* Nash Consensus */}
            <div className="flex items-center justify-between p-2 rounded bg-black/60 border border-zinc-900/60 transition-colors hover:border-purple-900/30">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Nash Consensus Signature Registry</span>
                <span className="text-zinc-300 select-all">{deployedAddresses.consensus}</span>
              </div>
              <a 
                href={`https://sepolia.etherscan.io/address/${deployedAddresses.consensus}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-purple-400 hover:text-purple-300 border border-purple-900/40 hover:bg-purple-950/20 px-2 py-1 rounded"
              >
                Etherscan
              </a>
            </div>
          </div>
        </div>

        {/* OPERATIONS PLAYGROUND */}
        <div className="border border-zinc-900 bg-black/40 rounded-xl overflow-hidden flex flex-col min-h-[380px]">
          
          {/* Navigation Controls bar */}
          <div className="grid grid-cols-3 border-b border-zinc-900 bg-zinc-950/80 p-1">
            <button
              onClick={() => setActiveSubTab('stake')}
              className={`py-2 text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg ${
                activeSubTab === 'stake'
                  ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" /> Ликвидный Стейкинг (sSYM)
            </button>
            <button
              onClick={() => setActiveSubTab('register_validator')}
              className={`py-2 text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg ${
                activeSubTab === 'register_validator'
                  ? 'bg-zinc-900 text-purple-400 border border-purple-900/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" /> Пост-Квантовый Реестр
            </button>
            <button
              onClick={() => setActiveSubTab('lazy_slashing')}
              className={`py-2 text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg relative ${
                activeSubTab === 'lazy_slashing'
                  ? 'bg-zinc-900 text-purple-400 border border-purple-900/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-pink-400" /> Слэшинг Ленивых
              <span className="absolute -top-1 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
              </span>
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {/* SUBTAB 1 : LIQUID STAKING (SYM -> sSYM) */}
            {activeSubTab === 'stake' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-950/20 text-purple-400 p-2 rounded-lg border border-purple-900/30 shrink-0">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-zinc-100 font-bold font-sans text-xs">Ликвидное Делегирование SYM за sSYM акции</h3>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                      Инвестируйте свободные токены SYM в пул для автоматического начисления долей. Вы моментально получаете ликвидный токен sSYM, который можно использовать в управлении DAO!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                  <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4">
                    <span className="text-[9.5px] text-zinc-500 block font-mono">Ваш свободный баланс</span>
                    <div className="text-zinc-100 font-extrabold text-sm font-mono mt-0.5">
                      {userBalance.toLocaleString()} <span className="text-purple-400">SYM</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 text-right">
                    <span className="text-[9.5px] text-zinc-500 block font-mono">Делегировано в пул sSYM</span>
                    <div className="text-zinc-100 font-extrabold text-sm font-mono mt-0.5">
                      {(userStakedNodes['pool-ssym'] || 0).toLocaleString()} <span className="text-pink-400">sSYM</span>
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
