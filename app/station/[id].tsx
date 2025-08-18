// File: app/station/[id].tsx
// FINAL VERSION 2.9: Adds a "Write Review" button in the comments section to navigate to the report chat screen.

import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Alert, Platform, Linking } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Constants from 'expo-constants';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { mapStyle } from '../../constants/MapStyle';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.web?.config?.googleMaps?.apiKey;

// --- HELPER FUNCTIONS ---
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number { const R = 6371e3; const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180; const dPhi = (lat2 - lat1) * Math.PI / 180, dLambda = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2); return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R; }
function calculateTravelTime(distanceMeters: number): { walk: string; run: string; drive: string } { const walkSpeedKph = 5, runSpeedKph = 10, driveSpeedKph = 30; const toMinutes = (speedKph: number) => Math.round(distanceMeters / 1000 / speedKph * 60); const formatTime = (minutes: number) => { if (minutes < 1) return "< 1 min"; if (minutes < 60) return `${minutes} min`; return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }; return { walk: formatTime(toMinutes(walkSpeedKph)), run: formatTime(toMinutes(runSpeedKph)), drive: formatTime(toMinutes(driveSpeedKph > 0 ? driveSpeedKph : 1)) }; }
function formatTimestamp(dateString: string): string { const date = new Date(dateString); const now = new Date(); const hours = Math.floor((now.getTime() - date.getTime()) / 1000 / 3600); if (hours < 1) return 'Updated just now'; if (hours < 24) return `Updated ${hours}h ago`; return `On ${date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`; }
function normalizeFuelName(dbName: string): string { const name = dbName.toLowerCase(); if (name.includes('pms') || name.includes('petrol')) return 'Petrol'; if (name.includes('gas')) return 'Gas'; if (name.includes('diesel') || name.includes('ago')) return 'Diesel'; if (name.includes('kerosine') || name.includes('dpk')) return 'Kerosine'; return dbName.charAt(0).toUpperCase() + dbName.slice(1); }

// --- COMPONENT TYPES ---
type ThemeColors = typeof Colors.light | typeof Colors.dark;
type StationDetails = { id: number; name: string; latitude: number; longitude: number; brand: string | null; amenities: string[] | null; payment_methods: string[] | null; };
type PriceReport = { id: number; user_id: string; fuel_type: string; price: number | null; notes: string | null; rating: number | null; created_at: string; profiles: { full_name: string | null; avatar_url?: string; } | null; other_fuel_prices: { [key: string]: number } | null; amenities_update: { add: string[] } | null; payment_methods_update: { add: string[] } | null; };
type Coords = { latitude: number; longitude: number; };
type PriceHistoryEntry = { price: number; created_at: string };
type PriceHistories = Map<string, PriceHistoryEntry[]>;
type LeaderboardEntry = { userId: string; fullName: string; reportCount: number };

// --- CONSTANTS ---
const amenityIcons: { [key: string]: React.ComponentProps<typeof FontAwesome>['name'] } = { "Supermarket": 'shopping-cart', "Restaurant": 'cutlery', "Car wash": 'car', "ATM": 'money', "POS Machine": 'credit-card', "Air Pump": 'cog', "Restrooms": 'female', "Full service": 'user-plus', "Open 24/7": 'clock-o', "Power": 'bolt', "Cash": 'money', "Transfer": 'send' };
const ALL_FUEL_TYPES = ['Petrol', 'Gas', 'Kerosine', 'Diesel'];
const INITIAL_AMENITIES_LIMIT = 6;
const INITIAL_COMMENTS_LIMIT = 3;

