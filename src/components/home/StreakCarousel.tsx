import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
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

export function StreakCarousel({ currentStreak }: StreakCarouselProps) {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <ThemedText style={styles.greetingText}>
          {greeting}, {firstName}
        </ThemedText>
        <ThemedText style={styles.headlineText}>
          Ready to level up?
        </ThemedText>
      </View>
      <View style={styles.streakPill}>
        <ThemedText style={styles.streakNumber}>
          {currentStreak} Day Streak
        </ThemedText>
        <ThemedText style={styles.streakEmoji}>🔥</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  leftCol: {
    justifyContent: 'flex-end',
  },
  greetingText: {
    fontSize: 12,
    color: '#615b6e',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: Fonts.primary.regular, android: Fonts.primary.regular }),
    fontWeight: Platform.select({ web: '400', default: '400' }),
  },
  headlineText: {
    fontSize: 20,
    color: '#4800b2',
    fontFamily: Platform.select({ ios: Fonts.primary.semiBold, android: Fonts.primary.semiBold }),
    fontWeight: Platform.select({ web: '600', default: '600' }),
    lineHeight: 28,
  },
  streakPill: {
    backgroundColor: '#e8dff5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  streakNumber: {
    color: '#4800b2',
    fontSize: 14,
    fontFamily: Platform.select({ ios: Fonts.primary.bold, android: Fonts.primary.bold }),
    fontWeight: Platform.select({ web: '700', default: 'bold' }),
  },
  streakEmoji: {
    fontSize: 16,
  },
});
