import React, { useState } from 'react';
import { Shield, Coins, Zap, Hourglass, Scale, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConsensusProfile {
  id: string;
  name: string;
  type: string;
  finality: string;
  tps: string;
  vulnerability: 'None' | 'High' | 'Zero' | 'Medium';
  capitalEfficiency: 'Low' | 'Medium' | 'Maximum';
  energyCost: string;
  hardwareReqs: string;
  mathematicalStability: string;
  description: string;
  remedy: string;
}

export const ComparisonMatrix: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('sym');

  const profiles: ConsensusProfile[] = [
    {
      id: 'pow',
      name: 'Proof of Work (PoW)',
      type: 'Nakamoto Consensus (e.g., Bitcoin)',
      finality: '10 - 60 минут',
      tps: '7 - 15',
      vulnerability: 'None',
      capitalEfficiency: 'Low',
      energyCost: 'Чрезвычайно высокая (~90-150 ТВт·ч/год)',
      hardwareReqs: 'Специализированные ASIC-майнеры',
      mathematicalStability: 'Вероятностная устойчивость (правило длиннейшей цепи, атака 51%)',
      description: 'Безопасность достигается за счет сжигания физической энергии. Майнеры соревнуются в расшифровке случайных хэшей.',
      remedy: 'Неприменимо к смарт-контрактам высокой плотности и микроплатежам из-за безумного времени финализации.'
    },
    {
      id: 'pos',
      name: 'Proof of Stake (PoS)',
      type: 'BFT-style / Gas-bound (e.g., Ethereum, Solana)',
      finality: '6 - 12 секунд (Solana ~400мс верификация)',
      tps: '30 - 1500 (с высоким риском сбоев)',
      vulnerability: 'High',
      capitalEfficiency: 'Medium',
      energyCost: 'Низкая (обычные серверные стойки)',
      hardwareReqs: 'Высокопроизводительные CPU, NVMe SSD, выделенный IP',
      mathematicalStability: 'Нестабильно при росте нагрузок (Дилемма верификатора вынуждает экономить CPU и слепо подписывать блоки)',
      description: 'Валидаторы блокируют капитал для права подтверждать транзакции. Однако проверка чужих переходов экономически НЕ выгодна.',
      remedy: 'Приводит к централизации в пулы (Lido / Coinbase) и скрытому соглашательству без фактического аудита кода.'
    },
    {
      id: 'sym',
      name: 'Symbiosis Network (SYM)',
      type: 'Symbiosis Sub-Second Consensus Architecture',
      finality: '100 - 300 миллисекунд (Мгновенно)',
      tps: '20 000+ (сверхбыстрые микро-транки)',
      vulnerability: 'Zero',
      capitalEfficiency: 'Maximum',
      energyCost: 'Минимальная (оптимизирована под потоковые вычисления)',
      hardwareReqs: 'Потребительские ПК, мобильные или облачные микро-ноды',
      mathematicalStability: 'Абсолютно стабильно (Равновесие Нэша гарантирует проверку благодаря алгоритму Red Herring Puzzles)',
      description: 'Сеть постоянно отправляет ложные зашифрованные ловушки. Сговор или лень моментально ведут к срезу стейка.',
      remedy: 'Идеальное решение для сверхзвукового Web3: нулевые локаут периоды, мгновенная подпись и 100% гарантия честности.'
    }
  ];

  const active = profiles.find(p => p.id === selectedId) || profiles[2];

  return (
    <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-5" id="consensus-comparison-matrix">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 shrink-0">
        <Scale className="w-4 h-4 text-purple-400" />
        <div>
          <h2 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
            Сравнительный матричный анализ консенсусов
          </h2>
          <p className="text-[10px] text-zinc-500 font-sans">
            Почему Symbiosis Network (SYM) превосходит классические технологии первого и второго поколения
          </p>
        </div>
      </div>

      {/* Grid of Consensus selectors */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`py-2 px-3 rounded-lg text-xs font-sans text-left flex flex-col gap-1 cursor-pointer border transition-all ${
              selectedId === p.id
                ? 'bg-purple-950/20 border-purple-500 text-purple-200'
                : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-900/50 text-zinc-400'
            }`}
          >
            <span className="font-bold">{p.name}</span>
            <span className="text-[9px] opacity-70 truncate font-mono">{p.type}</span>
          </button>
        ))}
      </div>

      {/* Main Comparison Table / Data matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
        
        {/* Table Metrics */}
        <div className="bg-zinc-950/70 rounded-xl border border-zinc-900 overflow-hidden divide-y divide-zinc-900 font-mono">
          
          {/* Row 1: Finality */}
          <div className="p-3 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 text-zinc-500 text-[10px] uppercase font-sans flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5 text-zinc-400" /> Скорость финализации
            </div>
            <div className="col-span-7 font-bold text-zinc-100">
              {active.finality}
            </div>
          </div>

          {/* Row 2: Throughput */}
          <div className="p-3 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 text-zinc-500 text-[10px] uppercase font-sans flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Пропускная способность
            </div>
            <div className="col-span-7 font-bold text-zinc-100">
              {active.tps} TPS
            </div>
          </div>

          {/* Row 3: Verifier's Dilemma */}
          <div className="p-3 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 text-zinc-500 text-[10px] uppercase font-sans flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-rose-500" /> Риск уязвимости лени
            </div>
            <div className="col-span-7">
              {active.vulnerability === 'Zero' && (
                <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 font-sans font-bold px-2 py-0.5 rounded text-[10px]">
                  0% (Абсолютная защита)
                </span>
              )}
              {active.vulnerability === 'High' && (
                <span className="bg-rose-950 border border-rose-900 text-red-400 font-sans font-bold px-2 py-0.5 rounded text-[10px] animate-pulse">
                  Критическая уязвимость
                </span>
              )}
              {active.vulnerability === 'None' && (
                <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-sans px-2 py-0.5 rounded text-[10px]">
                  Не применимо
                </span>
              )}
            </div>
          </div>

          {/* Row 4: Capital Efficiency */}
          <div className="p-3 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 text-zinc-500 text-[10px] uppercase font-sans flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-zinc-400" /> Капитал и ликвидность
            </div>
            <div className="col-span-7">
              {active.capitalEfficiency === 'Maximum' && (
                <span className="bg-purple-950/40 border border-purple-900 text-purple-300 font-sans font-bold px-2 py-0.5 rounded text-[10px]">
                  Максимальный оборот (0 штрафных локов)
                </span>
              )}
              {active.capitalEfficiency === 'Medium' && (
                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-sans px-2 py-0.5 rounded text-[10px]">
                  Средний (блокировка Ether на 14-30 дней)
                </span>
              )}
              {active.capitalEfficiency === 'Low' && (
                <span className="bg-red-950/20 text-red-400 font-sans px-2 py-0.5 rounded text-[10px]">
                  Низкий (постоянный износ оборудования)
                </span>
              )}
            </div>
          </div>

          {/* Row 5: Power requirements */}
          <div className="p-3 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 text-zinc-500 text-[10px] uppercase font-sans flex items-center_gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-500" /> Энергозатраты сети
            </div>
            <div className="col-span-7 font-bold text-zinc-100">
              {active.energyCost}
            </div>
          </div>

          {/* Row 6: Hardware cost */}
          <div className="p-3 grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 text-zinc-500 text-[10px] uppercase font-sans flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-400" /> Требования к оборудованию
            </div>
            <div className="col-span-7 text-zinc-200">
              {active.hardwareReqs}
            </div>
          </div>
        </div>

        {/* Detailed Description Block */}
        <div className="flex flex-col justify-between bg-zinc-900/30 rounded-xl border border-zinc-900 p-4">
          
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <AlertCircle className="w-4 h-4 text-purple-400" />
              <span className="text-zinc-100 font-bold uppercase tracking-wide text-[10px]">Аналитика безопасности & механики</span>
            </div>
            
            <p className="text-zinc-300 leading-relaxed text-[11.5px]">
              {active.description}
            </p>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider block font-bold">Математический баланс устойчивости</span>
              <p className="text-zinc-300 font-mono text-[10.5px]">
                {active.mathematicalStability}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-900 flex items-start gap-2 text-zinc-400 text-[10.5px] leading-relaxed">
            {selectedId === 'sym' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold text-zinc-300">Решение: </span>
              {active.remedy}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
