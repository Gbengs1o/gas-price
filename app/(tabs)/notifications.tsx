import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type AppColors = ReturnType<typeof useTheme>['colors'];

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  station_id: number | null;
}

export default function NotificationsScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    const { user } = useAuth();
    const isFocused = useIsFocused();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) { setNotifications([]); setIsLoading(false); return; }
        const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        if (error) { Alert.alert("Error", "Could not fetch notifications."); }
        else { setNotifications(data || []); }
    }, [user]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotifications();
        setIsRefreshing(false);
    };

    const markAllAsRead = useCallback(async (notifs: Notification[]) => {
        if (!user) return;
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;
        const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        if (!error) { setNotifications(current => current.map(n => ({ ...n, is_read: true }))); }
    }, [user]);

    useEffect(() => {
        if (isFocused) { setIsLoading(true); fetchNotifications().finally(() => setIsLoading(false)); }
    }, [isFocused, fetchNotifications]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isFocused && notifications.length > 0 && notifications.some(n => !n.is_read)) {
            timer = setTimeout(() => { markAllAsRead(notifications); }, 2000);
        }
        return () => clearTimeout(timer);
    }, [isFocused, notifications, markAllAsRead]);
    
    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[styles.notificationCard, { opacity: item.is_read ? 0.7 : 1.0 }]}>
            {!item.is_read && <View style={styles.unreadDot} />}
            <View style={styles.iconContainer}>
                 <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </View>
    );

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="notifications-off-outline" size={60} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>You have no notifications yet.</Text>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
}

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background },
    header: { paddingTop: 40, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: colors.text },
    notificationCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border },
    unreadDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary },
    iconContainer: { marginRight: 16 },
    textContainer: { flex: 1 },
    message: { fontSize: 16, fontWeight: '500', color: colors.text },
    timestamp: { fontSize: 12, marginTop: 4, color: colors.textSecondary },
    emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center', color: colors.textSecondary },
    listContentContainer: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
});