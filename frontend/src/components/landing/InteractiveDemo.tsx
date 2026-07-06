'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useScrollReveal } from './useScrollReveal';

type SpotState = 'free' | 'occupied' | 'reserved';

interface SpotData {
  id: string;
  zone: string;
  status: SpotState;
}

const ZONES = [
  { id: 'a', label: 'Zone A — Near Entrance', prefix: 'A' },
  { id: 'b', label: 'Zone B — Central', prefix: 'B' },
  { id: 'c', label: 'Zone C — Near Elevators', prefix: 'C' },
];

function initSpots(): SpotData[] {
  const spots: SpotData[] = [];
  ZONES.forEach((zone) => {
    for (let row = 1; row <= 2; row++) {
      for (let col = 1; col <= 8; col++) {
        const id = `${zone.prefix}${row}${String(col).padStart(2, '0')}`;
        const rand = Math.random();
        const status: SpotState = rand < 0.35 ? 'free' : rand < 0.92 ? 'occupied' : 'reserved';
        spots.push({ id, zone: zone.id, status });
      }
    }
  });
  return spots;
}

export default function InteractiveDemo() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const [spots, setSpots] = useState<SpotData[]>(() => initSpots());
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [changingIds, setChangingIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const simulateTick = useCallback(() => {
    setSpots((prev) => {
      const next = [...prev];
      const numChanges = Math.ceil(Math.random() * 3 * speed);
      const changed: string[] = [];
      for (let i = 0; i < numChanges; i++) {
        const idx = Math.floor(Math.random() * next.length);
        const spot = { ...next[idx] };
        if (spot.status === 'occupied' && Math.random() < 0.3) spot.status = 'free';
        else if (spot.status === 'free' && Math.random() < 0.25) spot.status = 'occupied';
        else if (spot.status === 'reserved' && Math.random() < 0.15) spot.status = 'occupied';
        next[idx] = spot;
        changed.push(spot.id);
      }
      setChangingIds(new Set(changed));
      setTimeout(() => setChangingIds(new Set()), 500);
      return next;
    });
  }, [speed]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(simulateTick, 1500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, simulateTick]);

  const toggleSpot = (id: string) => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus: SpotState = s.status === 'free' ? 'reserved' : s.status === 'reserved' ? 'occupied' : 'free';
        return { ...s, status: nextStatus };
      })
    );
    setChangingIds(new Set([id]));
    setTimeout(() => setChangingIds(new Set()), 500);
  };

  // Metrics
  const total = spots.length;
  const free = spots.filter((s) => s.status === 'free').length;
  const occupied = spots.filter((s) => s.status === 'occupied').length;
  const reserved = spots.filter((s) => s.status === 'reserved').length;
  const occPct = Math.round(((occupied + reserved) / total) * 100);

  const nearestFree = spots.find((s) => s.status === 'free');
  const nearestId = nearestFree?.id ?? 'Full';
  const nearestDist = nearestFree ? `~${12 + Math.floor(Math.random() * 30)}m from entrance` : 'Try Zone B or Level P3';

  const zoneStats = ZONES.map((z) => {
    const zoneSpots = spots.filter((s) => s.zone === z.id);
    const zoneFree = zoneSpots.filter((s) => s.status === 'free').length;
    return { ...z, free: zoneFree, total: zoneSpots.length };
  });

  const occColor = occPct > 85 ? 'text-sp-red' : occPct > 60 ? 'text-sp-amber' : 'text-sp-cyan';
  const barColor = occPct > 85 ? 'bg-sp-red' : occPct > 60 ? 'bg-sp-amber' : 'bg-sp-cyan';

  return (
    <section ref={sectionRef} id="demo" className="py-[120px] px-8 max-w-7xl mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-sp-cyan uppercase tracking-[2px] mb-4">
        <span className="w-6 h-px bg-sp-cyan" />
        Interactive Demo
      </span>
      <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
        Live Parking Intelligence
      </h2>
      <p className="text-base text-sp-text-2 max-w-[600px] leading-relaxed">
        Watch simulated IoT sensors update in real time. Click any green spot to reserve it. The AI agent monitors patterns and guides drivers.
      </p>

      <div className="mt-12 bg-sp-bg-2 border border-white/[0.08] rounded-[20px] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-sp-bg-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sp-red" />
              <span className="w-2.5 h-2.5 rounded-full bg-sp-amber" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-[13px] font-semibold text-sp-text-2 ml-2 hidden sm:inline">
              SmartPark Control Center — Dubai Mall Level P2
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sp-cyan uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-sp-cyan animate-pulse-glow" />
              LIVE
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSpeed(1)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-all ${
                  speed === 1
                    ? 'bg-sp-cyan/15 text-sp-cyan border-sp-cyan/30'
                    : 'bg-sp-bg-2 text-sp-text-2 border-white/[0.08] hover:border-sp-cyan hover:text-sp-cyan'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setSpeed(3)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-all ${
                  speed === 3
                    ? 'bg-sp-cyan/15 text-sp-cyan border-sp-cyan/30'
                    : 'bg-sp-bg-2 text-sp-text-2 border-white/[0.08] hover:border-sp-cyan hover:text-sp-cyan'
                }`}
              >
                3x
              </button>
              <button
                onClick={() => setRunning((r) => !r)}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-sp-bg-2 text-sp-text-2 border border-white/[0.08] hover:border-sp-cyan hover:text-sp-cyan cursor-pointer transition-all"
              >
                {running ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[520px]">
          {/* Map area */}
          <div className="p-8 flex flex-col">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
              <div>
                <div className="text-[15px] font-bold">Level P2 — Dubai Mall</div>
                <div className="text-xs text-sp-text-3 mt-0.5">48 spots &middot; 3 zones &middot; Real-time sensor feed</div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-sp-text-3 font-medium">
                  <div className="w-2.5 h-2.5 rounded-sm bg-sp-cyan" /> Available
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-sp-text-3 font-medium">
                  <div className="w-2.5 h-2.5 rounded-sm bg-sp-red" /> Occupied
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-sp-text-3 font-medium">
                  <div className="w-2.5 h-2.5 rounded-sm bg-sp-amber" /> Reserved
                </div>
              </div>
            </div>

            {ZONES.map((zone, zi) => {
              const zoneSpots = spots.filter((s) => s.zone === zone.id);
              const row1 = zoneSpots.slice(0, 8);
              const row2 = zoneSpots.slice(8, 16);
              return (
                <div key={zone.id}>
                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-sp-text-3 uppercase tracking-[1.5px] mb-2 pl-1">
                      {zone.label}
                    </div>
                    {[row1, row2].map((row, ri) => (
                      <div key={ri} className="flex gap-1.5 mb-1.5">
                        {row.map((spot) => (
                          <button
                            key={spot.id}
                            onClick={() => toggleSpot(spot.id)}
                            className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center text-[9px] font-semibold font-mono cursor-pointer transition-all relative border-[1.5px] ${
                              spot.status === 'free'
                                ? 'bg-sp-cyan/[0.08] border-sp-cyan/25 text-sp-cyan hover:bg-sp-cyan/[0.18] hover:border-sp-cyan hover:scale-[1.08] hover:shadow-[0_0_16px_rgba(0,229,160,0.2)]'
                                : spot.status === 'occupied'
                                ? 'bg-sp-red/[0.06] border-sp-red/15 text-sp-red/50 hover:scale-105'
                                : 'bg-sp-amber/[0.06] border-sp-amber/15 text-sp-amber/50'
                            } ${changingIds.has(spot.id) ? 'animate-[spot-change_0.5s_ease]' : ''}`}
                          >
                            {spot.status === 'free' && (
                              <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-sp-cyan animate-pulse-glow" />
                            )}
                            <span className="text-base leading-none">
                              {spot.status === 'free' ? '◇' : spot.status === 'occupied' ? '◆' : '★'}
                            </span>
                            <span className="text-[8px] opacity-60 mt-0.5">{spot.id}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  {zi < ZONES.length - 1 && (
                    <div className="h-5 my-2 rounded bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_20px,rgba(148,163,184,0.08)_20px,rgba(148,163,184,0.08)_22px)] relative">
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-sp-text-3 opacity-40">
                        &rarr;
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="border-t lg:border-t-0 lg:border-l border-white/[0.08] p-6 flex flex-col gap-5 bg-sp-bg-1/50">
            {/* Occupancy */}
            <div className="bg-sp-bg-3 border border-white/[0.08] rounded-[10px] p-4">
              <div className="text-[11px] text-sp-text-3 font-semibold uppercase tracking-[0.5px]">Overall Occupancy</div>
              <div className={`text-[32px] font-extrabold font-mono mt-1 leading-none ${occColor}`}>{occPct}%</div>
              <div className="h-1 rounded-sm bg-sp-bg-2 mt-2.5 overflow-hidden">
                <div className={`h-full rounded-sm transition-all duration-700 ${barColor}`} style={{ width: `${occPct}%` }} />
              </div>
              <div className="text-[11px] text-sp-text-3 mt-1.5">
                {free} free &middot; {occupied} occupied &middot; {reserved} reserved
              </div>
            </div>

            {/* Nearest Free */}
            <div className="bg-sp-bg-3 border border-white/[0.08] rounded-[10px] p-4">
              <div className="text-[11px] text-sp-text-3 font-semibold uppercase tracking-[0.5px]">Nearest Free Spot</div>
              <div className="text-[32px] font-extrabold font-mono mt-1 leading-none text-sp-blue">{nearestId}</div>
              <div className="text-[11px] text-sp-text-3 mt-1.5">{nearestDist}</div>
            </div>

            {/* Zone Availability */}
            <div className="bg-sp-bg-3 border border-white/[0.08] rounded-[10px] p-4">
              <div className="text-[11px] text-sp-text-3 font-semibold uppercase tracking-[0.5px] mb-2">Zone Availability</div>
              <div className="flex flex-col gap-2">
                {zoneStats.map((z) => {
                  const color = z.free > 8 ? 'text-sp-cyan' : z.free > 3 ? 'text-sp-amber' : 'text-sp-red';
                  return (
                    <div
                      key={z.id}
                      className="flex justify-between items-center px-3.5 py-2.5 rounded-md bg-sp-bg-3 border border-white/[0.08] text-[13px] hover:border-white/15 transition-all"
                    >
                      <span className="font-semibold">{z.prefix}</span>
                      <span className={`font-mono font-bold text-sm ${color}`}>
                        {z.free}/{z.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sensor Network */}
            <div className="bg-sp-bg-3 border border-white/[0.08] rounded-[10px] p-4">
              <div className="text-[11px] text-sp-text-3 font-semibold uppercase tracking-[0.5px]">Sensor Network</div>
              <div className="text-xl font-extrabold font-mono mt-1 leading-none text-sp-cyan">48/48 Online</div>
              <div className="text-[11px] text-sp-text-3 mt-1.5">Avg signal: 98.2% &middot; Last sync: just now</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
