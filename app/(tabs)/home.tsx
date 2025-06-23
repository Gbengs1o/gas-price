// File: app/(tabs)/home.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Alert, Pressable, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import StationCard from '../../components/home/StationCard';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { mapStyle } from '../../constants/MapStyle';
import { useAuth } from '../../context/AuthContext';

export interface DbStation {
    id: number; created_at: string; name: string; latitude: number; longitude: number; brand: string | null; address: string | null; distance_meters: number; latest_pms_price: number | null; latest_ago_price: number | null; latest_dpk_price: number | null; last_updated_at: string | null; rating: number | null; review_count: number | null;
}

export default function HomeScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isFocused = useIsFocused();
    const mapViewRef = useRef<MapView>(null);
    
    const [stations, setStations] = useState<DbStation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);

    const { user } = useAuth();
    const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());

    const fetchFavouriteIds = useCallback(async () => {
        if (!user) { setFavouriteIds(new Set()); return; }
        const { data } = await supabase.from('favourite_stations').select('station_id').eq('user_id', user.id);
        if (data) { setFavouriteIds(new Set(data.map(f => f.station_id))); }
    }, [user]);

    const handleToggleFavourite = async (station: DbStation) => {
        if (!user) { return Alert.alert("Login Required", "Please sign in to add favourites."); }
        const isCurrentlyFavourite = favouriteIds.has(station.id);
        const originalFavouriteIds = new Set(favouriteIds);
        const newIds = new Set(favouriteIds);
        isCurrentlyFavourite ? newIds.delete(station.id) : newIds.add(station.id);
        setFavouriteIds(newIds);
        if (isCurrentlyFavourite) {
            const { error } = await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: station.id });
            if (error) { Alert.alert("Error", "Could not remove from favourites."); setFavouriteIds(originalFavouriteIds); }
        } else {
            const { error } = await supabase.from('favourite_stations').insert({ user_id: user.id, station_id: station.id });
            if (error) { Alert.alert("Error", "Could not add to favourites."); setFavouriteIds(originalFavouriteIds); }
        }
    };

    const fetchNearbyStations = useCallback(async (lat: number, lon: number) => {
        const { data, error } = await supabase.rpc('get_stations_for_app', { search_term: '', target_latitude: lat, target_longitude: lon });
        if (error) { Alert.alert("Database Error", `Could not fetch nearby stations: ${error.message}`); setStations([]); } 
        else { const nearby = (data || []).filter(s => s.distance_meters <= 50000); setStations(nearby); }
    }, []);

    const setupScreen = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        await Promise.all([ fetchFavouriteIds(), (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permission Denied', 'Location access is needed.'); return; }
            try {
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                setUserLocation(coords);
                await fetchNearbyStations(coords.latitude, coords.longitude);
            } catch (error) { Alert.alert("Location Error", "Could not fetch your location."); }
        })()]);
        if (!isRefresh) setIsLoading(false);
    }, [fetchFavouriteIds, fetchNearbyStations]);

    useEffect(() => { if (isFocused) { setupScreen(); } }, [isFocused, user]);
    
    const onRefresh = async () => { setIsRefreshing(true); await setupScreen(true); setIsRefreshing(false); };
    
    const onStationCardPress = (station: DbStation) => {
        if (mapViewRef.current) {
            mapViewRef.current.animateToRegion({
                latitude: station.latitude, longitude: station.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01,
            }, 1000);
        }
    };

    const handleSyncWithGoogle = async () => {
        if (!user) { return Alert.alert("Login Required", "You must be logged in to sync stations."); }
        if (!userLocation) { return Alert.alert("Location Unknown", "Cannot sync without your current location."); }
        
        setIsSyncing(true);
        try {
            const { data, error } = await supabase.functions.invoke('super-worker', {
                body: { latitude: userLocation.latitude, longitude: userLocation.longitude }
            });

            if (error) throw error;
            
            // --- THIS IS THE FIX ---
            // After the sync completes and the user presses "OK", re-fetch the stations.
            Alert.alert(
                "Sync Complete", 
                `Summary:\n- Stations found on Google: ${data.google_found}\n- New stations added: ${data.stations_added}\n- Stations updated: ${data.stations_updated}\n- Stations deactivated: ${data.stations_deactivated}`,
                [
                    { 
                        text: "OK", 
                        onPress: () => {
                            // Re-fetch the stations to show the new data on screen
                            setIsLoading(true); // Show loading indicator while fetching
                            fetchNearbyStations(userLocation.latitude, userLocation.longitude)
                                .finally(() => setIsLoading(false));
                        } 
                    }
                ]
            );

        } catch (error: any) {
            Alert.alert("Sync Failed", error.message);
        } finally {
            setIsSyncing(false);
        }
    };
    
    if (isLoading) {
        return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView ref={mapViewRef} style={styles.map} initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 } : undefined} showsUserLocation={true} showsMyLocationButton={true} customMapStyle={theme === 'dark' ? mapStyle : []}>
                {stations.map((station) => (<Marker key={`marker-${station.id}`} coordinate={{ latitude: station.latitude, longitude: station.longitude }} title={station.name || 'Unnamed Station'} description={`${(station.distance_meters / 1000).toFixed(1)} km away`}><Ionicons name="location" size={30} color={colors.primary} /></Marker>))}
            </MapView>
            <View style={[styles.listContainer, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
                <Text style={[styles.listTitle, { color: colors.text }]}>Nearby Stations</Text>
                <FlatList data={stations} renderItem={({ item }) => (<StationCard station={item} onPress={() => onStationCardPress(item)} isFavourite={favouriteIds.has(item.id)} onToggleFavourite={() => handleToggleFavourite(item)} />)} keyExtractor={(item) => item.id.toString()} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stations found within 50km.</Text></View>} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} />
            </View>

            <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleSyncWithGoogle} disabled={isSyncing}>
                {isSyncing ? <ActivityIndicator color={colors.primaryText} /> : <Ionicons name="sync" size={30} color={colors.primaryText} />}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16 },
    map: { flex: 1 },
    listContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '50%', backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 20, },
    listTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingVertical: 16, },
    emptyContainer: { paddingTop: 40, alignItems: 'center', },
    emptyText: { fontSize: 16, },
    fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 20, bottom: '48%', borderRadius: 30, elevation: 21, },
});