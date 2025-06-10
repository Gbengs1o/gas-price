// File: app/(tabs)/home.tsx

import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import StationCard from '../../components/home/StationCard';

// Updated interface to include the distance calculated by the database
export interface DbStation {
    id: number;
    created_at: string;
    name: string;
    latitude: number;
    longitude: number;
    brand: string | null;
    address: string | null;
    distance_meters: number; // The new distance field
}

export default function HomeScreen() {
    const [stations, setStations] = useState<DbStation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
    
    const isFocused = useIsFocused();
    const mapViewRef = useRef<MapView>(null);

    // This function now requires the user's location to work
    const fetchNearbyStations = async (lat: number, lon: number) => {
        const { data, error } = await supabase.rpc('nearby_stations', {
            user_lat: lat,
            user_lon: lon,
            search_radius_meters: 50000 // Search within a 50km radius
        });

        if (error) {
            Alert.alert("Database Error", `Could not fetch nearby stations: ${error.message}`);
        } else {
            setStations(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const setupScreen = async () => {
            setIsLoading(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is needed to find nearby stations.');
                setIsLoading(false);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setUserLocation(coords);
                // Now that we have the location, fetch the stations
                await fetchNearbyStations(coords.latitude, coords.longitude);
            } catch (error) {
                Alert.alert("Location Error", "Could not fetch your location.");
                setIsLoading(false);
            }
        };

        if (isFocused) {
            setupScreen();
        }
    }, [isFocused]);

    const onStationCardPress = (station: DbStation) => {
        if (mapViewRef.current) {
            const newRegion = {
                latitude: station.latitude,
                longitude: station.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            mapViewRef.current.animateToRegion(newRegion, 1000);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}><ActivityIndicator size="large" color="green" /><Text>Finding nearby stations...</Text></View>
        );
    }
    
    return (
        <View style={styles.container}>
            <MapView
                ref={mapViewRef}
                style={styles.map}
                initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 } : undefined}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {stations.map((station) => (
                    <Marker
                        key={station.id}
                        coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                        title={station.name || 'Unnamed Station'}
                        description={`${(station.distance_meters / 1000).toFixed(1)} km away`}
                        pinColor="green"
                    />
                ))}
            </MapView>

            <View style={styles.listContainer}>
                <FlatList
                    data={stations}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => onStationCardPress(item)}>
                            <StationCard station={item} />
                        </Pressable>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={<Text style={styles.listTitle}>Nearby Stations</Text>}
                    ListEmptyComponent={<Text style={styles.emptyText}>No stations found within 50km.</Text>}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 150 }}
                />
            </View>

            <Link href="/addStation" asChild>
                <Pressable style={styles.fab}>
                    <Text style={styles.fabIcon}>+</Text>
                </Pressable>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    map: { flex: 1 },
    listContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '45%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: 10, paddingHorizontal: 5, elevation: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 3,
    },
    listTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
    emptyText: { textAlign: 'center', marginTop: 20, color: 'gray' },
    fab: {
        position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
        right: 20, bottom: '42%', backgroundColor: 'green', borderRadius: 30, elevation: 8,
        shadowColor: '#000', shadowRadius: 5, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 },
    },
    fabIcon: { fontSize: 30, color: 'white', lineHeight: 32 },
});