'use client';

import { useEffect, useState } from 'react';
import { T } from './tokens';
import { useReveal } from './useReveal';

// Animated system diagram: stages light up in sequence while pulses travel
// the data paths. The full loop: sensor → gateway → platform ⇄ payments,
// platform → agent → patrol → RTA fines → confirmation back to platform.

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  sub: string;
  color: string;
}

const NODES: Node[] = [
  { id: 'sensor', x: 20, y: 170, w: 128, label: 'Bay Sensor', sub: 'ToF · light-powered', color: T.green },
  { id: 'gateway', x: 188, y: 170, w: 128, label: 'Zone Gateway', sub: 'Thread mesh · 1/block', color: T.blue },
  { id: 'platform', x: 356, y: 158, w: 158, label: 'Enforce Platform', sub: 'Alibaba Cloud · Qwen', color: T.cyan },
  { id: 'payments', x: 356, y: 30, w: 158, label: 'Parkin / RTA Payments', sub: 'session lookup', color: T.blue },
  { id: 'agent', x: 566, y: 158, w: 140, label: 'Dispatch Agent', sub: 'Qwen-Max · voice', color: T.purple },
  { id: 'patrol', x: 758, y: 158, w: 128, label: 'ANPR Patrol', sub: 'plate confirmation', color: T.amber },
  { id: 'fines', x: 566, y: 300, w: 140, label: 'RTA Fine System', sub: 'existing · unchanged', color: T.red },
];

interface Edge {
  id: string;
  path: string;
  label?: string;
  labelPos?: [number, number];
  color: string;
}

const NODE_H = 58;

const EDGES: Edge[] = [
  { id: 'e-sg', path: 'M 148 199 H 188', color: T.green },
  { id: 'e-gp', path: 'M 316 199 H 356', color: T.green },
  { id: 'e-pp', path: 'M 435 158 V 88', label: 'paid?', labelPos: [449, 122], color: T.blue },
  { id: 'e-pa', path: 'M 514 187 H 566', label: 'violation', labelPos: [540, 176], color: T.red },
  { id: 'e-ap', path: 'M 706 187 H 758', label: 'route', labelPos: [732, 176], color: T.amber },
  { id: 'e-pf', path: 'M 822 216 V 329 H 706', label: 'fine issued', labelPos: [800, 280], color: T.red },
  { id: 'e-fp', path: 'M 566 329 H 435 V 216', label: 'confirmation ✓', labelPos: [470, 318], color: T.green },
];

const STAGES: { caption: string; nodes: string[]; edges: string[] }[] = [
  { caption: '1 · The bay sensor detects a parked car', nodes: ['sensor'], edges: [] },
  { caption: '2 · Status streams over the mesh to the platform', nodes: ['sensor', 'gateway', 'platform'], edges: ['e-sg', 'e-gp'] },
  { caption: '3 · The platform checks Parkin — no active session found', nodes: ['platform', 'payments'], edges: ['e-pp'] },
  { caption: '4 · Grace timer expires → violation flagged to the authority', nodes: ['platform', 'agent'], edges: ['e-pa'] },
  { caption: '5 · The agent routes the nearest patrol straight to the bay', nodes: ['agent', 'patrol'], edges: ['e-ap'] },
  { caption: '6 · ANPR confirms the plate — the existing RTA system issues the fine', nodes: ['patrol', 'fines'], edges: ['e-pf'] },
  { caption: '7 · Fine confirmation syncs back — the loop is closed', nodes: ['fines', 'platform'], edges: ['e-fp'] },
];

const STAGE_MS = 2600;

export default function SystemSchema() {
  const { ref, visible } = useReveal<HTMLElement>(0.3);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => setStage((s) => (s + 1) % STAGES.length), STAGE_MS);
    return () => clearInterval(iv);
  }, [visible]);

  const active = STAGES[stage];

  return (
    <section
      id="schema"
      ref={ref}
      className="py-28 px-6"
      style={{ backgroundColor: T.bg1, borderTop: `1px solid ${T.border}` }}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="text-center mb-12 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <div className="text-[13px] font-bold tracking-[0.25em] mb-3" style={{ color: T.blue }}>
            SYSTEM SCHEMA
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ color: T.text1 }}>
            One closed loop — <span style={{ color: T.blue }}>bay to fine and back</span>
          </h2>
        </div>

        <div
          className="rounded-3xl p-4 md:p-8 transition-all duration-700 delay-200"
          style={{
            backgroundColor: T.bg0,
            border: `1px solid ${T.border}`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <svg viewBox="0 0 906 390" className="w-full">
            <defs>
              <marker id="arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
                <path d="M 0 0 L 8 4 L 0 8 z" fill={T.text3} />
              </marker>
            </defs>

            {/* Edges */}
            {EDGES.map((e) => {
              const isActive = active.edges.includes(e.id);
              return (
                <g key={e.id}>
                  <path
                    d={e.path}
                    fill="none"
                    stroke={isActive ? e.color : '#cbd5e1'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    markerEnd="url(#arrow)"
                    strokeDasharray={isActive ? '7 5' : undefined}
                    style={{
                      transition: 'stroke 0.5s ease, stroke-width 0.5s ease',
                      animation: isActive ? 'schema-flow 0.7s linear infinite' : undefined,
                    }}
                  />
                  {e.label && (
                    <text
                      x={e.labelPos?.[0]}
                      y={e.labelPos?.[1]}
                      fontSize={11}
                      fontFamily="monospace"
                      fill={isActive ? e.color : T.text3}
                      textAnchor="middle"
                      style={{ transition: 'fill 0.5s ease' }}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              const isActive = active.nodes.includes(n.id);
              return (
                <g key={n.id} style={{ transition: 'opacity 0.5s ease' }} opacity={isActive ? 1 : 0.55}>
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={NODE_H}
                    rx={14}
                    fill={T.bg2}
                    stroke={isActive ? n.color : '#cbd5e1'}
                    strokeWidth={isActive ? 2 : 1}
                    style={{ transition: 'stroke 0.5s ease', filter: isActive ? `drop-shadow(0 0 10px ${n.color}55)` : undefined }}
                  />
                  <text x={n.x + n.w / 2} y={n.y + 25} fontSize={13.5} fontWeight={700} fill={T.text1} textAnchor="middle">
                    {n.label}
                  </text>
                  <text x={n.x + n.w / 2} y={n.y + 43} fontSize={10.5} fill={T.text3} textAnchor="middle" fontFamily="monospace">
                    {n.sub}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Stage captions */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="relative h-8 w-full max-w-[620px]">
              {STAGES.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center text-center text-[14px] md:text-[15px] font-semibold transition-opacity duration-500"
                  style={{ color: T.text1, opacity: i === stage ? 1 : 0 }}
                >
                  {s.caption}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {STAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStage(i)}
                  className="w-2.5 h-2.5 rounded-full transition-colors duration-300 cursor-pointer"
                  style={{ backgroundColor: i === stage ? T.cyan : T.bg3, border: `1px solid ${T.border}` }}
                  aria-label={`Stage ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes schema-flow { to { stroke-dashoffset: -12; } }
      `}</style>
    </section>
  );
}
