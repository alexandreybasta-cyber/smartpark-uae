import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchZoneDetail, fetchZones, WS_URL } from '../api';
import { buildSeedData, simulateTick } from '../seed';
import { DataMode, Spot, Zone } from '../types';

interface SpotUpdateMessage {
  type: string;
  spots: { id: string; status: string; last_changed_at: string }[];
}

// Single data layer for the whole app: live backend (REST bootstrap +
// WebSocket updates) with an offline fallback (seed + local simulator).
export function useParkingData() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [mode, setMode] = useState<DataMode>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const recomputeZoneCounts = useCallback((zoneList: Zone[], spotList: Spot[]): Zone[] => {
    return zoneList.map((zone) => {
      const zs = spotList.filter((s) => s.zone_id === zone.id);
      return {
        ...zone,
        free_count: zs.filter((s) => s.status === 'free').length,
        occupied_count: zs.filter((s) => s.status === 'occupied').length,
        reserved_count: zs.filter((s) => s.status === 'reserved').length,
      };
    });
  }, []);

  const startOfflineMode = useCallback(() => {
    if (!mountedRef.current) return;
    const seed = buildSeedData();
    setZones(seed.zones);
    setSpots(seed.spots);
    setMode('offline');
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(() => {
      setSpots((prev) => {
        const next = simulateTick(prev);
        if (next !== prev) {
          setZones((z) => recomputeZoneCounts(z, next));
        }
        return next;
      });
    }, 2000);
  }, [recomputeZoneCounts]);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg: SpotUpdateMessage = JSON.parse(String(event.data));
          if (msg.type !== 'spot_update' || !msg.spots?.length) return;
          const updates = new Map(msg.spots.map((u) => [u.id, u]));
          setSpots((prev) => {
            const next = prev.map((s) => {
              const u = updates.get(s.id);
              return u ? { ...s, status: u.status as Spot['status'], last_changed_at: u.last_changed_at } : s;
            });
            setZones((z) => recomputeZoneCounts(z, next));
            return next;
          });
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        // Backend went away mid-session: retry, data stays at last state.
        setTimeout(() => {
          if (mountedRef.current && wsRef.current === ws) connectWebSocket();
        }, 5000);
      };
    } catch {
      // WebSocket construction failure — offline simulator keeps demo alive
    }
  }, [recomputeZoneCounts]);

  const bootstrap = useCallback(async () => {
    setMode('connecting');
    try {
      const zoneList = await fetchZones();
      const details = await Promise.all(zoneList.map((z) => fetchZoneDetail(z.id)));
      if (!mountedRef.current) return;
      const allSpots = details.flatMap((d) => d.spots);
      setZones(zoneList);
      setSpots(allSpots);
      setMode('live');
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      connectWebSocket();
    } catch {
      startOfflineMode();
    }
  }, [connectWebSocket, startOfflineMode]);

  useEffect(() => {
    mountedRef.current = true;
    bootstrap();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [bootstrap]);

  return { zones, spots, mode, retry: bootstrap };
}
