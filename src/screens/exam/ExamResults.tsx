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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');
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
  const unansweredCount = results.filter((r) => !r.user_answer).length;

  return (
    <AppLayout showBackButton={true} headerTitle="Exam Results">
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

              {unansweredCount > 0 && (
                <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#6B7280' + '20' }]}>
                    <MaterialIcons name="help-outline" size={24} color="#6B7280" />
                  </View>
                  <ThemedText style={styles.statValue}>{unansweredCount}</ThemedText>
                  <ThemedText style={styles.statLabel}>Unanswered</ThemedText>
                </View>
              )}
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

            {/* Performance Metrics */}
            <View style={[styles.metricsCard, { backgroundColor: cardBackground }]}>
              <ThemedText type="subtitle" style={styles.metricsTitle}>
                Performance Metrics
              </ThemedText>
              
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Time Spent:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {formatTime(attempt.time_spent)}
                </ThemedText>
              </View>
              
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Score:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {attempt.score} / {attempt.total_questions}
                </ThemedText>
              </View>
              
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Accuracy:</ThemedText>
                <ThemedText style={[styles.metricValue, { color: getGradeColor(attempt.percentage) }]}>
                  {attempt.percentage.toFixed(1)}%
                </ThemedText>
              </View>
              
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Completed:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {new Date(attempt.completed_at).toLocaleString()}
                </ThemedText>
              </View>
            </View>

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

        {/* Corrections Tab */}
        {selectedTab === 'corrections' && (
          <>
            <View style={styles.tabHeader}>
              <ThemedText type="subtitle" style={styles.tabTitle}>
                Question Corrections
              </ThemedText>
              <ThemedText style={styles.tabSubtitle}>
                Review your answers and explanations
              </ThemedText>
            </View>

            {results.map((result, index) => (
              <View
                key={result.question.id}
                style={[styles.correctionCard, { backgroundColor: cardBackground }]}
              >
                <View style={styles.correctionHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: result.is_correct
                          ? successColor + '20'
                          : errorColor + '20',
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={result.is_correct ? 'check-circle' : 'cancel'}
                      size={20}
                      color={result.is_correct ? successColor : errorColor}
                    />
                    <ThemedText
                      style={[
                        styles.statusText,
                        {
                          color: result.is_correct ? successColor : errorColor,
                        },
                      ]}
                    >
                      {result.is_correct ? 'Correct' : 'Incorrect'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.questionNumber}>
                    Question {index + 1}
                  </ThemedText>
                </View>

                <ThemedText style={styles.questionText}>
                  {result.question.question_text}
                </ThemedText>

                <View style={styles.answersSection}>
                  {result.user_answer && (
                    <View
                      style={[
                        styles.answerBox,
                        {
                          backgroundColor: result.is_correct
                            ? successColor + '10'
                            : errorColor + '10',
                          borderColor: result.is_correct ? successColor : errorColor,
                        },
                      ]}
                    >
                      <View style={styles.answerHeader}>
                        <MaterialIcons
                          name={result.is_correct ? 'check-circle' : 'cancel'}
                          size={18}
                          color={result.is_correct ? successColor : errorColor}
                        />
                        <ThemedText
                          style={[
                            styles.answerLabel,
                            {
                              color: result.is_correct ? successColor : errorColor,
                            },
                          ]}
                        >
                          Your Answer
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.answerText}>
                        {result.user_answer.order}. {result.user_answer.answer_text}
                      </ThemedText>
                    </View>
                  )}

                  {!result.is_correct && result.correct_answer && (
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
                        {result.correct_answer.order}. {result.correct_answer.answer_text}
                      </ThemedText>
                    </View>
                  )}

                  {!result.user_answer && (
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

                {result.question.explanation && (
                  <View style={[styles.explanationBox, { backgroundColor: tintColor + '10' }]}>
                    <View style={styles.explanationHeader}>
                      <MaterialIcons name="lightbulb" size={18} color={tintColor} />
                      <ThemedText style={[styles.explanationLabel, { color: tintColor }]}>
                        Explanation
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.explanationText}>
                      {result.question.explanation}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))}

            <View style={styles.actionsContainer}>
              <Button
                title="Back to Overview"
                onPress={() => setSelectedTab('overview')}
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
      </ScrollView>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: cardBackground, borderTopColor: borderColor }]}>
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 80, // Space for tab bar
  },
  actionButton: {
    marginBottom: 0,
  },
  tabHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    opacity: 0.7,
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
  questionNumber: {
    fontSize: 12,
    opacity: 0.7,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  answersSection: {
    gap: 12,
    marginBottom: 16,
  },
  answerBox: {
    padding: 12,
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
    fontSize: 15,
    lineHeight: 22,
  },
  explanationBox: {
    padding: 12,
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
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
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
});
