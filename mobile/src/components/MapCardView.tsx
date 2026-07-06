import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';
import { MapCard } from '../types';
import { NavigateIcon } from './icons';

export default function MapCardView({ card }: { card: MapCard }) {
  const { showOnMap } = useApp();
  const hasCoords = card.lat != null && card.lng != null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.zone}>{card.zone_name ?? 'Recommended zone'}</Text>
        {card.price_per_hour != null && <Text style={styles.price}>AED {card.price_per_hour.toFixed(0)}/hr</Text>}
      </View>
      <View style={styles.statsRow}>
        {card.free_spots != null && card.total_spots != null && (
          <Text style={styles.stat}>
            <Text style={styles.statValue}>{card.free_spots}</Text>
            <Text style={styles.statLabel}>/{card.total_spots} free</Text>
          </Text>
        )}
        {card.walking_minutes != null && <Text style={styles.walk}>{card.walking_minutes} min walk</Text>}
      </View>
      {hasCoords && (
        <Pressable style={styles.button} onPress={() => showOnMap(card.lat!, card.lng!)}>
          <NavigateIcon color={colors.bg0} size={16} />
          <Text style={styles.buttonText}>Show on map</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg3,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zone: {
    color: colors.text1,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  price: {
    color: colors.text2,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 14,
  },
  stat: {
    color: colors.text1,
  },
  statValue: {
    color: colors.cyan,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.text2,
    fontSize: 14,
  },
  walk: {
    color: colors.text2,
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    borderRadius: radius.input,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.bg0,
    fontWeight: '700',
    fontSize: 14,
  },
});
