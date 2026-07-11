// Types mirror backend/schemas.py — do not diverge from the API contract.

export type SpotStatus = 'free' | 'occupied' | 'reserved' | 'sensor_offline';

export interface Spot {
  id: string;
  zone_id: number;
  lat: number;
  lng: number;
  status: SpotStatus;
  last_changed_at?: string | null;
  sensor_id?: string | null;
  occupied_since?: string | null;
}

export interface Zone {
  id: number;
  name: string;
  geojson_polygon?: string | null;
  pricing_type: string;
  price_per_hour: number;
  total_spots: number;
  free_count: number;
  occupied_count: number;
  reserved_count: number;
}

export interface Prediction {
  timestamp: string;
  predicted_occupancy: number;
  confidence: number;
}

export interface SavedPlace {
  id: number;
  user_id: string;
  label: string;
  custom_name?: string | null;
  lat: number;
  lng: number;
  address?: string | null;
}

export interface MapCard {
  zone_id?: number | null;
  zone_name?: string | null;
  lat?: number | null;
  lng?: number | null;
  free_spots?: number | null;
  total_spots?: number | null;
  price_per_hour?: number | null;
  walking_minutes?: number | null;
}

export interface AgentResponse {
  text: string;
  reasoning_steps: string[];
  map_card?: MapCard | null;
}

export type DataMode = 'connecting' | 'live' | 'offline';

export interface LatLng {
  latitude: number;
  longitude: number;
}

// Navigation / geofence types
export interface RecommendRequest {
  destination_lat: number;
  destination_lng: number;
  saved_place_lat?: number;
  saved_place_lng?: number;
  user_lat: number;
  user_lng: number;
}

export interface RecommendResponse {
  spot_id: string;
  spot_lat: number;
  spot_lng: number;
  spot_name: string;
  zone_name: string;
  walking_distance_meters: number;
  score: number;
  time_free_seconds: number;
}

export type GPSApp = 'apple_maps' | 'google_maps' | 'waze';

// Demo user location = "Work" (DIC Building 3), same as the web demo.
export const DEMO_LOCATION = { lat: 25.092, lng: 55.16 };
