import React from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
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
  if (attempts.length === 0) {
    return null;
  }

  // Get only the most recent one for the "Achievement" view design
  const latestAttempt = attempts[0];
  const isPerfect = latestAttempt.percentage >= 100;
  
  // Custom message based on score
  const achievementTitle = isPerfect ? `Perfect Score: ${latestAttempt.exam_title}` : `Great Job: ${latestAttempt.exam_title}`;
  const achievementMessage = isPerfect 
    ? `You mastered the questions in your last session.`
    : `You scored ${latestAttempt.percentage.toFixed(0)}% in your last session. Keep it up!`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh6MO6AYpRf87A8PwP7L7UFses6B1ryLbMVcJUo1Deib3fe8RRTglENUf7XZUG8bBrDZ2WBKNq7qFJwmCscLtSvvK8viX9QBWp8wbg9JUWJZuSrKfuYH-ofOjlsZ6KL5uhBiVXXdWaqHu8C0L0Dh2TOgS-ys2uVVPeM4TxjmiKxl-Fgqfc3SUyxj1oM05v_cbguzKmsu3Rf-aCh-T_aYv91xa3BGrgXKRBLrK3vN43SMBOKeIQlTKhVwYsUjgQkic1MaQR5-9g-zS4' }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={styles.label}>New Achievement!</ThemedText>
          <ThemedText style={styles.title} numberOfLines={1}>{achievementTitle}</ThemedText>
          <ThemedText style={styles.caption} numberOfLines={2}>{achievementMessage}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f3f3f5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e2e4',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(72, 0, 178, 0.2)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#4800b2',
    fontFamily: Fonts.primary.medium,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    color: '#1a1c1d',
    fontFamily: Fonts.primary.bold,
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    color: '#615b6e',
    fontFamily: Fonts.primary.regular,
    lineHeight: 16,
  },
});
