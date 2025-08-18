// File: app/(tabs)/map.tsx
// FINAL CORRECTED VERSION 2: Fixes the user flow to be intuitive.
// Implements "long-press on map to select destination" and removes confusing navigation.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, MapEvent } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { mapStyle } from '../../constants/MapStyle';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // <-- IMPORTANT!

interface LocationDetails {
    latitude: number;
    longitude: number;
    address: string;
}

const customColors = {
    cardBackground: '#FFFBEB',
    primaryGold: '#FBBF24',
    darkText: '#4B5563',
    accentRed: '#E53935',
    accentGreen: '#34D399',
    infoBlue: '#3B82F6',
};

export default function MapScreen() {
    const { theme } = useTheme();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const mapViewRef = useRef<MapView>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    
    const [userLocation, setUserLocation] = useState<LocationDetails | null>(null);
    const [origin, setOrigin] = useState<LocationDetails | null>(null);
    const [destination, setDestination] = useState<LocationDetails | null>(null);
    const [stationsOnRoute, setStationsOnRoute] = useState<any[]>([]);

    // NEW STATE: To track if we are currently setting the destination.
    const [isSettingDestination, setIsSettingDestination] = useState(false);

    const fetchStationsOnRoute = useCallback(async (polyline: string) => {
        setIsLoadingRoute(true);
        try {
            const { data, error } = await supabase.rpc('get_stations_on_route', { route_polyline: polyline });
            if (error) throw error;
            setStationsOnRoute(data || []);
        } catch (err: any) {
            console.error("Error fetching stations on route:", err.message);
            Alert.alert("Error", "Could not fetch stations for this route.");
        } finally {
            setIsLoadingRoute(false);
        }
    }, []);

    const setupLocation = useCallback(async () => {
        if (userLocation) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required.'); return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const geocoded = await Location.reverseGeocodeAsync(loc.coords);
            const initialLocation = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                address: geocoded[0]?.name || 'Current Location'
            };
            setUserLocation(initialLocation);
            setOrigin(initialLocation); // Automatically set origin to current location
        } catch (error) {
            console.error("Location Setup Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userLocation]);

    useEffect(() => {
        if (isFocused) {
            setupLocation();
        }
    }, [isFocused, setupLocation]);

    // NEW FUNCTION: Handles long-press on the map
    const handleMapLongPress = async (event: MapEvent) => {
        if (!isSettingDestination) return; // Only act if we are in "set destination" mode

        const { latitude, longitude } = event.nativeEvent.coordinate;
        setIsLoading(true);
        try {
            const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
            setDestination({
                latitude,
                longitude,
                address: geocoded[0]?.name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
            });
            setIsSettingDestination(false); // Turn off "set destination" mode
        } catch (error) {
            console.error("Reverse geocode error:", error);
            Alert.alert("Error", "Could not determine address for this location.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const clearRoute = () => {
        // Only clear the destination, keep origin as current location
        setDestination(null);
        setStationsOnRoute([]);
        setIsSettingDestination(false);
        if (userLocation && mapViewRef.current) {
            mapViewRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            });
        }
    };

    if (isLoading && !userLocation) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={customColors.primaryGold} /></View>;
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapViewRef}
                style={styles.map}
                initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 } : undefined}
                showsUserLocation={true}
                showsMyLocationButton={false}
                customMapStyle={theme === 'dark' ? mapStyle : []}
                onLongPress={handleMapLongPress} // <-- ADDED THIS
            >
                {origin && destination && (
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor={customColors.primaryGold}
                        onReady={result => {
                            if (result.encodedPolyline) {
                                fetchStationsOnRoute(result.encodedPolyline);
                            }
                            mapViewRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 250, right: 50, bottom: 100, left: 50 },
                            });
                        }}
                        onError={(error) => console.log('Directions Error: ', error)}
                    />
                )}
                
                {stationsOnRoute.map((station) => (
                    <Marker key={`station-${station.id}`} coordinate={{ latitude: station.latitude, longitude: station.longitude }} title={station.name} anchor={{ x: 0.5, y: 1 }}>
                        <View style={styles.pin}><View style={styles.pinCircle}><MaterialCommunityIcons name="gas-station" size={20} color="#fff" /></View><View style={styles.pinTriangle} /></View>
                    </Marker>
                ))}

                {/* Show origin marker only if it's set */}
                {origin && <Marker coordinate={origin} title="Origin"><FontAwesome5 name="map-marker-alt" size={32} color={customColors.accentGreen} /></Marker>}
                {destination && <Marker coordinate={destination} title="Destination"><FontAwesome5 name="flag-checkered" size={32} color={customColors.accentRed} /></Marker>}
            </MapView>
            
            {/* Show a helpful tip when user needs to select a destination */}
            {isSettingDestination && (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>Long-press on the map to set your destination</Text>
                </View>
            )}

            <View style={[styles.routeCard, { top: insets.top + 10 }]}>
                {/* Origin field (not tappable, shows current location) */}
                <View style={styles.routeInputRow}>
                    <FontAwesome5 name="map-marker-alt" size={20} color={customColors.accentGreen} style={{marginHorizontal: 10}} />
                    <View style={styles.routeInputContainer}>
                        <Text style={styles.routeInputText} numberOfLines={1}>{origin?.address || 'Getting current location...'}</Text>
                    </View>
                </View>

                {/* Destination field */}
                <View style={styles.routeInputRow}>
                    <FontAwesome5 name="flag-checkered" size={20} color={customColors.accentRed} style={{marginHorizontal: 10}} />
                    <TouchableOpacity 
                        style={[
                            styles.routeInputContainer,
                            isSettingDestination && styles.routeInputActive // Highlight when active
                        ]} 
                        onPress={() => setIsSettingDestination(true)} // <-- CORRECTED ACTION
                    >
                        <Text style={styles.routeInputText} numberOfLines={1}>
                            {destination?.address || 'Choose destination'}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.bottomRow}>
                    {isLoadingRoute ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color={customColors.primaryGold} />
                            <Text style={styles.loaderText}>Finding stations...</Text>
                        </View>
                    ) : <View />}
                    {(origin || destination) && (
                         <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                            <Ionicons name="close-circle" size={20} color={customColors.darkText} />
                            <Text style={styles.clearButtonText}>Clear Destination</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}


// --- Styles (added tooltip and active state) ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: customColors.cardBackground },
    map: { ...StyleSheet.absoluteFillObject },
    pin: { width: 40, height: 48, alignItems: 'center', justifyContent: 'flex-start' },
    pinCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: customColors.accentRed, borderColor: '#fff', borderWidth: 2, justifyContent: 'center', alignItems: 'center', zIndex: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    pinTriangle: { position: 'absolute', bottom: 0, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderTopWidth: 16, borderTopColor: '#fff', borderLeftWidth: 10, borderLeftColor: 'transparent', borderRightWidth: 10, borderRightColor: 'transparent', zIndex: 1 },
    routeCard: { position: 'absolute', left: 15, right: 15, padding: 15, borderRadius: 16, backgroundColor: customColors.cardBackground, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, gap: 10 },
    routeInputRow: { flexDirection: 'row', alignItems: 'center'},
    routeInputContainer: { flex: 1, height: 48, justifyContent: 'center', paddingHorizontal: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 },
    routeInputActive: {
        borderColor: customColors.infoBlue,
        borderWidth: 2,
    },
    routeInputText: { fontSize: 16, color: customColors.darkText, fontWeight: '500' },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingHorizontal: 10 },
    clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 20, gap: 6, alignSelf: 'flex-end' },
    clearButtonText: { color: customColors.darkText, fontWeight: '600' },
    loaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    loaderText: { fontSize: 14, color: customColors.darkText, fontWeight: '500' },
    tooltip: {
        position: 'absolute',
        top: '50%',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    tooltipText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});