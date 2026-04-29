import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { useThemeColor } from '@/hooks/useThemeColor';
import  api  from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

type LeaderboardEntry = {
  rank: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  statistics: {
    total_score: number;
    total_attempts: number;
    average_score: number;
    highest_score: number;
    total_correct: number;
    total_questions: number;
    accuracy: number;
  };
};

type LeaderboardType = 'all_time' | 'monthly' | 'weekly';
type ExamType = 'JAMB' | 'DLI' | 'UNILAG' | 'GENERAL' | null;

const leaderboardTypeOptions: { label: string; value: LeaderboardType }[] = [
  { label: 'All Time', value: 'all_time' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Week', value: 'weekly' },
];

const examTypeOptions: { label: string; value: ExamType }[] = [
  { label: 'All Exams', value: null },
  { label: 'JAMB', value: 'JAMB' },
  { label: 'DLI', value: 'DLI' },
  { label: 'UNILAG', value: 'UNILAG' },
  { label: 'GENERAL', value: 'GENERAL' },
];

export function Leaderboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [type, setType] = useState<LeaderboardType>('all_time');
  const [examType, setExamType] = useState<ExamType>(null);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  useEffect(() => {
    fetchLeaderboard();
  }, [type, examType]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (examType) params.append('exam_type', examType);

      const response = await api.get(`/leaderboard?${params.toString()}`);
      if (response.data.success) {
        setLeaderboard(response.data.data.leaderboard || []);
        setUserRank(response.data.data.current_user || null);
      }
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return <MaterialIcons name="emoji-events" size={24} color="#FFD700" />;
    } else if (rank === 2) {
      return <MaterialIcons name="emoji-events" size={24} color="#C0C0C0" />;
    } else if (rank === 3) {
      return <MaterialIcons name="emoji-events" size={24} color="#CD7F32" />;
    }
    return (
      <ThemedText style={[styles.rankNumber, { color: textColor }]}>
        #{rank}
      </ThemedText>
    );
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Leaderboard">
      <View style={styles.container}>
        {/* Filters */}
        <View style={[styles.filtersContainer, { borderBottomColor: borderColor }]}>
          <ThemedText style={styles.filterSectionLabel}>Period</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            {leaderboardTypeOptions.map((option) => {
              const isSelected = type === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterButton,
                    isSelected && { backgroundColor: tintColor, borderColor: tintColor },
                    !isSelected && { borderColor },
                  ]}
                  onPress={() => setType(option.value)}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ThemedText style={styles.filterSectionLabel}>Exam</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
          >
            {examTypeOptions.map((option) => {
              const isSelected = examType === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.filterButton,
                    isSelected && { backgroundColor: tintColor, borderColor: tintColor },
                    !isSelected && { borderColor },
                  ]}
                  onPress={() => setExamType(option.value)}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Current User Rank */}
        {userRank && (
          <View
            style={[
              styles.userRankCard,
              {
                backgroundColor: tintColor + '20',
                borderColor: tintColor,
              },
            ]}
          >
            <ThemedText type="subtitle" style={styles.userRankTitle}>
              Your Rank
            </ThemedText>
            <View style={styles.userRankContent}>
              <View style={styles.userRankLeft}>
                {renderRankBadge(userRank.rank)}
                <View style={styles.userRankInfo}>
                  <ThemedText type="subtitle" style={styles.userRankName}>
                    {userRank.user.name}
                  </ThemedText>
                  <ThemedText style={styles.userRankStats} numberOfLines={1}>
                    Rank #{userRank.rank} • {userRank.statistics.total_score} points
                  </ThemedText>
                </View>
              </View>
              <View style={styles.userRankStatsRight}>
                <ThemedText style={styles.statValue}>
                  {userRank.statistics.total_attempts}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Attempts</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Leaderboard List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {leaderboard.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="leaderboard" size={64} color={textColor} style={{ opacity: 0.3 }} />
                <ThemedText style={styles.emptyText}>
                  No rankings available yet
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: textColor, opacity: 0.6 }]}>
                  Complete some exams to appear on the leaderboard
                </ThemedText>
              </View>
            ) : (
              leaderboard.map((entry) => (
                <View
                  key={entry.user.id}
                  style={[
                    styles.leaderboardCard,
                    {
                      backgroundColor: cardBackground,
                      borderColor,
                    },
                    entry.user.id === user?.id && {
                      backgroundColor: tintColor + '15',
                      borderColor: tintColor,
                    },
                  ]}
                >
                  <View style={styles.leaderboardLeft}>
                    {renderRankBadge(entry.rank)}
                    <View style={styles.leaderboardInfo}>
                      <ThemedText
                        type="subtitle"
                        style={styles.leaderboardName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {entry.user.name}
                      </ThemedText>
                      <ThemedText
                        style={styles.leaderboardEmail}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {entry.user.email}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.leaderboardStats}>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>
                        {entry.statistics.total_score}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Points</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>
                        {entry.statistics.accuracy.toFixed(1)}%
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>
                        {entry.statistics.total_attempts}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Attempts</ThemedText>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterSectionLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
    opacity: 0.7,
    fontFamily: Fonts.primary.medium,
  },
  filters: {
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontFamily: Fonts.primary.medium,
  },
  filterTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.primary.semiBold,
  },
  userRankCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  userRankTitle: {
    marginBottom: 12,
    fontSize: 14,
    opacity: 0.8,
    fontFamily: Fonts.primary.medium,
  },
  userRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userRankInfo: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  userRankName: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: Fonts.primary.semiBold,
  },
  userRankStats: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: Fonts.primary.regular,
  },
  userRankStatsRight: {
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Fonts.primary.semiBold,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontFamily: Fonts.primary.regular,
  },
  leaderboardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    fontSize: 20,
    fontFamily: Fonts.primary.bold,
    width: 32,
    textAlign: 'center',
  },
  leaderboardInfo: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  leaderboardName: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: Fonts.primary.semiBold,
  },
  leaderboardEmail: {
    fontSize: 12,
    opacity: 0.6,
    fontFamily: Fonts.primary.regular,
  },
  leaderboardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: Fonts.primary.bold,
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
    fontFamily: Fonts.primary.medium,
  },
});
