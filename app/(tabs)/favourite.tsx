// File: app/(tabs)/favourite.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext'; // Re-enabled for dynamic theming
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { DbStation } from './home';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

interface FavouriteStationData extends DbStation {
  notifications_enabled: boolean;
  latest_pms_price: number | null;
  last_updated_at: string | null;
}

const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'No updates';
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return `Up. ${Math.floor(interval)}hrs ago`;
    interval = seconds / 60;
    if (interval > 1) return `Up. ${Math.floor(interval)}mins ago`;
    return "Just now";
};

export default function FavouriteScreen() {
    // --- FIX: Restored dynamic theme switching ---
    const { theme } = useTheme();
    const colors = Colors[theme]; 
    
    const { user } = useAuth();
    const isFocused = useIsFocused();
    const navigation = useNavigation();

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [allFavourites, setAllFavourites] = useState<FavouriteStationData[]>([]);

    const fetchFavourites = useCallback(async () => {
        if (!user) {
            setAllFavourites([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const { data, error } = await supabase.rpc('get_favourite_stations_for_app', {
            p_user_id: user.id
        });

        if (error) {
            Alert.alert('Error Fetching Favourites', error.message);
        } else if (data) {
            setAllFavourites(data as FavouriteStationData[]);
        }
        setIsLoading(false);
    }, [user]);

    const handleRemoveFavourite = (stationIdToRemove: number) => {
        Alert.alert(
            "Remove Favourite",
            "Are you sure you want to remove this station from your favourites?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    onPress: async () => {
                        if (!user) return;
                        setAllFavourites(current => current.filter(fav => fav.id !== stationIdToRemove));
                        const { error } = await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: stationIdToRemove });
                        if (error) {
                            Alert.alert('Error', 'Could not remove favourite. Refreshing list.');
                            fetchFavourites();
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };
    
    const handleToggleNotification = async (favourite: FavouriteStationData) => {
        const newStatus = !favourite.notifications_enabled;
        setAllFavourites(current => current.map(fav => 
            fav.id === favourite.id ? { ...fav, notifications_enabled: newStatus } : fav
        ));
        const { error } = await supabase
            .from('favourite_stations')
            .update({ notifications_enabled: newStatus })
            .match({ user_id: user!.id, station_id: favourite.id });
        if (error) {
            Alert.alert('Error', 'Could not update notification preference. Please try again.');
            fetchFavourites();
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchFavourites();
        }
    }, [isFocused, user, fetchFavourites]);

    const filteredFavourites = useMemo(() => {
        if (!searchTerm.trim()) return allFavourites;
        return allFavourites.filter(fav =>
            fav.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allFavourites]);
    
    const renderFavouriteCard = ({ item }: { item: FavouriteStationData }) => (
        <View style={[styles.cardContainer, { 
            backgroundColor: colors.cardBackground,
            // --- FIX: Use theme color for shadow in dark mode ---
            shadowColor: theme === 'dark' ? '#fff' : '#000',
        }]}>
            <View style={styles.logoContainer}>
                {item.logo_url ? (
                     <Image source={{ uri: item.logo_url }} style={styles.logoImage} resizeMode="contain" />
                ) : (
                    <FontAwesome name="credit-card" size={16} color="#FBC52D" />
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.stationName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.ratingContainer}>
                    <FontAwesome name="star" size={16} color="#FBC52D" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>
                        {item.rating?.toFixed(1) ?? 'N/A'} ({item.review_count ?? 0} reviews)
                    </Text>
                </View>
                <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>{item.address}</Text>
            </View>

            <View style={styles.priceBox}>
                <Text style={[styles.priceText, { color: colors.text }]}>
                    N {item.latest_pms_price?.toFixed(0) || '---'}/L
                </Text>
                <Text style={[styles.updateText, { color: colors.textSecondary }]}>{formatTimeAgo(item.last_updated_at)}</Text>
            </View>
            
            <View style={styles.actionsContainer}>
                 <TouchableOpacity onPress={() => handleToggleNotification(item)} style={styles.actionButton}>
                    <Ionicons 
                        name={item.notifications_enabled ? "notifications" : "notifications-outline"} 
                        size={22} 
                        color={item.notifications_enabled ? colors.primary : colors.textSecondary} 
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveFavourite(item.id)} style={styles.actionButton}>
                    <View style={styles.removeIconCircle}>
                         <FontAwesome name="minus" size={12} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Custom Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                        <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Favourite</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>
            
                <TextInput
                    style={[styles.searchInput, { 
                        backgroundColor: colors.cardBackground, 
                        color: colors.text, 
                        borderColor: colors.cardBorder 
                    }]}
                    placeholder="Search in your favourites..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }}/>
                ) : (
                    <FlatList
                        data={filteredFavourites}
                        renderItem={renderFavouriteCard}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.list}
                        contentContainerStyle={styles.listContentContainer}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {allFavourites.length === 0 
                                        ? "You haven't added any favourite stations yet."
                                        : "No favourites match your search."
                                    }
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

// --- STYLES NOW USE THEME-INDEPENDENT DEFINITIONS ---
// Specific colors are applied dynamically in the component's `style` prop.
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    headerContainer: {
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 2,
        alignItems: 'center',
    },
    headerRight: {
        flex: 1,
    },
    backButtonText: {
        fontSize: 16,
        marginLeft: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
    },
    searchInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginHorizontal: 16,
        marginBottom: 24,
    },
    list: {
        flex: 1,
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    cardContainer: {
        height: 92,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 5,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    logoContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#000000', // Kept black as a design choice
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: 12,
    },
    logoImage: {
        width: 24,
        height: 24,
    },
    infoContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        gap: 3,
    },
    stationName: {
        fontSize: 16,
        fontWeight: '600',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    addressText: {
        fontSize: 12,
        fontWeight: '500',
    },
    priceBox: {
        width: 85,
        height: 60,
        borderLeftWidth: 1,
        borderLeftColor: '#FDEE00', // Kept yellow as an accent color
        paddingLeft: 10,
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 3,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
    },
    updateText: {
        fontSize: 10,
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
        paddingLeft: 8,
    },
    actionButton: {
        padding: 4,
    },
    removeIconCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#B7083C', // Kept red as a consistent action color
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        marginTop: 50,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});