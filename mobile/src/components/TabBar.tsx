import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TabKey, useApp } from '../context/AppContext';
import { colors } from '../theme';
import { ChartIcon, MapIcon, MicIcon, StarIcon } from './icons';

const TABS: { key: TabKey; label: string; Icon: typeof MapIcon }[] = [
  { key: 'map', label: 'Map', Icon: MapIcon },
  { key: 'agent', label: 'Agent', Icon: MicIcon },
  { key: 'places', label: 'Places', Icon: StarIcon },
  { key: 'insights', label: 'Insights', Icon: ChartIcon },
];

export default function TabBar() {
  const { tab, setTab } = useApp();

  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const active = tab === key;
        const color = active ? colors.cyan : colors.text3;
        return (
          <Pressable key={key} style={styles.item} onPress={() => setTab(key)}>
            <Icon color={color} size={24} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 28,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
