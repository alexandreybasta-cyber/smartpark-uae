'use client';

import { useState } from 'react';
import { savedPlaces } from '@/data/seed';

interface SearchBarProps {
  onPlaceFound: (lat: number, lng: number) => void;
}

export default function SearchBar({ onPlaceFound }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const match = savedPlaces.find(
      p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.address.toLowerCase().includes(query.toLowerCase()) ||
        (p.custom_name && p.custom_name.toLowerCase().includes(query.toLowerCase()))
    );

    if (match) {
      onPlaceFound(match.lat, match.lng);
      setQuery('');
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] w-full max-w-sm px-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Park near..."
          className="w-full py-2.5 pl-4 pr-12 bg-sp-bg-2/90 backdrop-blur-md border border-white/10 rounded-xl text-sm text-sp-text-1 placeholder:text-sp-text-3 focus:outline-none focus:border-sp-cyan/40 transition-colors"
        />
        {/* Mic icon */}
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-text-3 hover:text-sp-text-2 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      </form>
    </div>
  );
}
