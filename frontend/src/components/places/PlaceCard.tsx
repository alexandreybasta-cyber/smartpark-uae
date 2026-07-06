'use client';

import { SavedPlace } from '@/types';

interface PlaceCardProps {
  place: SavedPlace;
  distance?: string;
  onFindParking: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const LABEL_ICONS: Record<string, string> = {
  home: '🏠',
  work: '💼',
  gym: '🏋️',
  custom: '📍',
};

function getDisplayName(place: SavedPlace): string {
  if (place.label === 'custom' && place.custom_name) {
    return place.custom_name;
  }
  return place.label.charAt(0).toUpperCase() + place.label.slice(1);
}

export default function PlaceCard({
  place,
  distance,
  onFindParking,
  onEdit,
  onDelete,
}: PlaceCardProps) {
  const icon = LABEL_ICONS[place.label] || '📍';

  return (
    <div className="group bg-sp-bg-2 rounded-xl p-4 border border-sp-bg-3 hover:border-sp-cyan/20 transition-colors">
      <div className="flex items-center gap-4">
        {/* Left: Icon */}
        <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-sp-bg-3">
          {icon}
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sp-text-1 font-semibold text-base truncate">
            {getDisplayName(place)}
          </h3>
          <p className="text-sp-text-2 text-sm truncate">{place.address}</p>
          {distance && (
            <p className="text-sp-text-3 text-xs mt-0.5">{distance}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onFindParking}
            className="px-3 py-1.5 rounded-lg bg-sp-cyan/10 text-sp-cyan text-xs font-medium hover:bg-sp-cyan/20 transition-colors"
          >
            Find Parking
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-sp-text-3 hover:text-sp-text-1 hover:bg-sp-bg-3 transition-colors"
            aria-label="Edit place"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-sp-text-3 hover:text-sp-red hover:bg-sp-red/10 transition-colors"
            aria-label="Delete place"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
