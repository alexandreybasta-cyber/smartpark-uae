export type SpotStatus = 'free' | 'occupied' | 'reserved' | 'sensor_offline';

export interface Zone {
  id: number;
  name: string;
  geojson_polygon: GeoJSON.Polygon;
  pricing_type: 'A' | 'B' | 'C' | 'D';
  price_per_hour: number;
  total_spots: number;
  free_spots: number;
  occupied_spots: number;
  reserved_spots: number;
}

export interface Spot {
  id: string;
  zone_id: number;
  lat: number;
  lng: number;
  status: SpotStatus;
  last_changed_at: string;
  sensor_id: string;
  occupied_since?: string;
}

export interface Sensor {
  id: string;
  spot_id: string;
  firmware_version: string;
  battery_mv: number;
  signal_rssi: number;
  last_heartbeat: string;
  status: 'online' | 'offline' | 'low_battery';
}

export interface SavedPlace {
  id: string;
  label: 'home' | 'work' | 'gym' | 'custom';
  custom_name?: string;
  lat: number;
  lng: number;
  address: string;
}

export interface Prediction {
  zone_id: number;
  timestamp: string;
  predicted_occupancy: number;
  confidence: number;
}

export interface ParkEvent {
  id: string;
  spot_id: string;
  parked_at: string;
  left_at?: string;
  duration_minutes?: number;
}

export interface AgentResponse {
  text: string;
  reasoning_steps: string[];
  recommended_zone?: Zone;
  recommended_spot?: Spot;
  action?: 'navigate' | 'pay' | 'predict' | 'compare';
  map_card?: {
    zone_id: number;
    zone_name: string;
    free_spots: number;
    total_spots: number;
    distance_meters: number;
    walking_minutes: number;
  };
}
