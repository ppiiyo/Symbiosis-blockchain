import React from 'react';
import { SimulationConfig } from '../types';
import { Play, Pause, ChevronRight, RotateCcw, ShieldAlert, Award, Skull, Sliders, Server, Zap } from 'lucide-react';

interface ControlPanelProps {
  config: SimulationConfig;
  onChangeConfig: (newConfig: SimulationConfig) => void;
  onTick: () => void;
  onReset: () => void;
  onInjectAttack: (attackType: 'none' | 'double_spend' | 'lazy_takeover' | 'sybil') => void;
  currentAttack: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChangeConfig,
  onTick,
  onReset,
  onInjectAttack,
  currentAttack
}) => {
  const updateParam = (key: keyof SimulationConfig, val: any) => {
    onChangeConfig({
      ...config,
      [key]: val
    });
  };

  return (
    <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col gap-4" id="simulation-controlls-panel">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-900 shrink-0">
        <Sliders className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-zinc-100 font-sans tracking-tight">
          Панель управления и Параметры
        </h2>
      </div>

      {/* Play / Run State Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => updateParam('isPaused', !config.isPaused)}
          className={`col-span-2 py-2 px-3 rounded-lg text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            config.isPaused
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/15'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
          }`}
        >
          {config.isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Запустить Симуляцию
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5" /> Пауза
            </>
          )}
        </button>

        <button
          onClick={onTick}
          disabled={!config.isPaused}
          className="py-2 px-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900 text-xs font-mono flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Сделать один шаг (произвести 1 блок)"
        >
          <ChevronRight className="w-4 h-4" /> Шаг
        </button>

        <button
          onClick={onReset}
          className="py-2 px-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900 text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
          title="Сбросить все показатели"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Сброс
        </button>
      </div>

      {/* Parameter Sliders */}
      <div className="flex flex-col gap-3 font-sans">
        {/* slider 1: block rate */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-zinc-400">Интервал блоков (мс)</span>
            <span className="text-purple-400 font-bold">{config.blockIntervalMs}ms</span>
          </div>
          <input
            type="range"
            min="250"
            max="3000"
            step="250"
            value={config.blockIntervalMs}
            onChange={(e) => updateParam('blockIntervalMs', parseInt(e.target.value))}
            className="w-full accent-purple-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
          />
        </div>

        {/* slider 2: puzzleRate */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-zinc-400">Частота ложных Puzzles (p)</span>
            <span className="text-emerald-400 font-bold">{(config.puzzleRate * 100).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.15"
            step="0.005"
            value={config.puzzleRate}
            onChange={(e) => updateParam('puzzleRate', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
          />
        </div>

        {/* slider 3: slashingPenalty */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-zinc-400">Списание за халатность (S_slash)</span>
            <span className="text-red-400 font-bold">{config.slashingPenalty} TKN</span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={config.slashingPenalty}
            onChange={(e) => updateParam('slashingPenalty', parseInt(e.target.value))}
            className="w-full accent-red-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
          />
        </div>

        {/* slider 4: rewardPerPuzzle */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-zinc-400">Награда за поимку (R_puzzle)</span>
            <span className="text-amber-400 font-bold">{config.rewardPerPuzzle} TKN</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={config.rewardPerPuzzle}
            onChange={(e) => updateParam('rewardPerPuzzle', parseInt(e.target.value))}
            className="w-full accent-amber-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
          />
        </div>

        {/* slider 5: verificationCost */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-zinc-400">Цена вычислений (C_verify)</span>
            <span className="text-zinc-300 font-bold">{config.verificationCost.toFixed(1)} TKN</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={config.verificationCost}
            onChange={(e) => updateParam('verificationCost', parseFloat(e.target.value))}
            className="w-full accent-zinc-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Sandbox Attack Injector Panel */}
      <div className="pt-3 border-t border-zinc-900/65 flex flex-col gap-2.5">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          Сценарии атак и песочница
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {/* Attack 1 */}
          <button
            onClick={() => onInjectAttack('double_spend')}
            className={`py-2 px-3 rounded-lg text-xs font-sans font-medium flex items-center justify-between transition-all cursor-pointer border ${
              currentAttack === 'double_spend'
                ? 'bg-rose-950/40 border-rose-600 text-rose-400'
                : 'bg-zinc-900/45 border-zinc-850 hover:bg-zinc-900 text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Атака Double Spend (Вброс)
            </span>
            <span className="text-[9px] uppercase tracking-wide bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded text-rose-400">
              Однократно
            </span>
          </button>

          {/* Attack 2 */}
          <button
            onClick={() => onInjectAttack(currentAttack === 'lazy_takeover' ? 'none' : 'lazy_takeover')}
            className={`py-2 px-3 rounded-lg text-xs font-sans font-medium flex items-center justify-between transition-all cursor-pointer border ${
              currentAttack === 'lazy_takeover'
                ? 'bg-red-950/40 border-red-500 text-red-400 font-bold'
                : 'bg-zinc-900/45 border-zinc-850 hover:bg-zinc-900 text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5" /> Саботаж: 51% Ленивых узлов
            </span>
            <span className={`text-[9px] uppercase tracking-wide px-1 py-0.2 rounded border ${
              currentAttack === 'lazy_takeover'
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-zinc-800 border-zinc-700/80 text-zinc-500'
            }`}>
              {currentAttack === 'lazy_takeover' ? 'Активен' : 'Вкл / Выкл'}
            </span>
          </button>

          {/* Attack 3 */}
          <button
            onClick={() => onInjectAttack(currentAttack === 'sybil' ? 'none' : 'sybil')}
            className={`py-2 px-3 rounded-lg text-xs font-sans font-medium flex items-center justify-between transition-all cursor-pointer border ${
              currentAttack === 'sybil'
                ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 font-bold'
                : 'bg-zinc-900/45 border-zinc-850 hover:bg-zinc-900 text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Наводнение Сибил-нодами
            </span>
            <span className={`text-[9px] uppercase tracking-wide px-1 py-0.2 rounded border ${
              currentAttack === 'sybil'
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 animate-pulse'
                : 'bg-zinc-800 border-zinc-700/80 text-zinc-500'
            }`}>
              {currentAttack === 'sybil' ? 'Активен' : 'Вкл / Выкл'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