export default function StationProfileScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const isFocused = useIsFocused();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const styles = useMemo(() => getThemedStyles(colors), [colors]);

    // --- STATE MANAGEMENT ---
    const [station, setStation] = useState<StationDetails | null>(null);
    const [reports, setReports] = useState<PriceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    const [userLocation, setUserLocation] = useState<Coords | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [travelTimes, setTravelTimes] = useState<{ walk: string; run: string; drive: string } | null>(null);
    const [historyIndex, setHistoryIndex] = useState<{ [key: string]: number }>({});
    const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const stationPromise = supabase.from('stations').select('*').eq('id', id).single();
                const reportsPromise = supabase.from('price_reports').select('*, profiles(full_name, avatar_url)').eq('station_id', id).order('created_at', { ascending: false });
                const [{ data: stationData, error: stationError }, { data: reportsData, error: reportsError }] = await Promise.all([stationPromise, reportsPromise]);
                if (stationError) throw stationError;
                if (reportsError) throw reportsError;
                setStation(stationData);
                setReports(reportsData || []);
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') { let location = await Location.getCurrentPositionAsync({}); setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude }); }
            } catch (error: any) { Alert.alert("Error", `Failed to fetch station data: ${error.message}`); } finally { setLoading(false); }
        };
        if (isFocused) { fetchAllData(); }
    }, [isFocused, id]);

    // --- DERIVED STATE & MEMOIZATION ---
    useEffect(() => { if (station && userLocation) { const dist = haversineDistance(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude); setDistance(dist); setTravelTimes(calculateTravelTime(dist)); } }, [station, userLocation]);
    useEffect(() => { const initialIndexState: { [key: string]: number } = {}; ALL_FUEL_TYPES.forEach(fuel => { initialIndexState[fuel] = 0; }); setHistoryIndex(initialIndexState); }, [reports]);

    const { priceHistories, allAmenities, ratingSummary, leaderboard } = useMemo(() => {
        const histories: PriceHistories = new Map();
        ALL_FUEL_TYPES.forEach(fuel => histories.set(fuel, []));
        const amenitySet = new Set<string>();
        if (station?.amenities) station.amenities.forEach(a => amenitySet.add(a));
        const paymentSet = new Set<string>();
        if (station?.payment_methods) station.payment_methods.forEach(p => paymentSet.add(p));
        const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0, ratingCount = 0;
        const userReportCounts = new Map<string, { profile: PriceReport['profiles'], count: number }>();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const report of reports) {
            if (report.price && report.fuel_type) { const normFuel = normalizeFuelName(report.fuel_type); if (histories.has(normFuel)) histories.get(normFuel)?.push({ price: report.price, created_at: report.created_at }); }
            if (report.other_fuel_prices) { for (const [fuel, price] of Object.entries(report.other_fuel_prices)) { if (price) { const normFuel = normalizeFuelName(fuel); if (histories.has(normFuel)) histories.get(normFuel)?.push({ price, created_at: report.created_at }); } } }
            
            report.amenities_update?.add?.forEach(a => amenitySet.add(a));
            report.payment_methods_update?.add?.forEach(p => paymentSet.add(p));
            
            if (report.rating && report.rating >= 1 && report.rating <= 5) { ratingDistribution[report.rating]++; totalRating += report.rating; ratingCount++; }
            if (report.user_id && new Date(report.created_at) >= thirtyDaysAgo) { const existing = userReportCounts.get(report.user_id); if (existing) { existing.count++; } else { userReportCounts.set(report.user_id, { profile: report.profiles, count: 1 }); } }
        }

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0";
        const sortedLeaderboard = Array.from(userReportCounts.entries()).map(([userId, data]) => ({ userId, fullName: data.profile?.full_name || 'Anonymous User', reportCount: data.count })).sort((a, b) => b.reportCount - a.reportCount).slice(0, 5);
        
        return { 
            priceHistories: histories, 
            allAmenities: Array.from(new Set([...amenitySet, ...paymentSet])),
            ratingSummary: { average: averageRating, count: ratingCount, distribution: ratingDistribution },
            leaderboard: sortedLeaderboard
        };
    }, [reports, station]);

    // --- EVENT HANDLERS ---
    const handleReportPress = async () => { if (!user) { Alert.alert("Login Required", "You must be signed in to submit a report."); return; } if (!station) return; setIsCheckingLocation(true); try { const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); const dist = haversineDistance(location.coords.latitude, location.coords.longitude, station.latitude, station.longitude); if (dist <= 200) { router.push(`/report/submit?stationId=${station.id}&stationName=${station.name}&lat=${station.latitude}&lon=${station.longitude}`); } else { Alert.alert("Too Far Away", `You must be within 200 meters of this station. You are currently about ${Math.round(dist)} meters away.`); } } catch (error) { Alert.alert("Location Error", "Could not get your current location."); } finally { setIsCheckingLocation(false); } };
    const handleHistoryNavigation = (fuel: string, direction: 'newer' | 'older') => { const history = priceHistories.get(fuel) || []; const maxIndex = history.length > 0 ? history.length - 1 : 0; setHistoryIndex(prev => { const currentIndex = prev[fuel] || 0; if (direction === 'older' && currentIndex < maxIndex) return { ...prev, [fuel]: currentIndex + 1 }; if (direction === 'newer' && currentIndex > 0) return { ...prev, [fuel]: currentIndex - 1 }; return prev; }); };
    const handleTakeMeThere = () => { if (!station) return; const { latitude, longitude, name } = station; const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' }); const latLng = `${latitude},${longitude}`; const label = encodeURIComponent(name); const url = Platform.select({ ios: `${scheme}${label}@${latLng}`, android: `${scheme}${latLng}(${label})` }); if (url) { Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open maps application.")); } };
    const handleWriteReviewPress = async () => { if (!user) { Alert.alert("Login Required", "You must be signed in to write a review."); return; } if (!station) return; setIsCheckingLocation(true); try { const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); const dist = haversineDistance(location.coords.latitude, location.coords.longitude, station.latitude, station.longitude); if (dist <= 200) { router.push(`/report/reportchat?stationId=${station.id}&stationName=${station.name}`); } else { Alert.alert("Too Far Away", `You must be within 200 meters of this station to write a review. You are currently about ${Math.round(dist)} meters away.`); } } catch (error) { Alert.alert("Location Error", "Could not get your current location."); } finally { setIsCheckingLocation(false); } };

    // --- RENDER LOGIC ---
    if (loading) { return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>; }
    if (!station) { return <View style={styles.centered}><Text style={{ color: colors.text }}>Station not found.</Text></View>; }

    const reportsWithComments = reports.filter(r => r.notes && r.notes.trim() !== '');
    const amenitiesToShow = isAmenitiesExpanded ? allAmenities : allAmenities.slice(0, INITIAL_AMENITIES_LIMIT);
    const commentsToShow = isCommentsExpanded ? reportsWithComments : reportsWithComments.slice(0, INITIAL_COMMENTS_LIMIT);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
            <Stack.Screen options={{ title: 'Station Details', headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.cardBackground }, headerTitleStyle: { color: colors.text } }} />
            
            <View style={styles.header}><Text style={styles.stationName}>{station.name}</Text><Text style={styles.stationBrand}>{station.brand || "Brand not specified"}</Text></View>
            <MapView style={styles.map} initialRegion={{ latitude: station.latitude, longitude: station.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }} showsUserLocation={true} customMapStyle={theme === 'dark' ? mapStyle : []}><Marker coordinate={{ latitude: station.latitude, longitude: station.longitude }} pinColor={colors.primary} title={station.name} />{userLocation && GOOGLE_MAPS_API_KEY && <MapViewDirections origin={userLocation} destination={{ latitude: station.latitude, longitude: station.longitude }} apikey={GOOGLE_MAPS_API_KEY} strokeWidth={4} strokeColor={theme === 'dark' ? colors.primary : 'blue'} />}</MapView>

            <View style={styles.content}>
                <View style={styles.detailsCard}><View style={styles.stationIconContainer}><MaterialCommunityIcons name="gas-station" size={40} color={colors.primary} /></View><View style={styles.detailRatingRow}><FontAwesome name="star" size={18} color="#FCBF2D" style={{marginRight: 7}}/><Text style={styles.detailRatingText}>{ratingSummary.average} ({ratingSummary.count} reviews)</Text></View><Text style={styles.detailAddressText}>Address details not available</Text><View style={styles.detailHoursRow}><FontAwesome name="clock-o" size={20} color={colors.textSecondary} style={{marginRight: 8}}/><Text style={styles.detailHoursText}>{allAmenities.includes("Open 24/7") ? "Open 24/7" : "Hours not specified"}</Text></View><Pressable style={styles.takeMeThereButton} onPress={handleTakeMeThere}><Text style={styles.takeMeThereButtonText}>Take me there</Text></Pressable></View>
                <View style={styles.priceReportContainer}><View style={styles.priceReportHeader}><Text style={styles.priceReportTitle}>Station Price</Text></View>{ALL_FUEL_TYPES.map(fuel => { const history = priceHistories.get(fuel) || []; const currentIndex = historyIndex[fuel] || 0; const currentData = history[currentIndex]; const isNewerDisabled = currentIndex === 0; const isOlderDisabled = currentIndex >= history.length - 1; return (<View key={fuel} style={styles.priceRow}><Text style={styles.fuelNameText}>{fuel}</Text><View style={styles.priceInteractionWrapper}><Pressable onPress={() => handleHistoryNavigation(fuel, 'newer')} disabled={isNewerDisabled} style={styles.arrowButton}><FontAwesome name="chevron-left" size={16} color={isNewerDisabled ? colors.disabled : colors.primary} /></Pressable><View style={styles.priceInfoBox}>{currentData ? (<><Text style={styles.priceValueText}>₦{currentData.price}/{fuel === 'Gas' ? 'KG' : 'L'}</Text><Text style={styles.priceTimestampText}>{formatTimestamp(currentData.created_at)}</Text></>) : <Text style={styles.priceValueText}>N/A</Text>}</View><Pressable onPress={() => handleHistoryNavigation(fuel, 'older')} disabled={isOlderDisabled} style={styles.arrowButton}><FontAwesome name="chevron-right" size={16} color={isOlderDisabled ? colors.disabled : colors.primary} /></Pressable></View></View>);})}<Pressable style={[styles.reportPriceButton, isCheckingLocation && styles.buttonDisabled]} onPress={handleReportPress} disabled={isCheckingLocation}>{isCheckingLocation ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.reportPriceButtonText}>Report Price</Text>}</Pressable></View>
                <View style={styles.cardContainer}><Text style={styles.cardTitle}>Travel Estimates</Text>{distance !== null && travelTimes ? (<View style={styles.travelGrid}><View style={styles.travelBox}><FontAwesome name="male" size={28} color={colors.text} /><Text style={styles.travelTime}>{travelTimes.walk}</Text><Text style={styles.travelLabel}>Walk</Text></View><View style={styles.travelBox}><FontAwesome name="rocket" size={28} color={colors.text} /><Text style={styles.travelTime}>{travelTimes.run}</Text><Text style={styles.travelLabel}>Run</Text></View><View style={styles.travelBox}><FontAwesome name="car" size={28} color={colors.text} /><Text style={styles.travelTime}>{travelTimes.drive}</Text><Text style={styles.travelLabel}>Vehicle</Text></View></View>) : <Text style={styles.noDataText}>Calculating travel times...</Text>}</View>
                <View style={styles.cardContainer}><Text style={styles.cardTitle}>Amenities</Text>{allAmenities.length > 0 ? (<View style={styles.amenitiesGrid}>{amenitiesToShow.map(item => (<View key={item} style={styles.amenityItem}><View style={styles.amenityIconContainer}><FontAwesome name={amenityIcons[item] || 'check-circle'} size={24} color={colors.text} /></View><Text style={styles.amenityText}>{item}</Text></View>))}</View>) : <Text style={styles.noDataText}>No amenities reported yet.</Text>}{allAmenities.length > INITIAL_AMENITIES_LIMIT && (<Pressable style={styles.viewAllButton} onPress={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}><Text style={styles.viewAllButtonText}>{isAmenitiesExpanded ? 'Show Less' : 'View all amenities'}</Text></Pressable>)}</View>
                <View style={styles.cardContainer}><Text style={styles.cardTitle}>Ratings & Comments ({ratingSummary.count})</Text>{ratingSummary.count > 0 && (<View style={styles.ratingsSummaryContainer}><View style={styles.ratingDistribution}>{[5, 4, 3, 2, 1].map(star => (<View key={star} style={styles.ratingBarRow}><Text style={styles.ratingBarLabel}>{star}</Text><FontAwesome name="star" size={14} color="#EAAA10" style={{marginHorizontal: 4}}/><View style={styles.ratingBarBackground}><View style={[styles.ratingBarForeground, { width: `${(ratingSummary.distribution[star] / ratingSummary.count) * 100}%` }]} /></View></View>))}</View><View style={styles.averageRatingBox}><Text style={styles.averageRatingValue}>{ratingSummary.average}</Text><Text style={styles.averageRatingLabel}>out of 5</Text></View></View>)}<View style={styles.commentList}>{commentsToShow.length > 0 ? commentsToShow.map((report, index) => (<View key={report.id} style={[styles.commentCard, index === commentsToShow.length - 1 && styles.lastCommentCard]}><View style={styles.commentHeader}><View style={styles.commentUser}><FontAwesome name="user-circle" size={38} color={colors.textSecondary}/><View><Text style={styles.commentUserName}>{report.profiles?.full_name || 'A User'}</Text><View style={styles.commentRating}>{Array.from({length: 5}).map((_, i) => <FontAwesome key={i} name="star" size={14} color={i < (report.rating || 0) ? '#EAAA10' : colors.disabled} />)}</View></View></View><Text style={styles.commentTimestamp}>{formatTimestamp(report.created_at).replace('Updated ', '')}</Text></View><Text style={styles.commentText}>{report.notes}</Text></View>)) : <Text style={styles.noDataText}>No comments yet.</Text>}</View>
                
                {/* --- NEW "WRITE REVIEW" BUTTON --- */}
                <Pressable style={[styles.writeReviewButton, isCheckingLocation && styles.buttonDisabled]} onPress={handleWriteReviewPress} disabled={isCheckingLocation}>
                    {isCheckingLocation ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.writeReviewButtonText}>Write Review</Text>}
                </Pressable>

                {reportsWithComments.length > INITIAL_COMMENTS_LIMIT && (<Pressable style={styles.viewAllButton} onPress={() => setIsCommentsExpanded(!isCommentsExpanded)}><Text style={styles.viewAllButtonText}>{isCommentsExpanded ? 'Show Less' : 'View all comments'}</Text></Pressable>)}</View>
                {leaderboard.length > 0 && (<View style={styles.cardContainer}><View style={styles.leaderboardHeader}><Text style={styles.leaderboardTitle}>Top update gurus</Text><Text style={styles.leaderboardTimespan}>Last 30 days</Text></View><View style={styles.leaderboardList}>{leaderboard.map((guru, index) => (<View key={guru.userId} style={styles.leaderboardRow}><Text style={styles.leaderboardRank}>{index + 1}</Text><FontAwesome name="user-circle" size={26} color={colors.textSecondary} style={styles.leaderboardAvatar} /><Text style={styles.leaderboardName} numberOfLines={1}>{guru.fullName}</Text><Text style={styles.leaderboardCount}>{guru.reportCount}</Text></View>))}</View></View>)}
            </View>
        </ScrollView>
    );
}

