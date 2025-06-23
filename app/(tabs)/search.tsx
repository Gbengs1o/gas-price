// File: app/(tabs)/search.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, SectionList, TextInput, ActivityIndicator, Alert, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import StationCard from '../../components/home/StationCard';
import { DbStation } from './home';
import { FontAwesome } from '@expo/vector-icons';
import { useFilterStore } from '../../stores/useFilterStore';

import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
// --- NEW ---
import { useAuth } from '../../context/AuthContext';
// --- END NEW ---

type Filters = { priceRange: { min: string; max: string }; fuelType: 'PMS' | 'AGO' | 'DPK' | null; sortBy: 'distance' | 'last_update'; };
type ThemeColors = typeof Colors.light | typeof Colors.dark;

const PriceSummary = ({ stations, colors }: { stations: DbStation[], colors: ThemeColors }) => {
    // This component is unchanged
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    const summary = useMemo(() => {
        const stationsWithPrice = stations.filter(s => s.latest_pms_price != null);
        if (stationsWithPrice.length < 2) return null;
        const lowest = stationsWithPrice.reduce((prev, curr) => prev.latest_pms_price! < curr.latest_pms_price! ? prev : curr);
        const highest = stationsWithPrice.reduce((prev, curr) => prev.latest_pms_price! > curr.latest_pms_price! ? prev : curr);
        if (lowest.id === highest.id) return null;
        return { lowest, highest };
    }, [stations]);
    if (!summary) return null;
    return (
        <View style={styles.priceSummaryContainer}>
            <View style={styles.priceSummaryBox}><Text style={styles.priceSummaryLabel}>Lowest</Text><Text style={styles.priceSummaryValue}>₦ {summary.lowest.latest_pms_price?.toLocaleString()}/L</Text><Text style={styles.priceSummaryDistance}>{(summary.lowest.distance_meters / 1000).toFixed(1)}km away</Text></View>
            <View style={styles.priceSummaryDividerContainer}><View style={styles.priceSummaryDivider} /></View>
            <View style={[styles.priceSummaryBox, { alignItems: 'flex-end' }]}><Text style={styles.priceSummaryLabel}>Highest</Text><Text style={styles.priceSummaryValue}>₦ {summary.highest.latest_pms_price?.toLocaleString()}/L</Text><Text style={styles.priceSummaryDistance}>{(summary.highest.distance_meters / 1000).toFixed(1)}km away</Text></View>
        </View>
    );
};

const DistanceHeader = ({ title, colors }: { title: string, colors: ThemeColors }) => {
    // This component is unchanged
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    return (
        <View style={styles.distanceHeaderContainer}><Text style={styles.distanceHeaderTextLeft}>Nearest station</Text><Text style={styles.distanceHeaderTextRight}>{title}</Text></View>
    );
};

