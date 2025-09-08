import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet, View, Text, ActivityIndicator, Alert,
    TouchableOpacity
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { mapStyle } from '../../constants/MapStyle';
import { useAuth } from '../../context/AuthContext';

const getAreaId = (lat: number, lon: number) => `${lat.toFixed(1)}_${lon.toFixed(1)}`;

const customColors = {
    cardBackground: '#FFFBEB',
    primaryGold: '#FBBF24',
    darkText: '#4B5563',
    iconColor: '#8C8C8C',
    closeButton: '#E5E7EB',
};

export default function HomeScreen() {
    const { theme } = useTheme();
    const isFocused = useIsFocused();
    const router = useRouter();
    const mapViewRef = useRef<MapView>(null);
    const tabBarHeight = useBottomTabBarHeight();

    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState<any | null>(null);

    const handleAutomaticSyncCheck = useCallback(async (location: { latitude: number, longitude: number }) => {
        if (!user) return;
        const SYNC_THRESHOLD_DAYS = 30;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - SYNC_THRESHOLD_DAYS);
        const areaId = getAreaId(location.latitude, location.longitude);
        try {
            const { data: log, error: logCheckError } = await supabase.from('area_sync_log').select('*').eq('area_id', areaId).single();
            if (logCheckError && logCheckError.code !== 'PGRST116') throw logCheckError;
            if (log && (log.is_syncing_now || new Date(log.last_synced_at) > thresholdDate)) return;
            console.log(`[Sync Triggered] Area ${areaId} is stale or new.`);
            await supabase.from('area_sync_log').upsert({ area_id: areaId, is_syncing_now: true, last_synced_by: user.id }, { onConflict: 'area_id' });
            const { error: functionError } = await supabase.functions.invoke('super-worker', { body: { latitude: location.latitude, longitude: location.longitude, area_id: areaId } });
            if (functionError) throw functionError;
        } catch (error: any) {
            console.error(`[Sync Failed] Automatic sync for ${areaId} failed:`, error.message);
            await supabase.from('area_sync_log').update({ is_syncing_now: false }).eq('area_id', areaId);
        }
    }, [user]);

    const fetchNearbyStations = useCallback(async (lat: number, lon: number) => {
        const { data, error } = await supabase.rpc('fetch_all_station_data', { search_term: '', target_latitude: lat, target_longitude: lon });
        if (error) {
            console.error("Database Error:", error.message);
            Alert.alert("Error", "Could not fetch nearby stations.");
            setStations([]);
        } else {
            const nearby = (data || []).filter(s => s.distance_meters <= 50000);
            setStations(nearby);
        }
    }, []);

    const setupScreen = useCallback(async () => {
        setIsLoading(true);
        let location: Location.LocationObject | null = null;
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required.');
                setIsLoading(false); return;
            }
            location = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({});
            const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            setUserLocation(coords);
            await fetchNearbyStations(coords.latitude, coords.longitude);
        } catch (error) {
            console.error("Setup Error:", error);
            const defaultLocation = { latitude: 6.5244, longitude: 3.3792 };
            setUserLocation(defaultLocation);
            await fetchNearbyStations(defaultLocation.latitude, defaultLocation.longitude);
        }
        setIsLoading(false);
        if (location) {
            handleAutomaticSyncCheck(location.coords);
        }
    }, [fetchNearbyStations, handleAutomaticSyncCheck]);

    useEffect(() => {
        if (isFocused) {
            setupScreen();
        }
    }, [isFocused, user, setupScreen]);

    const handleMarkerPress = (station: any) => {
        setSelectedStation(station);
        const newRegion: Region = {
            latitude: station.latitude,
            longitude: station.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
        mapViewRef.current?.animateToRegion(newRegion, 500);
    };

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
                    if (selectedStation) {
                        setSelectedStation(null);
                    }
                }}
            >
                {stations.map((station) => (
                    <Marker
                        key={`marker-${station.id}`}
                        coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                        anchor={{ x: 0.5, y: 1 }}
                        onPress={() => handleMarkerPress(station)}
                    >
                        <View style={styles.pin}>
                            <View style={[styles.pinCircle, selectedStation?.id === station.id && styles.pinSelected]}>
                                <MaterialCommunityIcons name="gas-station" size={20} color="#fff" />
                            </View>
                            <View style={styles.pinTriangle} />
                        </View>
                    </Marker>
                ))}
            </MapView>
            
            {selectedStation && (
                <View style={[styles.popupContainer, { bottom: tabBarHeight + 10 }]}>
                    <Text style={styles.popupTitle}>{selectedStation.name || 'Unnamed Station'}</Text>
                    
                    <View style={styles.popupButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.popupButton, styles.closeButton]} 
                            onPress={() => setSelectedStation(null)}
                        >
                            <Text style={[styles.popupButtonText, { color: customColors.darkText }]}>Close</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.popupButton, styles.viewButton]} 
                            onPress={() => router.push(`/station/${selectedStation.id}`)}
                        >
                            <Text style={styles.popupButtonText}>View Station</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: customColors.cardBackground },
    map: { ...StyleSheet.absoluteFillObject },
    pin: { width: 40, height: 48, alignItems: 'center', justifyContent: 'flex-start' },
    pinCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E53935', borderColor: '#fff', borderWidth: 2, justifyContent: 'center', alignItems: 'center', zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, },
    pinSelected: {
        backgroundColor: customColors.primaryGold,
        transform: [{ scale: 1.1 }],
    },
    pinTriangle: { position: 'absolute', bottom: 0, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderTopWidth: 16, borderTopColor: '#fff', borderLeftWidth: 10, borderLeftColor: 'transparent', borderRightWidth: 10, borderRightColor: 'transparent', zIndex: 1, },
    popupContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    popupTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: customColors.darkText,
        marginBottom: 12,
        textAlign: 'center',
    },
    popupButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    popupButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewButton: {
        backgroundColor: customColors.primaryGold,
    },
    closeButton: {
        backgroundColor: customColors.closeButton,
    },
    popupButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});