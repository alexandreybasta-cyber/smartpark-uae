'use client';

import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { SavedPlace } from '@/types';

const ICONS: Record<string, string> = {
  home: '🏠',
  work: '💼',
  gym: '🏋️',
  custom: '📍',
};

function createEmojiIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="font-size:20px;line-height:1;text-align:center;">${emoji}</div>`,
    className: 'saved-place-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface SavedPlaceMarkerProps {
  place: SavedPlace;
}

export default function SavedPlaceMarker({ place }: SavedPlaceMarkerProps) {
  const emoji = ICONS[place.label] || ICONS.custom;
  const icon = createEmojiIcon(emoji);

  return (
    <Marker position={[place.lat, place.lng]} icon={icon}>
      <Tooltip>
        <div className="text-xs">
          <div className="font-semibold capitalize">{place.label}</div>
          <div className="text-gray-500">{place.address}</div>
        </div>
      </Tooltip>
    </Marker>
  );
}
