import React, { useState } from 'react';
import { ValidatorNode } from '../types';
import { Shield, ShieldAlert, Cpu, Award, Zap, AlertCircle, Ban } from 'lucide-react';

interface NetworkGridProps {
  nodes: ValidatorNode[];
  onSelectNode: (node: ValidatorNode) => void;
  selectedNodeId: string | null;
}

export const NetworkGrid: React.FC<NetworkGridProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId
}) => {
  const producer = nodes.find(n => n.role === 'producer') || nodes[0];
  const validators = nodes.filter(n => n.role !== 'producer');

  return (
    <div className="w-full h-full relative bg-[#09090b] border border-zinc-900 rounded-xl overflow-hidden p-4 flex flex-col" id="network-map-container">
      {/* Visual background guide */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-zinc-100 font-sans tracking-tight">
            Карта сети валидаторов Symbiosis Network (SYM)
          </h2>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          Узлов: {nodes.length}
        </span>
      </div>

      {/* Interactive Web Map Area */}
      <div className="flex-1 min-h-[300px] relative z-10" id="network-svg-viewport">
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Connection Traces */}
          {validators.map(node => {
            if (node.isSlashed) return null;

            // Connection states based on validator action
            let strokeColor = 'rgba(39, 39, 42, 0.4)'; // Default zinc-500
            let animated = false;

            if (node.lastAction === 'verifying') {
              strokeColor = 'rgba(52, 211, 153, 0.5)'; // emerald
              animated = true;
            } else if (node.lastAction === 'signing') {
              strokeColor = 'rgba(59, 130, 246, 0.4)'; // blue
            } else if (node.lastAction === 'slashed') {
              strokeColor = 'rgba(239, 68, 68, 0.5)'; // red
            } else if (node.lastAction === 'rewarded') {
              strokeColor = 'rgba(245, 158, 11, 0.5)'; // amber
            }

            return (
              <g key={`link-${node.id}`}>
                <line
                  x1={producer.x}
                  y1={producer.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={strokeColor}
                  strokeWidth="0.3"
                  className="transition-colors duration-300"
                />
                {animated && (
                  <circle
                    r="0.5"
                    fill="#10b981"
                    className="animate-pulse"
                  >
                    <animateMotion
                      dur="0.8s"
                      repeatCount="indefinite"
                      path={`M ${producer.x} ${producer.y} L ${node.x} ${node.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes layer (HTML overlays for better rendering styling & handlers) */}
        <div className="absolute inset-0 pin-pointer">
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isProducer = node.role === 'producer';

            // Determine custom classes based on type/action
            let nodeBorderClass = 'border-zinc-800 bg-[#121214]/90';
            let pulseColor = '';
            let ringColor = 'border-transparent';

            if (node.isSlashed) {
              nodeBorderClass = 'border-red-900 bg-red-950/40 opacity-70';
              ringColor = 'ring-2 ring-red-500/30';
            } else if (node.lastAction === 'verifying') {
              nodeBorderClass = 'border-emerald-600 bg-emerald-950/20';
              pulseColor = 'bg-emerald-500/20 ring-emerald-400';
            } else if (node.lastAction === 'signing') {
              nodeBorderClass = 'border-blue-700 bg-blue-950/10';
              pulseColor = 'bg-blue-500/15 ring-blue-400';
            } else if (node.lastAction === 'slashed') {
              nodeBorderClass = 'border-red-500 bg-red-900/40 text-red-100';
              pulseColor = 'bg-red-500/40 ring-red-500 animate-ping';
            } else if (node.lastAction === 'rewarded') {
              nodeBorderClass = 'border-amber-500 bg-amber-950/35';
              pulseColor = 'bg-amber-500/30 ring-amber-400 animate-bounce';
            } else if (isSelected) {
              nodeBorderClass = 'border-zinc-300 bg-zinc-800/40';
            }

            // Node badges and labels
            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`absolute w-9 h-9 -ml-4.5 -mt-4.5 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-110 z-10 cursor-pointer ${nodeBorderClass} ${ringColor}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                title={`${node.name} (${node.type})`}
              >
                {/* Real-time pulse ping indicator */}
                {!node.isSlashed && node.lastAction !== 'idle' && (
                  <span className={`absolute -inset-1.5 rounded-full ring-2 opacity-75 animate-ping duration-1000 ${pulseColor}`} />
                )}

                {/* Main Node Graphic */}
                {isProducer ? (
                  <Cpu className="w-4 h-4 text-purple-400" />
                ) : node.isSlashed ? (
                  <Ban className="w-4 h-4 text-red-500" />
                ) : node.type === 'honest' ? (
                  <Shield className="w-4 h-4 text-emerald-400" />
                ) : node.type === 'lazy' ? (
                  <Award className="w-4 h-4 text-amber-500" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                )}

                {/* Mini Profile Indicator */}
                <div className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      node.isSlashed
                        ? 'bg-red-500'
                        : node.type === 'honest'
                        ? 'bg-emerald-500'
                        : node.type === 'lazy'
                        ? 'bg-amber-500'
                        : 'bg-indigo-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Map */}
      <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[11px] font-sans text-zinc-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/25 border border-emerald-500 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
            </span>
            <span>Честный (Проверяет)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/25 border border-amber-500 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
            </span>
            <span>Рациональный (Ленивый)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/25 border border-indigo-500 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-indigo-500" />
            </span>
            <span>Враждебный (Атака)</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Slashing</span>
        </div>
      </div>
    </div>
  );
};
