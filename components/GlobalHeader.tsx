// File: components/GlobalHeader.tsx

import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { ThemeToggle } from './ThemeToggle';

export function GlobalHeader() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const isDark = theme === 'dark';

    return (
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
            {/* Blur background effect */}
            <BlurView
                intensity={isDark ? 80 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurContainer}
            />
            
            {/* Gradient overlay for extra depth */}
            <View 
                style={[
                    styles.gradientOverlay, 
                    { 
                        backgroundColor: isDark 
                            ? 'rgba(0, 0, 0, 0.3)' 
                            : 'rgba(255, 255, 255, 0.7)' 
                    }
                ]} 
            />

            {/* Content container */}
            <View style={styles.contentContainer}>
                {/* Left side: Enhanced Profile Icon */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.iconButton,
                        {
                            backgroundColor: pressed 
                                ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                                : 'transparent',
                            transform: [{ scale: pressed ? 0.95 : 1 }]
                        }
                    ]}
                    onPress={() => router.push('/profile')}
                >
                    <View style={[styles.iconContainer, { borderColor: colors.text + '20' }]}>
                        <FontAwesome 
                            name="user-circle-o" 
                            size={16} 
                            color={colors.text} 
                        />
                    </View>
                </Pressable>

                {/* Right side: Enhanced Controls */}
                <View style={styles.rightContainer}>
                    {/* Notifications with badge indicator */}
                    <Pressable 
                        style={({ pressed }) => [
                            styles.iconButton,
                            {
                                backgroundColor: pressed 
                                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                                    : 'transparent',
                                transform: [{ scale: pressed ? 0.95 : 1 }]
                            }
                        ]}
                        onPress={() => router.push('/notifications')}
                    >
                        <View style={styles.notificationContainer}>
                            <View style={[styles.iconContainer, { borderColor: colors.text + '20' }]}>
                                <Ionicons 
                                    name="notifications-outline" 
                                    size={16} 
                                    color={colors.text} 
                                />
                            </View>
                            {/* Optional notification badge */}
                            <View style={[styles.notificationBadge, { backgroundColor: '#FF3B30' }]}>
                                <View style={styles.badgeDot} />
                            </View>
                        </View>
                    </Pressable>

                    {/* Enhanced Theme Toggle Container */}
                    <View style={[styles.themeToggleContainer, { borderColor: colors.text + '15' }]}>
                        <ThemeToggle />
                    </View>
                </View>
            </View>

            {/* Bottom border with gradient */}
            <View 
                style={[
                    styles.bottomBorder,
                    { 
                        backgroundColor: isDark 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.1)' 
                    }
                ]} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    headerWrapper: {
        width: '100%',
        backgroundColor: 'transparent',
        zIndex: 1000,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    contentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        minHeight: 36,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconButton: {
        borderRadius: 6,
        padding: 4,
        transition: 'all 0.15s ease',
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    notificationContainer: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'white',
    },
    badgeDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'white',
    },
    themeToggleContainer: {
        borderRadius: 10,
        borderWidth: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 0,
        marginLeft: 2,
    },
    bottomBorder: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
    },
});