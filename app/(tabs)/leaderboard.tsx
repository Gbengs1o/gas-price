// File: app/(tabs)/leaderboard.tsx

import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { LetterAvatar } from '../../components/LetterAvatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type AppColors = ReturnType<typeof useTheme>['colors'];

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  report_count: number;
  rank_number: number;
}

const PodiumItem = ({ user, rank, colors }: { user: LeaderboardEntry, rank: number, colors: AppColors }) => {
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  const rankStyles = {
    1: { bg: colors.podiumGoldBg, border: colors.podiumGold },
    2: { bg: colors.podiumSilverBg, border: colors.podiumSilver },
    3: { bg: colors.podiumBronzeBg, border: colors.podiumBronze },
  };
  const isFirst = rank === 1;

  return (
    <View style={[styles.podiumItem, { marginTop: isFirst ? 0 : 30 }]}>
      <View>
        <LetterAvatar avatarUrl={user.avatar_url} name={user.full_name} size={isFirst ? 80 : 60} />
        <View style={[styles.rankBadge, { backgroundColor: rankStyles[rank].bg, borderColor: rankStyles[rank].border }]}>
          <Text style={styles.rankBadgeText}>{rank}</Text>
        </View>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{user.full_name}</Text>
      <Text style={styles.podiumScore}>{user.report_count} reports</Text>
    </View>
  );
};

export default function LeaderboardScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    const { user: currentUser } = useAuth();
    const isFocused = useIsFocused();

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_leaderboard');
        if (error) { Alert.alert('Error', 'Could not fetch leaderboard data.'); }
        else { setLeaderboard(data || []); }
        setIsLoading(false);
    }, []);

    useEffect(() => { if (isFocused) { fetchLeaderboard(); } }, [isFocused, fetchLeaderboard]);

    const onRefresh = async () => { setIsRefreshing(true); await fetchLeaderboard(); setIsRefreshing(false); };

    const topThree = leaderboard.slice(0, 3);
    const restOfBoard = leaderboard.slice(3);
    const currentUserRank = leaderboard.find(u => u.user_id === currentUser?.id);

    if (isLoading) {
        return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="trophy" size={40} color={colors.primary} />
                <Text style={styles.title}>Leaderboard</Text>
                <Text style={styles.subtitle}>Top contributors based on price reports submitted.</Text>
            </View>
            {topThree.length >= 3 && (
                <View style={styles.podiumContainer}>
                    <PodiumItem user={topThree[1]} rank={2} colors={colors} />
                    <PodiumItem user={topThree[0]} rank={1} colors={colors} />
                    <PodiumItem user={topThree[2]} rank={3} colors={colors} />
                </View>
            )}
            <FlatList
                data={restOfBoard}
                keyExtractor={(item) => item.user_id}
                style={{ width: '100%' }}
                renderItem={({ item }) => (
                    <View style={[styles.listItem, { backgroundColor: item.user_id === currentUser?.id ? colors.primaryOpaque : colors.card }]}>
                        <Text style={styles.rank}>{item.rank_number}</Text>
                        <LetterAvatar avatarUrl={item.avatar_url} name={item.full_name} size={40} />
                        <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
                        <Text style={styles.score}>{item.report_count} reports</Text>
                    </View>
                )}
                ListHeaderComponent={<Text style={styles.listHeader}>All Ranks</Text>}
                ListEmptyComponent={restOfBoard.length === 0 && topThree.length > 0 ? null : <Text style={styles.emptyText}>The leaderboard is empty. Start reporting prices to get on the board!</Text>}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            />
            {currentUserRank && currentUserRank.rank_number > 3 && (
                <View style={styles.userRankBanner}>
                    <Text style={[styles.rank, { color: colors.primaryText }]}>{currentUserRank.rank_number}</Text>
                    <LetterAvatar avatarUrl={currentUserRank.avatar_url} name={currentUserRank.full_name} size={40} />
                    <Text style={[styles.name, { color: colors.primaryText }]} numberOfLines={1}>Your Rank</Text>
                    <Text style={[styles.score, { color: colors.primaryText }]}>{currentUserRank.report_count} reports</Text>
                </View>
            )}
        </View>
    );
}

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    container: { flex: 1, alignItems: 'center', backgroundColor: colors.background },
    header: { width: '100%', padding: 20, paddingTop: 50, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginTop: 8, color: colors.text },
    subtitle: { fontSize: 14, marginTop: 4, textAlign: 'center', color: colors.textSecondary },
    podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 30, width: '100%' },
    podiumItem: { flex: 1, alignItems: 'center' },
    rankBadge: { position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    rankBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    podiumName: { marginTop: 10, fontSize: 14, fontWeight: '600', color: colors.text },
    podiumScore: { fontSize: 12, fontWeight: '500', color: colors.primary },
    listHeader: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 10, color: colors.text },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    rank: { fontSize: 16, fontWeight: 'bold', width: 40, textAlign: 'center', color: colors.textSecondary },
    name: { flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12, color: colors.text },
    score: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    userRankBanner: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, borderTopWidth: 1, backgroundColor: colors.primary, borderTopColor: colors.border },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.textSecondary },
});