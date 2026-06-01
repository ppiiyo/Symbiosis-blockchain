import React from 'react';
import { SimulationStats, ChartDatapoint } from '../types';
import { Shield, ShieldAlert, Coins, TrendingUp, Clock, Percent } from 'lucide-react';

interface MetricsDashboardProps {
  stats: SimulationStats;
  chartData: ChartDatapoint[];
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ stats, chartData }) => {
  // Generate an SVG path corresponding to one of our chart history metrics
  const makeSvgPath = (key: 'tps' | 'latency' | 'diligence', height: number, width: number) => {
    if (chartData.length < 2) return '';
    
    // Find min and max for scaling
    const values = chartData.map(d => d[key]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const points = chartData.map((d, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - ((d[key] - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const isSecure = stats.nashEquilibrium;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full" id="stats-dashboard-grid">
      
      {/* Metric 1: TPS */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-500 font-medium">Текущий TPS</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1.5 z-10">
          <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
            {stats.realtimeTPS.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500 font-sans">tx/sec</span>
        </div>
        
        {/* Real-time sparkline SVG */}
        <div className="h-10 w-full mt-3 opacity-60">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={makeSvgPath('tps', 30, 100)}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Metric 2: Latency */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-500 font-medium">Финализация блоков</span>
          <Clock className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-1.5 z-10">
          <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
            {stats.avgFinalityTimeMs.toFixed(0)}
          </span>
          <span className="text-xs text-zinc-500 font-sans">мс</span>
        </div>

        {/* Real-time sparkline SVG */}
        <div className="h-10 w-full mt-3 opacity-60">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={makeSvgPath('latency', 30, 100)}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Metric 3: Diligence Ratio */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-500 font-medium">Проверки узлов (Индекс усердия)</span>
          <Percent className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-1.5 z-10">
          <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
            {Math.round(stats.diligenceIndex * 100)}%
          </span>
          <span className="text-xs text-zinc-500 font-sans">сеть проверяет</span>
        </div>

        {/* Real-time sparkline SVG */}
        <div className="h-10 w-full mt-3 opacity-60">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={makeSvgPath('diligence', 30, 100)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Metric 4: Security Heath Gauge */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-500 font-medium">Безопасность системы</span>
          {isSecure ? (
            <Shield className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>
        <div className="flex flex-col gap-1 mt-1 z-10">
          <span className={`text-xl font-bold tracking-tight font-mono ${isSecure ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`}>
            {isSecure ? 'НАДЕЖНО' : 'УГРОЗА ВЗЛОМА'}
          </span>
          <span className="text-[10px] text-zinc-500 font-sans">
            {isSecure ? 'Узлы мотивированы проверять' : 'Валидаторы ленятся'}
          </span>
        </div>

        {/* Budget stats */}
        <div className="mt-2 pt-2 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono">
          <div className="flex items-center gap-1 text-red-400">
            <Coins className="w-3 h-3 text-red-500" />
            <span>Срезано: {stats.totalTokensSlashed}</span>
          </div>
          <div className="text-emerald-400">
            <span>Награды: {stats.totalRewardsDistributed}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
