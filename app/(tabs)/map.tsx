import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui';
import { useBridgeStore } from '@/store/useBridgeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Idea } from '@/types/bridge';
import { Ionicons } from '@expo/vector-icons';

// Conditionally import react-native-maps only on native platforms
let MapView: any;
let Marker: any;
let Callout: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

export default function MapScreen() {
  // Show web-friendly message on web platform
  if (Platform.OS === 'web') {
    return (
      <Screen>
        <View style={styles.webContainer}>
          <Ionicons name="map-outline" size={64} color={colors.inkSoft} />
          <Text style={styles.webTitle}>Map View</Text>
          <Text style={styles.webMessage}>
            The interactive map is available on the mobile app.
          </Text>
          <Text style={styles.webHint}>
            Download Expo Go on your phone and scan the QR code to view your date spots on a map!
          </Text>
        </View>
      </Screen>
    );
  }
  const ideas = useBridgeStore((s) => s.ideas);
  const mapRef = useRef<MapView>(null);
  const [selectedSpot, setSelectedSpot] = useState<Idea | null>(null);

  // Filter ideas with coordinates
  const spotsWithCoords = ideas.filter((idea) => idea.latitude && idea.longitude);

  // Calculate initial region (center on all spots or default to LA)
  const getInitialRegion = () => {
    if (spotsWithCoords.length === 0) {
      // Default to Los Angeles
      return {
        latitude: 34.0522,
        longitude: -118.2437,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      };
    }

    // Center on first spot
    const firstSpot = spotsWithCoords[0];
    return {
      latitude: firstSpot.latitude!,
      longitude: firstSpot.longitude!,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  // Fit map to show all markers
  const fitToMarkers = () => {
    if (spotsWithCoords.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        spotsWithCoords.map((spot) => ({
          latitude: spot.latitude!,
          longitude: spot.longitude!,
        })),
        {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        }
      );
    }
  };

  // Get marker color based on idea status
  const getMarkerColor = (idea: Idea) => {
    switch (idea.status) {
      case 'shortlisted':
        return colors.coral;
      case 'planned':
        return colors.blue;
      case 'done':
        return colors.sage;
      default:
        return colors.inkSoft;
    }
  };

  // Get marker icon based on category
  const getMarkerIcon = (idea: Idea): keyof typeof Ionicons.glyphMap => {
    switch (idea.category) {
      case 'food':
      case 'fancy':
        return 'restaurant';
      case 'drinks':
        return 'wine';
      case 'activity':
        return 'basketball';
      case 'event':
        return 'calendar';
      case 'outdoors':
        return 'leaf';
      case 'travel':
        return 'airplane';
      case 'cozy':
        return 'home';
      default:
        return 'location';
    }
  };

  React.useEffect(() => {
    // Fit to markers after initial render
    const timer = setTimeout(() => {
      fitToMarkers();
    }, 500);
    return () => clearTimeout(timer);
  }, [spotsWithCoords.length]);

  return (
    <Screen>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={getInitialRegion()}
          showsUserLocation
          showsMyLocationButton
        >
          {spotsWithCoords.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: spot.latitude!,
                longitude: spot.longitude!,
              }}
              pinColor={getMarkerColor(spot)}
              onPress={() => setSelectedSpot(spot)}
            >
              <View style={[styles.customMarker, { backgroundColor: getMarkerColor(spot) }]}>
                <Ionicons name={getMarkerIcon(spot)} size={20} color={colors.white} />
              </View>
              <Callout
                onPress={() => {
                  Alert.alert(
                    spot.title,
                    'Would you like to view details or plan a date with this spot?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'View Details',
                        onPress: () => {
                          // TODO: Navigate to spot details
                          Alert.alert('Coming Soon', 'Spot details view coming soon!');
                        },
                      },
                      {
                        text: 'Plan Date',
                        onPress: () => {
                          router.push('/plans/new');
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{spot.title}</Text>
                  {spot.location_name && (
                    <Text style={styles.calloutLocation}>{spot.location_name}</Text>
                  )}
                  <Text style={styles.calloutCost}>{spot.cost_level}</Text>
                  {spot.vibe_tags && spot.vibe_tags.length > 0 && (
                    <Text style={styles.calloutVibes}>
                      {spot.vibe_tags.slice(0, 2).join(', ')}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Floating controls */}
        <View style={styles.controls}>
          <Pressable style={styles.controlButton} onPress={fitToMarkers}>
            <Ionicons name="locate" size={24} color={colors.ink} />
            <Text style={styles.controlText}>Fit All</Text>
          </Pressable>

          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {spotsWithCoords.length} spot{spotsWithCoords.length !== 1 ? 's' : ''} on map
            </Text>
            {ideas.length > spotsWithCoords.length && (
              <Text style={styles.statsSubtext}>
                {ideas.length - spotsWithCoords.length} without location
              </Text>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Status</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.inkSoft }]} />
            <Text style={styles.legendText}>New</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.coral }]} />
            <Text style={styles.legendText}>Shortlisted</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.blue }]} />
            <Text style={styles.legendText}>Planned</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.sage }]} />
            <Text style={styles.legendText}>Done</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  webTitle: {
    ...typography.display,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  webMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  webHint: {
    ...typography.bodySoft,
    textAlign: 'center',
    maxWidth: 300,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  callout: {
    width: 200,
    padding: spacing.sm,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  calloutLocation: {
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  calloutCost: {
    fontSize: 14,
    color: colors.coral,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  calloutVibes: {
    fontSize: 12,
    color: colors.inkFaint,
    fontStyle: 'italic',
  },
  controls: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  controlButton: {
    backgroundColor: colors.bgRaised,
    borderRadius: 12,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  stats: {
    backgroundColor: colors.bgRaised,
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  statsSubtext: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  legend: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.bgRaised,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: colors.ink,
  },
});
