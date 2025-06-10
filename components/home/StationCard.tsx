// File: components/home/StationCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DbStation } from '../../app/(tabs)/home';

interface StationCardProps {
    station: DbStation;
}

// Helper function to format the distance nicely
const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    const kilometers = meters / 1000;
    return `${kilometers.toFixed(1)} km`;
};

const StationCard: React.FC<StationCardProps> = ({ station }) => {
    return (
        <View style={styles.card}>
            <View style={styles.infoContainer}>
                <Text style={styles.stationName} numberOfLines={1}>
                    {station.name || 'Unnamed Station'}
                </Text>
                {station.brand && (
                    <Text style={styles.stationBrand}>Brand: {station.brand}</Text>
                )}
            </View>
            <View style={styles.distanceContainer}>
                <Text style={styles.distanceText}>{formatDistance(station.distance_meters)}</Text>
                <Text style={styles.distanceLabel}>away</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
        flexDirection: 'row', // Align info and distance side-by-side
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1, // Take up most of the space
        marginRight: 10,
    },
    stationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    stationBrand: {
        fontSize: 13,
        color: '#6c757d',
        marginTop: 4,
    },
    distanceContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 128, 0, 0.1)', // Light green background
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    distanceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'green',
    },
    distanceLabel: {
        fontSize: 11,
        color: 'green',
    },
});

export default StationCard;