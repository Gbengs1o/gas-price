// File: app/(tabs)/leaderboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LetterAvatar } from '../../components/LetterAvatar'; // We'll reuse the LetterAvatar

// Define the type for a single leaderboard entry
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  report_count: number;
  rank_number: number;
}

// A component for the top 3 podium
const PodiumItem = ({ user, rank, colors }: { user: LeaderboardEntry, rank: number, colors: typeof Colors.light }) => {
  const rankColors = {
    1: { bg: 'gold', border: '#FFD700' },
    2: { bg: '#EFEFEF', border: '#C0C0C0' },
    3: { bg: '#E4A178', border: '#CD7F32' },
  };
  const isFirst = rank === 1;

  return (
    <View style={[styles.podiumItem, { marginTop: isFirst ? 0 : 30 }]}>
      <View>
        <LetterAvatar avatarUrl={user.avatar_url} name={user.full_name} size={isFirst ? 80 : 60} />
        <View style={[styles.rankBadge, { backgroundColor: rankColors[rank].bg, borderColor: rankColors[rank].border }]}>
          <Text style={styles.rankBadgeText}>{rank}</Text>
        </View>
      </View>
      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>{user.full_name}</Text>
      <Text style={[styles.podiumScore, { color: colors.primary }]}>{user.report_count} reports</Text>
    </View>
  );
};

export default function LeaderboardScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user: currentUser } = useAuth();
    const isFocused = useIsFocused();

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_leaderboard');
        if (error) {
            Alert.alert('Error', 'Could not fetch leaderboard data.');
        } else {
            setLeaderboard(data || []);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchLeaderboard();
        }
    }, [isFocused, fetchLeaderboard]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchLeaderboard();
        setIsRefreshing(false);
    };

    const topThree = leaderboard.slice(0, 3);
    const restOfBoard = leaderboard.slice(3);
    const currentUserRank = leaderboard.find(u => u.user_id === currentUser?.id);

    if (isLoading) {
        return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Ionicons name="trophy" size={40} color={colors.primary} />
                <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Top contributors based on price reports submitted.
                </Text>
            </View>

            {/* Podium Section */}
            {topThree.length >= 3 && (
                <View style={styles.podiumContainer}>
                    <PodiumItem user={topThree[1]} rank={2} colors={colors} />
                    <PodiumItem user={topThree[0]} rank={1} colors={colors} />
                    <PodiumItem user={topThree[2]} rank={3} colors={colors} />
                </View>
            )}

            {/* List for the rest of the users */}
            <FlatList
                data={restOfBoard}
                keyExtractor={(item) => item.user_id}
                style={{ width: '100%' }}
                renderItem={({ item, index }) => (
                    <View style={[styles.listItem, { backgroundColor: item.user_id === currentUser?.id ? colors.primaryOpaque : colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.rank, { color: colors.textSecondary }]}>{item.rank_number}</Text>
                        <LetterAvatar avatarUrl={item.avatar_url} name={item.full_name} size={40} />
                        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.full_name}</Text>
                        <Text style={[styles.score, { color: colors.primary }]}>{item.report_count} reports</Text>
                    </View>
                )}
                ListHeaderComponent={<Text style={[styles.listHeader, { color: colors.text }]}>All Ranks</Text>}
                ListEmptyComponent={restOfBoard.length === 0 && topThree.length > 0 ? null : 
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>The leaderboard is empty. Start reporting prices to get on the board!</Text>
                }
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            />
            
            {/* Current User's Rank at the bottom */}
            {currentUserRank && currentUserRank.rank_number > 3 && (
                <View style={[styles.userRankBanner, { backgroundColor: colors.primary, borderTopColor: colors.cardBorder }]}>
                    <Text style={[styles.rank, { color: colors.primaryText }]}>{currentUserRank.rank_number}</Text>
                    <LetterAvatar avatarUrl={currentUserRank.avatar_url} name={currentUserRank.full_name} size={40} />
                    <Text style={[styles.name, { color: colors.primaryText }]} numberOfLines={1}>Your Rank</Text>
                    <Text style={[styles.score, { color: colors.primaryText }]}>{currentUserRank.report_count} reports</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 30,
        width: '100%',
    },
    podiumItem: {
        flex: 1,
        alignItems: 'center',
    },
    rankBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    rankBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    podiumName: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    podiumScore: {
        fontSize: 12,
        fontWeight: '500',
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    rank: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    score: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userRankBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 16,
        borderTopWidth: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
});