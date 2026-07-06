import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polygon } from 'react-native-maps';
import StatusPill from '../components/StatusPill';
import SpotSheet from '../components/SpotSheet';
import { useApp } from '../context/AppContext';
import { colors, statusColors } from '../theme';
import { DEMO_LOCATION, LatLng, Spot } from '../types';

const INITIAL_REGION = {
  latitude: 25.0925,
  longitude: 55.16,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

function parsePolygon(geojson?: string | null): LatLng[] {
  if (!geojson) return [];
  try {
    const parsed = JSON.parse(geojson);
    const ring: number[][] = parsed?.coordinates?.[0] ?? [];
    return ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  } catch {
    return [];
  }
}

export default function MapScreen() {
  const { zones, spots, mapFocus } = useApp();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Agent "Show on map" — fly to the recommended zone.
  useEffect(() => {
    if (!mapFocus) return;
    mapRef.current?.animateToRegion(
      { latitude: mapFocus.lat, longitude: mapFocus.lng, latitudeDelta: 0.003, longitudeDelta: 0.003 },
      600
    );
  }, [mapFocus]);

  const zonePolygons = useMemo(
    () =>
      zones.map((zone) => {
        const coords = parsePolygon(zone.geojson_polygon);
        const freeRatio = zone.total_spots > 0 ? zone.free_count / zone.total_spots : 0;
        const color = freeRatio > 0.3 ? colors.cyan : freeRatio > 0.1 ? colors.amber : colors.red;
        return { zone, coords, color };
      }),
    [zones]
  );

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;
  const selectedZone = selectedSpot ? zones.find((z) => z.id === selectedSpot.zone_id) : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        userInterfaceStyle="dark"
        showsPointsOfInterests={false}
        showsCompass={false}
        onPress={() => setSelectedSpotId(null)}
      >
        {zonePolygons.map(({ zone, coords, color }) =>
          coords.length > 2 ? (
            <Polygon
              key={zone.id}
              coordinates={coords}
              strokeColor={`${color}66`}
              fillColor={`${color}14`}
              strokeWidth={1.5}
            />
          ) : null
        )}

        {spots.map((spot) => (
          <SpotDot key={`${spot.id}-${spot.status}`} spot={spot} onPress={() => setSelectedSpotId(spot.id)} />
        ))}

        {/* Demo user location ("Work") */}
        <Circle
          center={{ latitude: DEMO_LOCATION.lat, longitude: DEMO_LOCATION.lng }}
          radius={18}
          fillColor={`${colors.blue}33`}
          strokeColor={colors.blue}
          strokeWidth={1.5}
        />
      </MapView>

      <View style={styles.topBar}>
        <StatusPill />
      </View>

      {selectedSpot && <SpotSheet spot={selectedSpot} zone={selectedZone} onClose={() => setSelectedSpotId(null)} />}
    </View>
  );
}

// Custom dot marker; key includes status so the frozen (tracksViewChanges
// = false) view re-renders on status flips pushed over the WebSocket.
function SpotDot({ spot, onPress }: { spot: Spot; onPress: () => void }) {
  const color = statusColors[spot.status] ?? colors.text3;
  return (
    <Marker
      coordinate={{ latitude: spot.lat, longitude: spot.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <View style={[styles.dot, { backgroundColor: `${color}55`, borderColor: color }]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  topBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
});
