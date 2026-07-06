'use client';

import './leaflet-import';
import { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { zones, spots as initialSpots, savedPlaces } from '@/data/seed';
import { Spot } from '@/types';
import { useSimulator } from '@/hooks/useSimulator';
import ZonePolygon from './ZonePolygon';
import SpotMarker from './SpotMarker';
import SpotSheet from './SpotSheet';
import CurrentLocation from './CurrentLocation';
import SavedPlaceMarker from './SavedPlaceMarker';
import MapControls from './MapControls';
import SearchBar from './SearchBar';

const CENTER: [number, number] = [25.092, 55.160];
const ZOOM = 17;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// User current location (Work location for demo)
const USER_LAT = 25.0920;
const USER_LNG = 55.1600;

export default function ParkingMap() {
  const { spots, isRunning, start, stop, setSpeed } = useSimulator(initialSpots);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [speed, setSpeedState] = useState(1);
  const mapRef = useRef<LeafletMap | null>(null);

  const handleSpotClick = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
  }, []);

  const handleToggle = useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
    setSpeed(newSpeed);
  }, [setSpeed]);

  const handlePlaceFound = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 18, { duration: 1 });
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Search bar */}
      <SearchBar onPlaceFound={handlePlaceFound} />

      {/* Map controls */}
      <MapControls
        isRunning={isRunning}
        speed={speed}
        spots={spots}
        onToggle={handleToggle}
        onSpeedChange={handleSpeedChange}
      />

      {/* Leaflet Map */}
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {/* Zone polygons */}
        {zones.map(zone => {
          const zoneSpots = spots.filter(s => s.zone_id === zone.id);
          const freeCount = zoneSpots.filter(s => s.status === 'free').length;
          const freeRatio = zoneSpots.length > 0 ? freeCount / zoneSpots.length : 1;
          return <ZonePolygon key={zone.id} zone={zone} freeRatio={freeRatio} />;
        })}

        {/* Spot markers */}
        {spots.map(spot => (
          <SpotMarker key={spot.id} spot={spot} onClick={handleSpotClick} />
        ))}

        {/* Current location */}
        <CurrentLocation lat={USER_LAT} lng={USER_LNG} />

        {/* Saved places */}
        {savedPlaces.map(place => (
          <SavedPlaceMarker key={place.id} place={place} />
        ))}
      </MapContainer>

      {/* Bottom sheet */}
      <SpotSheet spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
    </div>
  );
}
