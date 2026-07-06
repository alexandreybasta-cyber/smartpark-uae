'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SavedPlace } from '@/types';
import { usePlaces } from './PlacesContext';
import PlaceCard from './PlaceCard';
import AddPlaceModal from './AddPlaceModal';
import EditPlaceModal from './EditPlaceModal';

// User reference location (work place in DIC area)
const USER_LAT = 25.092;
const USER_LNG = 55.16;

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export default function PlacesList() {
  const { places, addPlace, removePlace, updatePlace } = usePlaces();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const router = useRouter();

  const handleFindParking = (place: SavedPlace) => {
    router.push(`/demo?lat=${place.lat}&lng=${place.lng}`);
  };

  const handleDelete = (id: string) => {
    removePlace(id);
  };

  return (
    <div>
      {/* Places list */}
      <div className="space-y-3">
        {places.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sp-text-3 text-lg">No saved places yet</p>
            <p className="text-sp-text-3 text-sm mt-1">Add your frequent destinations</p>
          </div>
        ) : (
          places.map(place => {
            const dist = getDistance(USER_LAT, USER_LNG, place.lat, place.lng);
            return (
              <PlaceCard
                key={place.id}
                place={place}
                distance={formatDistance(dist)}
                onFindParking={() => handleFindParking(place)}
                onEdit={() => setEditingPlace(place)}
                onDelete={() => handleDelete(place.id)}
              />
            );
          })
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full mt-6 py-3 rounded-xl border-2 border-dashed border-sp-bg-3 text-sp-text-2 hover:border-sp-cyan/40 hover:text-sp-cyan transition-colors font-medium"
      >
        + Add New Place
      </button>

      {/* Modals */}
      <AddPlaceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addPlace}
      />
      <EditPlaceModal
        isOpen={!!editingPlace}
        place={editingPlace}
        onClose={() => setEditingPlace(null)}
        onSave={updatePlace}
      />
    </div>
  );
}
