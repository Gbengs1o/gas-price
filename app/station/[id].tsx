// File: app/station/[id].tsx

import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Alert } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Constants from 'expo-constants';

// --- THEME IMPORTS ---
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { mapStyle } from '../../constants/MapStyle';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.web?.config?.googleMaps?.apiKey;

// --- Helper Functions (unchanged) ---
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180, dLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
}
function calculateTravelTime(distanceMeters: number): { walk: string; run: string; drive: string } {
    const walkSpeedKph = 5, runSpeedKph = 10, driveSpeedKph = 30;
    const toMinutes = (speedKph: number) => Math.round(distanceMeters / 1000 / speedKph * 60);
    const formatTime = (minutes: number) => {
        if (minutes < 1) return "< 1 min";
        if (minutes < 60) return `${minutes} min`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };
    return { walk: formatTime(toMinutes(walkSpeedKph)), run: formatTime(toMinutes(runSpeedKph)), drive: formatTime(toMinutes(driveSpeedKph > 0 ? driveSpeedKph : 1)) };
}

// --- Component Types ---
type ThemeColors = typeof Colors.light | typeof Colors.dark;
type StationDetails = { id: number; name: string; latitude: number; longitude: number; brand: string | null; };
type PriceReport = { id: number; fuel_type: string; price: number; notes: string | null; rating: number | null; created_at: string; profiles: { full_name: string | null; } | null; };
type Coords = { latitude: number; longitude: number; };

