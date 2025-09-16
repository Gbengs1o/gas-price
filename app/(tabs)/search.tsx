// File: app/(tabs)/search.tsx
// NO CHANGES ARE NEEDED IN THIS FILE. IT WILL AUTOMATICALLY USE THE NEW PURPLE THEME.

import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabase';
import { useFilterStore } from '../../stores/useFilterStore';
import { DbStation as OriginalDbStation } from './home';
import StationCard from './StationCard';

export type DbStation = OriginalDbStation & {
    average_rating?: number | null;
    amenities?: string[] | null;
    products?: string[] | null;
};

type AppColors = ReturnType<typeof useTheme>['colors'];

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 40,
        paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchBarContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.searchBar.background, borderRadius: 12, flex: 1,
        borderColor: colors.searchBar.border, borderWidth: 1.5,
        paddingHorizontal: 12,
    },
    inputIcon: { color: colors.searchBar.icon, marginRight: 8 },
    searchInput: {
        height: 48, fontSize: 16, flex: 1,
        color: colors.searchBar.text, fontWeight: '500',
    },
    clearButton: { marginLeft: 8, padding: 4 },
    mapButton: {
        height: 48, paddingHorizontal: 20, borderRadius: 12,
        backgroundColor: colors.searchBar.background,
        borderColor: colors.searchBar.border, borderWidth: 1.5,
        justifyContent: 'center', alignItems: 'center',
    },
    mapButtonText: { color: colors.searchBar.text, fontWeight: '600', fontSize: 16 },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
    chipButton: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.searchBar.background,
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 10, borderWidth: 1.5,
        borderColor: colors.searchBar.border, gap: 6,
    },
    chipButtonText: { color: colors.searchBar.text, fontWeight: '500' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    emptyText: { textAlign: 'center', marginTop: 50, color: colors.textSecondary, fontSize: 16 },
    priceSummaryContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
    priceSummaryBox: { flex: 1, gap: 2 },
    priceSummaryLabel: { fontSize: 10, color: colors.primary, fontWeight: '500', textTransform: 'uppercase' },
    priceSummaryValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    priceSummaryDistance: { fontSize: 10, color: colors.textSecondary },
    priceSummaryDividerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    priceSummaryDivider: { height: 2, width: '90%', backgroundColor: colors.primary },
    distanceHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.card },
    distanceHeaderTextLeft: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    distanceHeaderTextRight: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', maxWidth: 400, backgroundColor: colors.card, borderRadius: 12, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15, textAlign: 'center' },
    brandRow: { justifyContent: 'space-around', flexDirection: 'row' },
    brandItem: { alignItems: 'center', paddingVertical: 10, width: '33%', gap: 8 },
    brandIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    brandItemText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500', textAlign: 'center' },
});

const PriceSummary = React.memo(({ stations, colors }: { stations: DbStation[], colors: AppColors }) => {
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
});

const DistanceHeader = React.memo(({ title, colors }: { title: string, colors: AppColors }) => {
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    return (
        <View style={styles.distanceHeaderContainer}><Text style={styles.distanceHeaderTextLeft}>Nearest station</Text><Text style={styles.distanceHeaderTextRight}>{title}</Text></View>
    );
});


