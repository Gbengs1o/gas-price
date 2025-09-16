import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type AppColors = ReturnType<typeof useTheme>['colors'];

interface InitialLoadingScreenProps {
    message: string;
}

export default function InitialLoadingScreen({ message }: InitialLoadingScreenProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);

    return (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{message}</Text>
        </View>
    );
}

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 16,
        color: colors.text,
    },
});