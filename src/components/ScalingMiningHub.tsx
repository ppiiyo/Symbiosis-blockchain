import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Coins, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  ChevronRight,
  UserCheck,
  Flame,
  Brain,
  Link,
  ShieldCheck,
  Fingerprint,
  Activity
} from 'lucide-react';
import { ValidatorNode, SimulationConfig } from '../types';

interface ScalingMiningHubProps {
  nodes: ValidatorNode[];
  onDelegate: (nodeId: string, amount: number) => void;
  onClaimRewards: () => void;
  onUnstake: () => void;
  userStakedNodes: { [nodeId: string]: number };
  userClaimableRewards: number;
  userBalance: number;
  statsHeight: number;
  avgTPS: number;
  forceZkProtection: boolean;
  setForceZkProtection: (val: boolean) => void;
  config: SimulationConfig;
  gasBackEnabled: boolean;
  setGasBackEnabled: (val: boolean) => void;
  rotatingCommitteesEnabled: boolean;
  setRotatingCommitteesEnabled: (val: boolean) => void;
  pidTuningEnabled: boolean;
  setPidTuningEnabled: (val: boolean) => void;
  sentinelAiEnabled: boolean;
  setSentinelAiEnabled: (val: boolean) => void;
  btcAnchoringEnabled: boolean;
  setBtcAnchoringEnabled: (val: boolean) => void;
  quantumFalconEnabled: boolean;
  setQuantumFalconEnabled: (val: boolean) => void;
}