export default function SearchScreen() {
    const { theme } = useTheme();
    const colors: ThemeColors = Colors[theme];
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allStations, setAllStations] = useState<DbStation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const locationFilter = useFilterStore((state) => state.location);
    const setLocationFilter = useFilterStore((state) => state.setLocation);
    const [filters, setFilters] = useState<Filters>({ priceRange: { min: '', max: '' }, fuelType: null, sortBy: 'distance', });
    const debouncedSearchQuery = useDebounce(searchQuery, 400);
    const router = useRouter();
    const isFocused = useIsFocused();

    // --- NEW: Add state and functions for managing favourites ---
    const { user } = useAuth();
    const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());

    const fetchFavouriteIds = useCallback(async () => {
        if (!user) {
            setFavouriteIds(new Set());
            return;
        }
        const { data } = await supabase
            .from('favourite_stations')
            .select('station_id')
            .eq('user_id', user.id);
        if (data) {
            setFavouriteIds(new Set(data.map(f => f.station_id)));
        }
    }, [user]);

    const handleToggleFavourite = async (station: DbStation) => {
        if (!user) {
            return Alert.alert("Authentication Required", "Please sign in to add favourites.");
        }
        const isCurrentlyFavourite = favouriteIds.has(station.id);
        const originalFavouriteIds = new Set(favouriteIds);
        
        const newIds = new Set(favouriteIds);
        if (isCurrentlyFavourite) {
            newIds.delete(station.id);
        } else {
            newIds.add(station.id);
        }
        setFavouriteIds(newIds); // Optimistic update

        if (isCurrentlyFavourite) {
            const { error } = await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: station.id });
            if (error) {
                Alert.alert("Error", "Could not remove from favourites.");
                setFavouriteIds(originalFavouriteIds); // Revert on error
            }
        } else {
            const { error } = await supabase.from('favourite_stations').insert({ user_id: user.id, station_id: station.id });
            if (error) {
                Alert.alert("Error", "Could not add to favourites.");
                setFavouriteIds(originalFavouriteIds); // Revert on error
            }
        }
    };
    // --- END NEW ---

    const fetchFilteredStations = useCallback(async () => {
        if (!locationFilter) return;
        setIsLoading(true);
        // --- NEW: Fetch favourites along with station data ---
        await Promise.all([
            fetchFavouriteIds(),
            (async () => {
                const { data, error } = await supabase.rpc('get_stations_for_app', {
                    search_term: debouncedSearchQuery,
                    target_latitude: locationFilter.latitude,
                    target_longitude: locationFilter.longitude,
                    search_radius_meters: 50000,
                });
                if (error) Alert.alert('Search Error', error.message);
                setAllStations(data || []);
            })()
        ]);
        // --- END NEW ---
        setIsLoading(false);
    }, [debouncedSearchQuery, locationFilter, fetchFavouriteIds]); // Added fetchFavouriteIds dependency

    useEffect(() => {
        if (isFocused && locationFilter) fetchFilteredStations();
    }, [isFocused, locationFilter, fetchFilteredStations]);

    useEffect(() => {
        if (isFocused && !locationFilter) {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                const defaultLocation = { name: 'Ibadan', latitude: 7.3776, longitude: 3.9470 };
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    setLocationFilter({ name: 'My Location', latitude: location.coords.latitude, longitude: location.coords.longitude });
                } else {
                    Alert.alert('Permission Denied', 'Defaulting to Ibadan. You can change this in the filters.');
                    setLocationFilter(defaultLocation);
                }
            })();
        }
    }, [isFocused, locationFilter, setLocationFilter]);

    // The rest of your filtering/sorting logic is UNCHANGED
    const filteredAndSortedStations = useMemo(() => {
        let processedData = [...allStations];
        const minPrice = parseFloat(filters.priceRange.min);
        const maxPrice = parseFloat(filters.priceRange.max);
        const isPriceRangeActive = !isNaN(minPrice) || !isNaN(maxPrice);
        processedData = processedData.filter(station => {
            if (filters.fuelType) { const fuelKey = `latest_${filters.fuelType.toLowerCase()}_price` as keyof DbStation; if (station[fuelKey] == null) return false; }
            if (isPriceRangeActive) { const priceKey = `latest_${(filters.fuelType || 'PMS').toLowerCase()}_price` as keyof DbStation; const price = station[priceKey] as number | null; if (price === null) return false; const isAboveMin = isNaN(minPrice) || price >= minPrice; const isBelowMax = isNaN(maxPrice) || price <= maxPrice; return isAboveMin && isBelowMax; }
            return true;
        });
        if (isPriceRangeActive) { const fuelKey = `latest_${(filters.fuelType || 'PMS').toLowerCase()}_price` as keyof DbStation; processedData.sort((a, b) => (a[fuelKey] as number || 99999) - (b[fuelKey] as number || 99999));
        } else if (filters.sortBy === 'last_update') { processedData.sort((a, b) => new Date(b.last_updated_at || 0).getTime() - new Date(a.last_updated_at || 0).getTime()); }
        return processedData;
    }, [allStations, filters]);

    const sectionedStations = useMemo(() => {
        const stationsSortedByDistance = [...filteredAndSortedStations].sort((a, b) => a.distance_meters - b.distance_meters);
        if (stationsSortedByDistance.length === 0) return [];
        const GROUP_INTERVAL_KM = 4;
        const groups: { [key: string]: DbStation[] } = {};
        stationsSortedByDistance.forEach(station => {
            const groupKey = Math.ceil(station.distance_meters / 1000 / GROUP_INTERVAL_KM) * GROUP_INTERVAL_KM;
            const finalGroupKey = groupKey === 0 ? GROUP_INTERVAL_KM : groupKey;
            const title = `Within ${finalGroupKey}km`;
            if (!groups[title]) groups[title] = [];
            groups[title].push(station);
        });
        return Object.keys(groups).map(title => ({ title, data: groups[title] }));
    }, [filteredAndSortedStations]);

    return (
        <View style={styles.container}>
            {/* Modal is UNCHANGED */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                 <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalContent} onPress={() => {}}>
                        <Text style={styles.modalTitle}>Filter & Sort</Text>
                        <Text style={styles.label}>Fuel Type</Text>
                        <View style={styles.optionsContainer}><Pressable style={[styles.optionButton, filters.fuelType === null && styles.optionSelected]} onPress={() => setFilters(prev => ({ ...prev, fuelType: null }))}><Text style={[styles.optionText, filters.fuelType === null && styles.optionTextSelected]}>All</Text></Pressable>{(['PMS', 'AGO', 'DPK'] as const).map(fuel => (<Pressable key={fuel} style={[styles.optionButton, filters.fuelType === fuel && styles.optionSelected]} onPress={() => setFilters(prev => ({ ...prev, fuelType: fuel }))}><Text style={[styles.optionText, filters.fuelType === fuel && styles.optionTextSelected]}>{fuel}</Text></Pressable>))}</View>
                        <Text style={styles.label}>Price Range</Text>
                        <View style={styles.priceRangeContainer}><TextInput style={styles.priceInput} placeholder="Min Price" placeholderTextColor={colors.textSecondary} value={filters.priceRange.min} onChangeText={text => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: text } }))} keyboardType="numeric" /><Text style={{color: colors.text}}> – </Text><TextInput style={styles.priceInput} placeholder="Max Price" placeholderTextColor={colors.textSecondary} value={filters.priceRange.max} onChangeText={text => setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: text } }))} keyboardType="numeric" /></View>
                        <Text style={styles.label}>Sort By</Text>
                        <View style={styles.optionsContainer}>{(['distance', 'last_update'] as const).map(sort => (<Pressable key={sort} style={[styles.optionButton, filters.sortBy === sort && styles.optionSelected]} onPress={() => setFilters(prev => ({ ...prev, sortBy: sort }))}><Text style={[styles.optionText, filters.sortBy === sort && styles.optionTextSelected]}>{sort.replace('_', ' ')}</Text></Pressable>))}</View>
                        <Text style={styles.noteText}>Note: Using the Price Range filter will automatically sort by cheapest price.</Text>
                        <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}><Text style={styles.closeButtonText}>Apply Filters</Text></Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
            {/* Header is UNCHANGED */}
            <View style={styles.header}>
                <View style={styles.searchRow}><View style={styles.searchBarContainer}><FontAwesome name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} /><TextInput style={styles.searchInput} placeholder={`Search stations...`} placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} /></View><Pressable style={styles.filterButton} onPress={() => setModalVisible(true)}><FontAwesome name="sliders" size={20} color={colors.text} /></Pressable></View>
                <Pressable style={styles.locationButton} onPress={() => router.push('/locationSearch')}><FontAwesome name="map-marker" size={16} color={colors.primary} /><Text style={styles.locationButtonText} numberOfLines={1}>Location: {locationFilter?.name || 'Select Location'}</Text></Pressable>
            </View>
            {isLoading ? (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>) 
            : (<SectionList 
                    sections={sectionedStations} 
                    keyExtractor={(item) => item.id.toString()} 
                    ListHeaderComponent={<PriceSummary stations={filteredAndSortedStations} colors={colors} />} 
                    renderSectionHeader={({section: { title }}) => (<DistanceHeader title={title} colors={colors} />)} 
                    // --- NEW: Pass favourite props to StationCard ---
                    renderItem={({ item }) => (
                        <StationCard 
                            station={item} 
                            onPress={() => {}} // onPress here just needs to exist, but router.push on the parent Pressable handles navigation
                            isFavourite={favouriteIds.has(item.id)}
                            onToggleFavourite={() => handleToggleFavourite(item)}
                        />
                    )}
                    // --- END NEW --- 
                    ListEmptyComponent={<Text style={styles.emptyText}>No stations match your criteria.</Text>} 
                    contentContainerStyle={{ paddingBottom: 10 }} 
                    stickySectionHeadersEnabled={true} 
                />
            )}
        </View>
    );
}

