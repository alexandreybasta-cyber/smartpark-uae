import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import TabBar from './src/components/TabBar';
import { AppProvider, useApp } from './src/context/AppContext';
import AgentScreen from './src/screens/AgentScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import MapScreen from './src/screens/MapScreen';
import PlacesScreen from './src/screens/PlacesScreen';
import { colors } from './src/theme';

// All screens stay mounted (display:none when inactive) so the map keeps
// its position and the WebSocket-fed state never re-fetches on tab switch.
function Screens() {
  const { tab } = useApp();
  return (
    <View style={styles.screens}>
      <View style={[styles.screen, tab !== 'map' && styles.hidden]}>
        <MapScreen />
      </View>
      <View style={[styles.screen, tab !== 'agent' && styles.hidden]}>
        <AgentScreen />
      </View>
      <View style={[styles.screen, tab !== 'places' && styles.hidden]}>
        <PlacesScreen />
      </View>
      <View style={[styles.screen, tab !== 'insights' && styles.hidden]}>
        <InsightsScreen />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <Screens />
        <TabBar />
      </SafeAreaView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  screens: {
    flex: 1,
  },
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    display: 'none',
  },
});
