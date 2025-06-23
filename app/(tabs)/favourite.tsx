// File: app/(tabs)/favourite.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import StationCard from '../../components/home/StationCard';
import { DbStation } from './home';
import { useAuth } from '../../context/AuthContext';

// --- NEW: A simplified type for what we get back. It includes the notification status. ---
// The rest of the fields match DbStation exactly.
interface FavouriteStationData extends DbStation {
  notifications_enabled: boolean;
}

export default function FavouriteScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const isFocused = useIsFocused();

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // --- MODIFIED: State now holds our new, detailed favourite type ---
    const [allFavourites, setAllFavourites] = useState<FavouriteStationData[]>([]);

    const fetchFavourites = useCallback(async () => {
        if (!user) {
            setAllFavourites([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        // --- MODIFIED: Call our new, powerful database function ---
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

    const handleRemoveFavourite = async (stationIdToRemove: number) => {
        if (!user) return;
        setAllFavourites(current => current.filter(fav => fav.id !== stationIdToRemove));
        const { error } = await supabase.from('favourite_stations').delete().match({ user_id: user.id, station_id: stationIdToRemove });
        if (error) {
            Alert.alert('Error', 'Could not remove favourite. Refreshing list.');
            fetchFavourites();
        }
    };
    
    // --- MODIFIED: This now updates the notification status in the 'favourite_stations' table ---
    const handleToggleNotification = async (favourite: FavouriteStationData) => {
        const newStatus = !favourite.notifications_enabled;

        setAllFavourites(current => current.map(fav => 
            fav.id === favourite.id ? { ...fav, notifications_enabled: newStatus } : fav
        ));

        const { error } = await supabase
            .from('favourite_stations')
            .update({ notifications_enabled: newStatus })
            .match({ user_id: user!.id, station_id: favourite.id }); // Use user_id and station_id to identify the row
        
        if (error) {
            Alert.alert('Error', 'Could not update notification preference. Please try again.');
            fetchFavourites(); // Re-fetch to revert on error
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>My Favourite Stations</Text>
            
            {allFavourites.length > 0 && (
                <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.cardBorder }]}
                    placeholder="Search in your favourites..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            )}
            
            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }}/>
            ) : (
                <FlatList
                    data={filteredFavourites}
                    renderItem={({ item }) => (
                        <StationCard
                            // The `item` now perfectly matches the `DbStation` type, so the card will render correctly
                            station={item}
                            onPress={() => {}}
                            isFavourite={true}
                            onToggleFavourite={() => handleRemoveFavourite(item.id)}
                            notificationsEnabled={item.notifications_enabled}
                            onToggleNotification={() => handleToggleNotification(item)}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {allFavourites.length === 0 
                                    ? "You haven't added any favourite stations yet. Tap the heart icon on any station to add it here."
                                    : "No favourites match your search."
                                }
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', paddingVertical: 20, },
    searchInput: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginHorizontal: 16, marginBottom: 16, },
    list: { flex: 1, },
    emptyContainer: { flex: 1, marginTop: 50, paddingHorizontal: 20, alignItems: 'center', },
    emptyText: { fontSize: 16, textAlign: 'center', },
});