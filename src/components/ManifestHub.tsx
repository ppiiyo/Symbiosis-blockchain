import React, { useState } from 'react';
import { 
  Coins, 
  Milestone, 
  Zap, 
  Cpu, 
  PieChart, 
  Calendar, 
  TrendingUp, 
  Compass, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Flame, 
  Lock,
  Hourglass,
  Layers,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { SimulationConfig, SimulationStats } from '../types';

interface ManifestHubProps {
  config: SimulationConfig;
  stats: SimulationStats;
}

export const ManifestHub: React.FC<ManifestHubProps> = ({ config, stats }) => {
  const [subTab, setSubTab] = useState<'tokenomics' | 'roadmap' | 'innovations'>('tokenomics');
  const [activePhase, setActivePhase] = useState<number>(0);
  const [selectedAllocation, setSelectedAllocation] = useState<string>('genesis');
  const [interactiveSupply, setInteractiveSupply] = useState<number>(1000000000); // 1B base

  // Allocations definitions
  const allocations = [
    { 
      id: 'genesis', 
      name: 'Генезис-Аллокация', 
      percent: 45, 
      color: 'from-purple-500 to-indigo-600', 
      bg: 'bg-purple-950/20 border-purple-900/30',
      textColor: 'text-purple-400',
      description: 'Инициализация тестовой сети, гранты нодам-основателям, закрытый пул ранних институциональных хранителей.',
      vesting: 'Клифф 12 месяцев, линейный разлок в течение 36 месяцев.'
    },
    { 
      id: 'staking', 
      name: 'Стейкинг & Награды', 
      percent: 35, 
      color: 'from-emerald-500 to-teal-600', 
      bg: 'bg-emerald-950/20 border-emerald-900/30',
      textColor: 'text-emerald-400',
      description: 'Пул вознаграждения валидаторов и делегаторов за финализацию блоков и успешный аудит ловушек (Puzzle Red Herrings).',
      vesting: 'Автоматическая блок-эмиссия по заложенной формуле консенсуса.'
    },
    { 
      id: 'treasury', 
      name: 'Экосистемный Фонд', 
      percent: 20, 
      color: 'from-amber-500 to-orange-600', 
      bg: 'bg-amber-950/20 border-amber-900/30',
      textColor: 'text-amber-400',
      description: 'Казна сообщества, гранты разработчикам смарт-контрактов, маркетинг и вознаграждения охотникам за головами (Bug Bounty).',
      vesting: 'Управляется через честных валидаторов с мультиподписью 2/3.'
    }
  ];

  // Roadmap definition
  const roadmapPhases = [
    {
      index: 0,
      period: 'Phase 1: Game Theory Sandbox',
      status: 'completed',
      title: 'Математическая симуляция & Песочница',
      description: 'Разработка интерактивной визуализации теории игр. Поиск Нэш-равновесия для дилеммы верификатора.',
      techDetails: [
        'Разработка математического ядра консенсуса и частотного генератора ловушек.',
        'Система имитации пассивных (lazy) и вредоносных (malicious) атак.',
        'Интеграция EIP-1559 газового симулятора с механизмом сжигания.',
        'Статистический дашборд реального времени (Diligence / TPS).'
      ],
      deliverables: ['Синтетический Ledger', 'Генератор Red Herring', 'Защита от Slashing']
    },
    {
      index: 1,
      period: 'Phase 2: zk-SNARK & Sharding Pipeline',
      status: 'completed',
      title: 'Сжатие стейта и масштабирование транков',
      description: 'Интеграция zk-SNARK пруверов для создания легких клиентов и распараллеливание нагрузки на цепочку шардов.',
      techDetails: [
        'Разработка протокола проверки блоков без повторного исполнения (zk-Prover Shield).',
        'Внедрение ротационных суб-комитетов с суб-выборочной валидацией (Sub-Sampling).',
        'Система мгновенной амортизации задержек сети через пред-делегирование.',
        'Анализ издержек вычисления (Verification Cost) и авто-компенсация.'
      ],
      deliverables: ['zk-SNARK Prover Engine', 'Multi-Shard Dispatcher', 'Dynamic Gas-Back']
    },
    {
      index: 3,
      period: 'Phase 3: Sentinel AI Guard & BTC Time-Locking',
      status: 'completed',
      title: 'Гибридная криптоэкономика и ИИ-Агенты',
      description: 'Внедрение автономных стражей консенсуса и анкоринг состояний в Proof-of-Work биткоина для защиты от 51% атак.',
      techDetails: [
        'Использование нейросетевых агентов для прогнозирования сговора пулов валидации.',
        'Формирование контрольных сумм реестра (Time-Locking) в транзакции сети Bitcoin.',
        'Система «Безупречной репутации» для переключения операторов нод в экстремальные периоды.',
        'Обеспечение устойчивости перед квантовыми вычислениями через подписи Falcon.'
      ],
      deliverables: ['Sentinel AI Dashboard', 'BTC Anchor-Registry', 'Falcon Sign SDK']
    },
    {
      index: 4,
      period: 'Phase 4: Merito-Decentralization Mainnet',
      status: 'completed',
      title: 'Автономная сеть Меритократии',
      description: 'Запуск основной сети Symbiosis Network с переходом полного контроля управления честным валидаторам (SYM DAO).',
      techDetails: [
        'Миграция синтетических стейков пользователей в токены ERC-20 / Native Net.',
        'Распределенный DNS-реестр активных валидаторов повышенной устойчивости.',
        'Институциональный ликвидный стейкинг (SYM-sSYM) для извлечения MEV.',
        'Управление экономическими коэффициентами (R_puzzle, P_latency) через блокчейн голосование.'
      ],
      deliverables: ['Symbiosis Mainnet Genesis', 'SYM Governance DAO', 'SDK Liquid Staking']
    }
  ];

  // Dynamic parameters calculation based on active simulation inputs
  const rawVerify = config.verificationCost;
  const rawLatency = (config.networkLatencyMs || 120) / 100;
  const isProtected = true; // Enabled dynamically in Hub

  const currentReward = 1.0 + (config.puzzleRate * config.rewardPerPuzzle);
  const currentCost = rawVerify + rawLatency;
  const netEarnings = currentReward - currentCost;
  
  const totalBurn = stats.totalTokensSlashed + (stats.currentHeight * 4.5); // Slashing + gas fee burn estimation

  return (
    <div className="flex flex-col gap-5 w-full h-full font-sans text-zinc-300">
      
      {/* 1. Header with dynamic selector tabs */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="text-zinc-100 font-bold text-sm tracking-tight">Технический Манифест Symbiosis v1.2</h3>
            <p className="text-[10px] text-zinc-500">Дорожная карта исследований, экономический движок и суперадаптивные инновации</p>
          </div>
        </div>

        {/* Subtab buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
          <button
            onClick={() => setSubTab('tokenomics')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'tokenomics'
                ? 'bg-zinc-900 text-purple-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Токеномика SYM
          </button>
          <button
            onClick={() => setSubTab('roadmap')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'roadmap'
                ? 'bg-zinc-900 text-purple-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            Роадмап Сети
          </button>
          <button
            onClick={() => setSubTab('innovations')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'innovations'
                ? 'bg-zinc-900 text-purple-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Тех-Инновации
          </button>
        </div>
      </div>

      {/* 2. SUBTAB CONTENT PANELS */}
      {subTab === 'tokenomics' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          
          {/* Allocations & Live metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Циркулирующее Предложение</span>
                <span className="text-zinc-100 text-2xl font-bold font-mono tracking-tight">{(interactiveSupply + stats.totalRewardsDistributed).toLocaleString()} SYM</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-2 flex justify-between border-t border-zinc-900 pt-2">
                <span>Базовый резерв:</span>
                <span className="text-zinc-500">1,000,000,000 SYM</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Сыграно & Изъято из Сети</span>
                <span className="text-amber-500 text-2xl font-bold font-mono tracking-tight">{(stats.totalTokensSlashed).toLocaleString()} SYM</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-2 flex justify-between border-t border-zinc-900 pt-2">
                <span>Инфляция компенсирована:</span>
                <span className="text-emerald-400 font-semibold">-{((stats.totalTokensSlashed / Math.max(1, stats.totalRewardsDistributed)) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between font-sans">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Дефляционный Огонь (Burned)</span>
                <span className="text-red-400 text-2xl font-bold font-mono tracking-tight flex items-center gap-1">
                  <Flame className="w-5 h-5 text-red-500" />
                  {totalBurn.toFixed(1)} SYM
                </span>
              </div>
              <p className="text-[9.5px] text-zinc-500 mt-2 border-t border-zinc-900 pt-1.5 leading-tight">
                Совокупность комиссионных транзакций EIP-1559 и 50% конфискованного Slashing-залога ленивых валидаторов.
              </p>
            </div>

          </div>

          {/* Allocation interactive block & Pie chart simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Interactive Visual Graph (6 cols) */}
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col gap-4">
              <span className="text-xs font-bold text-zinc-200">Распределение Первоначальной Эмиссии SYM</span>
              
              <div className="flex-1 flex flex-col justify-center items-center py-4">
                
                {/* SVG Pseudo-Donut graph */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Circle 1: Genesis - 45% (dasharray 45, 100) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="12"
                      strokeDasharray={`${45 * 2.51} 251.2`}
                      strokeDashoffset="0"
                      className="cursor-pointer transition-all hover:stroke-width-14"
                      onClick={() => setSelectedAllocation('genesis')}
                    />
                    {/* Circle 2: Staking - 35% (dasharray 35, 100) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${35 * 2.51} 251.2`}
                      strokeDashoffset={`-${45 * 2.51}`}
                      className="cursor-pointer transition-all hover:stroke-width-14"
                      onClick={() => setSelectedAllocation('staking')}
                    />
                    {/* Circle 3: Treasury - 20% (dasharray 20, 100) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={`${20 * 2.51} 251.2`}
                      strokeDashoffset={`-${80 * 2.51}`}
                      className="cursor-pointer transition-all hover:stroke-width-14"
                      onClick={() => setSelectedAllocation('treasury')}
                    />
                  </svg>

                  {/* Absolute Center percentage display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-bold text-zinc-100">
                      {selectedAllocation === 'genesis' ? '45%' : selectedAllocation === 'staking' ? '35%' : '20%'}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">
                      {selectedAllocation}
                    </span>
                  </div>
                </div>

                {/* Switch Legend */}
                <div className="flex gap-4 mt-5 text-[10px] font-mono leading-tight">
                  <span 
                    onClick={() => setSelectedAllocation('genesis')}
                    className={`cursor-pointer px-2 py-1 rounded border transition-all ${
                      selectedAllocation === 'genesis' ? 'bg-purple-950/30 border-purple-800 text-purple-300' : 'border-zinc-900 text-zinc-500'
                    }`}
                  >
                    Генезис (45%)
                  </span>
                  <span 
                    onClick={() => setSelectedAllocation('staking')}
                    className={`cursor-pointer px-2 py-1 rounded border transition-all ${
                      selectedAllocation === 'staking' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'border-zinc-900 text-zinc-500'
                    }`}
                  >
                    Стейкинг (35%)
                  </span>
                  <span 
                    onClick={() => setSelectedAllocation('treasury')}
                    className={`cursor-pointer px-2 py-1 rounded border transition-all ${
                      selectedAllocation === 'treasury' ? 'bg-amber-950/30 border-amber-800 text-amber-300' : 'border-zinc-900 text-zinc-500'
                    }`}
                  >
                    Казна (20%)
                  </span>
                </div>

              </div>
            </div>

            {/* Interactive metadata cards for Allocation detailing (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              {(() => {
                const alloc = allocations.find(a => a.id === selectedAllocation) || allocations[0];
                return (
                  <div className={`p-5 rounded-xl border flex-1 flex flex-col justify-between gap-4 transition-all ${alloc.bg}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                        <div className="flex items-center gap-2">
                          <Coins className={`${alloc.textColor} w-4 h-4`} />
                          <h4 className="text-zinc-100 font-bold text-sm">{alloc.name} ({alloc.percent}%)</h4>
                        </div>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 ${alloc.textColor}`}>
                          {(1000000000 * alloc.percent / 100).toLocaleString()} SYM
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{alloc.description}</p>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Правило разблокировки (Vesting Lockup)</span>
                      </div>
                      <p className="text-[11px] text-[#bcbcc2] leading-snug">{alloc.vesting}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Equilibrium State Engine connection */}
              <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 text-xs font-sans">
                <div className="flex items-center gap-2 mb-2 text-zinc-200 font-bold">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Калибратор Теории Игр (Верификатор против Лени):</span>
                </div>
                <div className="text-[11px] text-zinc-400 space-y-2 leading-relaxed leading-normal">
                  <p>Формула Нэша: <code className="font-mono text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900">p &gt; C_verify / (R_puzzle + S_slashing)</code> проверяется автоматически на основе текущих ползунков управления.</p>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-[10px] font-mono border-t border-zinc-900 pt-3">
                    <div className="bg-zinc-950 p-2 rounded">
                      <span className="text-zinc-500 block">Стоимость ЦПУ (C_verify):</span>
                      <strong className="text-zinc-200">{rawVerify.toFixed(2)} SYM</strong>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded">
                      <span className="text-zinc-500 block">Награда за поимку пазла (R_puzzle):</span>
                      <strong className="text-zinc-200">{config.rewardPerPuzzle} SYM</strong>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded">
                      <span className="text-zinc-500 block">Частота пазлов (p):</span>
                      <strong className="text-zinc-200">{(config.puzzleRate * 100).toFixed(1)}% блоков</strong>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded">
                      <span className="text-zinc-500 block">Штраф за сон (S_slashing):</span>
                      <strong className="text-zinc-200">{config.slashingPenalty} SYM</strong>
                    </div>
                  </div>
                  
                  {/* Live Nash audit verdict */}
                  {config.puzzleRate > rawVerify / (config.rewardPerPuzzle + config.slashingPenalty) ? (
                    <div className="mt-3 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg text-emerald-400 flex items-start gap-1.5 leading-snug">
                      <span className="font-bold shrink-0">✔ НЭШ-ОПТИМАЛЬНО:</span>
                      <span>Честная валидация является доминирующей стратегией. Рациональному узлу математически невыгодно лениться. Потери от взлома превышают выгоду.</span>
                    </div>
                  ) : (
                    <div className="mt-3 bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg text-red-400 flex items-start gap-1.5 leading-snug animate-pulse">
                      <span className="font-bold shrink-0">🚨 НЕТ РАВНОВЕСИЯ:</span>
                      <span>Слишком низкие штрафы или малая частота ловушек. Рациональные валидаторы будут паразитировать, лениво подписывая без проведения расчетов. Повысьте лимиты справа!</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {subTab === 'roadmap' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          
          <div className="flex items-center gap-2 mb-1 justify-between bg-zinc-950 p-3 rounded-lg border border-[#10b981]/20 text-xs text-zinc-300">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-spin" style={{ animationDuration: '3s' }} />
              Текущий статус разработки: <strong className="text-emerald-400 font-semibold font-mono">Phase 4: Mainnet Merito-Decentralization Live & Operational</strong>
            </span>
            <span className="text-emerald-400 font-bold font-mono">Общий прогресс: 100%</span>
          </div>

          {/* Interactive timeline grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {roadmapPhases.map((phase) => (
              <div 
                key={phase.index}
                onClick={() => setActivePhase(phase.index)}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 text-xs transition-all cursor-pointer ${
                  activePhase === phase.index 
                    ? 'bg-[#181024]/40 border-purple-900/80 shadow-md ring-1 ring-purple-500/20' 
                    : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">{phase.period}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      phase.status === 'completed' 
                        ? 'bg-emerald-400 shadow-emerald-400/50 shadow' 
                        : phase.status === 'active' 
                        ? 'bg-purple-400 animate-ping' 
                        : 'bg-zinc-800'
                    }`} />
                  </div>
                  <h4 className="text-zinc-100 font-bold tracking-tight text-[11px] leading-tight">{phase.title}</h4>
                </div>

                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-zinc-900/50">
                  <span className={`${
                    phase.status === 'completed' ? 'text-emerald-500' : phase.status === 'active' ? 'text-purple-400' : 'text-zinc-500'
                  } uppercase font-bold font-mono text-[9px]`}>
                    {phase.status === 'completed' ? 'Готово' : phase.status === 'active' ? 'В Работе' : 'План'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${activePhase === phase.index ? 'transform rotate-180 text-purple-400' : ''}`} />
                </div>
              </div>
            ))}
          </div>

          {/* DETAILED ROADMAP TAB PREVIEW */}
          {(() => {
            const phase = roadmapPhases.find(p => p.index === activePhase) || roadmapPhases[0];
            return (
              <div className="bg-[#09090b] border border-zinc-900 p-5 rounded-2xl flex flex-col lg:flex-row gap-6 font-sans">
                
                {/* Visual Left info column */}
                <div className="lg:w-1/3 flex flex-col justify-between gap-4 border-b lg:border-b-0 lg:border-r border-zinc-900 pb-5 lg:pb-0 lg:pr-6 shrink-0">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] font-mono text-purple-400 font-semibold uppercase tracking-widest">{phase.period}</span>
                    </div>

                    <h3 className="text-zinc-100 font-extrabold text-sm tracking-tight leading-tight">{phase.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed leading-normal pt-1">{phase.description}</p>
                  </div>

                  {/* Badges deliverables */}
                  <div className="space-y-2 border-t border-zinc-900 pt-4">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Ожидаемые артефакты (Milestones):</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {phase.deliverables.map((item, id) => (
                        <span key={id} className="bg-zinc-950 px-2 py-1 rounded text-[10px] font-mono border border-zinc-900 text-zinc-300 hover:border-zinc-800 transition-colors">
                          ◆ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtasks checklist on Right side */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <span className="text-xs font-bold text-zinc-200">Спецификация технических задач (Technical Checklist):</span>
                    <span className="text-[10px] text-zinc-500 font-mono font-semibold">Реализационные требования</span>
                  </div>

                  <div className="space-y-3">
                    {phase.techDetails.map((detail, id) => (
                      <div 
                        key={id} 
                        className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900/60 hover:bg-zinc-950 hover:border-zinc-850 transition-all flex items-start gap-3 text-xs"
                      >
                        <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center font-mono text-[9px] font-bold ${
                          phase.status === 'completed' 
                            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' 
                            : phase.status === 'active' && id === 0
                            ? 'bg-purple-950/20 border-purple-800/80 text-purple-400 animate-pulse'
                            : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                        }`}>
                          {phase.status === 'completed' ? '✔' : id + 1}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-250 font-medium leading-normal block">{detail}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {phase.status === 'completed' 
                              ? 'СТАТУС: ВНЕДРЕНО В СБОРКУ' 
                              : phase.status === 'active' && id === 0 
                              ? 'СТАТУС: В РАЗРАБОТКЕ (90% готовности)' 
                              : 'СТАТУС: ЗАПЛАНИРОВАНО'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      )}

      {subTab === 'innovations' && (
        <div className="flex flex-col gap-4 animate-fadeIn font-sans">
          
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-4 space-y-2.5">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Архитектурная Механика: Почему запуск Symbiosis выстоит в реальном мире?
            </span>
            <p className="text-xs text-[#9d9da3] leading-relaxed">
              В отличие от чисто академических сетей, консенсус Symbiosis учитывает неизбежные физические ограничения: <strong>сетевой джиттер, удорожание CPU, задержки трансляции блоков</strong>. Ниже представлены инновации, которые стабилизируют математическое равновесие в экстремальных условиях.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Innovation Card 1 */}
            <div className="bg-[#09090b] border border-zinc-900 hover:border-purple-900/30 p-4 rounded-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-950/30 p-1.5 rounded border border-purple-900/20 text-purple-400">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-zinc-100 text-xs">Ловушки Red Herring (Аудит-Приманки)</strong>
                </div>
                <span className="text-[9px] bg-purple-950/20 text-purple-400 border border-purple-900/30 font-mono font-semibold px-2 py-0.5 rounded">Теория Игр</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed leading-normal">
                Искусственно сгенерированные битые блоки, которые выдаются за легитимные. Валидаторы не могут знать заранее, является ли повреждение в блоке реальным злоумышленником или тестовым пазлом. Это ставит ленивого подписанта под угрозу мгновенного среза залога, ликвидируя мотивацию «подписи вслепую».
              </p>
            </div>

            {/* Innovation Card 2 */}
            <div className="bg-[#09090b] border border-zinc-900 hover:border-emerald-900/30 p-4 rounded-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-950/30 p-1.5 rounded border border-emerald-900/20 text-emerald-400">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-zinc-100 text-xs">Динамический Gas-Back (Энергосубсидия)</strong>
                </div>
                <span className="text-[9px] bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 font-mono font-semibold px-2 py-0.5 rounded">Субсидирование</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed leading-normal">
                При экстремальном удорожании валидационных вычислений (CPU Verification Costs), валидаторы начинают выключать ноды. Наша система компенсирует до <strong className="text-emerald-400 font-mono">85% расходов</strong> на электроэнергию напрямую из EIP-1559 пула возвратов, удерживая рентабельность валидаторов стабильно положительной.
              </p>
            </div>

            {/* Innovation Card 3 */}
            <div className="bg-[#09090b] border border-zinc-900 hover:border-amber-900/30 p-4 rounded-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-950/30 p-1.5 rounded border border-amber-900/20 text-amber-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-zinc-100 text-xs">Ротационные Суб-Комитеты</strong>
                </div>
                <span className="text-[9px] bg-amber-950/20 text-amber-400 border border-amber-900/30 font-mono font-semibold px-2 py-0.5 rounded">Latency Safe</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed leading-normal">
                Высокая задержка связи в глобальной сети приводит к вилкам консенсуса. Вместо полной валидации блоки верифицируются случайной выборкой узлов (sub-sampling), меняющейся каждый блок. Это снижает общую коммуникационную нагрузку в 4 раза, предотвращая рассинхронизацию.
              </p>
            </div>

            {/* Innovation Card 4 */}
            <div className="bg-[#09090b] border border-zinc-900 hover:border-pink-900/30 p-4 rounded-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-pink-950/30 p-1.5 rounded border border-pink-900/20 text-pink-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <strong className="text-zinc-100 text-xs">zk-SNARK Prover Броня</strong>
                </div>
                <span className="text-[9px] bg-pink-950/20 text-pink-400 border border-pink-900/30 font-mono font-semibold px-2 py-0.5 rounded">ZKP Shield</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed leading-normal">
                Честные валидаторы, отставшие из-за плохой связи, могут случайно подписать невалидный блок и получить штраф. ZK-Armor позволяет валидаторам моментально криптографически подтвердить факт отставания в связи и застраховать свой стейк от автоматического срезания (slashing) за леность.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
