// File: app/(tabs)/StationCard.tsx (or wherever this component is located)

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
// *** THIS IS THE ONLY LINE THAT HAS CHANGED ***
import StationIcon from '../../components/StationIcon'; 
import { DbStation } from './home'; // Assuming home.ts is in the same directory

type AppColors = ReturnType<typeof useTheme>['colors'];

interface StationCardProps {
    station: DbStation;
    onPress: () => void;
    isFavourite?: boolean;
    onToggleFavourite?: () => void;
    notificationsEnabled?: boolean;
    onToggleNotification?: () => void;
}

const formatTimeAgo = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(); } catch { return '...'; }
};

const StationCard: React.FC<StationCardProps> = ({ station, onPress, isFavourite, onToggleFavourite, notificationsEnabled, onToggleNotification }) => {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    const router = useRouter();

    const handleViewPress = (e: any) => { e.stopPropagation(); router.push(`/station/${station.id}`); };
    const handleFavouritePress = (e: any) => { e.stopPropagation(); onToggleFavourite?.(); };
    const handleNotificationPress = (e: any) => { e.stopPropagation(); onToggleNotification?.(); };

    return (
        <Pressable style={styles.cardContainer} onPress={onPress}>
            <View style={styles.topSection}>
                <View style={styles.iconContainer}>
                    <StationIcon color={colors.primary} width={20} height={20} />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.stationName} numberOfLines={1}>{station.name}</Text>
                    <View style={styles.ratingContainer}>
                        {typeof onToggleFavourite === 'function' && (
                            <Pressable onPress={handleFavouritePress} style={styles.iconButton}>
                                <Ionicons name={isFavourite ? 'heart' : 'heart-outline'} size={18} color={isFavourite ? colors.destructive : colors.textSecondary} />
                            </Pressable>
                        )}
                        {typeof onToggleNotification === 'function' && (
                             <Pressable onPress={handleNotificationPress} style={styles.iconButton}>
                                <Ionicons name={notificationsEnabled ? 'notifications' : 'notifications-outline'} size={18} color={notificationsEnabled ? colors.primary : colors.textSecondary} />
                            </Pressable>
                        )}
                        <Ionicons name="star" size={16} color={colors.accent} />
                        <Text style={styles.ratingText}>{station.rating?.toFixed(1) ?? 'N/A'} ({station.review_count ?? 0} reviews)</Text>
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>{station.address || 'No address provided'}</Text>
                </View>
                <View style={styles.priceBox}>
                    <Text style={styles.priceText}>₦{station.latest_pms_price ? station.latest_pms_price.toFixed(0) : '---'}/L</Text>
                    <Text style={styles.lastUpdatedText}>Upd: {formatTimeAgo(station.last_updated_at)}</Text>
                </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.bottomSection}>
                <Text style={styles.distanceText}>
                    {station.distance_meters != null ? `Within ${(station.distance_meters / 1000).toFixed(1)} km` : 'Distance not applicable'}
                </Text>
                <Pressable style={({ pressed }) => [styles.viewButton, pressed && { opacity: 0.8 }]} onPress={handleViewPress}>
                    <Ionicons name="eye" size={16} color={colors.primaryText} />
                    <Text style={styles.viewButtonText}>View</Text>
                </Pressable>
            </View>
        </Pressable>
    );
};

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    cardContainer: { borderRadius: 10, borderWidth: 1, padding: 12, marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border },
    topSection: { flexDirection: 'row', alignItems: 'flex-start' },
    iconContainer: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 5, backgroundColor: 'transparent' },
    infoContainer: { flex: 1, marginRight: 8 },
    stationName: { fontSize: 16, fontWeight: '600', color: colors.text },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    iconButton: { marginRight: 8, padding: 2 },
    ratingText: { fontSize: 14, marginLeft: 2, color: colors.text },
    addressText: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
    priceBox: { width: 90, height: 60, borderWidth: 1.5, borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 5, borderColor: colors.primary },
    priceText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    lastUpdatedText: { fontSize: 10, marginTop: 2, color: colors.textSecondary },
    separator: { height: 1, marginVertical: 10, backgroundColor: colors.border },
    bottomSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    distanceText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    viewButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.primary },
    viewButtonText: { fontSize: 14, fontWeight: '500', marginLeft: 6, color: colors.primaryText },
});

export default StationCard;