// Styles are UNCHANGED
const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.cardBackground, paddingHorizontal: 16, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, flex: 1, borderColor: colors.cardBorder, borderWidth: 1, },
    searchIcon: { paddingLeft: 12, color: colors.textSecondary, },
    searchInput: { height: 42, paddingHorizontal: 10, fontSize: 16, flex: 1, color: colors.text, },
    filterButton: { height: 42, width: 42, borderRadius: 8, backgroundColor: colors.background, borderColor: colors.cardBorder, borderWidth: 1, justifyContent: 'center', alignItems: 'center', },
    locationButton: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.cardBorder, },
    locationButtonText: { color: colors.primary, fontWeight: '600', marginLeft: 8 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, },
    emptyText: { textAlign: 'center', marginTop: 50, color: colors.textSecondary, fontSize: 16 },
    priceSummaryContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', },
    priceSummaryBox: { flex: 1, gap: 2, },
    priceSummaryLabel: { fontSize: 10, color: colors.primary, fontWeight: '500', textTransform: 'uppercase', },
    priceSummaryValue: { fontSize: 16, fontWeight: 'bold', color: colors.text, },
    priceSummaryDistance: { fontSize: 10, color: colors.textSecondary, },
    priceSummaryDividerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    priceSummaryDivider: { height: 2, width: '90%', backgroundColor: colors.primary, },
    distanceHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.cardBackground, },
    distanceHeaderTextLeft: { fontSize: 16, fontWeight: 'bold', color: colors.text, },
    distanceHeaderTextRight: { fontSize: 14, fontWeight: 'bold', color: colors.primary, },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: colors.cardBackground, padding: 20, paddingBottom: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: colors.text, },
    label: { fontSize: 16, fontWeight: '500', color: colors.text, marginTop: 15, marginBottom: 10 },
    optionsContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: 10 },
    optionButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, alignItems: 'center' },
    optionSelected: { backgroundColor: colors.primary, },
    optionText: { color: colors.primary, fontWeight: '600', textTransform: 'capitalize' },
    optionTextSelected: { color: colors.primaryText, },
    priceRangeContainer: { flexDirection: 'row', alignItems: 'center' },
    priceInput: { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, padding: 10, textAlign: 'center', color: colors.text, backgroundColor: colors.background, },
    noteText: { fontSize: 12, color: colors.textSecondary, marginTop: 5, textAlign: 'center' },
    closeButton: { backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    closeButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: 'bold' },
});