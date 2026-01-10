import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

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
  subjects?: (string | { subject: string; question_count: number })[];
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
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>(
    []
  );

  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const successColor = "#10B981";
  const errorColor = "#EF4444";

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/exam-attempts/${params.attemptId}/results`
      );

      if (response.data.success) {
        setAttempt(response.data.data.attempt);
        setResults(response.data.data.results);
        setSubjectAnalytics(response.data.data.subject_analytics || []);
      } else {
        Alert.alert("Error", "Failed to load results. Please try again.");
      }
    } catch (error: any) {
      console.error("Error loading results:", error);
      Alert.alert("Error", "Failed to load results. Please try again.");
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
    if (percentage >= 50) return "#F59E0B";
    return errorColor;
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 70) return "Excellent";
    if (percentage >= 50) return "Good";
    if (percentage >= 40) return "Fair";
    return "Needs Improvement";
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

  return (
    <AppLayout
      showBackButton={true}
      headerTitle="Exam Results"
      onBackPress={() => {
        // @ts-ignore
        navigation.navigate("Home");
      }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        {attempt && (
          <>
            {/* Score Card */}
            <View
              style={[styles.scoreCard, { backgroundColor: cardBackground }]}
            >
              <LinearGradient
                colors={[
                  getGradeColor(attempt.percentage),
                  getGradeColor(attempt.percentage) + "DD",
                ]}
                style={styles.scoreGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ThemedText style={styles.scorePercentage}>
                  {attempt.correct_answers}/{attempt.total_questions}
                </ThemedText>
                <ThemedText style={styles.scoreGrade}>
                  {getGradeText(attempt.percentage)}
                </ThemedText>
                <ThemedText style={styles.scoreDetails}>
                  {attempt.correct_answers} correct out of{" "}
                  {attempt.total_questions} questions
                </ThemedText>
              </LinearGradient>
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View
                style={[styles.statCard, { backgroundColor: cardBackground }]}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: successColor + "20" },
                  ]}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={successColor}
                  />
                </View>
                <ThemedText style={styles.statValue}>{correctCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Correct</ThemedText>
              </View>

              <View
                style={[styles.statCard, { backgroundColor: cardBackground }]}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: errorColor + "20" },
                  ]}
                >
                  <MaterialIcons name="cancel" size={24} color={errorColor} />
                </View>
                <ThemedText style={styles.statValue}>
                  {incorrectCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Incorrect</ThemedText>
              </View>
            </View>

            {/* Subject Analytics (if multiple subjects) */}
            {subjectAnalytics.length > 0 && (
              <View
                style={[
                  styles.metricsCard,
                  { backgroundColor: cardBackground },
                ]}
              >
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
                        {analytics.correct}/{analytics.total}
                      </ThemedText>
                    </View>
                    <View style={styles.subjectAnalyticsBar}>
                      <View
                        style={[
                          styles.subjectAnalyticsFill,
                          {
                            width: `${analytics.percentage}%`,
                            backgroundColor: getGradeColor(
                              analytics.percentage
                            ),
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.subjectAnalyticsDetails}>
                      {analytics.correct} correct out of {analytics.total}{" "}
                      questions
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                title="View Corrections"
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate("CorrectionsScreen", {
                    attemptId: params.attemptId,
                    subjects:
                      subjectAnalytics.length > 0
                        ? subjectAnalytics.map((a) => a.subject)
                        : attempt?.subjects
                        ? Array.isArray(attempt.subjects)
                          ? attempt.subjects.map((s: any) =>
                              typeof s === "string" ? s : s.subject
                            )
                          : []
                        : [],
                  });
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Back to Home"
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate("Home");
                }}
                style={styles.actionButton}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scoreCard: {
    borderRadius: 16,
    margin: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scoreGradient: {
    padding: 32,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    width: "100%",
  },
  scorePercentage: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 66,
    letterSpacing: 0.5,
  },
  scoreGrade: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
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
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  subjectAnalyticsRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  subjectAnalyticsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectAnalyticsName: {
    fontSize: 16,
    fontWeight: "600",
  },
  subjectAnalyticsPercentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  subjectAnalyticsBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  subjectAnalyticsFill: {
    height: "100%",
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
});
