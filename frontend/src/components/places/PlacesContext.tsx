'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SavedPlace } from '@/types';
import { savedPlaces as seedPlaces } from '@/data/seed';

interface PlacesContextValue {
  places: SavedPlace[];
  addPlace: (place: Omit<SavedPlace, 'id'>) => void;
  removePlace: (id: string) => void;
  updatePlace: (id: string, updates: Partial<Omit<SavedPlace, 'id'>>) => void;
}

const PlacesContext = createContext<PlacesContextValue | null>(null);

const STORAGE_KEY = 'spotsense-saved-places';

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<SavedPlace[]>(seedPlaces);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlaces(JSON.parse(stored));
      }
    } catch {
      // localStorage unavailable, use seed data
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } catch {
      // localStorage unavailable
    }
  }, [places, hydrated]);

  const addPlace = (place: Omit<SavedPlace, 'id'>) => {
    const newPlace: SavedPlace = {
      ...place,
      id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setPlaces(prev => [...prev, newPlace]);
  };

  const removePlace = (id: string) => {
    setPlaces(prev => prev.filter(p => p.id !== id));
  };

  const updatePlace = (id: string, updates: Partial<Omit<SavedPlace, 'id'>>) => {
    setPlaces(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  return (
    <PlacesContext.Provider value={{ places, addPlace, removePlace, updatePlace }}>
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const ctx = useContext(PlacesContext);
  if (!ctx) {
    throw new Error('usePlaces must be used within a PlacesProvider');
  }
  return ctx;
}
