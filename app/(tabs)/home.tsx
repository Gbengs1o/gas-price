// FINAL VERSION: Incorporates dynamic on-page search and Google API-powered sync.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    StyleSheet, View, Text, ActivityIndicator, Alert, TextInput,
    TouchableOpacity, FlatList, Keyboard, Platform
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { mapStyle } from '../../constants/MapStyle';
import { useAuth } from '../../context/AuthContext';
import FindGasIcon from '../../components/icons/FindGasIcon';

// Define the structure for our searchable areas
interface SearchableArea {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}

// Helper function to create a consistent grid ID for sync logging
const getAreaId = (lat: number, lon: number) => `${lat.toFixed(1)}_${lon.toFixed(1)}`;

// Custom color palette for a consistent theme
const customColors = {
    cardBackground: '#FFFBEB',
    primaryGold: '#FBBF24',
    darkText: '#4B5563',
    iconColor: '#8C8C8C',
};

export default function HomeScreen() {
    const { theme } = useTheme();
    const isFocused = useIsFocused();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapViewRef = useRef<MapView>(null);
    const textInputRef = useRef<TextInput>(null);

    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
    const [stations, setStations] = useState<any[]>([]);

    // --- NEW STATE FOR DYNAMIC SEARCH ---
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [allAreas, setAllAreas] = useState<SearchableArea[]>([]);

    // --- ASYNCHRONOUS SYNC CHECK LOGIC ---
    const handleAutomaticSyncCheck = useCallback(async (location: { latitude: number, longitude: number }) => {
        if (!user) return; // Sync only for logged-in users

        const SYNC_THRESHOLD_DAYS = 30; // How often to re-sync an area
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - SYNC_THRESHOLD_DAYS);
        const areaId = getAreaId(location.latitude, location.longitude);

        try {
            // Check the sync log to see if we need to act
            const { data: log, error: logCheckError } = await supabase
                .from('area_sync_log').select('*').eq('area_id', areaId).single();

            if (logCheckError && logCheckError.code !== 'PGRST116') throw logCheckError; // Ignore "no rows found" error

            if (log && log.is_syncing_now) {
                console.log(`[Sync Check] Area ${areaId} is already being synced. Standing by.`);
                return; // Do nothing, another user triggered it
            }

            if (log && new Date(log.last_synced_at) > thresholdDate) {
                console.log(`[Sync Check] Area ${areaId} is fresh. No action needed.`);
                return; // Do nothing, data is recent
            }

            // If we reach here, the data is stale or non-existent. Time to sync.
            console.log(`[Sync Triggered] Area ${areaId} is stale or new. Starting background sync.`);

            // 1. Lock the area to prevent duplicate syncs
            await supabase.from('area_sync_log').upsert({
                area_id: areaId, is_syncing_now: true, last_synced_by: user.id
            }, { onConflict: 'area_id' });

            // 2. Invoke the serverless function to do the heavy lifting (e.g., call Google API)
            //    This happens in the background and does NOT block the UI.
            const { error: functionError } = await supabase.functions.invoke('super-worker', {
                body: { latitude: location.latitude, longitude: location.longitude, area_id: areaId }
            });
            if (functionError) throw functionError;

            console.log(`[Sync Success] Background sync for area ${areaId} complete.`);
        } catch (error: any) {
            console.error(`[Sync Failed] Automatic sync for ${areaId} failed:`, error.message);
            // Ensure we unlock the area on failure so it can be tried again later
            await supabase.from('area_sync_log').update({ is_syncing_now: false }).eq('area_id', areaId);
        }
    }, [user]);

    // --- DATA FETCHING FUNCTIONS ---
    const fetchNearbyStations = useCallback(async (lat: number, lon: number) => {
        const { data, error } = await supabase.rpc('fetch_all_station_data', {
            search_term: '', target_latitude: lat, target_longitude: lon
        });

        if (error) {
            console.error("Database Error:", error.message);
            Alert.alert("Error", "Could not fetch nearby stations.");
            setStations([]);
        } else {
            // Show stations within a 50km radius
            const nearby = (data || []).filter(s => s.distance_meters <= 50000);
            setStations(nearby);
        }
    }, []);

    const fetchSearchableAreas = useCallback(async () => {
        // Fetch our predefined list of areas for the search feature
        const { data, error } = await supabase.from('searchable_areas').select('id, name, latitude, longitude');
        if (error) {
            console.error("Could not fetch searchable areas:", error.message);
        } else {
            setAllAreas(data || []);
        }
    }, []);

    // --- INITIAL SCREEN SETUP ---
    const setupScreen = useCallback(async () => {
        setIsLoading(true);
        let location: Location.LocationObject | null = null;

        // Fetch the list of areas for the search feature
        await fetchSearchableAreas();

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required for the best experience.');
                setIsLoading(false); return;
            }
            // Get user's location to center the map initially
            location = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({});
            const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            setUserLocation(coords);
            await fetchNearbyStations(coords.latitude, coords.longitude);
        } catch (error) {
            console.error("Setup Error:", error);
            // Fallback to a default location if user location fails
            const defaultLocation = { latitude: 6.5244, longitude: 3.3792 }; // Default to Lagos
            setUserLocation(defaultLocation);
            await fetchNearbyStations(defaultLocation.latitude, defaultLocation.longitude);
        }

        setIsLoading(false);
        // Once setup is done, run a sync check for the user's current area
        if (location) {
            handleAutomaticSyncCheck(location.coords);
        }
    }, [fetchNearbyStations, handleAutomaticSyncCheck, fetchSearchableAreas]);

    useEffect(() => {
        // Re-run setup every time the user navigates to this tab
        if (isFocused) {
            setupScreen();
        }
    }, [isFocused, user, setupScreen]);

    // --- DYNAMIC SEARCH LOGIC ---
    const filteredAreas = useMemo(() => {
        if (!searchQuery) return []; // Don't show list if search is empty
        return allAreas.filter(area =>
            area.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, allAreas]);

    const handleAreaSelection = async (area: SearchableArea) => {
        console.log(`[UI] User selected ${area.name}.`);
        Keyboard.dismiss(); // Hide the keyboard
        setIsSearching(false);
        setSearchQuery(area.name); // Show the selected area name in the input

        const newRegion: Region = {
            latitude: area.latitude,
            longitude: area.longitude,
            latitudeDelta: 0.1, // A good zoom level for a neighborhood
            longitudeDelta: 0.1,
        };

        // 1. Animate map to the selected area for a smooth transition
        mapViewRef.current?.animateToRegion(newRegion, 1000); // 1-second animation

        // 2. Fetch stations for the new area
        await fetchNearbyStations(area.latitude, area.longitude);

        // 3. Trigger the background sync check for this new area
        handleAutomaticSyncCheck({ latitude: area.latitude, longitude: area.longitude });
    };

    const handleSearchFocus = () => {
        setIsSearching(true);
        setSearchQuery(''); // Clear previous selection when user wants to search again
    };

    // --- RENDER LOGIC ---
    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={customColors.primaryGold} /></View>;
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapViewRef}
                style={styles.map}
                initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 } : undefined}
                showsUserLocation={true}
                showsMyLocationButton={true}
                customMapStyle={theme === 'dark' ? mapStyle : []}
                onPress={() => {
                    // If user taps map while searching, exit search mode
                    if (isSearching) {
                        Keyboard.dismiss();
                        setIsSearching(false);
                    }
                }}
            >
                {stations.map((station) => (
                    <Marker key={`marker-${station.id}`} coordinate={{ latitude: station.latitude, longitude: station.longitude }} title={station.name || 'Unnamed Station'} anchor={{ x: 0.5, y: 1 }}>
                        <View style={styles.pin}>
                            <View style={styles.pinCircle}><MaterialCommunityIcons name="gas-station" size={20} color="#fff" /></View>
                            <View style={styles.pinTriangle} />
                        </View>
                    </Marker>
                ))}
            </MapView>

            <View style={[styles.topCard, { top: insets.top + 10 }]}>
                <View style={styles.inputContainer}>
                    <Ionicons name="search" size={20} color={customColors.iconColor} style={styles.inputIcon} />
                    <TextInput
                        ref={textInputRef}
                        placeholder="Enter Location"
                        placeholderTextColor={customColors.iconColor}
                        style={styles.input}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={handleSearchFocus}
                    />
                </View>

                {isSearching && (
                    <View style={styles.searchResultsContainer}>
                        <FlatList
                            data={filteredAreas}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.areaResultItem} onPress={() => handleAreaSelection(item)}>
                                    <Text style={styles.areaResultText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <Text style={styles.noResultsText}>
                                    {searchQuery.length > 1 ? "No matching areas found." : "Start typing to see areas..."}
                                </Text>
                            }
                        />
                    </View>
                )}

                {!isSearching && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.findGasButton]} onPress={() => textInputRef.current?.focus()}>
                            <FindGasIcon color="#fff" width={22} height={22} />
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Find Gas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.addLogButton]} onPress={() => router.push('/fuellog')}>
                            <Ionicons name="water-outline" size={22} color={customColors.darkText} />
                            <Text style={[styles.buttonText, { color: customColors.darkText }]}>Add Fuel Log</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: customColors.cardBackground },
    map: { ...StyleSheet.absoluteFillObject },
    pin: { width: 40, height: 48, alignItems: 'center', justifyContent: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, },
    pinCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E53935', borderColor: '#fff', borderWidth: 2, justifyContent: 'center', alignItems: 'center', zIndex: 2, },
    pinTriangle: { position: 'absolute', bottom: 0, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderTopWidth: 16, borderTopColor: '#fff', borderLeftWidth: 10, borderLeftColor: 'transparent', borderRightWidth: 10, borderRightColor: 'transparent', zIndex: 1, },
    topCard: { position: 'absolute', left: 15, right: 15, padding: 12, borderRadius: 16, backgroundColor: customColors.cardBackground, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: customColors.primaryGold, borderRadius: 12, paddingHorizontal: 12, backgroundColor: customColors.cardBackground, },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 48, fontSize: 16, color: customColors.darkText, fontWeight: '500' },
    buttonContainer: { flexDirection: 'row', marginTop: 10, borderRadius: 12, borderWidth: 1.5, borderColor: customColors.primaryGold, overflow: 'hidden', },
    button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, },
    findGasButton: { backgroundColor: customColors.primaryGold, },
    addLogButton: { backgroundColor: customColors.cardBackground, },
    buttonText: { fontSize: 16, fontWeight: '600' },
    // --- NEW STYLES FOR SEARCH RESULTS ---
    searchResultsContainer: {
        maxHeight: 250,
        marginTop: 8,
        backgroundColor: 'white',
        borderRadius: 12,
        borderColor: '#ddd',
        borderWidth: 1,
        overflow: 'hidden',
    },
    areaResultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    areaResultText: {
        fontSize: 16,
        color: customColors.darkText,
    },
    noResultsText: {
        padding: 15,
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
    },
});