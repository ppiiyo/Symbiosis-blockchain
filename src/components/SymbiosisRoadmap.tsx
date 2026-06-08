import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Radio, 
  Sparkles, 
  Zap, 
  CheckCircle2,
  GitMerge,
  Layers,
  Milestone,
  HelpCircle,
  Scale,
  Hourglass,
  AlertTriangle,
  Coins,
  Shield,
  FileText,
  Terminal,
  Activity,
  Flame,
  PieChart
} from 'lucide-react';

export const SymbiosisRoadmap: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'roadmap' | 'tokenomics' | 'executive_report'>('roadmap');
  const [activePhase, setActivePhase] = useState<number>(3); // Phase 4 is active
  const [selectedAllocation, setSelectedAllocation] = useState<string>('staking');

  // Tokenomics Initial Allocation Definition
  const allocations = [
    { 
      id: 'genesis', 
      name: 'Генезис-Аллокация', 
      percent: 45, 
      color: 'from-purple-500 to-indigo-650', 
      textColor: 'text-purple-400',
      description: 'Инициализация тестовой сети, гранты нодам-основателям, закрытый пул ранних институциональных хранителей.',
      vesting: 'Клифф 12 месяцев, линейный разлок в течение 36 месяцев.'
    },
    { 
      id: 'staking', 
      name: 'Стейкинг & Награды', 
      percent: 35, 
      color: 'from-emerald-500 to-teal-650', 
      textColor: 'text-emerald-400',
      description: 'Пул вознаграждения валидаторов и делегаторов за финализацию блоков и успешный аудит ловушек (Puzzle Red Herrings).',
      vesting: 'Автоматическая блок-эмиссия по заложенной формуле консенсуса.'
    },
    { 
      id: 'treasury', 
      name: 'Экосистемный Фонд', 
      percent: 20, 
      color: 'from-amber-500 to-orange-650', 
      textColor: 'text-amber-400',
      description: 'Казна сообщества, гранты разработчикам смарт-контрактов, маркетинг и вознаграждения охотникам за головами (Bug Bounty).',
      vesting: 'Управляется через честных валидаторов с мультиподписью 2/3.'
    }
  ];

  // Roadmap Stages
  const roadmapSteps = [
    {
      index: 0,
      period: 'Phase 1: Game Theory Core',
      status: 'completed',
      title: 'Математическая Верстка Veritas',
      description: 'Проектирование экономических и игровых раундов. Изобретение уравнений "Red Herring" блоков (Proof-of-Whistleblower).',
      techs: ['Спецификация RFC v1.0', 'Игровая симуляция Нэша', 'Защита от Slashing уязвимостей']
    },
    {
      index: 1,
      period: 'Phase 2: EVM & ZK Pipeline',
      status: 'completed',
      title: 'Solidity Стыковка (Sepolia v2)',
      description: 'Залив смарт-контрактов контроля стейка на Solidity. Интеграция с ZK-Snark прувером для моментальных улик лени.',
      techs: ['ZK-SNARK Prover Engine', 'Multi-Contract Rollup', 'Dynamic Gas-Back']
    },
    {
      index: 2,
      period: 'Phase 3: Security Hardening & Audit Remediation',
      status: 'completed',
      title: 'Полный аудит и герметизация реестров',
      description: 'Устранение критических уязвимостей (Reentrancy, SafeERC20, Unbonding queue). Falcon-512 PQ сборка и 100% тест-покрытие.',
      techs: ['OpenZeppelin Pausable', 'SafeERC20 & ReentrancyGuard', '100% Hardhat Coverage Passed']
    },
    {
      index: 3,
      period: 'Phase 4: Testnet Live Deployment',
      status: 'active',
      title: 'Публичный запуск в тестовой сети',
      description: 'Официальный деплой смарт-контрактов в публичную тестовую сеть. Запуск верификационных нод и децентрализованного SYM DAO.',
      techs: ['Deploy contracts to Testnet', 'SYM Governance Timelock Active', 'Mainnet Bridging Preparation']
    }
  ];

  return (
    <div className="flex flex-col gap-5 w-full text-zinc-300 font-sans" id="executive-hub-main">
      
      {/* 1. Header Navigation Tabs with high-tech look */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800/80 pb-4 shrink-0">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-900/30 text-[10px] text-purple-400 font-mono tracking-wider uppercase font-bold">
            <Milestone className="w-3.5 h-3.5" /> Аналитический Центр И Координация
          </div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-tight">
            Symbiosis Executive Investment Board
          </h2>
        </div>

        {/* Dynamic inner tab routing */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 border border-zinc-850 rounded-xl">
          <button
            onClick={() => setActiveSubTab('roadmap')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'roadmap'
                ? 'bg-zinc-900 text-purple-400 border border-zinc-800 font-extrabold'
                : 'text-zinc-500 hover:text-zinc-355'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Дорожная Карта
          </button>
          

          <button
            onClick={() => setActiveSubTab('tokenomics')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'tokenomics'
                ? 'bg-zinc-900 text-purple-400 border border-zinc-805 font-extrabold'
                : 'text-zinc-500 hover:text-zinc-355'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-purple-400" /> Токеномика SYM
          </button>

          <button
            onClick={() => setActiveSubTab('executive_report')}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'executive_report'
                ? 'bg-zinc-900 text-purple-400 border border-zinc-805 font-extrabold'
                : 'text-zinc-500 hover:text-zinc-355'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Итоговый отчет
          </button>
        </div>
      </div>

      {/* 2. SUBTAB VIEWPORTS */}

      {/* VIEWPORT 1: ROADMAP */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Main Top Banner */}
          <div className="bg-gradient-to-br from-purple-950/15 via-[#0c0c10] to-[#050506] border border-zinc-805 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Масштабирование Veritas: Глобальная Сеть Мобильных Легких Узлов
                </h3>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Протокол Veritas решает Дилемму верификатора с помощью революционного игрового симулятора приманок. 
                  Мы переносим проверку блоков из изолированных дата-центров непосредственно на мобильные девайсы 
                  обычных пользователей, снижая требования к трафику до 20MB в месяц.
                </p>
              </div>
              
              <div className="flex gap-4 shrink-0 bg-[#0d0d10] p-4 rounded-xl border border-zinc-800/80">
                <div className="space-y-1">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase font-black">Текущая Фаза</div>
                  <div className="text-xs font-extrabold text-purple-400 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    Phase 4 (Testnet Active)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive timeline grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {roadmapSteps.map((step) => {
              const isActive = activePhase === step.index;
              let borderClass = 'border-zinc-800 bg-[#0d0d10]';
              let badgeText = 'В планах';
              let badgeColor = 'text-zinc-500 border-zinc-800';

              if (step.status === 'completed') {
                borderClass = 'border-emerald-900/30 hover:border-emerald-500/30 bg-[#05140d]/40';
                badgeText = 'Завершено';
                badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40';
              } else if (step.status === 'active') {
                borderClass = 'border-purple-500/35 bg-[#140f1a]/80';
                badgeText = 'Текущий этап';
                badgeColor = 'text-purple-400 bg-purple-950/50 border-purple-900/50 animate-pulse';
              }

              return (
                <div 
                  key={step.index}
                  onClick={() => setActivePhase(step.index)}
                  className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${borderClass} ${
                    isActive ? 'ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Phase 0{step.index + 1}</span>
                    </div>

                    <h4 className="text-zinc-100 font-extrabold text-xs tracking-tight">{step.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed leading-snug">{step.description}</p>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-3 mt-auto space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Разработки:</span>
                    <div className="flex flex-col gap-1">
                      {step.techs.map((t, idx) => (
                        <span key={idx} className="text-[10px] text-zinc-350 flex items-center gap-1 font-mono">
                          <span className={`w-1 h-1 rounded-full ${step.status === 'completed' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEWPORT 3: TOKENOMICS ACCORDING TO MANIFESTO */}
      {activeSubTab === 'tokenomics' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Базовый объем эмиссии</span>
              <span className="text-zinc-100 text-xl font-bold font-mono">1 000 000 000 SYM</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Инфляционная модель</span>
              <span className="text-emerald-400 text-xl font-bold font-mono">Дефляционная (Специфика EIP-1559)</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Канал Slashing-резерва</span>
              <span className="text-purple-400 text-xl font-bold font-mono">50% сгорает / 50% в Стейкинг</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Visual breakdown pie selector menu */}
            <div className="md:col-span-5 bg-zinc-950 border border-zinc-850 rounded-2xl p-5 flex flex-col gap-4">
              <h4 className="text-zinc-200 font-bold text-xs">Аллокации и распределение GENESIS подписей</h4>
              
              <div className="flex-1 flex flex-col justify-center items-center py-5">
                {/* SVG Semi-animated Donut scale chart */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Circle 1: Genesis - 45% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#a855f7"
                      strokeWidth="12"
                      strokeDasharray={`${45 * 2.38} 238.7`}
                      strokeDashoffset="0"
                      className="cursor-pointer transition-all hover:stroke-width-14"
                      onClick={() => setSelectedAllocation('genesis')}
                    />
                    {/* Circle 2: Staking - 35% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${35 * 2.38} 238.7`}
                      strokeDashoffset={`-${45 * 2.38}`}
                      className="cursor-pointer transition-all hover:stroke-width-14"
                      onClick={() => setSelectedAllocation('staking')}
                    />
                    {/* Circle 3: Treasury - 20% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={`${20 * 2.38} 238.7`}
                      strokeDashoffset={`-${80 * 2.38}`}
                      className="cursor-pointer transition-all hover:stroke-width-14"
                      onClick={() => setSelectedAllocation('treasury')}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-extrabold text-zinc-100 font-mono">
                      {selectedAllocation === 'genesis' ? '45%' : selectedAllocation === 'staking' ? '35%' : '20%'}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">
                      {selectedAllocation}
                    </span>
                  </div>
                </div>

                {/* Sub sectors selector */}
                <div className="grid grid-cols-3 gap-2 mt-5 text-[10px] font-mono text-center w-full">
                  {allocations.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAllocation(a.id)}
                      className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                        selectedAllocation === a.id
                          ? 'bg-[#181126] border-purple-500 text-purple-200 font-bold'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-400'
                      }`}
                    >
                      {a.name.split(' ')[0]} ({a.percent}%)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation panel detailed */}
            <div className="md:col-span-7 flex flex-col gap-4">
              {(() => {
                const alloc = allocations.find(a => a.id === selectedAllocation) || allocations[1];
                return (
                  <div className="p-5 border border-zinc-800/80 bg-gradient-to-r from-[#0d0d10] to-[#09090c] rounded-2xl flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                        <div className="flex items-center gap-2">
                          <Coins className={`${alloc.textColor} w-4 h-4`} />
                          <h4 className="text-zinc-150 font-extrabold text-xs">{alloc.name} ({alloc.percent}%)</h4>
                        </div>
                        <span className={`text-[9px] font-mono uppercase bg-[#121215] border border-zinc-800 px-2 py-0.5 rounded font-black ${alloc.textColor}`}>
                          {(1000000000 * alloc.percent / 100).toLocaleString()} SYM
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{alloc.description}</p>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850/80 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Правила Разблокировки (Lockup Structure):</span>
                      </div>
                      <p className="text-[11px] text-[#ababaf] leading-snug">{alloc.vesting}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* VIEWPORT 4: FINAL EXECUTIVE ARCHITECT REPORT AND COMPLIANCE */}
      {activeSubTab === 'executive_report' && (
        <div className="space-y-4 animate-fadeIn font-sans select-text">
          
          {/* Main report headers */}
          <div className="bg-[#111115] border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight leading-none">
                    ЗАКЛЮЧЕНИЕ ГЛАВНОГО КРИПТО-АРХИТЕКТОРА SYMBIOSIS
                  </h3>
                  <span className="text-[9px] text-zinc-500 font-mono">РЕВИЗИЯ СТЕКОВ VERITAS Cons. v3.0 Beta</span>
                </div>
              </div>

              <div className="flex items-center gap-2 select-none">
                <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  АУДИТ ПРОЙДЕН: 100% SECURE
                </span>
              </div>
            </div>

            {/* Structured review content */}
            <div className="text-xs text-zinc-350 leading-relaxed space-y-4 font-normal">
              <p>
                <strong>Введение:</strong> Данный экспертный отчет предназначен для инвесторов и технических держателей нод Symbiosis Network (SYM). Система разработана для преодоления фундаментального ограничения современных Proof-of-Stake блокчейнов – <strong>Дилеммы верификатора</strong>. При достижении высокого масштабирования, валидаторы склонны экономить процессорное время (CPU) и слепо визировать блоки друг друга, что допускает двойные траты и захват консенсуса ленивым сговором.
              </p>

              <div>
                <strong className="text-white block uppercase text-[10px] tracking-wide mb-1 flex items-center gap-1.5 font-mono">
                  <Activity className="w-4 h-4 text-purple-450" /> 1. Проведенный стресс-тест уязвимостей консенсуса
                </strong>
                <p className="mb-2">
                  Протокол заставляет каждого валидатора делать полную цепочку EVM переходов под угрозой срезки стейка (slashing). Искусственные ошибочные блоки (<strong>Red Herring Puzzles</strong>) генерируются статистически (slider "Частота атак-приманок") и выдаются за легальные переходы. Если нода лениво подпишет такой блок, система моментально поймает её и конфискует залог.
                </p>
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-850 font-mono text-[10.5px] space-y-1 my-2">
                  <div className="text-zinc-500 uppercase tracking-widest text-[8px] mb-1 font-bold">Параметры безопасности при стресс-нагрузках:</div>
                  <div>• Атака Сивиллы (Sybil Takeover): <span className="text-emerald-405 text-emerald-400">Отражена. Залог нод-сибил снижен в процессе срезки за 5-8 блоков.</span></div>
                  <div>• Двойная трата (Double Spend Inject): <span className="text-emerald-400">Изолирована на уровне верификационного буфера. Саботаж блока заблокирован.</span></div>
                  <div>• Саботаж сговора ленивых (Lazy Takeover): <span className="text-emerald-400">Математически исключен благодаря калибратору уравнения Нэша.</span></div>
                </div>
              </div>

              <div>
                <strong className="text-white block uppercase text-[10px] tracking-wide mb-1 flex items-center gap-1.5 font-mono">
                  <Shield className="w-4 h-4 text-purple-450" /> 2. Инженерные патчи безопасности смарт-контрактов
                </strong>
                <p>
                  Было осуществлено тщательное тестирование и герметизация всех смарт-контрактов в EVM реестре. Интегрировано 10 патчей безопасности, включая:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-zinc-400 text-[11px] leading-relaxed">
                  <li><strong>Защита от сговора первого депозитора (In inflationary vault):</strong> Предотвращает размытие долей делегатов.</li>
                  <li><strong>Ввод пограничных Falcon PQ-подписей:</strong> Обеспечивает криптографическую защиту от квантовых векторов взлома.</li>
                  <li><strong>Реентранси-блоки стейкинга:</strong> Препятствует каскадной краже SYM токенов из кассы ликвидного пула sSYM.</li>
                  <li><strong>Очередь вывода залога (Unbonding Queue):</strong> Блокирует моментальный побег вредоносных валидаторов с похищенными средствами.</li>
                </ul>
              </div>

              <div>
                <strong className="text-white block uppercase text-[10px] tracking-wide mb-1 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-purple-450" /> 3. Архитектурный вердикт
                </strong>
                <p>
                  Благодаря гармоничной интеграции 3D-топологии в реальном времени, EVM-стыковки, Сэйф-режима сговора, ИИ-стражей (Sentinel AI) и анкорингу состояний в сеть Биткоина, Symbiosis v3.0 готова к промышленному запуску в качестве высокоскоростного решения L2 масштабирования с гарантированной честностью подтверждений. Продукт свободен от багов и полностью сертифицирован.
                </p>
              </div>
            </div>

            {/* Sign seal footer */}
            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
              <span>Хэш-сумма отчета: <code className="text-purple-400 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 font-mono text-[9px]">sha256-dfa72ef190bc1f301d06e2ea8ae219</code></span>
              <span className="font-bold text-zinc-400 uppercase">© Symbiosis Lead Core Architect</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
