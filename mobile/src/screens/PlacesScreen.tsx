import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createPlace, deletePlace, fetchPlaces } from '../api';
import { BriefcaseIcon, DumbbellIcon, HomeIcon, StarIcon, TrashIcon } from '../components/icons';
import { useApp } from '../context/AppContext';
import { haversine } from '../localAgent';
import { seedPlaces } from '../seed';
import { colors, radius } from '../theme';
import { SavedPlace } from '../types';

const LABELS = ['home', 'work', 'gym', 'custom'] as const;

function PlaceIcon({ label }: { label: string }) {
  const props = { color: colors.cyan, size: 20 };
  if (label === 'home') return <HomeIcon {...props} />;
  if (label === 'work') return <BriefcaseIcon {...props} />;
  if (label === 'gym') return <DumbbellIcon {...props} />;
  return <StarIcon {...props} />;
}

export default function PlacesScreen() {
  const { mode, zones, spots, askAgent } = useApp();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState<string>('custom');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState('25.0920');
  const [formLng, setFormLng] = useState('55.1600');

  const load = useCallback(async () => {
    if (mode === 'offline') {
      setPlaces(seedPlaces);
      return;
    }
    try {
      setPlaces(await fetchPlaces());
    } catch {
      setPlaces(seedPlaces);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const freeSpotsNear = useCallback(
    (place: SavedPlace): number => {
      return spots.filter(
        (s) => s.status === 'free' && haversine(place.lat, place.lng, s.lat, s.lng) <= 500
      ).length;
    },
    [spots]
  );

  const onAdd = async () => {
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (!formName.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert('Missing info', 'Please provide a name and valid coordinates.');
      return;
    }
    if (mode === 'offline') {
      Alert.alert('Offline demo', 'Saved places are read-only while the backend is unreachable.');
      return;
    }
    try {
      await createPlace({
        label: formLabel,
        custom_name: formName.trim(),
        lat,
        lng,
        address: formAddress.trim() || null,
      });
      setShowForm(false);
      setFormName('');
      setFormAddress('');
      load();
    } catch {
      Alert.alert('Error', 'Could not save the place. Is the backend running?');
    }
  };

  const onDelete = (place: SavedPlace) => {
    if (mode === 'offline') {
      Alert.alert('Offline demo', 'Saved places are read-only while the backend is unreachable.');
      return;
    }
    Alert.alert('Delete place', `Remove "${place.custom_name ?? place.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlace(place.id);
            load();
          } catch {
            Alert.alert('Error', 'Could not delete the place.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Places</Text>
        <Pressable style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Say "find parking near my work" — the agent resolves these places.</Text>

      {showForm && (
        <View style={styles.form}>
          <View style={styles.labelRow}>
            {LABELS.map((l) => (
              <Pressable
                key={l}
                style={[styles.labelChip, formLabel === l && styles.labelChipActive]}
                onPress={() => setFormLabel(l)}
              >
                <Text style={[styles.labelChipText, formLabel === l && styles.labelChipTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Name (e.g. DIC Building 3)"
            placeholderTextColor={colors.text3}
            value={formName}
            onChangeText={setFormName}
          />
          <TextInput
            style={styles.input}
            placeholder="Address (optional)"
            placeholderTextColor={colors.text3}
            value={formAddress}
            onChangeText={setFormAddress}
          />
          <View style={styles.coordRow}>
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Latitude"
              placeholderTextColor={colors.text3}
              value={formLat}
              onChangeText={setFormLat}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Longitude"
              placeholderTextColor={colors.text3}
              value={formLng}
              onChangeText={setFormLng}
              keyboardType="decimal-pad"
            />
          </View>
          <Pressable style={styles.saveButton} onPress={onAdd}>
            <Text style={styles.saveButtonText}>Save place</Text>
          </Pressable>
        </View>
      )}

      {places.map((place) => {
        const free = freeSpotsNear(place);
        return (
          <View key={place.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <PlaceIcon label={place.label} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{place.custom_name ?? place.label}</Text>
              {!!place.address && <Text style={styles.cardAddress}>{place.address}</Text>}
              <Text style={[styles.cardFree, { color: free > 0 ? colors.cyan : colors.text3 }]}>
                {free > 0 ? `${free} free spots within 500m` : 'No monitored spots within 500m'}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={styles.findButton}
                onPress={() => askAgent(`Find parking near my ${place.label === 'custom' ? place.custom_name : place.label}`)}
              >
                <Text style={styles.findButtonText}>Find parking</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(place)} hitSlop={8} style={styles.trash}>
                <TrashIcon color={colors.text3} />
              </Pressable>
            </View>
          </View>
        );
      })}

      {zones.length === 0 && <Text style={styles.loading}>Loading zones…</Text>}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text1,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.text3,
    fontSize: 13,
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.badge,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addButtonText: {
    color: colors.cyan,
    fontWeight: '700',
    fontSize: 13,
  },
  form: {
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    borderRadius: radius.badge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  labelChipActive: {
    borderColor: colors.cyan,
    backgroundColor: `${colors.cyan}15`,
  },
  labelChipText: {
    color: colors.text2,
    fontSize: 13,
  },
  labelChipTextActive: {
    color: colors.cyan,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.bg1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text1,
    fontSize: 14,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordInput: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.cyan,
    borderRadius: radius.input,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.bg0,
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.cyan}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text1,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardAddress: {
    color: colors.text3,
    fontSize: 12,
  },
  cardFree: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  findButton: {
    backgroundColor: `${colors.cyan}15`,
    borderWidth: 1,
    borderColor: `${colors.cyan}40`,
    borderRadius: radius.badge,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  findButtonText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  trash: {
    padding: 2,
  },
  loading: {
    color: colors.text3,
    textAlign: 'center',
    marginTop: 12,
  },
});
