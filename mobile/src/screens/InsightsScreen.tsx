import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchPredictions } from '../api';
import PredictionChart from '../components/PredictionChart';
import { useApp } from '../context/AppContext';
import { generatePredictions, dubaiHourNow } from '../seed';
import { colors, radius } from '../theme';
import { Prediction } from '../types';

function bestTimeHint(): string {
  const hour = dubaiHourNow();
  if (hour < 7) return 'Now is a great time — streets are nearly empty';
  if (hour < 12) return 'Best window: 12:00–13:00 (lunch dip)';
  if (hour < 17) return 'Best window: after 20:00 (evening cool-down)';
  if (hour < 20) return 'Peak hours now — consider waiting until 20:00+';
  return 'Occupancy dropping — good time to find parking';
}

export default function InsightsScreen() {
  const { zones, mode } = useApp();
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const chartWidth = Dimensions.get('window').width - 32 - 28; // padding + card padding

  const zoneId = selectedZoneId ?? zones[0]?.id ?? null;

  const load = useCallback(async () => {
    if (zoneId == null) return;
    if (mode === 'live') {
      try {
        const preds = await fetchPredictions(zoneId);
        // Backend predictions are seeded once and can go stale after 12h;
        // fall back to the local profile when the API returns nothing.
        setPredictions(preds.length > 0 ? preds : generatePredictions());
        return;
      } catch {
        // fall through to local generation
      }
    }
    setPredictions(generatePredictions());
  }, [zoneId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const maxFree = Math.max(1, ...zones.map((z) => z.free_count));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>
      <View style={styles.hintCard}>
        <Text style={styles.hintLabel}>BEST TIME TO PARK</Text>
        <Text style={styles.hintText}>{bestTimeHint()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Occupancy forecast — next 12h</Text>
      <View style={styles.zoneChips}>
        {zones.map((zone) => (
          <Pressable
            key={zone.id}
            style={[styles.zoneChip, zoneId === zone.id && styles.zoneChipActive]}
            onPress={() => setSelectedZoneId(zone.id)}
          >
            <Text style={[styles.zoneChipText, zoneId === zone.id && styles.zoneChipTextActive]}>
              {zone.name.replace('DIC Parking ', '')}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.chartCard}>
        <PredictionChart predictions={predictions} width={chartWidth} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.purple }]} />
            <Text style={styles.legendText}>Predicted occupancy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: `${colors.red}44` }]} />
            <Text style={styles.legendText}>Peak (&gt;80%)</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Zone comparison</Text>
      {zones
        .slice()
        .sort((a, b) => b.free_count - a.free_count)
        .map((zone) => {
          const ratio = zone.total_spots > 0 ? zone.free_count / zone.total_spots : 0;
          const barColor = ratio > 0.3 ? colors.cyan : ratio > 0.1 ? colors.amber : colors.red;
          return (
            <View key={zone.id} style={styles.zoneCard}>
              <View style={styles.zoneCardHeader}>
                <Text style={styles.zoneCardName}>{zone.name}</Text>
                <Text style={styles.zoneCardPrice}>AED {zone.price_per_hour}/hr</Text>
              </View>
              <View style={styles.zoneCardStats}>
                <Text style={[styles.zoneCardFree, { color: barColor }]}>
                  {zone.free_count}
                  <Text style={styles.zoneCardTotal}>/{zone.total_spots} free</Text>
                </Text>
                <Text style={styles.zoneCardOcc}>
                  {zone.total_spots > 0 ? Math.round((zone.occupied_count / zone.total_spots) * 100) : 0}% occupied
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(2, (zone.free_count / maxFree) * 100)}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: colors.text1,
    fontSize: 22,
    fontWeight: '800',
  },
  hintCard: {
    backgroundColor: `${colors.purple}12`,
    borderWidth: 1,
    borderColor: `${colors.purple}35`,
    borderRadius: radius.card,
    padding: 14,
    gap: 4,
  },
  hintLabel: {
    color: colors.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hintText: {
    color: colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  zoneChips: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneChip: {
    borderRadius: radius.badge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoneChipActive: {
    borderColor: colors.purple,
    backgroundColor: `${colors.purple}15`,
  },
  zoneChipText: {
    color: colors.text2,
    fontSize: 13,
  },
  zoneChipTextActive: {
    color: colors.purple,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    color: colors.text3,
    fontSize: 12,
  },
  zoneCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  zoneCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoneCardName: {
    color: colors.text1,
    fontSize: 15,
    fontWeight: '700',
  },
  zoneCardPrice: {
    color: colors.text3,
    fontSize: 13,
  },
  zoneCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  zoneCardFree: {
    fontSize: 22,
    fontWeight: '800',
  },
  zoneCardTotal: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '400',
  },
  zoneCardOcc: {
    color: colors.text3,
    fontSize: 13,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
});
