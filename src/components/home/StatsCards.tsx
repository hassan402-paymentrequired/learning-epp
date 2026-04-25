import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface StatsCardsProps {
  totalAttempts: number;
  averageScore: number;
  totalTimeSpent: number; // in seconds
}

export function StatsCards({ totalAttempts, averageScore, totalTimeSpent }: StatsCardsProps) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      {/* Overall Accuracy - Full Width Bento Card */}
      <View style={[styles.accuracyCard, { borderColor: '#f1f5f9' }]}>
        <View>
          <ThemedText style={styles.caption}>Overall Accuracy</ThemedText>
          <ThemedText style={styles.accuracyValue}>{averageScore.toFixed(0)}%</ThemedText>
        </View>
        <View style={styles.circularProgress}>
          <MaterialIcons name="bolt" size={24} color="#4800b2" />
        </View>
      </View>

      <View style={styles.bottomRow}>
        {/* Total Questions/Attempts - Half Width */}
        <View style={[styles.statBox, { borderColor: '#f1f5f9' }]}>
          <MaterialIcons name="task-alt" size={20} color="#8b5cf6" style={styles.boxIcon} />
          <ThemedText style={styles.caption}>Total Attempts</ThemedText>
          <ThemedText style={styles.statValue}>{totalAttempts.toLocaleString()}</ThemedText>
        </View>

        {/* Time Spent - Half Width */}
        <View style={[styles.statBox, { borderColor: '#f1f5f9' }]}>
          <MaterialIcons name="schedule" size={20} color="#f97316" style={styles.boxIcon} />
          <ThemedText style={styles.caption}>Time Spent</ThemedText>
          <ThemedText style={styles.statValue}>{formatTime(totalTimeSpent)}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  accuracyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // No shadows as requested
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  caption: {
    fontSize: 12,
    color: '#615b6e',
    fontFamily: Fonts.primary.regular,
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 24,
    color: '#4800b2',
    fontFamily: Fonts.primary.bold,
  },
  statValue: {
    fontSize: 18,
    color: '#1a1c1d',
    fontFamily: Fonts.primary.semiBold,
  },
  circularProgress: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#e8dff5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxIcon: {
    marginBottom: 8,
  },
});
