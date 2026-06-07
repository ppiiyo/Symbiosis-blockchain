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
      <div className="bg-gradient-to-b from-[#121215] to-[#09090b] hover:from-[#16161a] hover:to-[#0b0b0e] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] group h-[145px]">
        {/* Subtle decorative mesh light glow on top right */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-400 font-medium">Текущая пропускная способность</span>
          <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-1.5 z-10">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {stats.realtimeTPS.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">TPS</span>
        </div>
        
        {/* Real-time sparkline SVG */}
        <div className="h-10 w-full mt-2 opacity-70">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={makeSvgPath('tps', 30, 100)}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Metric 2: Latency */}
      <div className="bg-gradient-to-b from-[#121215] to-[#09090b] hover:from-[#16161a] hover:to-[#0b0b0e] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] group h-[145px]">
        {/* Subtle decorative mesh light glow on top right */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 rounded-full bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-all duration-500 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-400 font-medium">Время финализации</span>
          <Clock className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-1.5 z-10">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {stats.avgFinalityTimeMs.toFixed(0)}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">мс</span>
        </div>

        {/* Real-time sparkline SVG */}
        <div className="h-10 w-full mt-2 opacity-70">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={makeSvgPath('latency', 30, 100)}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Metric 3: Diligence Ratio */}
      <div className="bg-gradient-to-b from-[#121215] to-[#09090b] hover:from-[#16161a] hover:to-[#0b0b0e] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] group h-[145px]">
        {/* Subtle decorative mesh light glow on top right */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-all duration-500 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-400 font-medium">Аудит-активность (Diligence)</span>
          <Percent className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-1.5 z-10">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {Math.round(stats.diligenceIndex * 100)}%
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">усердие</span>
        </div>

        {/* Real-time sparkline SVG */}
        <div className="h-10 w-full mt-2 opacity-70">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={makeSvgPath('diligence', 30, 100)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Metric 4: Security Heath Gauge */}
      <div className="bg-gradient-to-b from-[#121215] to-[#09090b] hover:from-[#16161a] hover:to-[#0b0b0e] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] group h-[145px]">
        {/* Subtle decorative mesh light glow on top right */}
        <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 rounded-full blur-xl group-hover:opacity-100 opacity-60 transition-all duration-500 pointer-events-none ${isSecure ? 'bg-emerald-500/10' : 'bg-red-500/20 animate-pulse'}`} />
        
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-sans text-zinc-400 font-medium">Состояние безопасности</span>
          {isSecure ? (
            <Shield className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 mt-1 z-10">
          <span className={`text-2xl font-extrabold tracking-tight font-mono ${isSecure ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`}>
            {isSecure ? 'SECURE_AAA' : 'RISK_DETECTED'}
          </span>
          <span className="text-[10px] text-zinc-400 font-sans tracking-wide">
            {isSecure ? 'Равновесие Нэша стабильно' : 'Валидаторы под угрозой лени'}
          </span>
        </div>

        {/* Budget stats */}
        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex justify-between items-center text-[9px] font-mono tracking-wider">
          <div className="flex items-center gap-1 text-red-400 font-semibold uppercase">
            <Coins className="w-3 h-3 text-red-500" />
            <span>Срезано: {stats.totalTokensSlashed} SYM</span>
          </div>
          <div className="text-emerald-400 font-semibold uppercase">
            <span>Эмиссия: {stats.totalRewardsDistributed} SYM</span>
          </div>
        </div>
      </div>

    </div>
  );
};

