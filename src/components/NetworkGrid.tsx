import React, { useState, useEffect, useRef } from 'react';
import { ValidatorNode } from '../types';
import { Shield, ShieldAlert, Cpu, Award, Zap, AlertCircle, Ban, Globe, Orbit, RotateCcw } from 'lucide-react';

interface NetworkGridProps {
  nodes: ValidatorNode[];
  onSelectNode: (node: ValidatorNode) => void;
  selectedNodeId: string | null;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  node: ValidatorNode;
  id: string;
}

export const NetworkGrid: React.FC<NetworkGridProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId
}) => {
  const [viewportMode, setViewportMode] = useState<'2d' | '3d'>('3d');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Canvas and animation state
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 3D rotation state
  const rotationRef = useRef({ angleX: 0.1, angleY: 0.3 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const idleSpinRef = useRef(true);

  const producer = nodes.find(n => n.role === 'producer') || nodes[0];
  const validators = nodes.filter(n => n.role !== 'producer');

  // Track size changes of container
  const [dimensions, setDimensions] = useState({ width: 400, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main canvas rendering loop for the 3D Sphere projection
  useEffect(() => {
    if (viewportMode !== '3d' || !canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support high definition screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    
    // Position nodes on a 3D Fibonacci sphere
    const getSpherePoints = (): Point3D[] => {
      const activeNodes = nodes;
      const pointList: Point3D[] = [];
      const count = activeNodes.length;

      // Golden ratio placement
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians

      for (let i = 0; i < count; i++) {
        const node = activeNodes[i];
        if (node.role === 'producer') {
          // Central main node
          pointList.push({ x: 0, y: 0, z: 0, node, id: node.id });
          continue;
        }

        // Space out attesters around a sphere of radius R
        const index = i; // Node index for spacing
        const y = 1 - (index / (count - 1)) * 2; // y goes from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * index; // golden angle increment

        const radius = Math.min(dimensions.width, dimensions.height) * 0.32;
        const sphericalX = Math.cos(theta) * radiusAtY * radius;
        const sphericalZ = Math.sin(theta) * radiusAtY * radius;
        const sphericalY = y * radius;

        pointList.push({
          x: sphericalX,
          y: sphericalY,
          z: sphericalZ,
          node,
          id: node.id
        });
      }
      return pointList;
    };

    // Tracks transaction flow animation variables along the 3D grid
    const pulsePositions: { [nodeId: string]: number } = {};

    const render = () => {
      // Background idle spin rotation (if not user-dragging)
      if (idleSpinRef.current && !isDraggingRef.current) {
        rotationRef.current.angleY += 0.003;
        rotationRef.current.angleX = Math.sin(Date.now() * 0.0003) * 0.08; // subtle head wobble
      }

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const points = getSpherePoints();
      const rotatedPoints = points.map(pt => {
        const { x, y, z } = pt;
        const { angleX, angleY } = rotationRef.current;

        // Rotate around Y-axis
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Rotate around X-axis
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective mathematical projection parameters
        const fov = dimensions.width * 1.5;
        const scale = fov / (fov + z2 + 100);
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        return {
          ...pt,
          projX: centerX + x1 * scale,
          projY: centerY + y2 * scale,
          projZ: z2, // Save depth key for sorting
          scale
        };
      });

      // Z-Depth Sorting (render from back/deepest nodes to front/closest nodes)
      const sortedPoints = [...rotatedPoints].sort((a, b) => b.projZ - a.projZ);

      // Find central producer projected coordinates
      const prodPt = rotatedPoints.find(p => p.node.role === 'producer') || rotatedPoints[0];

      // Draw connections from central producer to validators first (back to front depending on deeper node Z)
      sortedPoints.forEach(pt => {
        if (pt.node.role === 'producer') return;

        // Connection line styling base
        let linkColor = 'rgba(63, 63, 70, 0.45)'; // Zinc-700 translucent
        let lineWidth = 1;
        let showPulseAnimation = false;

        const isVerifying = pt.node.lastAction === 'verifying';
        const isSigning = pt.node.lastAction === 'signing';
        const isSlashed = pt.node.isSlashed;
        const isSlashedActive = pt.node.lastAction === 'slashed';
        const isRewarded = pt.node.lastAction === 'rewarded';

        if (isSlashed) {
          linkColor = 'rgba(239, 68, 68, 0.15)'; // Red faint
        } else if (isVerifying) {
          linkColor = 'rgba(16, 185, 129, 0.5)'; // Emerald green glow
          lineWidth = 1.5;
          showPulseAnimation = true;
        } else if (isSigning) {
          linkColor = 'rgba(99, 102, 241, 0.5)'; // Indigo blue
          lineWidth = 1.2;
          showPulseAnimation = true;
        } else if (isSlashedActive) {
          linkColor = 'rgba(239, 68, 68, 0.8)'; // Red alert
          lineWidth = 2;
        } else if (isRewarded) {
          linkColor = 'rgba(245, 158, 11, 0.6)'; // Amber reward glow
          lineWidth = 1.5;
        }

        // Draw deep visual lines in 3D perspective space
        ctx.beginPath();
        ctx.moveTo(prodPt.projX, prodPt.projY);
        ctx.lineTo(pt.projX, pt.projY);
        ctx.strokeStyle = linkColor;
        ctx.lineWidth = lineWidth * pt.scale;
        ctx.stroke();

        // Animated particles flying down the node pipeline (Red Herring checks)
        if (showPulseAnimation && !isSlashed) {
          if (pulsePositions[pt.id] === undefined) {
            pulsePositions[pt.id] = Math.random();
          }
          pulsePositions[pt.id] += 0.015;
          if (pulsePositions[pt.id] > 1) {
            pulsePositions[pt.id] = 0;
          }

          const t = pulsePositions[pt.id];
          const pulseX = prodPt.projX + (pt.projX - prodPt.projX) * t;
          const pulseY = prodPt.projY + (pt.projY - prodPt.projY) * t;

          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3 * pt.scale, 0, 2 * Math.PI);
          ctx.fillStyle = isVerifying ? '#10b981' : '#6366f1';
          ctx.shadowBlur = 10;
          ctx.shadowColor = isVerifying ? '#10b981' : '#6366f1';
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // Draw the nodes icons / circles on top in 3D sorted projection
      sortedPoints.forEach(pt => {
        const isHovered = hoveredNodeId === pt.id;
        const isSelected = selectedNodeId === pt.id;
        const sizeRadius = (pt.node.role === 'producer' ? 14 : 9) * pt.scale * (isHovered || isSelected ? 1.25 : 1.0);

        // Define color states based on Node configuration
        let nodeBg = '#121214';
        let nodeStroke = '#3f3f46';
        let nodeGlowColor = '';

        const isSlashed = pt.node.isSlashed;
        const type = pt.node.type;

        if (isSlashed) {
          nodeBg = 'rgba(127, 29, 29, 0.3)';
          nodeStroke = '#ef4444';
          nodeGlowColor = 'rgba(239, 68, 68, 0.2)';
        } else if (pt.node.role === 'producer') {
          nodeBg = '#1e1b4b'; // dark violet
          nodeStroke = '#a855f7'; // purple
          nodeGlowColor = 'rgba(168, 85, 247, 0.5)';
        } else if (pt.node.lastAction === 'verifying') {
          nodeBg = '#064e3b'; // deep green
          nodeStroke = '#34d399'; // emerald
          nodeGlowColor = 'rgba(52, 211, 153, 0.4)';
        } else if (pt.node.lastAction === 'signing') {
          nodeBg = '#1e1b4b';
          nodeStroke = '#818cf8'; // indigo
          nodeGlowColor = 'rgba(129, 140, 248, 0.3)';
        } else if (pt.node.lastAction === 'rewarded') {
          nodeBg = '#451a03';
          nodeStroke = '#fbbf24'; // amber
          nodeGlowColor = 'rgba(251, 191, 36, 0.5)';
        } else {
          // Idle states by node type
          if (type === 'honest') {
            nodeBg = '#0d0d10';
            nodeStroke = '#059669'; // light emerald
          } else if (type === 'lazy') {
            nodeBg = '#0d0d10';
            nodeStroke = '#d97706'; // orange
          } else {
            nodeBg = '#0d0d10';
            nodeStroke = '#818cf8'; // indigo
          }
        }

        // Draw soft orbital glow aura around nodes
        if (nodeGlowColor) {
          ctx.beginPath();
          ctx.arc(pt.projX, pt.projY, sizeRadius * 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = nodeGlowColor;
          ctx.shadowBlur = 15;
          ctx.shadowColor = nodeStroke;
          ctx.fill();
          ctx.shadowBlur = 0; // reset glow
        }

        // Draw core node circle
        ctx.beginPath();
        ctx.arc(pt.projX, pt.projY, sizeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = nodeBg;
        ctx.strokeStyle = isSelected ? '#ffffff' : nodeStroke;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.fill();
        ctx.stroke();

        // Orbit circle indicator (lazy type gets small double ring)
        if (type === 'lazy' && !isSlashed) {
          ctx.beginPath();
          ctx.arc(pt.projX, pt.projY, sizeRadius + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Draw icon/label initials inside for immersive telemetry feel
        ctx.fillStyle = isSlashed ? '#f87171' : '#ffffff';
        ctx.font = `bold ${Math.round(8 * pt.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let initialLetter = 'A';
        if (pt.node.role === 'producer') initialLetter = 'CPU';
        else if (isSlashed) initialLetter = '☠';
        else if (type === 'honest') initialLetter = 'H';
        else if (type === 'lazy') initialLetter = 'L';
        else if (type === 'malicious') initialLetter = 'M';

        ctx.fillText(initialLetter, pt.projX, pt.projY);

        // Node ID tag floating label on hover or click
        if (isHovered || isSelected) {
          const textLabel = `${pt.node.name} (${pt.node.type === 'honest' ? 'Честный' : pt.node.type === 'lazy' ? 'Ленивый' : 'Враждебный'})`;
          ctx.font = '9px system-ui, sans-serif';
          const txtWidth = ctx.measureText(textLabel).width;
          
          ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
          ctx.strokeStyle = nodeStroke;
          ctx.lineWidth = 1;

          const rectW = txtWidth + 12;
          const rectH = 18;
          const rectX = pt.projX - rectW / 2;
          const rectY = pt.projY - sizeRadius - 24;

          // Draw speech bubble frame
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, rectW, rectH, 4);
          ctx.fill();
          ctx.stroke();

          // Write text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(textLabel, pt.projX, rectY + rectH / 2);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewportMode, nodes, dimensions, selectedNodeId, hoveredNodeId]);

  // Handle Dragging in 3D viewport
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    idleSpinRef.current = false;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Calculate rotating coordinates
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;

      rotationRef.current.angleY += deltaX * 0.007;
      rotationRef.current.angleX += deltaY * 0.007;

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }

    // 2. Performance-safe hover calculation in 3D projected list
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundHoveredId: string | null = null;
    const activeNodes = nodes;
    const count = activeNodes.length;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const node = activeNodes[i];
      let x = 0, y = 0, z = 0;

      if (node.role !== 'producer') {
        const index = i;
        const sphericalY = 1 - (index / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - sphericalY * sphericalY);
        const theta = phi * index;
        const radius = Math.min(dimensions.width, dimensions.height) * 0.32;
        
        x = Math.cos(theta) * radiusAtY * radius;
        z = Math.sin(theta) * radiusAtY * radius;
        y = sphericalY * radius;
      }

      const { angleX, angleY } = rotationRef.current;
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = dimensions.width * 1.5;
      const scale = fov / (fov + z2 + 100);
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      const projX = centerX + x1 * scale;
      const projY = centerY + y2 * scale;

      const dist = Math.hypot(mouseX - projX, mouseY - projY);
      if (dist < 15 * scale) {
        foundHoveredId = node.id;
        break;
      }
    }

    setHoveredNodeId(foundHoveredId);
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    // Return to gentle idle rotating after a 2.5sec cooldown
    setTimeout(() => {
      if (!isDraggingRef.current) {
        idleSpinRef.current = true;
      }
    }, 2500);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const activeNodes = nodes;
    const count = activeNodes.length;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const node = activeNodes[i];
      let x = 0, y = 0, z = 0;

      if (node.role !== 'producer') {
        const index = i;
        const sphericalY = 1 - (index / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - sphericalY * sphericalY);
        const theta = phi * index;
        const radius = Math.min(dimensions.width, dimensions.height) * 0.32;
        
        x = Math.cos(theta) * radiusAtY * radius;
        z = Math.sin(theta) * radiusAtY * radius;
        y = sphericalY * radius;
      }

      const { angleX, angleY } = rotationRef.current;
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = dimensions.width * 1.5;
      const scale = fov / (fov + z2 + 100);
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      const projX = centerX + x1 * scale;
      const projY = centerY + y2 * scale;

      const dist = Math.hypot(mouseX - projX, mouseY - projY);
      if (dist < 15 * scale) {
        onSelectNode(node);
        break;
      }
    }
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-[#0c0c0e] to-[#040405] border border-zinc-800/80 rounded-2xl overflow-hidden p-5 flex flex-col shadow-xl shadow-black/80 group" id="network-map-container">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-purple-500/10 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid background guide for 2D mode */}
      {viewportMode === '2d' && (
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0 z-15 relative">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Orbit className="w-4.5 h-4.5 text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
            <h2 className="text-sm font-extrabold text-zinc-100 font-sans uppercase tracking-tight flex items-center gap-2">
              Топология Системы Veritas L2
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </h2>
          </div>
          <p className="text-[10px] text-zinc-400 font-sans">
            Переключение проекционных осей для анализа сомнительного соглашательства верификаторов
          </p>
        </div>

        {/* 2D/3D Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/85 p-1 rounded-xl shadow-inner shrink-0 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setViewportMode('3d')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all flex items-center gap-1 cursor-pointer ${
              viewportMode === '3d'
                ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30 font-extrabold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> 3D Ноосфера
          </button>
          <button
            onClick={() => setViewportMode('2d')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all flex items-center gap-1 cursor-pointer ${
              viewportMode === '2d'
                ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> 2D Сеть
          </button>
        </div>
      </div>

      {/* Visual Workspace Viewport */}
      <div ref={containerRef} className="flex-1 min-h-[320px] relative z-10 rounded-xl" id="network-viewport">
        {viewportMode === '3d' ? (
          <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onClick={handleCanvasClick}
              className="absolute inset-0 w-full h-full block"
            />
            {/* Immersive Helper Legend overlay inside 3D canvas */}
            <div className="absolute bottom-2 left-2 text-[8.5px] font-mono text-zinc-500 bg-black/60 border border-zinc-800/30 p-1.5 rounded-lg backdrop-blur-md select-none pointer-events-none">
              🖱️ ТАЩИТЕ, чтобы вращать орбиты • КЛИК на узел для инспекции
            </div>
          </div>
        ) : (
          /* Classical SVG 2D Topology */
          <div className="w-full h-full relative" id="network-svg-viewport">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Connection Traces */}
              {validators.map(node => {
                if (node.isSlashed) return null;

                let strokeColor = 'rgba(63, 63, 70, 0.45)'; // default quiet grey
                let animated = false;

                if (node.lastAction === 'verifying') {
                  strokeColor = 'rgba(16, 185, 129, 0.55)'; // emerald
                  animated = true;
                } else if (node.lastAction === 'signing') {
                  strokeColor = 'rgba(99, 102, 241, 0.5)'; // indigo
                } else if (node.lastAction === 'slashed') {
                  strokeColor = 'rgba(239, 68, 68, 0.6)'; // red
                } else if (node.lastAction === 'rewarded') {
                  strokeColor = 'rgba(245, 158, 11, 0.55)'; // amber
                }

                return (
                  <g key={`link-2d-${node.id}`}>
                    <line
                      x1={producer.x}
                      y1={producer.y}
                      x2={node.x}
                      y2={node.y}
                      stroke={strokeColor}
                      strokeWidth="0.32"
                      className="transition-colors duration-300"
                    />
                    {animated && (
                      <circle r="0.5" fill="#10b981" className="animate-pulse">
                        <animateMotion
                          dur="1.2s"
                          repeatCount="indefinite"
                          path={`M ${producer.x} ${producer.y} L ${node.x} ${node.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Absolute positioning html nodes */}
            <div className="absolute inset-0">
              {nodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isProducer = node.role === 'producer';

                let bgClass = 'border-zinc-800 bg-[#121214]/90';
                let pulseColor = '';
                let borderStyle = 'border-zinc-800';

                if (node.isSlashed) {
                  bgClass = 'border-red-900 bg-red-950/20 opacity-70';
                  borderStyle = 'border-red-500';
                } else if (node.lastAction === 'verifying') {
                  bgClass = 'border-emerald-500 bg-[#064e3b]/80';
                  pulseColor = 'bg-emerald-500/20 ring-emerald-400';
                  borderStyle = 'border-emerald-400';
                } else if (node.lastAction === 'signing') {
                  bgClass = 'border-indigo-500 bg-[#1e1b4b]/80';
                  pulseColor = 'bg-indigo-500/20 ring-indigo-400';
                  borderStyle = 'border-indigo-400';
                } else if (node.lastAction === 'slashed') {
                  bgClass = 'border-red-500 bg-[#ef4444]/25';
                  pulseColor = 'bg-red-500/40 ring-red-400 animate-ping';
                  borderStyle = 'border-red-500';
                } else if (node.lastAction === 'rewarded') {
                  bgClass = 'border-amber-400 bg-[#451a03]/80';
                  pulseColor = 'bg-amber-500/20 ring-amber-300 animate-bounce';
                  borderStyle = 'border-amber-400';
                } else if (isSelected) {
                  bgClass = 'border-white bg-zinc-800/85';
                  borderStyle = 'border-white';
                }

                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className={`absolute w-8.5 h-8.5 -ml-[17px] -mt-[17px] rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-115 z-10 cursor-pointer ${bgClass} ${borderStyle} ${
                      isSelected ? 'ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20' : ''
                    }`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    title={`${node.name}`}
                  >
                    {!node.isSlashed && node.lastAction !== 'idle' && (
                      <span className={`absolute -inset-1.5 rounded-full ring-2 opacity-75 animate-ping duration-1000 ${pulseColor}`} />
                    )}

                    {isProducer ? (
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    ) : node.isSlashed ? (
                      <Ban className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    ) : node.type === 'honest' ? (
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    ) : node.type === 'lazy' ? (
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                    )}

                    {/* Small tag bullet right below */}
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 scale-90 whitespace-nowrap text-[8px] font-mono opacity-80 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 leading-none">
                      {node.name.replace('Validator ', '#')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-[10px] font-sans text-zinc-500 relative z-10 shrink-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 font-medium">Честный (H)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-400 font-medium">Рациональный / Ленивый (L)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-zinc-400 font-medium">Враждебный (M)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
            <span className="text-purple-400 font-mono tracking-wider font-bold">L1/L2 CPU PRODUCER</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-red-500 font-mono font-bold bg-red-950/15 px-2.5 py-1 rounded-md border border-red-900/30">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span className="uppercase tracking-wider">Глобальный Slashing активен</span>
        </div>
      </div>
    </div>
  );
};
