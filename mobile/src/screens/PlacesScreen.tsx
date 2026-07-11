import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createPlace, deletePlace, fetchPlaces, fetchRecommendedSpot } from '../api';
import { BriefcaseIcon, DumbbellIcon, HomeIcon, NavigateIcon, StarIcon, TrashIcon } from '../components/icons';
import { useApp } from '../context/AppContext';
import { haversine } from '../localAgent';
import { seedPlaces } from '../seed';
import { colors, radius } from '../theme';
import { DEMO_LOCATION, GPSApp, RecommendResponse, SavedPlace } from '../types';

const LABELS = ['home', 'work', 'gym', 'custom'] as const;

function PlaceIcon({ label }: { label: string }) {
  const props = { color: colors.cyan, size: 20 };
  if (label === 'home') return <HomeIcon {...props} />;
  if (label === 'work') return <BriefcaseIcon {...props} />;
  if (label === 'gym') return <DumbbellIcon {...props} />;
  return <StarIcon {...props} />;
}

function buildNavURL(app: GPSApp, lat: number, lng: number): string {
  switch (app) {
    case 'apple_maps':
      return `maps://?daddr=${lat},${lng}&dirflg=d`;
    case 'google_maps':
      return `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    case 'waze':
      return `waze://?ll=${lat},${lng}&navigate=yes`;
  }
}

function appLabel(app: GPSApp): string {
  switch (app) {
    case 'apple_maps': return 'Apple Maps';
    case 'google_maps': return 'Google Maps';
    case 'waze': return 'Waze';
  }
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

  // Navigation modal state
  const [navPlace, setNavPlace] = useState<SavedPlace | null>(null);
  const [findSpot, setFindSpot] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recommendedSpot, setRecommendedSpot] = useState<RecommendResponse | null>(null);

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

  // Navigation modal handlers
  const openNavModal = (place: SavedPlace) => {
    setNavPlace(place);
    setRecommendedSpot(null);
    setFindSpot(true);
    setLoading(false);
  };

  const closeNavModal = () => {
    setNavPlace(null);
    setRecommendedSpot(null);
    setLoading(false);
  };

  const onFindSpotToggle = async (value: boolean) => {
    setFindSpot(value);
    if (value && navPlace && !recommendedSpot) {
      setLoading(true);
      try {
        const result = await fetchRecommendedSpot({
          destination_lat: navPlace.lat,
          destination_lng: navPlace.lng,
          saved_place_lat: navPlace.lat,
          saved_place_lng: navPlace.lng,
          user_lat: DEMO_LOCATION.lat,
          user_lng: DEMO_LOCATION.lng,
        });
        setRecommendedSpot(result);
      } catch {
        Alert.alert('No spots', 'Could not find a recommended parking spot nearby.');
        setFindSpot(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const onSelectApp = async (app: GPSApp) => {
    if (!navPlace) return;

    // If "find best spot" is on but spot hasn't loaded yet, fetch first
    if (findSpot && !recommendedSpot) {
      setLoading(true);
      try {
        const result = await fetchRecommendedSpot({
          destination_lat: navPlace.lat,
          destination_lng: navPlace.lng,
          saved_place_lat: navPlace.lat,
          saved_place_lng: navPlace.lng,
          user_lat: DEMO_LOCATION.lat,
          user_lng: DEMO_LOCATION.lng,
        });
        setRecommendedSpot(result);
        const url = buildNavURL(app, result.spot_lat, result.spot_lng);
        await Linking.openURL(url);
      } catch {
        // Fallback to place coords
        const url = buildNavURL(app, navPlace.lat, navPlace.lng);
        await Linking.openURL(url);
      } finally {
        setLoading(false);
        closeNavModal();
      }
      return;
    }

    // Navigate to spot or place
    const lat = findSpot && recommendedSpot ? recommendedSpot.spot_lat : navPlace.lat;
    const lng = findSpot && recommendedSpot ? recommendedSpot.spot_lng : navPlace.lng;
    const url = buildNavURL(app, lat, lng);

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to Apple Maps web if app not installed
        const fallback = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
        await Linking.openURL(fallback);
      }
    } catch {
      Alert.alert('Error', `Could not open ${appLabel(app)}.`);
    }
    closeNavModal();
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
                style={styles.navButton}
                onPress={() => openNavModal(place)}
              >
                <NavigateIcon color="#fff" size={14} />
                <Text style={styles.navButtonText}>Navigate</Text>
              </Pressable>
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

      {/* Navigation Modal */}
      <Modal
        visible={!!navPlace}
        animationType="slide"
        transparent
        onRequestClose={closeNavModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {navPlace?.custom_name ?? navPlace?.label}
            </Text>
            {!!navPlace?.address && (
              <Text style={styles.modalAddress}>{navPlace.address}</Text>
            )}

            {/* Find best spot toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Find best parking spot first</Text>
              <Switch
                value={findSpot}
                onValueChange={onFindSpotToggle}
                trackColor={{ false: colors.bg3, true: `${colors.amber}60` }}
                thumbColor={findSpot ? colors.amber : colors.text3}
              />
            </View>

            {/* Recommended spot info */}
            {loading && (
              <View style={styles.spotInfo}>
                <ActivityIndicator color={colors.amber} />
                <Text style={styles.spotInfoText}>Finding best spot…</Text>
              </View>
            )}
            {!loading && findSpot && recommendedSpot && (
              <View style={styles.spotInfo}>
                <Text style={styles.spotName}>{recommendedSpot.spot_name}</Text>
                <Text style={styles.spotDetail}>
                  {recommendedSpot.zone_name} • {Math.round(recommendedSpot.walking_distance_meters)}m walk
                </Text>
                <Text style={styles.spotDetail}>
                  Score: {(recommendedSpot.score * 100).toFixed(0)}% • Free for {Math.round(recommendedSpot.time_free_seconds / 60)} min
                </Text>
              </View>
            )}

            {/* GPS app picker */}
            <Text style={styles.chooseLabel}>Choose navigation app:</Text>
            <View style={styles.appRow}>
              {(['apple_maps', 'google_maps', 'waze'] as GPSApp[]).map((app) => (
                <Pressable
                  key={app}
                  style={styles.appButton}
                  onPress={() => onSelectApp(app)}
                  disabled={loading}
                >
                  <Text style={styles.appButtonText}>{appLabel(app)}</Text>
                </Pressable>
              ))}
            </View>

            {/* Cancel */}
            <Pressable style={styles.cancelButton} onPress={closeNavModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.amber,
    borderRadius: radius.badge,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: colors.text1,
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  modalAddress: {
    color: colors.text3,
    fontSize: 13,
    marginTop: -4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 4,
  },
  toggleLabel: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '600',
  },
  spotInfo: {
    backgroundColor: colors.bg2,
    borderRadius: radius.card,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: `${colors.amber}30`,
  },
  spotInfoText: {
    color: colors.text2,
    fontSize: 13,
  },
  spotName: {
    color: colors.amber,
    fontSize: 15,
    fontWeight: '700',
  },
  spotDetail: {
    color: colors.text2,
    fontSize: 13,
  },
  chooseLabel: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  appRow: {
    flexDirection: 'row',
    gap: 10,
  },
  appButton: {
    flex: 1,
    backgroundColor: colors.amber,
    borderRadius: radius.input,
    paddingVertical: 14,
    alignItems: 'center',
  },
  appButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: colors.bg2,
    borderRadius: radius.input,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '600',
  },
});
