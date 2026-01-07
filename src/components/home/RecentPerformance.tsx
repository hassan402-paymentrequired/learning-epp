import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface RecentAttempt {
  id: number;
  exam_title: string;
  score: number;
  percentage: number;
  completed_at: string;
}

interface RecentPerformanceProps {
  attempts: RecentAttempt[];
}

export function RecentPerformance({ attempts }: RecentPerformanceProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 70) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (attempts.length === 0) {
    return (
      <View style={styles.container}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recent Performance
        </ThemedText>
        <ThemedView
          style={[
            styles.emptyCard,
            {
              backgroundColor: cardBackground,
              borderColor: borderColor,
            },
          ]}
        >
          <MaterialIcons name="assessment" size={48} color={textColor} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No attempts yet</ThemedText>
          <ThemedText style={[styles.emptySubtext, { opacity: 0.6 }]}>
            Start practicing to see your performance here
          </ThemedText>
        </ThemedView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Recent Performance
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {attempts.map((attempt) => {
          const scoreColor = getScoreColor(attempt.percentage);
          return (
            <ThemedView
              key={attempt.id}
              style={[
                styles.card,
                {
                  backgroundColor: cardBackground,
                  borderColor: borderColor,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <ThemedText style={styles.dateText}>{formatDate(attempt.completed_at)}</ThemedText>
                <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
                  <ThemedText style={[styles.scoreText, { color: scoreColor }]}>
                    {attempt.percentage.toFixed(0)}%
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="defaultSemiBold" style={styles.examTitle} numberOfLines={2}>
                {attempt.exam_title}
              </ThemedText>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialIcons name="check-circle" size={16} color={scoreColor} />
                  <ThemedText style={styles.statText}>{attempt.score} correct</ThemedText>
                </View>
              </View>
            </ThemedView>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '700',
      default: 'normal',
    }),
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: 16,
    gap: 12,
  },
  card: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '700',
      default: 'normal',
    }),
  },
  examTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: Fonts.primary.semiBold,
      android: Fonts.primary.semiBold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '600',
      default: 'normal',
    }),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: Fonts.primary.semiBold,
      android: Fonts.primary.semiBold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '600',
      default: 'normal',
    }),
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
