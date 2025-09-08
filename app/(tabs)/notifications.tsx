// File: app/notifications.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  station_id: number | null;
}

export default function NotificationsScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const isFocused = useIsFocused();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50); // Limit to the last 50 notifications for performance

        if (error) {
            Alert.alert("Error", "Could not fetch notifications.");
        } else {
            setNotifications(data || []);
        }
    }, [user]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotifications();
        setIsRefreshing(false);
    };

    const markAllAsRead = useCallback(async (notifs: Notification[]) => {
        if (!user) return;
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return; // Nothing to mark

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        
        if (!error) {
            // Update the state locally to avoid a full re-fetch
            setNotifications(current => current.map(n => ({ ...n, is_read: true })));
        }
    }, [user]);

    useEffect(() => {
        if (isFocused) {
            setIsLoading(true);
            fetchNotifications().finally(() => setIsLoading(false));
        }
    }, [isFocused, fetchNotifications]);

    // Mark notifications as read a moment after the screen is viewed
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isFocused && notifications.length > 0 && notifications.some(n => !n.is_read)) {
            timer = setTimeout(() => {
                markAllAsRead(notifications);
            }, 2000); // Wait 2 seconds before marking as read
        }
        return () => clearTimeout(timer);
    }, [isFocused, notifications, markAllAsRead]);
    
    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[styles.notificationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, opacity: item.is_read ? 0.7 : 1.0 }]}>
            {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            <View style={styles.iconContainer}>
                 <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </View>
    );

    if (isLoading) {
        return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="notifications-off-outline" size={60} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You have no notifications yet.</Text>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: {
        paddingTop: 40, // Adjust for status bar
        paddingBottom: 10,
    },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    notificationCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 12, right: 12 },
    iconContainer: { marginRight: 16 },
    textContainer: { flex: 1 },
    message: { fontSize: 16, fontWeight: '500' },
    timestamp: { fontSize: 12, marginTop: 4 },
    emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
});