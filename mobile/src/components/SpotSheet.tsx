import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { haversine } from '../localAgent';
import { colors, radius, statusColors } from '../theme';
import { DEMO_LOCATION, Spot, Zone } from '../types';
import { NavigateIcon } from './icons';

interface Props {
  spot: Spot;
  zone?: Zone;
  onClose: () => void;
}

function minutesSince(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return ms > 0 ? Math.floor(ms / 60000) : 0;
}

export default function SpotSheet({ spot, zone, onClose }: Props) {
  const distance = haversine(DEMO_LOCATION.lat, DEMO_LOCATION.lng, spot.lat, spot.lng);
  const walkMin = Math.max(1, Math.round(distance / 80));
  const occupiedFor = minutesSince(spot.occupied_since);
  const statusColor = statusColors[spot.status] ?? colors.text3;

  const navigate = async () => {
    const appleMaps = `maps://?daddr=${spot.lat},${spot.lng}&dirflg=w`;
    const webFallback = `https://maps.apple.com/?daddr=${spot.lat},${spot.lng}&dirflg=w`;
    try {
      const supported = await Linking.canOpenURL(appleMaps);
      await Linking.openURL(supported ? appleMaps : webFallback);
    } catch {
      Alert.alert('Navigation', 'Could not open Maps on this device.');
    }
  };

  const payWithParkin = async () => {
    try {
      await Linking.openURL('parkin://pay');
    } catch {
      Alert.alert(
        'Parkin integration (mock)',
        `In production this deep-links into the Parkin app to pay for spot ${spot.id} at AED ${zone?.price_per_hour ?? 4}/hr. SmartPark finds the spot — Parkin handles payment.`
      );
    }
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.spotId}>Spot {spot.id}</Text>
          <Text style={styles.zoneName}>{zone?.name ?? `Zone ${spot.zone_id}`}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{spot.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.meta}>
          {Math.round(distance)}m · {walkMin} min walk
        </Text>
        {spot.status === 'occupied' && occupiedFor !== null && (
          <Text style={styles.meta}>occupied {occupiedFor}m</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.primary]} onPress={navigate}>
          <NavigateIcon color={colors.bg0} />
          <Text style={styles.primaryText}>Navigate</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondary]} onPress={payWithParkin}>
          <Text style={styles.secondaryText}>Pay via Parkin</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotId: {
    color: colors.text1,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  zoneName: {
    color: colors.text2,
    fontSize: 13,
    marginTop: 2,
  },
  close: {
    color: colors.text3,
    fontSize: 18,
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  meta: {
    color: colors.text2,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.input,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: colors.cyan,
  },
  primaryText: {
    color: colors.bg0,
    fontWeight: '700',
    fontSize: 15,
  },
  secondary: {
    backgroundColor: colors.bg3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text1,
    fontWeight: '600',
    fontSize: 15,
  },
});
