import React from 'react';
import { SimulationConfig } from '../types';
import { calculateExpectedUtilities } from '../simulationEngine';
import { Scale, Lock, Unlock, HelpCircle, Check, AlertTriangle } from 'lucide-react';

interface GameTheoryPanelProps {
  config: SimulationConfig;
}

export const GameTheoryPanel: React.FC<GameTheoryPanelProps> = ({ config }) => {
  const result = calculateExpectedUtilities(config);
  
  const pPercent = (config.puzzleRate * 100).toFixed(1);
  const crossoverPercent = (result.crossoverRate * 100).toFixed(1);
  
  // Dynamic scale ratios for visualization
  const maxBarValue = Math.max(0.1, config.puzzleRate * 1.5, result.crossoverRate * 1.5);
  const crossoverPosition = Math.min(95, (result.crossoverRate / maxBarValue) * 100);
  const currentPosition = Math.min(95, (config.puzzleRate / maxBarValue) * 100);

  return (
    <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col" id="game-theory-analysis-panel">
      {/* Panel Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Scale className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-zinc-100 font-sans tracking-tight">
          Теория игр и Равновесие Нэша
        </h2>
        {result.isSatisfied ? (
          <span className="flex items-center gap-1 text-[10px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 ml-auto font-mono">
            <Lock className="w-3 h-3" /> Стабильно
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] bg-red-950/40 text-red-400 px-2 py-0.5 rounded border border-red-900 ml-auto font-mono animate-pulse">
            <Unlock className="w-3 h-3" /> Уязвимо
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400 mb-4 font-sans leading-relaxed">
        В сетях PoS валидаторы склонны халтурить («дилемма верификатора»). Механизм Symbiosis Network (SYM) решает это, искусственно создавая тестовые ошибки (Red Herring, Puzzles) и наказывая слепо подписывающих валидаторов.
      </p>

      {/* Main Formula Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Diligent utility card */}
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">
            Матожидание проверки (Diligence)
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {result.expectedDiligent.toFixed(4)} <span className="text-[10px] text-zinc-500">TKN</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono mt-1 select-all">
            U = (1-p)·R_b + p·R_p - C_v
          </p>
        </div>

        {/* Lazy utility card */}
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">
            Матожидание ленивой подписи (Lazy)
          </div>
          <div className="text-lg font-mono font-bold text-amber-500">
            {result.expectedLazy.toFixed(4)} <span className="text-[10px] text-zinc-500">TKN</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono mt-1 select-all">
            U = (1-p)·R_b - p·S_s
          </p>
        </div>
      </div>

      {/* Inequality analysis block */}
      <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 mb-4 font-mono">
        <h3 className="text-[11px] text-zinc-400 uppercase tracking-widest mb-1">Условие Стимулирования (Индекс Безопасности)</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded text-zinc-300">
            Нужная частота Puzzle (p) &gt; {crossoverPercent}%
          </span>
          <span className="text-xs text-zinc-500 font-sans">vs</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${result.isSatisfied ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-500'}`}>
            Текущая: {pPercent}%
          </span>
        </div>

        {/* Graphical crossover scale */}
        <div className="h-6 w-full bg-zinc-900 rounded relative mt-3 overflow-hidden border border-zinc-800">
          {/* Crossover Barrier Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
            style={{ left: `${crossoverPosition}%` }}
          >
            <span className="absolute -top-3.5 -translate-x-1/2 text-[8px] font-mono font-black text-red-400 bg-black px-1 rounded">
              Порог
            </span>
          </div>

          {/* Current value indicator dot */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-emerald-400 border border-black shadow-lg shadow-emerald-400/50 z-20 transition-all duration-300"
            style={{ left: `calc(${currentPosition}% - 7px)` }}
          >
            <span className="absolute -bottom-5 -translate-x-1/2 text-[8px] font-mono text-zinc-300 bg-black px-1 rounded whitespace-nowrap">
              Текущая
            </span>
          </div>

          {/* Fill backgrounds */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-red-950/40" 
            style={{ width: `${crossoverPosition}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 right-0 bg-emerald-950/20" 
            style={{ left: `${crossoverPosition}%` }}
          />
        </div>
      </div>

      {/* Decision conclusion message */}
      <div className={`mt-auto p-3 rounded-lg border flex items-start gap-2.5 text-xs font-sans ${
        result.isSatisfied 
          ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-400' 
          : 'bg-red-950/10 border-red-900/30 text-red-400'
      }`}>
        {result.isSatisfied ? (
          <>
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Равновесие Нэша выполняется.</span> Выгода верификации превосходит риски списания. Рациональные узлы <span className="font-semibold underline decoration-dotted">будут верифицировать транзакции</span>, защищая сеть от настоящих атак.
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Угроза безопасности!</span> Слишком низкий штраф за списание или малый шанс Puzzle. Валидаторам выгоднее слепо подписывать блоки. <span className="font-semibold underline">Сеть находится под угрозой!</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