export default function SearchScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);

    const router = useRouter();
    const isFocused = useIsFocused();
    const locationFilter = useFilterStore((state) => state.location);
    const setLocationFilter = useFilterStore((state) => state.setLocation);
    const filters = useFilterStore((state) => state.filters);
    const [searchQuery, setSearchQuery] = useState('');
    const [allStations, setAllStations] = useState<DbStation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 400);
    const [brandsModalVisible, setBrandsModalVisible] = useState(false);
    const { user } = useAuth();
    const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());
    const POPULAR_BRANDS = ["Mobil", "NNPC", "Rainoil", "Conoil", "PPMC", "Total", "Ascon Oil", "OANDO"];

    // ... (All logic functions remain the same) ...
    const handleBrandSelect = (brandName: string) => {
        setSearchQuery(brandName);
        setBrandsModalVisible(false);
    };

    const fetchFavouriteIds = useCallback(async () => {
        if (!user) { setFavouriteIds(new Set()); return; }
        const { data } = await supabase.from('favourite_stations').select('station_id').eq('user_id', user.id);
        if (data) { setFavouriteIds(new Set(data.map(f => f.station_id))); }
    }, [user]);

    const handleToggleFavourite = async (station: DbStation) => {
        if (!user) { return Alert.alert("Authentication Required", "Please sign in to add favourites."); }
        const isCurrentlyFavourite = favouriteIds.has(station.id);
        const originalFavouriteIds = new Set(favouriteIds);
        const newIds = new Set(favouriteIds);
        if (isCurrentlyFavourite) { newIds.delete(station.id); } else { newIds.add(station.id); }
        setFavouriteIds(newIds);
        if (isCurrentlyFavourite) {
            const { error } = await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: station.id });
            if (error) { Alert.alert("Error", "Could not remove from favourites."); setFavouriteIds(originalFavouriteIds); }
        } else {
            const { error } = await supabase.from('favourite_stations').insert({ user_id: user.id, station_id: station.id });
            if (error) { Alert.alert("Error", "Could not add to favourites."); setFavouriteIds(originalFavouriteIds); }
        }
    };

    const fetchFilteredStations = useCallback(async () => {
        if (!locationFilter) return;
        setIsLoading(true);

        const { data: baseStations, error: rpcError } = await supabase.rpc('get_stations_for_app', {
            search_term: debouncedSearchQuery,
            target_latitude: locationFilter.latitude,
            target_longitude: locationFilter.longitude,
            search_radius_meters: 50000,
        });

        if (rpcError || !baseStations || baseStations.length === 0) {
            setAllStations([]);
            setIsLoading(false);
            if (rpcError) Alert.alert('Search Error', rpcError.message);
            return;
        }

        const stationIds = baseStations.map(station => station.id);

        const [allReportsResponse, _] = await Promise.all([
            supabase
                .from('price_reports')
                .select('station_id, rating, amenities_update, payment_methods_update, fuel_type, other_fuel_prices')
                .in('station_id', stationIds),
            fetchFavouriteIds()
        ]);

        const amenitiesMap = new Map<number, Set<string>>();
        const ratingsMap = new Map<number, { sum: number; count: number }>();
        const productsMap = new Map<number, Set<string>>();

        if (allReportsResponse.data) {
            for (const report of allReportsResponse.data) {
                const { station_id, rating, amenities_update, payment_methods_update, fuel_type, other_fuel_prices } = report;

                if (rating) {
                    const existingRating = ratingsMap.get(station_id) || { sum: 0, count: 0 };
                    ratingsMap.set(station_id, { sum: existingRating.sum + rating, count: existingRating.count + 1 });
                }

                const allAdditions = [...(amenities_update?.add || []), ...(payment_methods_update?.add || [])];
                if (allAdditions.length > 0) {
                    const existingAmenities = amenitiesMap.get(station_id) || new Set();
                    allAdditions.forEach(amenity => existingAmenities.add(amenity));
                    amenitiesMap.set(station_id, existingAmenities);
                }

                const existingProducts = productsMap.get(station_id) || new Set();
                if (fuel_type === 'PMS') {
                    existingProducts.add('Petrol');
                }
                if (other_fuel_prices) {
                    Object.keys(other_fuel_prices).forEach(productName => existingProducts.add(productName));
                }
                if (existingProducts.size > 0) {
                    productsMap.set(station_id, existingProducts);
                }
            }
        }

        const enrichedStations = baseStations.map(station => {
            const ratingInfo = ratingsMap.get(station.id);
            const amenitiesSet = amenitiesMap.get(station.id);
            const productsSet = productsMap.get(station.id);
            return {
                ...station,
                amenities: amenitiesSet ? Array.from(amenitiesSet) : [],
                average_rating: ratingInfo ? ratingInfo.sum / ratingInfo.count : null,
                products: productsSet ? Array.from(productsSet) : [],
            };
        });

        setAllStations(enrichedStations);
        setIsLoading(false);
    }, [debouncedSearchQuery, locationFilter, fetchFavouriteIds]);

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
    
    const filteredAndSortedStations = useMemo(() => {
        const FUEL_TYPE_TO_PRICE_KEY_MAP = {
            'Petrol': 'latest_pms_price',
            'Diesel': 'latest_ago_price',
            'Gas': 'latest_lpg_price',
            'Kerosine': 'latest_dpk_price',
        };

        let processedData = [...allStations];

        const minPrice = parseFloat(filters.priceRange.min);
        const maxPrice = parseFloat(filters.priceRange.max);
        const isPriceRangeActive = !isNaN(minPrice) || !isNaN(maxPrice);

        processedData = processedData.filter(station => {
            if (filters.fuelType) {
                const hasFuel = (station.products || []).includes(filters.fuelType);
                if (!hasFuel) {
                    return false;
                }
            }
            
            if (isPriceRangeActive && filters.fuelType) {
                const priceKey = FUEL_TYPE_TO_PRICE_KEY_MAP[filters.fuelType] as keyof DbStation;
                if (!priceKey) return true; 

                const price = station[priceKey] as number | null;
                if (price == null) return false;

                const isAboveMin = isNaN(minPrice) || price >= minPrice;
                const isBelowMax = isNaN(maxPrice) || price <= maxPrice;

                if (!(isAboveMin && isBelowMax)) {
                    return false;
                }
            }

            if (filters.rating > 0 && (station.average_rating || 0) < filters.rating) {
                return false;
            }
            if (filters.amenities.length > 0) {
                const stationAmenities = new Set(station.amenities || []);
                const hasAllAmenities = filters.amenities.every(required => stationAmenities.has(required));
                if (!hasAllAmenities) return false;
            }
            
            return true;
        });

        if (isPriceRangeActive && filters.fuelType && FUEL_TYPE_TO_PRICE_KEY_MAP[filters.fuelType]) {
            const fuelKey = FUEL_TYPE_TO_PRICE_KEY_MAP[filters.fuelType] as keyof DbStation;
            processedData.sort((a, b) => (a[fuelKey] as number || 99999) - (b[fuelKey] as number || 99999));
        } else if (filters.sortBy === 'last_update') {
            processedData.sort((a, b) => new Date(b.last_updated_at || 0).getTime() - new Date(a.last_updated_at || 0).getTime());
        }
        
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
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchBarContainer}>
                        <FontAwesome name="map-marker" size={18} style={styles.inputIcon} />
                        <TextInput style={styles.searchInput} placeholder={`Search...`} placeholderTextColor={colors.searchBar.icon} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                <FontAwesome name="times-circle" size={18} color={colors.searchBar.icon} />
                            </Pressable>
                        )}
                    </View>
                    <Pressable style={styles.mapButton} onPress={() => router.push('/home')}>
                        <Text style={styles.mapButtonText}>Map</Text>
                    </Pressable>
                </View>
                <View style={styles.buttonRow}>
                    <Pressable style={styles.chipButton} onPress={() => router.push('/filter')}>
                        <FontAwesome name="sliders" size={20} color={colors.searchBar.text} />
                    </Pressable>
                    <Pressable style={styles.chipButton} onPress={() => setBrandsModalVisible(true)}>
                         <MaterialCommunityIcons name="gas-station" size={16} color={colors.searchBar.text} />
                        <Text style={styles.chipButtonText}>Brands</Text>
                    </Pressable>
                     <Pressable style={styles.chipButton} onPress={() => router.push('/locationSearch')}>
                        <Text style={styles.chipButtonText} numberOfLines={1}>{locationFilter?.name || 'Select'}</Text>
                        <FontAwesome name="angle-down" size={16} color={colors.searchBar.text} />
                    </Pressable>
                </View>
            </View>

            <Modal
                animationType="fade" transparent={true} visible={brandsModalVisible}
                onRequestClose={() => { setBrandsModalVisible(!brandsModalVisible); }}
            >
             <Pressable style={styles.modalOverlay} onPress={() => setBrandsModalVisible(false)}>
                <Pressable style={styles.modalContent} onPress={() => {}}>
                    <Text style={styles.modalTitle}>Popular Brands</Text>
                    {[...Array(Math.ceil(POPULAR_BRANDS.length / 3))].map((_, rowIndex) => (
                        <View key={rowIndex} style={styles.brandRow}>
                            {POPULAR_BRANDS.slice(rowIndex * 3, rowIndex * 3 + 3).map((brand) => (
                                <Pressable key={brand} style={styles.brandItem} onPress={() => handleBrandSelect(brand)}>
                                    <View style={styles.brandIconContainer}>
                                        <MaterialCommunityIcons name="gas-station" size={24} color={colors.primary} />
                                    </View>
                                    <Text style={styles.brandItemText}>{brand}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ))}
                </Pressable>
             </Pressable>
            </Modal>

            {isLoading ? (<View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>)
            : (<SectionList
                    sections={sectionedStations}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={<PriceSummary stations={filteredAndSortedStations} colors={colors} />}
                    renderSectionHeader={({section: { title }}) => (<DistanceHeader title={title} colors={colors} />)}
                    renderItem={({ item }) => (
                        <StationCard
                            station={item}
                            onPress={() => router.push({ pathname: `/station/${item.id}`, params: { name: item.name }})}
                            isFavourite={favouriteIds.has(item.id)}
                            onToggleFavourite={() => handleToggleFavourite(item)}
                        />
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No stations match your criteria.</Text>}
                    contentContainerStyle={{ paddingBottom: 150 }}
                    stickySectionHeadersEnabled={true}
                />
            )}
        </View>
    );
}