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

export function Leaderboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [type, setType] = useState<LeaderboardType>('all_time');
  const [examType, setExamType] = useState<ExamType>(null);

  const backgroundColor = useThemeColor({}, 'background');
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                type === 'all_time' && { backgroundColor: tintColor },
                { borderColor },
              ]}
              onPress={() => setType('all_time')}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  type === 'all_time' && { color: '#FFFFFF' },
                ]}
              >
                All Time
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                type === 'monthly' && { backgroundColor: tintColor },
                { borderColor },
              ]}
              onPress={() => setType('monthly')}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  type === 'monthly' && { color: '#FFFFFF' },
                ]}
              >
                This Month
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                type === 'weekly' && { backgroundColor: tintColor },
                { borderColor },
              ]}
              onPress={() => setType('weekly')}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  type === 'weekly' && { color: '#FFFFFF' },
                ]}
              >
                This Week
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                examType === null && { backgroundColor: tintColor },
                { borderColor },
              ]}
              onPress={() => setExamType(null)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  examType === null && { color: '#FFFFFF' },
                ]}
              >
                All Exams
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                examType === 'JAMB' && { backgroundColor: tintColor },
                { borderColor },
              ]}
              onPress={() => setExamType('JAMB')}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  examType === 'JAMB' && { color: '#FFFFFF' },
                ]}
              >
                JAMB
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                examType === 'DLI' && { backgroundColor: tintColor },
                { borderColor },
              ]}
              onPress={() => setExamType('DLI')}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  examType === 'DLI' && { color: '#FFFFFF' },
                ]}
              >
                DLI
              </ThemedText>
            </TouchableOpacity>
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
                  <ThemedText style={styles.userRankStats}>
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
                      <ThemedText type="subtitle" style={styles.leaderboardName}>
                        {entry.user.name}
                      </ThemedText>
                      <ThemedText style={styles.leaderboardEmail}>
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
  filters: {
    marginVertical: 4,
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
    fontWeight: '600',
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
  },
  userRankName: {
    fontSize: 18,
    marginBottom: 4,
  },
  userRankStats: {
    fontSize: 12,
    opacity: 0.7,
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
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
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
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  leaderboardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    marginBottom: 4,
  },
  leaderboardEmail: {
    fontSize: 12,
    opacity: 0.6,
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
});
