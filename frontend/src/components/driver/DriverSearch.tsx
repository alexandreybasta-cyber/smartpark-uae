'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const savedPlaces = [
  { emoji: '🏠', label: 'Home', key: 'home', spots: 4 },
  { emoji: '💼', label: 'Work', key: 'work', spots: 7 },
  { emoji: '🏋️', label: 'Gym', key: 'gym', spots: 3 },
];

const searchResults: Record<string, { name: string; spots: number; area: string }> = {
  home: { name: 'Al Barsha Residence', spots: 4, area: 'Al Barsha 1' },
  work: { name: 'Dubai Internet City', spots: 7, area: 'DIC Tower 2' },
  gym: { name: 'Fitness First — Mall of Emirates', spots: 3, area: 'Al Barsha' },
  default: { name: 'Dubai Internet City', spots: 5, area: 'Near Building 12' },
};

export default function DriverSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const result = selected ? searchResults[selected] || searchResults.default : null;

  const handleSelect = (key: string) => {
    setSelected(key);
    setQuery(savedPlaces.find((p) => p.key === key)?.label || key);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      setSelected('default');
    } else {
      setSelected(null);
    }
  };

  const handleNavigate = () => {
    router.push(`/navigate?destination=${selected || 'work'}`);
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-sp-text-1">Where are you headed?</h1>
        <p className="text-sm text-sp-text-3 mt-1">
          SmartPark will find a spot when you arrive
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sp-text-3">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search destination..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-emerald-100 text-sp-text-1 text-lg placeholder:text-sp-text-3/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-sp-cyan/40 transition"
        />
      </div>

      {/* Quick Access */}
      {!selected && (
        <div className="flex gap-3 justify-center">
          {savedPlaces.map((place) => (
            <button
              key={place.key}
              onClick={() => handleSelect(place.key)}
              className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-white shadow-sm border border-emerald-50 hover:border-sp-cyan/40 hover:shadow-md transition active:scale-95"
            >
              <span className="text-2xl">{place.emoji}</span>
              <span className="text-xs font-medium text-sp-text-2">{place.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-50 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sp-text-1 text-lg">{result.name}</p>
              <p className="text-sm text-sp-text-3">{result.area}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
              {result.spots} spots
            </div>
          </div>

          <button
            onClick={handleNavigate}
            className="mt-4 w-full py-3.5 rounded-full bg-sp-cyan text-white font-semibold text-base shadow-md hover:shadow-lg hover:brightness-110 transition active:scale-[0.98]"
          >
            Start Navigation
          </button>
        </div>
      )}
    </div>
  );
}
