'use client';

import { useState, useEffect } from 'react';
import { SavedPlace } from '@/types';

type PlaceLabel = SavedPlace['label'];

interface EditPlaceModalProps {
  isOpen: boolean;
  place: SavedPlace | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<SavedPlace, 'id'>>) => void;
}

const LABEL_OPTIONS: { value: PlaceLabel; icon: string; name: string }[] = [
  { value: 'home', icon: '🏠', name: 'Home' },
  { value: 'work', icon: '💼', name: 'Work' },
  { value: 'gym', icon: '🏋️', name: 'Gym' },
  { value: 'custom', icon: '📍', name: 'Custom' },
];

export default function EditPlaceModal({ isOpen, place, onClose, onSave }: EditPlaceModalProps) {
  const [label, setLabel] = useState<PlaceLabel>('home');
  const [customName, setCustomName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (place) {
      setLabel(place.label);
      setCustomName(place.custom_name || '');
      setAddress(place.address);
      setLat(String(place.lat));
      setLng(String(place.lng));
      setError('');
    }
  }, [place]);

  if (!isOpen || !place) return null;

  const handleSave = () => {
    if (label === 'custom' && !customName.trim()) {
      setError('Please enter a custom name');
      return;
    }
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    onSave(place.id, {
      label,
      address: address.trim(),
      lat: parseFloat(lat) || place.lat,
      lng: parseFloat(lng) || place.lng,
      ...(label === 'custom' ? { custom_name: customName.trim() } : { custom_name: undefined }),
    });

    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
        <div className="bg-sp-bg-2 border border-sp-bg-3 rounded-2xl p-6 w-full max-w-md animate-fade-in">
          <h2 className="text-xl font-semibold text-sp-text-1 mb-5">Edit Place</h2>

          {/* Label selector */}
          <div className="mb-4">
            <label className="text-sm text-sp-text-2 mb-2 block">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {LABEL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setLabel(opt.value); setError(''); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                    label === opt.value
                      ? 'border-sp-cyan bg-sp-cyan/10 text-sp-cyan'
                      : 'border-sp-bg-3 text-sp-text-2 hover:border-sp-text-3'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-medium">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom name input */}
          {label === 'custom' && (
            <div className="mb-4">
              <label className="text-sm text-sp-text-2 mb-1.5 block">Custom Name</label>
              <input
                type="text"
                value={customName}
                onChange={e => { setCustomName(e.target.value); setError(''); }}
                placeholder="e.g., Coffee Shop"
                className="w-full px-4 py-2.5 rounded-xl bg-sp-bg-1 border border-sp-bg-3 text-sp-text-1 placeholder:text-sp-text-3 focus:outline-none focus:border-sp-cyan/50 transition-colors"
              />
            </div>
          )}

          {/* Address */}
          <div className="mb-4">
            <label className="text-sm text-sp-text-2 mb-1.5 block">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => { setAddress(e.target.value); setError(''); }}
              placeholder="Enter address"
              className="w-full px-4 py-2.5 rounded-xl bg-sp-bg-1 border border-sp-bg-3 text-sp-text-1 placeholder:text-sp-text-3 focus:outline-none focus:border-sp-cyan/50 transition-colors"
            />
          </div>

          {/* Lat/Lng */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-sp-text-2 mb-1.5 block">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={e => setLat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-sp-bg-1 border border-sp-bg-3 text-sp-text-1 placeholder:text-sp-text-3 focus:outline-none focus:border-sp-cyan/50 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-sp-text-2 mb-1.5 block">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={e => setLng(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-sp-bg-1 border border-sp-bg-3 text-sp-text-1 placeholder:text-sp-text-3 focus:outline-none focus:border-sp-cyan/50 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sp-red text-sm mb-3">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-sp-bg-3 text-sp-text-2 hover:text-sp-text-1 hover:border-sp-text-3 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-sp-cyan text-sp-bg-0 font-semibold hover:brightness-110 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