export default function StationProfileScreen() {
    // --- HOOKS ---
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const isFocused = useIsFocused();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const styles = useMemo(() => getThemedStyles(colors), [colors]);

    // --- STATE ---
    const [station, setStation] = useState<StationDetails | null>(null);
    const [reports, setReports] = useState<PriceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    const [userLocation, setUserLocation] = useState<Coords | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [travelTimes, setTravelTimes] = useState<{ walk: string; run: string; drive: string } | null>(null);

    // --- EFFECTS (Logic Unchanged) ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const stationPromise = supabase.from('stations').select('*').eq('id', id).single();
                const reportsPromise = supabase.from('price_reports').select('*, profiles(full_name)').eq('station_id', id).order('created_at', { ascending: false });
                
                const [{ data: stationData, error: stationError }, { data: reportsData, error: reportsError }] = await Promise.all([stationPromise, reportsPromise]);
                if (stationError) throw stationError;
                if (reportsError) throw reportsError;

                setStation(stationData);
                setReports(reportsData || []);

                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    let location = await Location.getCurrentPositionAsync({});
                    setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
                }
            } catch (error: any) {
                Alert.alert("Error", `Failed to fetch station data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        if (isFocused) {
            fetchAllData();
        }
    }, [isFocused, id]);

    useEffect(() => {
        if (station && userLocation) {
            const dist = haversineDistance(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude);
            setDistance(dist);
            setTravelTimes(calculateTravelTime(dist));
        }
    }, [station, userLocation]);

    // --- HANDLERS (Logic Unchanged) ---
    const handleReportPress = async () => {
        if (!user) {
            Alert.alert("Login Required", "You must be signed in to submit a report.");
            return;
        }
        if (!station) return;
        setIsCheckingLocation(true);
        try {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const dist = haversineDistance(location.coords.latitude, location.coords.longitude, station.latitude, station.longitude);
            if (dist <= 100) {
                router.push(`/report/submit?stationId=${station.id}&stationName=${station.name}&lat=${station.latitude}&lon=${station.longitude}`);
            } else {
                Alert.alert("Too Far Away", `You must be within 100 meters of this station to submit a report. You are currently about ${Math.round(dist)} meters away.`);
            }
        } catch (error) {
            Alert.alert("Location Error", "Could not get your current location.");
        } finally {
            setIsCheckingLocation(false);
        }
    };

    // --- RENDER LOGIC (Themed) ---
    if (loading) { return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>; }
    if (!station) { return <View style={styles.centered}><Text style={{ color: colors.text }}>Station not found.</Text></View>; }

    const latestPrices: { [key: string]: PriceReport } = {};
    reports.forEach(report => {
        if (!latestPrices[report.fuel_type]) latestPrices[report.fuel_type] = report;
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
            <Stack.Screen options={{ title: 'Station Details', headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.cardBackground }, headerTitleStyle: { color: colors.text } }} />
            <View style={styles.header}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationBrand}>{station.brand || "Brand not specified"}</Text>
            </View>

            <MapView style={styles.map} initialRegion={{ latitude: station.latitude, longitude: station.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04, }} showsUserLocation={true} customMapStyle={theme === 'dark' ? mapStyle : []}>
                <Marker coordinate={{ latitude: station.latitude, longitude: station.longitude }} pinColor={colors.primary} title={station.name} />
                {userLocation && GOOGLE_MAPS_API_KEY && (
                    <MapViewDirections origin={userLocation} destination={{ latitude: station.latitude, longitude: station.longitude }} apikey={GOOGLE_MAPS_API_KEY} strokeWidth={4} strokeColor={theme === 'dark' ? colors.primary : 'blue'} />
                )}
            </MapView>

            <View style={styles.content}>
                <Pressable style={[styles.reportButton, isCheckingLocation && styles.buttonDisabled]} onPress={handleReportPress} disabled={isCheckingLocation}>
                    {isCheckingLocation ? <ActivityIndicator color={colors.primaryText} /> : (<><FontAwesome name="edit" size={20} color={colors.primaryText} /><Text style={styles.reportButtonText}>Submit a Price Report</Text></>)}
                </Pressable>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Travel Estimates</Text>
                    {distance !== null && travelTimes ? (
                         <View style={styles.travelGrid}>
                            <View style={styles.travelBox}><FontAwesome name="male" size={24} color={colors.text} /><Text style={styles.travelTime}>{travelTimes.walk}</Text><Text style={styles.travelLabel}>Walk</Text></View>
                            <View style={styles.travelBox}><FontAwesome name="rocket" size={24} color={colors.text} /><Text style={styles.travelTime}>{travelTimes.run}</Text><Text style={styles.travelLabel}>Run</Text></View>
                            <View style={styles.travelBox}><FontAwesome name="car" size={24} color={colors.text} /><Text style={styles.travelTime}>{travelTimes.drive}</Text><Text style={styles.travelLabel}>Vehicle</Text></View>
                        </View>
                    ) : <Text style={styles.noDataText}>Getting your location to calculate times...</Text>}
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Latest Prices</Text>
                    {Object.keys(latestPrices).length > 0 ? (
                        <View style={styles.priceGrid}>
                            {Object.entries(latestPrices).map(([fuel, report]) => (
                                <View key={fuel} style={styles.priceBox}>
                                    <Text style={styles.fuelType}>{fuel}</Text>
                                    <Text style={styles.price}>₦{report.price}</Text>
                                    <Text style={styles.reportTime}>updated {new Date(report.created_at).toLocaleDateString()}</Text>
                                </View>
                            ))}
                        </View>
                    ) : <Text style={styles.noDataText}>No price reports yet. Be the first!</Text>}
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Reports ({reports.length})</Text>
                    {reports.length > 0 ? reports.map(report => (
                        <View key={report.id} style={styles.reportCard}>
                            <Text style={styles.reportHeader}><Text style={{fontWeight: 'bold'}}>{report.profiles?.full_name || 'A User'}</Text> reported <Text style={{fontWeight: 'bold'}}>{report.fuel_type}</Text> at <Text style={{fontWeight: 'bold'}}>₦{report.price}</Text></Text>
                            {report.rating && <Text style={styles.ratingText}>Rating: {'⭐'.repeat(report.rating)}</Text>}
                            {report.notes && <Text style={styles.reportNotes}>"{report.notes}"</Text>}
                            <Text style={styles.reportTime}>{new Date(report.created_at).toLocaleString()}</Text>
                        </View>
                    )) : <Text style={styles.noDataText}>No recent reports.</Text>}
                </View>
            </View>
        </ScrollView>
    );
}

// --- THEMED STYLESHEET ---
const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContentContainer: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
    stationName: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    stationBrand: { fontSize: 16, color: colors.textSecondary },
    map: { width: '100%', height: 250 },
    content: { padding: 20 },
    reportButton: { flexDirection: 'row', backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    reportButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    buttonDisabled: { opacity: 0.7 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: colors.text },
    travelGrid: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.cardBackground, paddingVertical: 15, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder },
    travelBox: { alignItems: 'center', padding: 10 },
    travelTime: { fontSize: 18, fontWeight: 'bold', marginTop: 5, color: colors.text },
    travelLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    priceGrid: { flexDirection: 'row', justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap' },
    priceBox: { alignItems: 'center', backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, minWidth: 100, borderWidth: 1, borderColor: colors.cardBorder },
    fuelType: { fontWeight: 'bold', color: colors.textSecondary },
    price: { fontSize: 22, fontWeight: 'bold', marginVertical: 5, color: colors.primary },
    reportCard: { backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
    reportHeader: { fontSize: 16, lineHeight: 22, color: colors.text },
    ratingText: { marginTop: 5, color: colors.textSecondary },
    reportNotes: { fontStyle: 'italic', color: colors.text, marginVertical: 8, backgroundColor: colors.background, padding: 8, borderRadius: 4 },
    reportTime: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginTop: 5 },
    noDataText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: 10 },
});