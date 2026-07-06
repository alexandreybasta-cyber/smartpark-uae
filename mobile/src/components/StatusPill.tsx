import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';

export default function StatusPill() {
  const { mode, spots } = useApp();
  const freeCount = spots.filter((s) => s.status === 'free').length;

  const config = {
    connecting: { color: colors.blue, label: 'CONNECTING…' },
    live: { color: colors.cyan, label: `LIVE · ${freeCount} free` },
    offline: { color: colors.amber, label: `OFFLINE DEMO · ${freeCount} free` },
  }[mode];

  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,14,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.badge,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
