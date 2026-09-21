export type SpotStatus = 'free' | 'occupied' | 'reserved' | 'sensor_offline';

// Which detector currently owns a spot's status.
export type DetectionSource = 'simulated' | 'camera' | 'ingest';

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
  detection_source?: DetectionSource;
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

// ---------------------------------------------------------------------------
// Camera vision (OpenCV occupancy detection)
// ---------------------------------------------------------------------------
export type CameraSourceType = 'rtsp' | 'file' | 'webcam' | 'snapshot';
export type CameraStatus = 'offline' | 'connecting' | 'online' | 'error';
export type RegionStatus = 'unknown' | 'free' | 'occupied';

// Normalized [x, y] pairs in 0..1 relative to the frame.
export type PolygonPoint = [number, number];

export interface CameraRegion {
  id: number;
  camera_id: number;
  spot_id: string | null;
  label: string;
  polygon: PolygonPoint[];
  status: RegionStatus;
  confidence: number;
  occupy_threshold: number;
  free_threshold: number;
  last_updated_at: string | null;
}

export interface Camera {
  id: number;
  name: string;
  source_type: CameraSourceType;
  source_url: string | null;
  webcam_index: number | null;
  status: CameraStatus;
  error_message: string | null;
  fps_target: number;
  width: number | null;
  height: number | null;
  last_frame_at: string | null;
  frames_analysed: number;
  created_at: string;
  regions: CameraRegion[];
}

export interface DetectionEvent {
  id: number;
  camera_id: number;
  region_id: number;
  spot_id: string | null;
  previous_status: string;
  new_status: string;
  confidence: number;
  source: 'vision' | 'ingest';
  created_at: string;
}
