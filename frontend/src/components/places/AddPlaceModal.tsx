'use client';

import { useState } from 'react';
import { SavedPlace } from '@/types';

type PlaceLabel = SavedPlace['label'];

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (place: Omit<SavedPlace, 'id'>) => void;
}

const LABEL_OPTIONS: { value: PlaceLabel; icon: string; name: string }[] = [
  { value: 'home', icon: '🏠', name: 'Home' },
  { value: 'work', icon: '💼', name: 'Work' },
  { value: 'gym', icon: '🏋️', name: 'Gym' },
  { value: 'custom', icon: '📍', name: 'Custom' },
];

export default function AddPlaceModal({ isOpen, onClose, onSave }: AddPlaceModalProps) {
  const [label, setLabel] = useState<PlaceLabel>('home');
  const [customName, setCustomName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('25.09');
  const [lng, setLng] = useState('55.16');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (label === 'custom' && !customName.trim()) {
      setError('Please enter a custom name');
      return;
    }
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    onSave({
      label,
      address: address.trim(),
      lat: parseFloat(lat) || 25.09,
      lng: parseFloat(lng) || 55.16,
      ...(label === 'custom' ? { custom_name: customName.trim() } : {}),
    });

    // Reset form
    setLabel('home');
    setCustomName('');
    setAddress('');
    setLat('25.09');
    setLng('55.16');
    setError('');
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
          <h2 className="text-xl font-semibold text-sp-text-1 mb-5">Add New Place</h2>

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
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
