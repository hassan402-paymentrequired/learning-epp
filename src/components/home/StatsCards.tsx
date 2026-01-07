import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface StatsCardsProps {
  totalAttempts: number;
  averageScore: number;
  totalTimeSpent: number; // in seconds
}

export function StatsCards({ totalAttempts, averageScore, totalTimeSpent }: StatsCardsProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = [
    {
      label: 'Total Attempts',
      value: totalAttempts.toString(),
      icon: 'quiz' as const,
      color: tintColor,
    },
    {
      label: 'Average Score',
      value: `${averageScore.toFixed(1)}%`,
      icon: 'trending-up' as const,
      color: '#10b981',
    },
    {
      label: 'Time Spent',
      value: formatTime(totalTimeSpent),
      icon: 'schedule' as const,
      color: '#3b82f6',
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <ThemedView
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: cardBackground,
              borderColor: borderColor,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
            <MaterialIcons name={stat.icon} size={24} color={stat.color} />
          </View>
          <ThemedText type="subtitle" style={styles.value}>
            {stat.value}
          </ThemedText>
          <ThemedText style={styles.label}>{stat.label}</ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '700',
      default: 'normal',
    }),
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
