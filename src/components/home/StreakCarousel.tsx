import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface StreakDay {
  date: string;
  has_streak: boolean;
  day_name: string;
  day_number: number;
}

interface StreakCarouselProps {
  currentStreak: number;
  streakDays: StreakDay[];
}

export function StreakCarousel({ currentStreak, streakDays }: StreakCarouselProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  // Get last 7 days for display
  const recentDays = streakDays.slice(-7);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <MaterialIcons name="local-fire-department" size={24} color={tintColor} />
          <ThemedText type="subtitle" style={styles.streakText}>
            {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak
          </ThemedText>
        </View>
        <ThemedText style={styles.keepGoing}>Keep it up! 🔥</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentDays.map((day, index) => (
          <View
            key={day.date}
            style={[
              styles.dayCard,
              {
                backgroundColor: day.has_streak ? tintColor : cardBackground,
                borderColor: borderColor,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.dayName,
                { color: day.has_streak ? '#fff' : textColor },
              ]}
            >
              {day.day_name}
            </ThemedText>
            <ThemedText
              style={[
                styles.dayNumber,
                { color: day.has_streak ? '#fff' : textColor },
              ]}
            >
              {day.day_number}
            </ThemedText>
            {day.has_streak && (
              <MaterialIcons name="check-circle" size={16} color="#fff" style={styles.checkIcon} />
            )}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 18,
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
  keepGoing: {
    fontSize: 14,
    opacity: 0.7,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  dayCard: {
    width: 60,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  dayName: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: Fonts.primary.semiBold,
      android: Fonts.primary.semiBold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '600',
      default: 'normal',
    }),
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
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
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