export const ScalingMiningHub: React.FC<ScalingMiningHubProps> = ({
  nodes,
  onDelegate,
  onClaimRewards,
  onUnstake,
  userStakedNodes,
  userClaimableRewards,
  userBalance,
  statsHeight,
  avgTPS,
  forceZkProtection,
  setForceZkProtection,
  config,
  gasBackEnabled,
  setGasBackEnabled,
  rotatingCommitteesEnabled,
  setRotatingCommitteesEnabled,
  pidTuningEnabled,
  setPidTuningEnabled,
  sentinelAiEnabled,
  setSentinelAiEnabled,
  btcAnchoringEnabled,
  setBtcAnchoringEnabled,
  quantumFalconEnabled,
  setQuantumFalconEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'sharding' | 'innovations'>('sharding');
  const [delegateAmount, setDelegateAmount] = useState<number>(500);
  const [selectedValidatorId, setSelectedValidatorId] = useState<string>('');
  const [pipelineLoads, setPipelineLoads] = useState<number[]>([45, 62, 38, 51]);
  
  // ZK-Prover State
  const [zkStatus, setZkStatus] = useState<'idle' | 'generating' | 'proved'>('idle');
  const [zkLog, setZkLog] = useState<string[]>([]);
  const [totalZkProofsGenerated, setTotalZkProofsGenerated] = useState<number>(14);

  // EIP-1559 State
  const [burntSym, setBurntSym] = useState<number>(3154.24);
  const [gasFeeGwei, setGasFeeGwei] = useState<number>(14);

  // Set default validator ID when nodes are loaded
  useEffect(() => {
    const activeAttesters = nodes.filter(n => n.role === 'attester' && !n.isSlashed);
    if (activeAttesters.length > 0 && !selectedValidatorId) {
      setSelectedValidatorId(activeAttesters[0].id);
    }
  }, [nodes, selectedValidatorId]);

  // Jitter pipeline loads & simulate core metrics on each block height change
  useEffect(() => {
    setPipelineLoads([
      Math.min(100, Math.max(10, 40 + Math.floor(Math.sin(statsHeight) * 25) + Math.floor(Math.random() * 15))),
      Math.min(100, Math.max(10, 55 + Math.floor(Math.cos(statsHeight * 0.8) * 30) + Math.floor(Math.random() * 10))),
      Math.min(100, Math.max(10, 30 + Math.floor(Math.sin(statsHeight * 1.5) * 20) + Math.floor(Math.random() * 20))),
      Math.min(100, Math.max(10, 65 + Math.floor(Math.cos(statsHeight * 1.2) * 20) + Math.floor(Math.random() * 15))),
    ]);

    // Simulate EIP-1559 Token Burn
    setBurntSym(prev => prev + (0.45 + Math.random() * 0.8));
    setGasFeeGwei(Math.min(120, Math.max(8, Math.floor(15 + Math.sin(statsHeight / 4) * 8 + Math.random() * 3))));

    // Simulate ZK Prover
    if (statsHeight > 0) {
      setZkStatus('generating');
      const proverNode = nodes[statsHeight % nodes.length]?.name || 'Validator Node #2';
      const shortHash = Math.random().toString(16).substring(2, 10);
      
      const timer = setTimeout(() => {
        setZkStatus('proved');
        setTotalZkProofsGenerated(p => p + 1);
        setZkLog(prev => [
          `[Block #${statsHeight}] ZK-Snark generated successfully for ${proverNode}. Core proof: proof_0x${shortHash}... [VERIFIED]`,
          ...prev.slice(0, 5)
        ]);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [statsHeight]);

  const selectedNode = nodes.find(n => n.id === selectedValidatorId);
  
  // Calculate total staked
  const totalStakedSum = Object.values(userStakedNodes).reduce((a, b) => (a as number) + (b as number), 0) as number;

  // Dynamic APY calculation based on validator reputation
  const calculateAPY = (reputation: number, type: string) => {
    if (type === 'honest') return 12 + (reputation / 10); // up to 22% APY
    if (type === 'lazy') return 18; // tempting high yield, but risky!
    return 24; // extreme risk, highest APY, likely to get slashed!
  };

  const handleDelegateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedValidatorId) return;
    if (delegateAmount <= 0 || delegateAmount > userBalance) return;
    onDelegate(selectedValidatorId, delegateAmount);
  };

  // Compute Reputation-Weighted Power vs Pure Capital
  const totalRawStake = nodes.filter(n => !n.isSlashed).reduce((acc, n) => acc + n.stake, 0);
  const totalWeightedPower = nodes.filter(n => !n.isSlashed).reduce((acc, n) => acc + (n.stake * n.reputationScore / 100), 0);

  return (
    <div className="w-full h-full flex flex-col gap-5" id="scaling-mining-hub-container">
      
      {/* Tab bar switch */}
      <div className="flex border-b border-zinc-900 justify-start gap-1 p-0.5 shrink-0 bg-zinc-950 rounded-lg">
        <button
          onClick={() => setActiveTab('sharding')}
          className={`flex-1 md:flex-none text-xs font-sans font-bold px-4 py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'sharding'
              ? 'bg-zinc-900 text-purple-400 font-bold border border-purple-900/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Траки & Делегирование Стейка
        </button>
        <button
          onClick={() => setActiveTab('innovations')}
          className={`flex-1 md:flex-none text-xs font-sans font-bold px-4 py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'innovations'
              ? 'bg-zinc-900 text-purple-400 font-bold border border-purple-900/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5 text-emerald-400" /> Инновационное Ядро (ZK & Sentinel AI)
        </button>
      </div>

      {activeTab === 'sharding' ? (
        <>
          {/* SECTION 1: SHARDING PIPELINE VISUALIZATION */}
          <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400 animate-pulse" />
                <div>
                  <h3 className="text-zinc-100 font-bold font-sans text-sm">Параллельное Масштабирование: SYM Pipelines</h3>
                  <p className="text-[10px] text-zinc-500 font-sans">Параллельные суб-секундные микро-транки распределяют нагрузку до 20,000+ TPS</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded">
                Суммарный TPS: <strong className="text-purple-400">{avgTPS > 0 ? (avgTPS * 4).toFixed(0) : '24,510'}</strong>
              </span>
            </div>

            {/* 4 Pipeline view */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { name: 'SYM-0: Core Accounts', desc: 'Переводы и балансы', color: 'from-purple-600 to-indigo-600' },
                { name: 'SYM-1: EVM Sub-state', desc: 'Смарт-контракты и DeFi', color: 'from-emerald-600 to-teal-600' },
                { name: 'SYM-2: Cross-rollup Router', desc: 'Мосты и L2 агрегаторы', color: 'from-amber-600 to-orange-600' },
                { name: 'SYM-3: Neural Oracles', desc: 'Внебюджетные фиды цен AI', color: 'from-pink-600 to-rose-600' }
              ].map((pipeline, idx) => {
                const load = pipelineLoads[idx] || 50;
                return (
                  <div key={idx} className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 flex flex-col gap-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-zinc-200 truncate">{pipeline.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[9px] text-[#8e8e93] leading-tight block">{pipeline.desc}</p>
                    
                    {/* Pipeline Stats */}
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-mono border-t border-zinc-900 pt-2 mt-1">
                      <div>
                        <span className="text-zinc-500 block">Нагрузка:</span>
                        <span className="font-bold text-zinc-300">{load}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block">Pipeline TPS:</span>
                        <span className="font-bold text-purple-400">{Math.round((avgTPS || 5200) * (load / 50))}</span>
                      </div>
                    </div>

                    {/* Loading Line Gauge */}
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${load}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-[#a1a1aa] leading-relaxed italic bg-zinc-950/40 p-2.5 rounded border border-zinc-900/60 flex items-start gap-1.5 font-sans">
              <Database className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              В отличие от классического шардинга, параллельный трубопровод **Symbiosis Pipeline** осуществляет консенсусный прогон на унифицированной базе данных, исключая кросс-шардовый оверхед задержки.
            </p>
          </div>

          {/* SECTION 2: DELEGATION MINING PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* User Balance Stake overview */}
            <div className="md:col-span-4 bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Coins className="text-purple-400 w-4 h-4" />
                  <h3 className="text-zinc-100 font-bold font-sans text-xs">Кабинет Инвестора SYM</h3>
                </div>

                {/* Token details */}
                <div className="space-y-3">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block font-sans">Свободный баланс:</span>
                    <span className="text-lg font-mono font-bold text-white">{userBalance.toLocaleString()} SYM</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block font-sans">В делегированном стейкинге:</span>
                    <span className="text-lg font-mono font-bold text-purple-400">{totalStakedSum.toLocaleString()} SYM</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 block font-sans">Claimable доход (процент):</span>
                      <span className="text-sm font-mono font-bold text-emerald-400 animate-pulse">+{userClaimableRewards.toFixed(4)} SYM</span>
                    </div>
                    {userClaimableRewards > 0 && (
                      <button
                        onClick={onClaimRewards}
                        className="bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded font-bold transition-all cursor-pointer"
                      >
                        Забрать
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {totalStakedSum > 0 && (
                <button
                  onClick={onUnstake}
                  className="w-full text-center border border-zinc-850/60 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 font-sans font-bold py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                >
                  Вывести весь стейк из валидаторов
                </button>
              )}
            </div>

            {/* Stake Submission Form */}
            <div className="md:col-span-8 bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-purple-400 w-4 h-4" />
                  <h3 className="text-zinc-100 font-bold font-sans text-xs">Запуск Делегирования: Майнинг через валидаторы</h3>
                </div>
              </div>

              <form onSubmit={handleDelegateSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Dropdown chooser */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Целевой валидатор SYM</label>
                    <select
                      value={selectedValidatorId}
                      onChange={(e) => setSelectedValidatorId(e.target.value)}
                      className="bg-zinc-950 text-xs border border-zinc-900 rounded p-2.5 outline-none font-mono focus:border-purple-600 transition-colors text-zinc-200"
                    >
                      {nodes
                        .filter(n => n.role === 'attester')
                        .map(node => (
                          <option key={node.id} value={node.id} disabled={node.isSlashed}>
                            {node.name} ({node.type} • Stake: {node.stake.toLocaleString()}) {node.isSlashed ? '[Slashed]' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Amount input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Количество токенов для стейка (SYM)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={delegateAmount}
                        onChange={(e) => setDelegateAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        max={userBalance}
                        min={100}
                        className="w-full bg-zinc-950 text-xs border border-zinc-900 rounded p-2.5 outline-none font-mono focus:border-purple-600 text-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => setDelegateAmount(Math.floor(userBalance))}
                        className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[8px] bg-zinc-900 text-purple-400 font-bold border border-zinc-800"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                </div>

                {/* Game theory simulation review */}
                {selectedNode && (
                  <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-900 space-y-3.5">
                    <div className="flex justify-between text-xs border-b border-zinc-900 pb-2">
                      <span className="text-[#a1a1aa] font-sans">Выбранный тип поведения:</span>
                      <span className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        selectedNode.type === 'honest' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' 
                          : selectedNode.type === 'lazy'
                          ? 'bg-amber-950 text-amber-500 border border-amber-900/60'
                          : 'bg-indigo-950 text-indigo-400 border border-indigo-900/60'
                      }`}>
                        {selectedNode.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[9px] font-sans">Ожидаемая доходность (APY):</span>
                        <span className="text-emerald-400 font-bold">
                          {calculateAPY(selectedNode.reputationScore, selectedNode.type).toFixed(1)}%
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[9px] font-sans">Репутационный залог:</span>
                        <span className="text-zinc-100 font-bold">{selectedNode.reputationScore}% (Хороший)</span>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <span className="text-zinc-500 block text-[9px] font-sans">Математический риск среза:</span>
                        <span className={`font-bold ${
                          selectedNode.type === 'honest' 
                            ? 'text-emerald-400' 
                            : selectedNode.type === 'lazy'
                            ? 'text-amber-500'
                            : 'text-rose-500 font-bold'
                        }`}>
                          {selectedNode.type === 'honest' ? '0.001%' : selectedNode.type === 'lazy' ? '30% (Катастрофический)' : '95%'}
                        </span>
                      </div>
                    </div>

                    {selectedNode.type !== 'honest' && (
                      <div className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded flex items-start gap-2 text-[10px] text-amber-400 leading-relaxed font-sans">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <span>
                          <strong>Предупреждение:</strong> Данный валидатор помечен как <strong>{selectedNode.type === 'lazy' ? 'ленивый' : 'атакующий'}</strong>. Если сеть вбросит ловушку (Red Herring Test Block), а он его слепо подтвердит, <strong>ваш стейк будет оштрафован на {selectedNode.type === 'lazy' ? '30%' : '50%'}</strong>!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={userBalance < 100 || delegateAmount > userBalance}
                  className={`w-full text-center font-sans font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    userBalance >= 100 && delegateAmount <= userBalance
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/10'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Делегировать стейк {delegateAmount} SYM
                </button>
              </form>
            </div>

          </div>

          {/* SECTION 3: CURRENT ACTIVE DELEGATOR POSITION TABLE */}
          {totalStakedSum > 0 && (
            <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-zinc-300 font-sans">Ваши активные позиции в валидаторах</h4>
              <div className="space-y-2">
                {Object.entries(userStakedNodes).map(([nodeId, amount]) => {
                  const stakedAmt = amount as number;
                  if (stakedAmt <= 0) return null;
                  const nodeObj = nodes.find(n => n.id === nodeId);
                  const isNodeSlashed = nodeObj?.isSlashed;
                  return (
                    <div key={nodeId} className="flex justify-between items-center text-xs font-mono bg-zinc-950 p-2.5 rounded border border-zinc-900">
                      <div className="flex items-center gap-2">
                        <Award className={`w-4 h-4 ${isNodeSlashed ? 'text-red-500' : 'text-purple-400'}`} />
                        <span>{nodeObj?.name || nodeId}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">({nodeObj?.type || 'attester'})</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-zinc-500 text-[10px] font-sans block text-right">Размер стейка:</span>
                          <span className="text-zinc-100 font-bold">{stakedAmt.toLocaleString()} SYM</span>
                        </div>

                        <div>
                          <span className="text-zinc-500 text-[10px] font-sans block text-right">Накоплено:</span>
                          <span className={`text-[11px] font-bold ${isNodeSlashed ? 'text-red-500' : 'text-emerald-400'}`}>
                            {isNodeSlashed ? 'Slashed' : `+${(stakedAmt * 0.00015 * (nodeObj?.reputationScore || 100) / 100).toFixed(3)} SYM`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* INNOVATION ENGINE DETAILS TAB */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* COLUMN 1: ZK-Proving & EIP-1559 */}
          <div className="flex flex-col gap-5">
            
            {/* ZK Snark Panel */}
            <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-4 font-sans">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="text-emerald-400 w-4 h-4 animate-pulse" />
                  <div>
                    <h3 className="text-zinc-100 font-bold text-xs">zk-SNARK Криптографический Прувер</h3>
                    <p className="text-[9px] text-zinc-500">Генерация доказательств с нулевым разглашением о честном прогоне</p>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded font-bold">
                  АКТИВЕН
                </span>
              </div>

              {/* Prover Simulation state */}
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 flex justify-between items-center text-xs">
                <div>
                  <span className="text-zinc-500 text-[9px] block uppercase font-mono">Статус прувера:</span>
                  <span className={`font-mono font-bold ${
                    zkStatus === 'generating' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                  }`}>
                    {zkStatus === 'generating' ? '⚡ Генерация SNARK-Proof...' : '✅ Proofs Сгенерированы'}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className="text-zinc-500 text-[9px] block uppercase font-mono">Всего ZK Доказательств:</span>
                  <span className="text-zinc-200 font-bold font-mono">{totalZkProofsGenerated}</span>
                </div>
              </div>

              {/* ZK Toggle of complete insurance */}
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[75%]">
                    <span className="text-xs font-bold text-zinc-200 block">Разблокировать ZK-Иммунитет Стейка</span>
                    <p className="text-[9px] text-[#8e8e93] leading-relaxed">
                      Примените передовые ZK-оболочки для своего стейка. Это страхует вас на 100% от слашинга лени (если валидатор ленив, математический прувер принудительно отвергнет ловушку до подписания).
                    </p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={forceZkProtection} 
                      onChange={() => setForceZkProtection(!forceZkProtection)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {forceZkProtection && (
                  <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span><strong>ZK-Иммунитет АКТИВЕН:</strong> Ваши позиции защищены на криптографическом уровне. Штрафы от ленивых валидаторов за ловушки предотвращаются автоматически!</span>
                  </div>
                )}
              </div>

              {/* ZK proofs log */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider block">Лог криптографического прувера:</span>
                <div className="bg-black/40 border border-zinc-900 rounded p-2.5 max-h-[105px] overflow-y-auto font-mono text-[9.5px] leading-tight space-y-1 text-[#a1a1aa] custom-scrollbar">
                  {zkLog.length === 0 ? (
                    <div className="text-zinc-650 italic text-center py-4">Ожидание блоков консенсуса для прувинга...</div>
                  ) : (
                    zkLog.map((log, idx) => (
                      <div key={idx} className="border-b border-zinc-950 pb-1 last:border-0 truncate">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* EIP-1559 Dynamic Gas Burn */}
            <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-3 font-sans">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="text-[#ff453a] w-4 h-4 animate-bounce" />
                  <div>
                    <h3 className="text-zinc-100 font-bold text-xs">EIP-1559 Механизм Сжигания SYM</h3>
                    <p className="text-[9px] text-zinc-500">Сжигание базовой комиссии транзакций для стабилизации инфляции</p>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono text-[#ff453a] bg-[#3f1e1e]/20 border border-red-900/30 px-2 py-0.5 rounded font-bold">
                  ДЕФЛЯЦИОННЫЙ СОЮЗ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-zinc-950 p-3 rounded border border-zinc-900">
                  <span className="text-[9pt] text-zinc-500 block uppercase font-mono">Суммарно сожжено:</span>
                  <span className="text-base font-mono font-bold text-red-400">
                    {burntSym.toFixed(2)} SYM
                  </span>
                </div>
                <div className="bg-zinc-950 p-3 rounded border border-zinc-900">
                  <span className="text-[9pt] text-zinc-500 block uppercase font-mono">Комиссия (Base Fee):</span>
                  <span className="text-base font-mono font-bold text-zinc-200">
                    {gasFeeGwei} Gwei
                  </span>
                </div>
              </div>

              {/* Dynamic deflation visual meter */}
              <div className="bg-zinc-950/45 p-3 rounded border border-zinc-900 flex flex-col gap-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#a1a1aa]">Эмиссия vs Сжигание (Баланс):</span>
                  <span className="text-emerald-400 font-mono font-semibold">-1.18% (Ультра-Звуковые токены)</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-[45%] right-0 bg-red-500/80 rounded-full animate-pulse" />
                  <div className="absolute top-0 bottom-0 left-0 right-[55%] bg-purple-500 rounded-full" />
                </div>
                <p className="text-[9px] text-[#8e8e93] leading-normal pt-1 block">
                  При переходе TPS выше 5,000, суммарный объем сгораемых SYM в транзакционных комиссиях превосходит базовый майнинговый блок-реворд, делая экономику долгосрочно дефляционной.
                </p>
              </div>

            </div>

          </div>

          {/* COLUMN 2: RWPoS & AI Sentinel & Bitcoin Anchor */}
          <div className="flex flex-col gap-5">
            
            {/* Reputation-Weighted Power (RWPoS) vs Plutocracy */}
            <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-4 font-sans">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-purple-400 w-4 h-4" />
                  <div>
                    <h3 className="text-zinc-100 font-bold text-xs">RWPoS Сила Весов (Анти-Плутократия)</h3>
                    <p className="text-[9px] text-zinc-500">Умножение стейка на индекс репутации предотвращает захват сети китами</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                
                {/* Visualizing 2 scenarios side by side */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-zinc-300 font-medium font-sans">1. Валидатор "Олигарх" (Много SYM, плохая репутация)</span>
                    <span className="text-zinc-400 font-mono">Вес: 30%</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900 text-[10px] space-y-1.5 font-sans">
                    <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                      <span>Стек: 50,000 SYM</span>
                      <span>Индекс Репутации: 35% (Ленивый)</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: '35%' }} />
                    </div>
                    <span className="text-[9.5px] text-[#ff453a] block leading-tight">Эффективный вес в голосовании: <strong>17,500 Power</strong> (Плутократия остановлена!)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-zinc-300 font-medium font-sans">2. Валидатор "Меритократ" (Компактный SYM, отличный аудит)</span>
                    <span className="text-zinc-400 font-mono font-mono">Вес: 100%</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900 text-[10px] space-y-1.5 font-sans">
                    <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                      <span>Стек: 15,000 SYM</span>
                      <span>Индекс Репутации: 100% (Честный)</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-[9.5px] text-emerald-400 block leading-tight">Эффективный вес в голосовании: <strong>15,000 Power</strong> (Практически равен олигарху!)</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 leading-normal font-sans italic pt-1 text-center bg-zinc-950 p-2 rounded border border-zinc-900-50">
                  Благодаря RWPoS, честные валидаторы с небольшим залогом сдерживают неискренних китов, гарантируя децентрализацию и решая вечную проблему PoS.
                </p>

              </div>
            </div>

            {/* Cognitive Sentinel AI Watchdog & BTC Time-Anchor */}
            <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-4 font-sans">
              
              {/* AI Watchdog Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <Brain className="text-[#a286f4] w-4 h-4 animate-pulse" />
                  <div>
                    <h3 className="text-zinc-100 font-bold text-xs">On-Chain Монитор "Cognitive Sentinel AI"</h3>
                    <p className="text-[9px] text-zinc-500">Интеллектуальное динамическое регулирование частоты ловушек</p>
                  </div>
                </div>
              </div>

              {/* Status block */}
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Статус ИИ-Контроля:</span>
                  <span className="text-emerald-400 font-mono font-bold animate-pulse">АВТО-ПАТРУЛЬ: АКТИВЕН</span>
                </div>
                <div className="flex justify-between text-[11px] border-t border-zinc-900/50 pt-2 font-sans">
                  <span className="text-zinc-400">Текущая Частота Ловушек:</span>
                  <span className="text-purple-400 font-mono">Авто (3.0% - 15.0%)</span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed pt-1 block">
                  Если коллективный индекс усердия падает ниже 70%, ИИ автоматически взвинчивает частоту случайных ловушек `Puzzle Rate`. Это вынуждает рациональных валидаторов срочно включать проверку процессора, выправляя устойчивость.
                </p>
              </div>

              {/* Bitcoin State Anchor list */}
              <div className="space-y-2 font-sans">
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold border-t border-zinc-900 pt-3">
                  <Link className="w-3.5 h-3.5 text-orange-400" />
                  <span>Якорные Хеши в Биткоин (Taproot L1 Proofs)</span>
                </div>
                <p className="text-[9px] text-zinc-400 leading-normal block">
                  Periodic state roots committed directly to Bitcoin network, preventing any "long-range history attacks".
                </p>

                <div className="space-y-1.5 font-mono text-[9px] bg-zinc-950 p-2.5 rounded border border-zinc-900">
                  <div className="flex justify-between text-zinc-400">
                    <span className="text-orange-400">SYM H-{(statsHeight - (statsHeight % 10)).toLocaleString()}</span>
                    <span>→ BTC H-845,91{Math.floor(statsHeight / 10 % 10)}</span>
                    <span className="text-[#a1a1aa]">0x3ef9...4b12 [CONFIRMED]</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span className="text-orange-400">SYM H-{(statsHeight - (statsHeight % 10) - 10).toLocaleString()}</span>
                    <span>→ BTC H-845,91{Math.max(0, Math.floor(statsHeight / 10 % 10) - 1)}</span>
                    <span className="text-[#a1a1aa]">0x71da...bb55 [CONFIRMED]</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* REAL-WORLD STABILITY & LATENCY SAFEGUARDS PANEL */}
          <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 font-sans">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="text-purple-400 w-4 h-4 animate-pulse text-purple-400" />
                  <h3 className="text-zinc-100 font-bold text-sm">Инфраструктурный Стабилизатор Ликвидности</h3>
                </div>
                <p className="text-[10px] text-zinc-500">Автоматическая защита экономики сети от экстремальных задержек (Latency) и удорожания процессоров (Verification Cost)</p>
              </div>

              {/* Equilibrium Health Indicator Gauge */}
              {(() => {
                const rawCost = config.verificationCost + (config.networkLatencyMs || 120) / 100;
                let actVerify = gasBackEnabled ? config.verificationCost * 0.15 : config.verificationCost;
                if (sentinelAiEnabled) {
                  actVerify = actVerify * 0.85; // 15% discount for AI co-processing
                }
                if (quantumFalconEnabled) {
                  actVerify = actVerify * 0.65; // 35% HSM-hardware acceleration discount
                }
                const actLatency = rotatingCommitteesEnabled ? ((config.networkLatencyMs || 120) / 100) / 4 : ((config.networkLatencyMs || 120) / 100);
                const effectiveCost = actVerify + actLatency;
                
                const pidReward = pidTuningEnabled ? Math.max(0, effectiveCost - (1.0 + config.puzzleRate * config.rewardPerPuzzle) + 1.25) : 0;
                const finalPuzzleReward = config.rewardPerPuzzle + pidReward * 12;
                const effectiveReward = 1.0 + (config.puzzleRate * finalPuzzleReward);
                const validatorProfit = effectiveReward - effectiveCost;
                const isSystemHealthy = validatorProfit > 0;

                return (
                  <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    isSystemHealthy 
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                      : 'bg-red-950/20 border-red-900/40 text-red-400 animate-pulse'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                    <span>
                      Состояние Сети: {isSystemHealthy ? 'NASH EQUILIBRIUM: СТАБИЛЬНО' : 'КРИЗИС ВЫХОДА ВАЛИДАТОРОВ!'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Content block: Math model & interactive switches */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Interactive Switches (Left side: 5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  Активные Инженерные Защиты:
                </span>

                {/* Switch 1 */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 flex items-center justify-between transition-all hover:border-zinc-800">
                  <div className="max-w-[75%]">
                    <span className="text-[11px] font-bold text-zinc-200 block">1. Динамический Gas-Back (Субсидии SYM)</span>
                    <p className="text-[9px] text-[#8e8e93] leading-tight">Снижает издержки проверки на <strong className="text-purple-400">85%</strong> за счет компенсации из пула сборов транзакций при высоких нагрузках.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={gasBackEnabled} 
                      onChange={() => setGasBackEnabled(!gasBackEnabled)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 2 */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 flex items-center justify-between transition-all hover:border-zinc-800">
                  <div className="max-w-[75%]">
                    <span className="text-[11px] font-bold text-zinc-200 block">2. Ротационные Комитеты (Sub-Sampling)</span>
                    <p className="text-[9px] text-[#8e8e93] leading-tight">Вместо полной валидации блоки проверяет случайный кворум. Нагрузка снижается в <strong className="text-purple-400">4 раза</strong>.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={rotatingCommitteesEnabled} 
                      onChange={() => setRotatingCommitteesEnabled(!rotatingCommitteesEnabled)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 3 */}
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between transition-all hover:border-zinc-800">
                  <div className="max-w-[75%]">
                    <span className="text-[11px] font-bold text-zinc-200 block">3. PID-Регулятор Пазлов (Game Theory Lock)</span>
                    <p className="text-[9px] text-[#8e8e93] leading-tight">Автоматически повышает <strong className="text-purple-400">R_puzzle</strong> (награду за ловушку), если стоимость превышает доход.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={pidTuningEnabled} 
                      onChange={() => setPidTuningEnabled(!pidTuningEnabled)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 4 */}
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-905 flex items-center justify-between transition-all hover:border-zinc-805">
                  <div className="max-w-[75%]">
                    <span className="text-[11px] font-bold text-zinc-200 block">4. Sentinel AI On-Chain Active Guard</span>
                    <p className="text-[9px] text-[#8e8e93] leading-tight">Обнаруживает аномалии в пулах и ленивых валидаторах. <strong className="text-emerald-400">Снижает издержки на 15%</strong>.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={sentinelAiEnabled} 
                      onChange={() => setSentinelAiEnabled(!sentinelAiEnabled)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 5 */}
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-905 flex items-center justify-between transition-all hover:border-zinc-850">
                  <div className="max-w-[75%]">
                    <span className="text-[11px] font-bold text-zinc-200 block">5. Bitcoin Time-Locking (BTC Anchor)</span>
                    <p className="text-[9px] text-[#8e8e93] leading-tight">Безопасность высшего уровня: анкоринг стейта в PoW BTC, <strong className="text-emerald-400">пресекающий 51% атаки</strong>.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={btcAnchoringEnabled} 
                      onChange={() => setBtcAnchoringEnabled(!btcAnchoringEnabled)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 6 */}
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-905 flex items-center justify-between transition-all hover:border-zinc-850">
                  <div className="max-w-[75%]">
                    <span className="text-[11px] font-bold text-zinc-200 block">6. Post-Quantum Falcon Signatures</span>
                    <p className="text-[9px] text-[#8e8e93] leading-tight">Falcon подписи дают крипто-ускорение на <strong className="text-purple-400">35%</strong> и ускоряют прокачку репутации в 2 раза.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={quantumFalconEnabled} 
                      onChange={() => setQuantumFalconEnabled(!quantumFalconEnabled)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

              </div>

              {/* Economic Balance Visualization Details (Right side: 7 columns) */}
              {(() => {
                const rawVerify = config.verificationCost;
                const rawLatency = (config.networkLatencyMs || 120) / 100;
                
                let actVerify = gasBackEnabled ? rawVerify * 0.15 : rawVerify;
                if (sentinelAiEnabled) {
                  actVerify = actVerify * 0.85; // 15% discount for AI co-processing
                }
                if (quantumFalconEnabled) {
                  actVerify = actVerify * 0.65; // 35% HSM-hardware acceleration discount
                }

                const actLatency = rotatingCommitteesEnabled ? rawLatency / 4 : rawLatency;
                const systemCost = actVerify + actLatency;

                const baseReward = 1.0;
                const rawPuzzleFreq = config.puzzleRate;
                const rawPuzzleReward = config.rewardPerPuzzle;
                
                const pidSubsidy = pidTuningEnabled ? Math.max(0, systemCost - (baseReward + rawPuzzleFreq * rawPuzzleReward) + 1.25) : 0;
                const finalPuzzleReward = rawPuzzleReward + pidSubsidy * 12;
                
                const expectedReward = baseReward + (rawPuzzleFreq * finalPuzzleReward);
                const netProfit = expectedReward - systemCost;
                const isOptimal = netProfit > 0;

                return (
                  <div className="lg:col-span-7 bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col justify-between gap-4 font-sans text-xs">
                    
                    {/* Visual Profit Scale */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-300">Баланс Экономики Валидатора (Ожидаемый профит)</span>
                        <span className={`font-mono font-bold ${isOptimal ? 'text-emerald-400' : 'text-red-500'}`}>
                          {netProfit > 0 ? '+' : ''}{netProfit.toFixed(3)} SYM / Блок
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        
                        {/* Expenditures column */}
                        <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900 flex flex-col gap-1">
                          <span className="text-zinc-500 text-[9px] uppercase font-mono">Фактические затраты:</span>
                          <span className="text-red-400 font-bold font-mono text-[13px]">{systemCost.toFixed(3)} SYM</span>
                          
                          <div className="text-[9px] text-zinc-500 font-mono space-y-0.5 border-t border-zinc-900 pt-1 mt-1">
                            <div className="flex justify-between">
                              <span>ЦПУ:</span>
                              <span className={gasBackEnabled ? 'text-emerald-400' : 'text-zinc-400'}>
                                {actVerify.toFixed(2)} SYM {gasBackEnabled ? '(-85%)' : ''}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Сеть (лат):</span>
                              <span className={rotatingCommitteesEnabled ? 'text-emerald-400' : 'text-zinc-400'}>
                                {actLatency.toFixed(2)} SYM {rotatingCommitteesEnabled ? '(-75%)' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Earnings column */}
                        <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900 flex flex-col gap-1">
                          <span className="text-zinc-500 text-[9px] uppercase font-mono">Среднее вознаграждение:</span>
                          <span className="text-emerald-400 font-bold font-mono text-[13px]">{expectedReward.toFixed(3)} SYM</span>
                          
                          <div className="text-[9px] text-zinc-500 font-mono space-y-0.5 border-t border-zinc-900 pt-1 mt-1">
                            <div className="flex justify-between">
                              <span>Финализация:</span>
                              <span>{baseReward.toFixed(2)} SYM</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Аудит ловушек:</span>
                              <span className={pidTuningEnabled && pidSubsidy > 0 ? 'text-emerald-400' : 'text-zinc-400'}>
                                {(rawPuzzleFreq * finalPuzzleReward).toFixed(2)} SYM {pidSubsidy > 0 ? '(PID: +)' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Educational feedback on Nash collapse vs Stability state */}
                    <div className="border-t border-zinc-900 pt-3">
                      {isOptimal ? (
                        <div className="text-[10px] text-emerald-400 leading-normal flex items-start gap-1.5 bg-emerald-950/10 p-2 border border-emerald-900/20 rounded">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>
                            <strong>Защитная адаптация включена:</strong> Система гарантирует, что проверять блоки выгоднее, чем быть ленивым валидатором, даже при задержках в <strong className="text-zinc-100 font-mono">{config.networkLatencyMs}ms</strong> и стоимости вычислений в <strong className="text-zinc-100 font-mono">{config.verificationCost} SYM</strong>. Валидаторы застрахованы от убытков, исход из сети исключен!
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-red-400 leading-normal flex items-start gap-1.5 bg-red-950/10 p-2 border border-red-900/20 rounded animate-pulse">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>
                            <strong>🚨 ВНИМАНИЕ: КРИЗИС ЭКОСИСТЕМЫ!</strong> Затраты на аудит ловушек превзошли награду. Рациональные валидаторы генерируют убытки (<strong className="font-mono text-zinc-100">{(expectedReward - systemCost).toFixed(2)} SYM / блок</strong>) и выключают ноды, сбрасывая ликвидность SYM и ставя под удар безопасность консенсуса. Включите защитные протоколы слева!
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
