import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type AppColors = ReturnType<typeof useTheme>['colors'];

interface SubtleActivityIndicatorProps {
    visible: boolean;
}

export default function SubtleActivityIndicator({ visible }: SubtleActivityIndicatorProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);

    if (!visible) {
        return null;
    }

    return (
        <View style={styles.subtleLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
        </View>
    );
}

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    subtleLoading: {
        position: 'absolute',
        top: 120,
        alignSelf: 'center',
        backgroundColor: colors.card,
        padding: 8,
        borderRadius: 20,
        elevation: 6,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});