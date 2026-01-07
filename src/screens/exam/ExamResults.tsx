import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface QuestionResult {
  question: {
    id: number;
    question_text: string;
    explanation: string | null;
    points: number;
  };
  user_answer: {
    id: number;
    answer_text: string;
    order: string;
  } | null;
  correct_answer: {
    id: number;
    answer_text: string;
    order: string;
  } | null;
  is_correct: boolean;
  time_spent: number | null;
}

interface AttemptData {
  id: number;
  score: number;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  time_spent: number;
  completed_at: string;
}

interface SubjectAnalytics {
  subject: string;
  correct: number;
  total: number;
  percentage: number;
}

interface RouteParams {
  attemptId: number;
}

export function ExamResults() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'corrections'>('overview');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const successColor = '#10B981';
  const errorColor = '#EF4444';

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exam-attempts/${params.attemptId}/results`);
      
      if (response.data.success) {
        setAttempt(response.data.data.attempt);
        setResults(response.data.data.results);
        setSubjectAnalytics(response.data.data.subject_analytics || []);
      } else {
        Alert.alert('Error', 'Failed to load results. Please try again.');
      }
    } catch (error: any) {
      console.error('Error loading results:', error);
      Alert.alert('Error', 'Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 70) return successColor;
    if (percentage >= 50) return '#F59E0B';
    return errorColor;
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 70) return 'Excellent';
    if (percentage >= 50) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const handleNext = () => {
    if (currentQuestionIndex < results.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Results">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading results...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  if (!attempt || results.length === 0) {
    return (
      <AppLayout showBackButton={true} headerTitle="Results">
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>No results found</ThemedText>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </AppLayout>
    );
  }

  const correctCount = results.filter((r) => r.is_correct).length;
  const incorrectCount = results.filter((r) => !r.is_correct).length;
  const currentResult = results[currentQuestionIndex];

  return (
    <AppLayout showBackButton={true} headerTitle="Exam Results">
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'overview' && { borderBottomColor: tintColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setSelectedTab('overview')}
        >
          <MaterialIcons
            name="dashboard"
            size={20}
            color={selectedTab === 'overview' ? tintColor : textColor}
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: selectedTab === 'overview' ? tintColor : textColor },
            ]}
          >
            Overview
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'corrections' && { borderBottomColor: tintColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setSelectedTab('corrections')}
        >
          <MaterialIcons
            name="assignment"
            size={20}
            color={selectedTab === 'corrections' ? tintColor : textColor}
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: selectedTab === 'corrections' ? tintColor : textColor },
            ]}
          >
            Corrections
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Score Card */}
            <View style={[styles.scoreCard, { backgroundColor: cardBackground }]}>
              <LinearGradient
                colors={[getGradeColor(attempt.percentage), getGradeColor(attempt.percentage) + 'DD']}
                style={styles.scoreGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ThemedText style={styles.scorePercentage}>
                  {attempt.percentage.toFixed(1)}%
                </ThemedText>
                <ThemedText style={styles.scoreGrade}>
                  {getGradeText(attempt.percentage)}
                </ThemedText>
                <ThemedText style={styles.scoreDetails}>
                  {attempt.correct_answers} out of {attempt.total_questions} correct
                </ThemedText>
              </LinearGradient>
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
                <View style={[styles.statIcon, { backgroundColor: successColor + '20' }]}>
                  <MaterialIcons name="check-circle" size={24} color={successColor} />
                </View>
                <ThemedText style={styles.statValue}>{correctCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Correct</ThemedText>
              </View>

              <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
                <View style={[styles.statIcon, { backgroundColor: errorColor + '20' }]}>
                  <MaterialIcons name="cancel" size={24} color={errorColor} />
                </View>
                <ThemedText style={styles.statValue}>{incorrectCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Incorrect</ThemedText>
              </View>
            </View>

            {/* Subject Analytics (if multiple subjects) */}
            {subjectAnalytics.length > 0 && (
              <View style={[styles.metricsCard, { backgroundColor: cardBackground }]}>
                <ThemedText type="subtitle" style={styles.metricsTitle}>
                  Performance by Subject
                </ThemedText>
                {subjectAnalytics.map((analytics, index) => (
                  <View key={index} style={styles.subjectAnalyticsRow}>
                    <View style={styles.subjectAnalyticsHeader}>
                      <ThemedText style={styles.subjectAnalyticsName}>
                        {analytics.subject}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.subjectAnalyticsPercentage,
                          { color: getGradeColor(analytics.percentage) },
                        ]}
                      >
                        {analytics.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                    <View style={styles.subjectAnalyticsBar}>
                      <View
                        style={[
                          styles.subjectAnalyticsFill,
                          {
                            width: `${analytics.percentage}%`,
                            backgroundColor: getGradeColor(analytics.percentage),
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.subjectAnalyticsDetails}>
                      {analytics.correct} / {analytics.total} correct
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                title="View Corrections"
                onPress={() => setSelectedTab('corrections')}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Back to Home"
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate('Home');
                }}
                style={styles.actionButton}
              />
            </View>
          </>
        )}

        {/* Corrections Tab - Single Question View */}
        {selectedTab === 'corrections' && currentResult && (
          <>
            {/* Question Progress */}
            <View style={[styles.progressBar, { backgroundColor: cardBackground }]}>
              <ThemedText style={styles.progressText}>
                Question {currentQuestionIndex + 1} of {results.length}
              </ThemedText>
              <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentQuestionIndex + 1) / results.length) * 100}%`,
                      backgroundColor: tintColor,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Question Card */}
            <View style={[styles.correctionCard, { backgroundColor: cardBackground }]}>
              <View style={styles.correctionHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: currentResult.is_correct
                        ? successColor + '20'
                        : errorColor + '20',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={currentResult.is_correct ? 'check-circle' : 'cancel'}
                    size={20}
                    color={currentResult.is_correct ? successColor : errorColor}
                  />
                  <ThemedText
                    style={[
                      styles.statusText,
                      {
                        color: currentResult.is_correct ? successColor : errorColor,
                      },
                    ]}
                  >
                    {currentResult.is_correct ? 'Correct' : 'Incorrect'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.questionText}>
                {currentResult.question.question_text}
              </ThemedText>

              <View style={styles.answersSection}>
                {currentResult.user_answer && (
                  <View
                    style={[
                      styles.answerBox,
                      {
                        backgroundColor: currentResult.is_correct
                          ? successColor + '10'
                          : errorColor + '10',
                        borderColor: currentResult.is_correct ? successColor : errorColor,
                      },
                    ]}
                  >
                    <View style={styles.answerHeader}>
                      <MaterialIcons
                        name={currentResult.is_correct ? 'check-circle' : 'cancel'}
                        size={18}
                        color={currentResult.is_correct ? successColor : errorColor}
                      />
                      <ThemedText
                        style={[
                          styles.answerLabel,
                          {
                            color: currentResult.is_correct ? successColor : errorColor,
                          },
                        ]}
                      >
                        Your Answer
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.answerText}>
                      {currentResult.user_answer.order}. {currentResult.user_answer.answer_text}
                    </ThemedText>
                  </View>
                )}

                {!currentResult.is_correct && currentResult.correct_answer && (
                  <View
                    style={[
                      styles.answerBox,
                      {
                        backgroundColor: successColor + '10',
                        borderColor: successColor,
                      },
                    ]}
                  >
                    <View style={styles.answerHeader}>
                      <MaterialIcons name="check-circle" size={18} color={successColor} />
                      <ThemedText
                        style={[styles.answerLabel, { color: successColor }]}
                      >
                        Correct Answer
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.answerText}>
                      {currentResult.correct_answer.order}. {currentResult.correct_answer.answer_text}
                    </ThemedText>
                  </View>
                )}

                {!currentResult.user_answer && (
                  <View
                    style={[
                      styles.answerBox,
                      {
                        backgroundColor: '#6B7280' + '10',
                        borderColor: '#6B7280',
                      },
                    ]}
                  >
                    <View style={styles.answerHeader}>
                      <MaterialIcons name="help-outline" size={18} color="#6B7280" />
                      <ThemedText style={[styles.answerLabel, { color: '#6B7280' }]}>
                        Not Answered
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>

              {currentResult.question.explanation && (
                <View style={[styles.explanationBox, { backgroundColor: tintColor + '10' }]}>
                  <View style={styles.explanationHeader}>
                    <MaterialIcons name="lightbulb" size={18} color={tintColor} />
                    <ThemedText style={[styles.explanationLabel, { color: tintColor }]}>
                      Explanation
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.explanationText}>
                    {currentResult.question.explanation}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              <Button
                title="Previous"
                onPress={handlePrevious}
                variant="outline"
                disabled={currentQuestionIndex === 0}
                style={styles.navButton}
              />
              <Button
                title={currentQuestionIndex === results.length - 1 ? 'Finish' : 'Next'}
                onPress={currentQuestionIndex === results.length - 1 
                  ? () => {
                      // @ts-ignore
                      navigation.navigate('Home');
                    }
                  : handleNext}
                style={styles.navButton}
              />
            </View>
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCard: {
    borderRadius: 16,
    margin: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scoreGradient: {
    padding: 32,
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scoreGrade: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  metricsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subjectAnalyticsRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subjectAnalyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectAnalyticsName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectAnalyticsPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectAnalyticsBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  subjectAnalyticsFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectAnalyticsDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 0,
  },
  progressBar: {
    padding: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  correctionCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  correctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: '600',
  },
  answersSection: {
    gap: 12,
    marginBottom: 16,
  },
  answerBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
  explanationBox: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  navButton: {
    flex: 1,
  },
});
