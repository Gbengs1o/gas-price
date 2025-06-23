// File: app/addStation.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth to get the user

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.web?.config?.googleMaps?.apiKey || 'YOUR_GOOGLE_MAPS_API_KEY_FALLBACK';

interface GooglePlace {
    place_id: string;
    name: string;
    vicinity: string;
    geometry: { location: { lat: number; lng: number; } };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180, dLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
}

export default function AddStationScreen() {
    const { user } = useAuth(); // 2. Get the current logged-in user object
    const [mapRegion, setMapRegion] = useState<Region | null>(null);
    const [pinLocation, setPinLocation] = useState<Region | null>(null);
    const [stationName, setStationName] = useState('');
    const [stationBrand, setStationBrand] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isSmartLoading, setIsSmartLoading] = useState(false);
    const [googleResults, setGoogleResults] = useState<GooglePlace[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            const defaultRegion = { latitude: 9.076, longitude: 7.491, latitudeDelta: 0.02, longitudeDelta: 0.02 };
            if (status === 'granted') {
                try {
                    let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    const region = { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
                    setMapRegion(region); setPinLocation(region);
                } catch { setMapRegion(defaultRegion); setPinLocation(defaultRegion); }
            } else { setMapRegion(defaultRegion); setPinLocation(defaultRegion); }
            setIsInitialLoad(false);
        })();
    }, []);

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert("Login Required", "You must be logged in to add a station.");
            return;
        }
        if (!stationName || !pinLocation) {
            Alert.alert('Missing Info', 'Please provide a station name and ensure the pin is placed correctly.');
            return;
        }
        setIsSubmitting(true);
        try {
            const userLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const distanceToPin = haversineDistance(userLocation.coords.latitude, userLocation.coords.longitude, pinLocation.latitude, pinLocation.longitude);
            if (distanceToPin > 100) {
                throw new Error(`You must be within 100m of the pin to add a station. You are ~${Math.round(distanceToPin)}m away.`);
            }

            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${pinLocation.latitude},${pinLocation.longitude}&radius=50&type=gas_station&key=${GOOGLE_MAPS_API_KEY}`;
            const placesResponse = await fetch(placesUrl);
            const placesData = await placesResponse.json();
            if (!placesData.results || placesData.results.length === 0) {
                throw new Error("Google Maps could not verify a fuel station at this exact location. Please adjust your pin.");
            }
            const googleStation = placesData.results[0];
            const googlePlaceId = googleStation.place_id;

            const { data: existingStation } = await supabase.from('stations').select('id, name').eq('google_place_id', googlePlaceId).maybeSingle();
            if (existingStation) {
                throw new Error(`This station ("${existingStation.name}") already exists in our database.`);
            }

            const { error: insertError } = await supabase.from('stations').insert({
                name: stationName,
                brand: stationBrand || null,
                latitude: pinLocation.latitude,
                longitude: pinLocation.longitude,
                address: googleStation.vicinity || null,
                google_place_id: googlePlaceId,
                user_id: user.id, // --- THE CRUCIAL UPDATE ---
            });
            if (insertError) throw insertError;

            Alert.alert('Success', 'Station verified and added successfully!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert("Verification Failed", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleGoogleSearch = async () => {
        if (!pinLocation) return;
        setIsGoogleLoading(true);
        setGoogleResults([]);
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${pinLocation.latitude},${pinLocation.longitude}&radius=500&type=gas_station&key=${GOOGLE_MAPS_API_KEY}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.results?.length > 0) setGoogleResults(data.results);
            else Alert.alert("No Results", "Google found no fuel stations here.");
        } catch (error) { Alert.alert("API Error", "Could not fetch data from Google."); }
        finally { setIsGoogleLoading(false); }
    };

    const handleAddMyLocation = async () => {
        setIsSmartLoading(true);
        try {
            const userLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = userLocation.coords;
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&rankby=distance&type=gas_station&key=${GOOGLE_MAPS_API_KEY}`;
            const googleResponse = await fetch(url);
            const googleData = await googleResponse.json();
            if (!googleData.results || googleData.results.length === 0) throw new Error("Google found no fuel stations at your current location.");
            const closestStation = googleData.results[0];
            setStationName(closestStation.name);
            setStationBrand(closestStation.name.split(' ')[0]);
            Alert.alert("Location Found", `We've auto-filled the form with data for "${closestStation.name}". Please press "Verify & Add Station" to confirm.`);
        } catch (error: any) { Alert.alert("Smart Add Failed", error.message); }
        finally { setIsSmartLoading(false); }
    };

    if (isInitialLoad) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="green" /></View>;
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Stack.Screen options={{ title: "Pin New Station Location" }}/>
            <MapView style={styles.map} initialRegion={mapRegion!} onRegionChangeComplete={setPinLocation} showsUserLocation={true} />
            <View style={styles.pinContainerPointerEventsNone}><FontAwesome name="map-marker" size={48} color="gold" style={styles.pinShadow} /></View>

            <View style={styles.formContainer}>
                <Text style={styles.instructions}>Move map to place pin, or use helper buttons.</Text>
                
                <View style={styles.helperButtonContainer}>
                    <Pressable style={styles.helperButton} onPress={handleGoogleSearch} disabled={isGoogleLoading || isSmartLoading || isSubmitting}><Text style={styles.helperButtonText}>Search this area</Text></Pressable>
                    <Pressable style={styles.helperButton} onPress={handleAddMyLocation} disabled={isGoogleLoading || isSmartLoading || isSubmitting}><Text style={styles.helperButtonText}>Find My Location</Text></Pressable>
                </View>
                {isGoogleLoading && <ActivityIndicator />}

                {googleResults.length > 0 && (
                    <FlatList
                        data={googleResults}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <Pressable style={styles.resultItem} onPress={() => { setStationName(item.name); setStationBrand(item.name.split(' ')[0]); setGoogleResults([]); }}>
                                <Text style={styles.resultName}>{item.name}</Text><Text style={styles.resultVicinity}>{item.vicinity}</Text>
                            </Pressable>
                        )}
                        style={styles.resultsList}
                    />
                )}

                <TextInput style={styles.input} placeholder="Station Name" value={stationName} onChangeText={setStationName} />
                <TextInput style={styles.input} placeholder="Brand (Optional)" value={stationBrand} onChangeText={setStationBrand} />
                
                <Pressable style={[styles.button, isSubmitting && { backgroundColor: '#9ccc9c' }]} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Add Station</Text>}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    map: { flex: 1 },
    pinContainerPointerEventsNone: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', },
    pinShadow: { textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, },
    formContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20, },
    instructions: { textAlign: 'center', marginBottom: 15, color: 'gray', fontSize: 15, },
    helperButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
    helperButton: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, flex: 1, alignItems: 'center', },
    helperButtonText: { color: '#495057', fontWeight: '600', textAlign: 'center', },
    resultsList: { maxHeight: 150, marginBottom: 10, borderColor: '#eee', borderWidth: 1, borderRadius: 8, },
    resultItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', },
    resultName: { fontWeight: 'bold', },
    resultVicinity: { color: 'gray', fontSize: 12, },
    input: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 8, marginBottom: 12, fontSize: 16, },
    button: { backgroundColor: 'green', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5, },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16, },
});