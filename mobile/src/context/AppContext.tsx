import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useParkingData } from '../hooks/useParkingData';
import { DataMode, Spot, Zone } from '../types';

export type TabKey = 'map' | 'agent' | 'places' | 'insights';

interface AppContextValue {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  zones: Zone[];
  spots: Spot[];
  mode: DataMode;
  retry: () => void;
  // Cross-tab actions
  mapFocus: { lat: number; lng: number; token: number } | null;
  showOnMap: (lat: number, lng: number) => void;
  pendingAgentQuery: { text: string; token: number } | null;
  askAgent: (text: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<TabKey>('map');
  const { zones, spots, mode, retry } = useParkingData();
  const [mapFocus, setMapFocus] = useState<AppContextValue['mapFocus']>(null);
  const [pendingAgentQuery, setPendingAgentQuery] = useState<AppContextValue['pendingAgentQuery']>(null);

  const showOnMap = useCallback((lat: number, lng: number) => {
    setMapFocus({ lat, lng, token: Date.now() });
    setTab('map');
  }, []);

  const askAgent = useCallback((text: string) => {
    setPendingAgentQuery({ text, token: Date.now() });
    setTab('agent');
  }, []);

  const value = useMemo(
    () => ({ tab, setTab, zones, spots, mode, retry, mapFocus, showOnMap, pendingAgentQuery, askAgent }),
    [tab, zones, spots, mode, retry, mapFocus, showOnMap, pendingAgentQuery, askAgent]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
