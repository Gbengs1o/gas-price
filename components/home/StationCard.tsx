// File: components/home/StationCard.tsx

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { DbStation } from '../../app/(tabs)/home';

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
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return '...';
    }
};

const StationCard: React.FC<StationCardProps> = ({
    station,
    onPress,
    isFavourite,
    onToggleFavourite,
    notificationsEnabled,
    onToggleNotification,
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const handleViewPress = (e: any) => {
        e.stopPropagation();
        router.push(`/station/${station.id}`);
    };

    const handleFavouritePress = (e: any) => {
        e.stopPropagation();
        onToggleFavourite?.();
    };

    const handleNotificationPress = (e: any) => {
        e.stopPropagation();
        onToggleNotification?.();
    };

    return (
        <Pressable
            style={[styles.cardContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            onPress={onPress}
        >
            <View style={styles.topSection}>
                <View style={[styles.iconContainer, { backgroundColor: colors.cardBorder }]}>
                    <Ionicons name="business" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={[styles.stationName, { color: colors.text }]} numberOfLines={1}>{station.name}</Text>
                    
                    <View style={styles.ratingContainer}>
                        {typeof onToggleFavourite === 'function' && (
                            <Pressable onPress={handleFavouritePress} style={styles.iconButton}>
                                <Ionicons
                                    name={isFavourite ? 'heart' : 'heart-outline'}
                                    size={18}
                                    color={isFavourite ? colors.error : colors.textSecondary}
                                />
                            </Pressable>
                        )}
                        {typeof onToggleNotification === 'function' && (
                             <Pressable onPress={handleNotificationPress} style={styles.iconButton}>
                                <Ionicons
                                    name={notificationsEnabled ? 'notifications' : 'notifications-outline'}
                                    size={18}
                                    color={notificationsEnabled ? colors.primary : colors.textSecondary}
                                />
                            </Pressable>
                        )}
                        <Ionicons name="star" size={16} color={colors.primary} />
                        <Text style={[styles.ratingText, { color: colors.text }]}>
                            {station.rating?.toFixed(1) ?? 'N/A'} ({station.review_count ?? 0} reviews)
                        </Text>
                    </View>

                    <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {station.address || 'No address provided'}
                    </Text>
                </View>

                <View style={[styles.priceBox, { borderColor: colors.primary }]}>
                    <Text style={[styles.priceText, { color: colors.text }]}>
                        ₦{station.latest_pms_price ? station.latest_pms_price.toFixed(0) : '---'}/L
                    </Text>
                    <Text style={[styles.lastUpdatedText, { color: colors.textSecondary }]}>
                        Upd: {formatTimeAgo(station.last_updated_at)}
                    </Text>
                </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.bottomSection}>
                <Text style={[styles.distanceText, { color: colors.primary }]}>
                    {station.distance_meters != null
                        ? `Within ${(station.distance_meters / 1000).toFixed(1)} km`
                        : 'Distance not applicable'
                    }
                </Text>
                <Pressable
                    style={({ pressed }) => [ styles.viewButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 } ]}
                    onPress={handleViewPress}
                >
                    <Ionicons name="eye" size={16} color={colors.primaryText} />
                    <Text style={[styles.viewButtonText, { color: colors.primaryText }]}>View</Text>
                </Pressable>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 5,
    },
    infoContainer: {
        flex: 1,
        marginRight: 8,
    },
    stationName: {
        fontSize: 16,
        fontWeight: '600',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    iconButton: {
        marginRight: 8,
        padding: 2,
    },
    ratingText: {
        fontSize: 14,
        marginLeft: 2,
    },
    addressText: {
        fontSize: 12,
        lineHeight: 16,
    },
    priceBox: {
        width: 90,
        height: 60,
        borderWidth: 1.5,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    lastUpdatedText: {
        fontSize: 10,
        marginTop: 2,
    },
    separator: {
        height: 1,
        marginVertical: 10,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
});

export default StationCard;