// --- STYLESHEET ---
const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContentContainer: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
    stationName: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    stationBrand: { fontSize: 16, color: colors.textSecondary },
    map: { width: '100%', height: 250 },
    content: { padding: 20 },
    detailsCard: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20, ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.5)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 }, android: { elevation: 5 } }) },
    stationIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder, },
    detailRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, },
    detailRatingText: { fontSize: 16, fontWeight: '600', color: colors.text, },
    detailAddressText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 12, },
    detailHoursRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, },
    detailHoursText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, },
    takeMeThereButton: { backgroundColor: '#edae11', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, width: '80%', alignItems: 'center', },
    takeMeThereButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
    buttonDisabled: { opacity: 0.7 },
    noDataText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: 20 },
    cardContainer: { backgroundColor: colors.cardBackground, borderRadius: 10, padding: 15, marginBottom: 20, ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.5)', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }, android: { elevation: 4 } }) },
    cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingBottom: 10 },
    priceReportContainer: { backgroundColor: colors.cardBackground, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
    priceReportHeader: { padding: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
    priceReportTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
    fuelNameText: { fontSize: 14, fontWeight: '500', color: colors.text },
    priceInteractionWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    arrowButton: { paddingHorizontal: 12, paddingVertical: 5 },
    priceInfoBox: { borderWidth: 1, borderColor: colors.primary, borderRadius: 4, paddingVertical: 5, paddingHorizontal: 10, alignItems: 'center', minWidth: 120 },
    priceValueText: { fontSize: 16, fontWeight: '600', color: colors.text },
    priceTimestampText: { fontSize: 10, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
    reportPriceButton: { backgroundColor: colors.primary, padding: 12, alignItems: 'center', justifyContent: 'center', margin: 10, borderRadius: 8 },
    reportPriceButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '500' },
    travelGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    travelBox: { alignItems: 'center', flex: 1 },
    travelTime: { fontSize: 20, fontWeight: 'bold', marginTop: 8, color: colors.text },
    travelLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    amenityItem: { width: '33.33%', alignItems: 'center', marginBottom: 15 },
    amenityIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    amenityText: { fontSize: 11, color: colors.text, textAlign: 'center' },
    ratingsSummaryContainer: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingBottom: 20 },
    ratingDistribution: { flex: 3, marginRight: 15 },
    ratingBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    ratingBarLabel: { fontSize: 14, color: colors.textSecondary, width: 20 },
    ratingBarBackground: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
    ratingBarForeground: { height: '100%', backgroundColor: '#EAAA10', borderRadius: 4 },
    averageRatingBox: { flex: 1.5, backgroundColor: colors.background, borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 10 },
    averageRatingValue: { fontSize: 40, fontWeight: 'bold', color: colors.text },
    averageRatingLabel: { fontSize: 12, color: colors.textSecondary },
    commentList: { marginTop: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingBottom: 15, marginBottom: 15 },
    commentCard: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
    lastCommentCard: { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    commentUser: { flexDirection: 'row', alignItems: 'center' },
    commentUserName: { fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 10 },
    commentRating: { flexDirection: 'row', marginLeft: 10, marginTop: 2 },
    commentTimestamp: { fontSize: 12, color: colors.textSecondary },
    commentText: { fontSize: 14, color: colors.text, lineHeight: 20, marginLeft: 48 },
    // --- "WRITE REVIEW" BUTTON STYLES ---
    writeReviewButton: {
        backgroundColor: '#edae11', // Gold/yellow color from design
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 53,
    },
    writeReviewButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    viewAllButton: { marginTop: 15, paddingVertical: 5, alignItems: 'center' },
    viewAllButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingBottom: 10, marginBottom: 10 },
    leaderboardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    leaderboardTimespan: { fontSize: 10, color: colors.textSecondary },
    leaderboardList: { gap: 12, paddingHorizontal: 5 },
    leaderboardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 8, borderRadius: 10 },
    leaderboardRank: { fontSize: 12, fontWeight: 'bold', color: colors.text, width: 20 },
    leaderboardAvatar: { marginHorizontal: 10 },
    leaderboardName: { fontSize: 12, fontWeight: 'bold', color: colors.text, flex: 1 },
    leaderboardCount: { fontSize: 10, fontWeight: '600', color: colors.text, backgroundColor: colors.cardBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, overflow: 'hidden' },
});