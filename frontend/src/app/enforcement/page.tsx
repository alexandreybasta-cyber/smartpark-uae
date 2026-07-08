'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import EnforcementHeader from '@/components/enforcement/EnforcementHeader';
import StatsBar from '@/components/enforcement/StatsBar';
import SpotGrid, { SpotData, SpotStatus } from '@/components/enforcement/SpotGrid';
import ViolationList, { Violation } from '@/components/enforcement/ViolationList';
import ViolationDetail from '@/components/enforcement/ViolationDetail';
import ZoneSummary from '@/components/enforcement/ZoneSummary';
import EnforcementTimeline, { TimelineEvent } from '@/components/enforcement/EnforcementTimeline';

// --- Seed data ---
const ZONE_CONFIG = [
  { id: '312', count: 18 },
  { id: '314', count: 24 },
  { id: '315', count: 16 },
];

function randomStatus(): SpotStatus {
  const r = Math.random();
  if (r < 0.15) return 'empty';
  if (r < 0.80) return 'paid';
  if (r < 0.90) return 'violation';
  if (r < 0.97) return 'grace';
  return 'offline';
}

function initSpots(): SpotData[] {
  const spots: SpotData[] = [];
  for (const zone of ZONE_CONFIG) {
    for (let i = 1; i <= zone.count; i++) {
      const status = randomStatus();
      spots.push({
        id: `${zone.id}-${String(i).padStart(2, '0')}`,
        zone: zone.id,
        index: i,
        status,
        occupiedSince: status !== 'empty' ? Date.now() - Math.random() * 3600000 : undefined,
      });
    }
  }
  return spots;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getTimeNow(): string {
  return formatTime(Date.now());
}

function initViolations(spots: SpotData[]): Violation[] {
  return spots
    .filter((s) => s.status === 'violation' || s.status === 'grace')
    .map((s) => ({
      id: s.id,
      spotId: s.id,
      zone: s.zone,
      timeParked: s.occupiedSince ? formatTime(s.occupiedSince) : getTimeNow(),
      durationUnpaid: s.occupiedSince ? Math.round((Date.now() - s.occupiedSince) / 60000) : 5,
      status: s.status === 'violation' ? ('active' as const) : ('grace' as const),
    }));
}

function initEvents(spots: SpotData[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const violations = spots.filter((s) => s.status === 'violation');
  const paid = spots.filter((s) => s.status === 'paid').slice(0, 3);

  violations.slice(0, 3).forEach((s) => {
    events.push({
      id: `ev-${s.id}-occ`,
      time: s.occupiedSince ? formatTime(s.occupiedSince) : getTimeNow(),
      message: `Spot ${s.id} occupied, no payment detected`,
      type: 'warning',
    });
    events.push({
      id: `ev-${s.id}-vio`,
      time: s.occupiedSince ? formatTime(s.occupiedSince + 300000) : getTimeNow(),
      message: `Violation flagged: Spot ${s.id} — grace period expired`,
      type: 'violation',
    });
  });

  paid.forEach((s) => {
    events.push({
      id: `ev-${s.id}-paid`,
      time: formatTime(Date.now() - Math.random() * 1800000),
      message: `Spot ${s.id} payment confirmed via the parking app`,
      type: 'resolved',
    });
  });

  return events.sort(() => Math.random() - 0.5).slice(0, 8);
}

export default function EnforcementPage() {
  const [spots, setSpots] = useState<SpotData[]>(() => initSpots());
  const [violations, setViolations] = useState<Violation[]>(() => initViolations(spots));
  const [events, setEvents] = useState<TimelineEvent[]>(() => initEvents(spots));
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const tickRef = useRef(0);

  // Simulation tick: every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;

      setSpots((prev) => {
        const next = [...prev];
        const actionType = Math.random();

        if (actionType < 0.5) {
          // Create new violation from a paid spot
          const paidSpots = next.filter((s) => s.status === 'paid');
          if (paidSpots.length > 0) {
            const target = paidSpots[Math.floor(Math.random() * paidSpots.length)];
            const idx = next.findIndex((s) => s.id === target.id);
            next[idx] = { ...target, status: 'grace', occupiedSince: Date.now() - 180000 };

            setEvents((evts) => [{
              id: `ev-${Date.now()}-grace`,
              time: getTimeNow(),
              message: `Spot ${target.id} occupied, checking payment status...`,
              type: 'warning' as const,
            }, ...evts].slice(0, 30));

            // After a brief period, escalate to violation
            setTimeout(() => {
              setSpots((curr) => {
                const updated = [...curr];
                const i = updated.findIndex((s) => s.id === target.id);
                if (i >= 0 && updated[i].status === 'grace') {
                  updated[i] = { ...updated[i], status: 'violation' };

                  setViolations((vl) => [{
                    id: target.id,
                    spotId: target.id,
                    zone: target.zone,
                    timeParked: formatTime(Date.now() - 480000),
                    durationUnpaid: 8,
                    status: 'active' as const,
                  }, ...vl.filter((v) => v.id !== target.id)]);

                  setEvents((evts) => [{
                    id: `ev-${Date.now()}-vio`,
                    time: getTimeNow(),
                    message: `Violation flagged: Spot ${target.id} — no payment after grace period`,
                    type: 'violation' as const,
                  }, ...evts].slice(0, 30));
                }
                return updated;
              });
            }, 8000);
          }
        } else {
          // Resolve a violation
          const violationSpots = next.filter((s) => s.status === 'violation');
          if (violationSpots.length > 0) {
            const target = violationSpots[Math.floor(Math.random() * violationSpots.length)];
            const idx = next.findIndex((s) => s.id === target.id);
            next[idx] = { ...target, status: 'paid', occupiedSince: Date.now() };

            setViolations((vl) =>
              vl.map((v) => v.id === target.id ? { ...v, status: 'resolved' as const } : v)
            );

            setEvents((evts) => ([{
              id: `ev-${Date.now()}-res`,
              time: getTimeNow(),
              message: `Spot ${target.id} payment confirmed via the parking app — violation resolved`,
              type: 'resolved' as const,
            }, ...evts] satisfies TimelineEvent[]).slice(0, 30));
          }
        }

        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Increase duration for active violations every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setViolations((prev) =>
        prev.map((v) =>
          v.status === 'active' ? { ...v, durationUnpaid: v.durationUnpaid + 1 } : v
        )
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = useCallback((id: string, action: 'fine' | 'dismiss' | 'warn') => {
    if (action === 'fine') {
      setViolations((prev) => prev.map((v) => v.id === id ? { ...v, status: 'resolved' as const } : v));
      setSpots((prev) => prev.map((s) => s.id === id ? { ...s, status: 'empty' as SpotStatus } : s));
      setEvents((evts) => ([{
        id: `ev-${Date.now()}-fine`,
        time: getTimeNow(),
        message: `Fine issued (AED 150) for Spot ${id}`,
        type: 'violation' as const,
      }, ...evts] satisfies TimelineEvent[]).slice(0, 30));
    } else if (action === 'dismiss' || action === 'warn') {
      setViolations((prev) => prev.map((v) => v.id === id ? { ...v, status: 'resolved' as const } : v));
      setSpots((prev) => prev.map((s) => s.id === id ? { ...s, status: 'paid' as SpotStatus } : s));
      setEvents((evts) => ([{
        id: `ev-${Date.now()}-dismiss`,
        time: getTimeNow(),
        message: action === 'warn' ? `Warning sent for Spot ${id}` : `Violation dismissed for Spot ${id}`,
        type: 'info' as const,
      }, ...evts] satisfies TimelineEvent[]).slice(0, 30));
    }
    setSelectedViolation(null);
  }, []);

  const handleSpotClick = useCallback((spot: SpotData) => {
    const v = violations.find((vl) => vl.id === spot.id);
    if (v) setSelectedViolation(v);
  }, [violations]);

  // Compute stats
  const violationsToday = violations.filter((v) => v.status === 'active').length;
  const revenueProtected = violations.filter((v) => v.status === 'resolved').length * 150 + violationsToday * 150;
  const totalOccupied = spots.filter((s) => s.status !== 'empty' && s.status !== 'offline').length;
  const complianceRate = totalOccupied > 0 ? ((totalOccupied - violationsToday) / totalOccupied) * 100 : 100;

  // Zone summary
  const zoneSummary = ZONE_CONFIG.map((z) => {
    const zoneSpots = spots.filter((s) => s.zone === z.id);
    const zoneViolations = zoneSpots.filter((s) => s.status === 'violation').length;
    return {
      id: z.id,
      violations: zoneViolations,
      compliant: z.count - zoneViolations,
      total: z.count,
    };
  });

  return (
    <div className="min-h-screen bg-sp-bg-0">
      <EnforcementHeader />
      <StatsBar
        violationsToday={violationsToday}
        revenueProtected={revenueProtected}
        complianceRate={complianceRate}
        activeSpots={58}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-8 max-w-7xl mx-auto">
        <div className="lg:col-span-2">
          <SpotGrid spots={spots} onSpotClick={handleSpotClick} />
          <ViolationList
            violations={violations}
            onSelectViolation={setSelectedViolation}
            onAction={(id, action) => handleAction(id, action)}
          />
        </div>
        <div>
          <ZoneSummary zones={zoneSummary} />
          <EnforcementTimeline events={events} />
        </div>
      </div>
      <ViolationDetail
        violation={selectedViolation}
        onClose={() => setSelectedViolation(null)}
        onAction={handleAction}
      />
    </div>
  );
}
