import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppLayout } from '@/components/AppLayout';
import { ThemedView } from '@/components/ThemedView';
import { StreakCarousel } from '@/components/home/StreakCarousel';
import { AnnouncementBanner } from '@/components/home/AnnouncementBanner';
import { StatsCards } from '@/components/home/StatsCards';
import { QuickActionCards } from '@/components/home/QuickActionCards';
import { ContinuePracticeCard } from '@/components/home/ContinuePracticeCard';
import { RecentPerformance } from '@/components/home/RecentPerformance';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import api from '@/services/api';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  streak_days: Array<{
    date: string;
    has_streak: boolean;
    day_name: string;
    day_number: number;
  }>;
  all_streaks: string[];
}

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
  link_text?: string;
  created_at: string;
}

interface AnalyticsData {
  overview: {
    total_attempts: number;
    total_exams: number;
    average_score: number;
    total_time_spent: number;
  };
  recent_attempts: Array<{
    id: number;
    exam_title: string;
    score: number;
    percentage: number;
    completed_at: string;
  }>;
  subject_performance: Array<{
    subject: string;
    avg_score: number;
    attempts: number;
  }>;
}

interface InProgressAttempt {
  id: number;
  exam: {
    id: number;
    title: string;
    type: string;
  };
  status: string;
}

export function Home() {
  const navigation = useNavigation();
  const { setExamType } = useExamSelection();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [inProgressAttempt, setInProgressAttempt] = useState<InProgressAttempt | null>(null);

  const fetchData = async () => {
    try {
      const [streakResponse, announcementsResponse, analyticsResponse, attemptsResponse] =
        await Promise.all([
          api.get('/streaks'),
          api.get('/announcements'),
          api.get('/analytics'),
          api.get('/exam-attempts?status=in_progress'),
        ]);

      if (streakResponse.data.success) {
        setStreakData(streakResponse.data.data);
      }

      if (announcementsResponse.data.success) {
        setAnnouncements(announcementsResponse.data.data);
      }

      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.data);
      }

      if (attemptsResponse.data.success && attemptsResponse.data.data.length > 0) {
        setInProgressAttempt(attemptsResponse.data.data[0]);
      } else {
        setInProgressAttempt(null);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleJambPress = () => {
    setExamType('JAMB');
    // @ts-ignore
    navigation.navigate('QuestionModeSelection');
  };

  const handleDliPress = () => {
    setExamType('DLI');
    // @ts-ignore
    navigation.navigate('QuestionModeSelection');
  };

  const handleContinuePractice = () => {
    if (inProgressAttempt) {
      // @ts-ignore
      navigation.navigate('ExamScreen', {
        attemptId: inProgressAttempt.id,
        exam: inProgressAttempt.exam,
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={true} headerTitle="">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Streak Carousel */}
        {streakData && (
          <StreakCarousel
            currentStreak={streakData.current_streak}
            streakDays={streakData.streak_days}
          />
        )}

        {/* Announcement Banner */}
        {announcements.length > 0 && (
          <AnnouncementBanner
            announcement={announcements[0]}
            onPress={() => {
              if (announcements[0].link) {
                // Handle link navigation if needed
              }
            }}
          />
        )}

        {/* Stats Cards */}
        {analytics && (
          <StatsCards
            totalAttempts={analytics.overview.total_attempts}
            averageScore={analytics.overview.average_score}
            totalTimeSpent={analytics.overview.total_time_spent}
          />
        )}

        {/* Continue Practice Card */}
        {inProgressAttempt && (
          <ContinuePracticeCard
            examTitle={inProgressAttempt.exam.title}
            examType={inProgressAttempt.exam.type}
            onPress={handleContinuePractice}
          />
        )}

        {/* Quick Action Cards */}
        <QuickActionCards onJambPress={handleJambPress} onDliPress={handleDliPress} />

        {/* Recent Performance */}
        {analytics && (
          <RecentPerformance attempts={analytics.recent_attempts.slice(0, 5)} />
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
