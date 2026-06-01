import React from 'react';
import { SimulatedBlock } from '../types';
import { Layers, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

interface ChainFlowProps {
  blocks: SimulatedBlock[];
}

export const ChainFlow: React.FC<ChainFlowProps> = ({ blocks }) => {
  // Take last 12 blocks and render them chronologically (older left, newer right, or vice versa)
  const displayBlocks = [...blocks].slice(-8).reverse();

  return (
    <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col" id="chain-timeline-panel">
      {/* Timeline Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Layers className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-zinc-100 font-sans tracking-tight">
          Поток транков / Живая цепочка блоков
        </h2>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 ml-auto">
          Блоков в памяти: {blocks.length}
        </span>
      </div>

      {/* Blocks Grid/Horizontal Stream */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none custom-scrollbar" id="blocks-timeline-container">
        {displayBlocks.length === 0 ? (
          <div className="w-full py-10 flex flex-col items-center justify-center border border-dashed border-zinc-950 rounded-lg text-zinc-600 text-xs text-center font-mono">
            Ожидание производства блоков...
          </div>
        ) : (
          displayBlocks.map((block, index) => {
            // Pick styles based on block type and consensus outcome
            let headerBg = 'bg-zinc-950 border-zinc-800';
            let titleColor = 'text-zinc-500';
            let statusText = '';
            let statusIcon = <HelpCircle className="w-3.5 h-3.5" />;
            let titlePrefix = 'BLOCK';

            if (block.type === 'puzzle') {
              titlePrefix = 'PUZZLE (RED)';
              if (block.status === 'rejected') {
                headerBg = 'bg-amber-950/20 border-amber-600/50';
                titleColor = 'text-amber-500';
                statusText = 'Ловушка сработала (Успех)';
                statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
              } else {
                headerBg = 'bg-red-950/70 border-red-500';
                titleColor = 'text-red-500 animate-pulse';
                statusText = 'Пропущен валидаторами';
                statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
              }
            } else if (block.type === 'malicious_attack') {
              titlePrefix = 'ATTACK';
              if (block.status === 'rejected') {
                headerBg = 'bg-rose-950/30 border-rose-600';
                titleColor = 'text-rose-500';
                statusText = 'Атака отбита';
                statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
              } else {
                headerBg = 'bg-red-950 border-red-500 ring-2 ring-red-500/20 animate-bounce';
                titleColor = 'text-red-600 font-extrabold';
                statusText = 'Успешный double spend (Провал)';
                statusIcon = <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
              }
            } else {
              // Valid
              headerBg = 'bg-[#121214] border-zinc-900';
              titleColor = 'text-zinc-400';
              if (block.status === 'finalized') {
                statusText = 'Завершен';
                statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
              } else {
                statusText = 'Проверка';
                statusIcon = <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-emerald-500 animate-spin" />;
              }
            }

            return (
              <div
                key={`${block.height}-${block.hash}`}
                className={`min-w-[195px] w-[195px] rounded-lg border p-3 flex flex-col justify-between select-none relative transition-all duration-300 ${
                  index === 0 ? 'ring-2 ring-purple-500/30 ring-offset-1 ring-offset-[#09090b]' : ''
                } ${headerBg}`}
              >
                {/* Visual Connector Line for stream linking */}
                {index !== displayBlocks.length - 1 && (
                  <div className="absolute top-[40%] -right-3 w-3 h-[1px] bg-zinc-800" />
                )}

                {/* Block Header ID */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {titlePrefix} #{block.height}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {block.finalityTimeMs}ms
                  </span>
                </div>

                {/* Block Hash & Info */}
                <span className="text-xs font-mono font-bold text-zinc-100 truncate mb-1.5" title={block.hash}>
                  {block.hash}
                </span>

                {/* Transactions size pill */}
                <div className="flex items-center justify-between text-[11px] font-sans text-zinc-400 mb-2">
                  <span className="bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800/80 font-mono">
                    Транзакций: {block.txCount}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span className="text-zinc-500">Подписи:</span>
                    <span className={block.votesReceived >= block.votesNeeded ? "text-emerald-400" : "text-zinc-400"}>
                      {block.votesReceived}/{block.votesNeeded}
                    </span>
                  </div>
                </div>

                {/* Slashed report inline */}
                {block.slashedNodes.length > 0 && (
                  <div className="mt-1 bg-red-950/20 text-red-400 border border-red-900/30 rounded px-1.5 py-0.5 text-[9px] font-mono mb-2 truncate">
                    Срезано узлов: {block.slashedNodes.length}
                  </div>
                )}

                {/* Status Bar */}
                <div className="flex items-center gap-1.5 border-t border-zinc-900/40 pt-2 text-[10px] font-sans font-medium text-zinc-400">
                  {statusIcon}
                  <span className={`truncate ${titleColor}`}>{statusText}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
