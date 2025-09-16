import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import polylineUtil from '@mapbox/polyline';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useDebouncedCallback } from 'use-debounce';

// Import the new components
import FilterControl from '../../components/home/FilterControl';
import InitialLoadingScreen from '../../components/home/InitialLoadingScreen';
import SearchBar from '../../components/home/SearchBar';
import StationInfoPopup from '../../components/home/StationInfoPopup';
import SubtleActivityIndicator from '../../components/home/SubtleActivityIndicator';
import TripPlanner from '../../components/home/TripPlanner';
import { createMapStyle } from '../../constants/MapStyle'; // Import the new function
import { useTheme } from '../../context/ThemeContext'; // Import your hook
import { supabase } from '../../lib/supabase';

interface Station {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
}

export default function HomeScreen() {
    // Get the full theme object, including the colors
    const { theme, colors } = useTheme();
    const mapViewRef = useRef<MapView>(null);
    const tabBarHeight = useBottomTabBarHeight();

    const [isLoading, setIsLoading] = useState(true);
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
    const [filterTerm, setFilterTerm] = useState('');
    const [searchKey, setSearchKey] = useState(0);
    const [searchScope, setSearchScope] = useState<'map' | 'city' | 'country' | 'worldwide'>('city');
    const [locationInfo, setLocationInfo] = useState<{ city?: string; country?: string; countryCode?: string }>({});
    const [isTripModeActive, setTripModeActive] = useState(false);
    const [isTripLoading, setIsTripLoading] = useState(false);
    const [route, setRoute] = useState<{ polyline: string; bounds: any } | null>(null);

    // Memoize the map style so it only recalculates when the theme changes
    const themedMapStyle = useMemo(() => createMapStyle(colors.map), [colors]);

    // Memoize the component styles to make them theme-aware
    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        map: { ...StyleSheet.absoluteFillObject },
        pin: { width: 40, height: 48, alignItems: 'center', justifyContent: 'flex-start' },
        pinCircle: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.pinDefault, // Use theme color
            borderColor: colors.background, // Use theme color
            borderWidth: 2, justifyContent: 'center', alignItems: 'center',
            zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
        },
        pinSelected: {
            backgroundColor: colors.primary, // Use theme color for selected state
            transform: [{ scale: 1.1 }],
        },
        pinTriangle: {
            position: 'absolute', bottom: 0, width: 0, height: 0,
            backgroundColor: 'transparent', borderStyle: 'solid',
            borderTopWidth: 16, borderTopColor: colors.background, // Use theme color
            borderLeftWidth: 10, borderLeftColor: 'transparent',
            borderRightWidth: 10, borderRightColor: 'transparent', zIndex: 1,
        },
    }), [colors]); // Re-create styles only when colors change


    const filteredStations = useMemo(() => {
        if (!filterTerm.trim()) return stations;
        const lowercasedFilter = filterTerm.toLowerCase();
        return stations.filter(s => s.name.toLowerCase().includes(lowercasedFilter));
    }, [stations, filterTerm]);

    // --- LOGIC & CALLBACKS ---
    const fetchStationsForRegion = useCallback(async (region: Region) => {
        if (!region) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-google-stations', { body: { latitude: region.latitude, longitude: region.longitude } });
            if (error) throw error;
            setStations(prevStations => {
                const stationMap = new Map(prevStations.map(s => [s.id, s]));
                (data as Station[]).forEach(newStation => stationMap.set(newStation.id, newStation));
                return Array.from(stationMap.values());
            });
        } catch (err: any) { console.error("Error fetching stations:", err.message); }
        finally { setIsLoading(false); }
    }, []);

    const updateLocationName = useCallback(async (region: Region) => {
        try {
            const result = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
            if (result.length > 0) {
                const { city, country, isoCountryCode } = result[0];
                setLocationInfo({ city, country, countryCode: isoCountryCode });
            }
        } catch (error) { console.error("Reverse geocoding failed (handled):", error); }
    }, []);

    const debouncedFetch = useDebouncedCallback(fetchStationsForRegion, 400);
    const debouncedUpdateLocationName = useDebouncedCallback(updateLocationName, 500);

    useEffect(() => {
        const setupInitialScreen = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                let initialRegion: Region;
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Showing default location.');
                    initialRegion = { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.1, longitudeDelta: 0.1 };
                } else {
                    const location = await Location.getLastKnownPositionAsync({}) || await Location.getCurrentPositionAsync({});
                    initialRegion = { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 };
                }
                setCurrentRegion(initialRegion);
                await fetchStationsForRegion(initialRegion);
                await updateLocationName(initialRegion);
            } catch (error) {
                console.error("Failed to setup initial screen:", error);
                const fallbackRegion = { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.1, longitudeDelta: 0.1 };
                setCurrentRegion(fallbackRegion);
                Alert.alert("Initialization Error", "Could not determine location. Showing default map.");
            }
        };
        setupInitialScreen();
    }, []);

    const handleMarkerPress = (station: Station) => {
        setSelectedStation(station);
        mapViewRef.current?.animateToRegion({
            latitude: station.latitude, longitude: station.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02
        }, 500);
    };

    const handlePlaceSelected = (newRegion: Region) => {
        mapViewRef.current?.animateToRegion(newRegion, 1000);
    };

    const handleMapPress = () => {
        if (selectedStation) setSelectedStation(null);
        Keyboard.dismiss();
    };

    const handleRegionChangeComplete = (region: Region) => {
        setCurrentRegion(region);
        debouncedFetch(region);
        if (!isTripModeActive) { debouncedUpdateLocationName(region); }
    };

    const handleFindTrip = async (destinationPlaceId: string) => {
        Keyboard.dismiss(); setIsTripLoading(true);
        try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude: startLat, longitude: startLon } = location.coords;
            const { data, error } = await supabase.functions.invoke('get-trip-details', { body: { startLat, startLon, destinationPlaceId } });
            if (error) throw new Error(error.message);

            setStations([]);
            setRoute({ polyline: data.polyline, bounds: data.bounds });
            setTripModeActive(true);

            const { northeast, southwest } = data.bounds;
            mapViewRef.current?.fitToCoordinates(
                [{ latitude: northeast.lat, longitude: northeast.lng }, { latitude: southwest.lat, longitude: southwest.lng }],
                { edgePadding: { top: 150, right: 50, bottom: 50, left: 50 }, animated: true }
            );
        } catch (err: any) { Alert.alert("Error Finding Route", err.message); }
        finally { setIsTripLoading(false); }
    };

    const cancelTripMode = () => {
        setTripModeActive(false); setRoute(null);
        if (currentRegion) debouncedFetch(currentRegion);
    };

    if (!currentRegion) {
        return <InitialLoadingScreen message="Finding your location..." />;
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapViewRef} style={styles.map}
                initialRegion={currentRegion} showsUserLocation={true}
                showsMyLocationButton={true}
                customMapStyle={theme === 'dark' ? themedMapStyle : []} // Use the generated style
                onPress={handleMapPress} onRegionChangeComplete={handleRegionChangeComplete}
            >
                {filteredStations.map((station) => (
                    <Marker key={station.id} coordinate={{ latitude: station.latitude, longitude: station.longitude }} onPress={() => handleMarkerPress(station)} tracksViewChanges={false}>
                        <View style={styles.pin}>
                            <View style={[styles.pinCircle, selectedStation?.id === station.id && styles.pinSelected]}>
                                <MaterialCommunityIcons name="gas-station" size={20} color={colors.pinText} />
                            </View>
                            <View style={styles.pinTriangle} />
                        </View>
                    </Marker>
                ))}
                {isTripModeActive && route && (
                    <Polyline coordinates={polylineUtil.decode(route.polyline).map(c => ({ latitude: c[0], longitude: c[1] }))} strokeColor={colors.primary} strokeWidth={5} />
                )}
            </MapView>

            {!isTripModeActive && (
                <>
                    <SearchBar searchKey={searchKey} setSearchKey={setSearchKey} currentRegion={currentRegion} locationInfo={locationInfo} searchScope={searchScope} setSearchScope={setSearchScope} onPlaceSelected={handlePlaceSelected} />
                    <FilterControl filterTerm={filterTerm} onApplyFilter={setFilterTerm} />
                </>
            )}

            <TripPlanner isTripModeActive={isTripModeActive} onCancelTrip={cancelTripMode} onFindTrip={handleFindTrip} tabBarHeight={tabBarHeight} currentRegion={currentRegion} locationInfo={locationInfo} />
            <StationInfoPopup station={selectedStation} onClose={() => setSelectedStation(null)} tabBarHeight={tabBarHeight} />
            <SubtleActivityIndicator visible={isLoading || isTripLoading} />
        </View>
    );
}