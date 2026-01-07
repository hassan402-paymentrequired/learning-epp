import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import api from "@/services/api";

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  answers: Answer[];
}

interface Answer {
  id: number;
  answer_text: string;
  order: string;
}

export function TimeSelection() {
  const { selection, setTimeMinutes } = useExamSelection();
  const navigation = useNavigation();
  const [minutes, setMinutes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "backgroundSecondary");

  // Calculate default time based on number of subjects (30 min per subject)
  // For JAMB, allow 30 minutes to 2 hours (120 minutes) regardless of subject count
  const isJAMB = selection.examType === 'JAMB';
  const isDLI = selection.examType === 'DLI';
  const defaultMinutes = selection.subjects.length * 30;
  const maxMinutes = isJAMB 
    ? 120 // JAMB: maximum 2 hours (120 minutes)
    : selection.subjects.length * 30; // Other exams: 30 min per subject/course
  const minMinutes = isJAMB 
    ? 30 // JAMB: minimum 30 minutes
    : 1; // Other exams: minimum 1 minute

  useEffect(() => {
    // Set default time when component mounts
    if (!minutes && defaultMinutes > 0) {
      setMinutes(defaultMinutes.toString());
    }
  }, [defaultMinutes, minutes]);

  // For JAMB, show quick options from 30 minutes to 2 hours
  // For other exams, show quick options based on subject count
  const quickOptions = isJAMB
    ? [30, 60, 90, 120] // JAMB: 30 min, 1 hour, 1.5 hours, 2 hours
    : selection.subjects.length === 1
    ? [30]
    : selection.subjects.length === 2
    ? [60]
    : selection.subjects.length === 3
    ? [90]
    : [120]; // For 4 subjects

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ""}`;
    }
    return `${mins}m`;
  };

  const handleStartExam = async () => {
    const numMinutes = parseInt(minutes);

    if (!minutes || isNaN(numMinutes) || numMinutes < minMinutes) {
      Alert.alert(
        "Invalid Input",
        isJAMB
          ? `For JAMB (UTME), please enter a duration between 30 minutes and 2 hours (120 minutes).`
          : `Please enter a valid duration (minimum ${minMinutes} minute)`
      );
      return;
    }

    if (numMinutes > maxMinutes) {
      Alert.alert(
        "Time Limit Exceeded",
        isJAMB
          ? `For JAMB (UTME), maximum allowed time is 2 hours (120 minutes).`
          : `Maximum allowed time is ${maxMinutes} minutes (${formatTime(
              maxMinutes
            )}) for ${selection.subjects.length} ${
              selection.subjects.length === 1 ? "subject" : "subjects"
            }`
      );
      return;
    }

    // Validate all subjects have question counts
    const missingSubjects: string[] = [];
    selection.subjects.forEach((subject) => {
      const count = selection.questionCounts[subject];
      if (!count || count < 1) {
        missingSubjects.push(subject);
      }
    });

    if (missingSubjects.length > 0) {
      Alert.alert(
        'Incomplete Selection',
        `Please set question count for: ${missingSubjects.join(', ')}. Go back to subject selection.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setTimeMinutes(numMinutes);

    try {
      setLoading(true);

      // Fetch questions for all subjects
      const subjectsQuestions: Record<string, Question[]> = {};
      let firstExamId: number | null = null;

      for (const subject of selection.subjects) {
        try {
          const questionCount = selection.questionCounts[subject] || 0;

          if (selection.questionMode === 'practice') {
            // For practice: Get random questions from questions table
            const questionsResponse = await api.get('/questions/practice', {
              params: {
                exam_type: selection.examType,
                subject: subject,
                count: questionCount,
              },
            });

            if (!questionsResponse.data.success) {
              Alert.alert('Error', `Failed to load questions for ${subject}. Please try again.`);
              return;
            }

            const allQuestions = questionsResponse.data.data || [];

            if (allQuestions.length === 0) {
              Alert.alert(
                'No Questions Found',
                `No practice questions available for ${subject}. Please try a different subject.`
              );
              return;
            }

            if (allQuestions.length < questionCount) {
              Alert.alert(
                'Limited Questions',
                `Only ${allQuestions.length} questions available for ${subject} (requested ${questionCount}).`
              );
            }

            // Add subject identifier to questions
            const questionsWithSubject = allQuestions.map((q: any) => ({
              ...q,
              subject: subject,
            }));

            subjectsQuestions[subject] = questionsWithSubject;

            // For practice, we still need an exam_id for the attempt
            // Create a dummy exam or use the first available exam
            if (!firstExamId) {
              const examResponse = await api.get('/exams', {
                params: {
                  exam_type: selection.examType,
                  type: 'practice',
                  subject: subject,
                },
              });

              if (examResponse.data.success && examResponse.data.data.length > 0) {
                firstExamId = examResponse.data.data[0].id;
              }
            }
          } else {
            // For past questions: Get questions from specific exam with year
            const examResponse = await api.get('/exams', {
              params: {
                exam_type: selection.examType,
                type: 'past_question',
                subject: subject,
                year: selection.selectedYear,
              },
            });

            if (!examResponse.data.success || examResponse.data.data.length === 0) {
              Alert.alert(
                'No Exam Found',
                `No past questions found for ${subject} in ${selection.selectedYear}. Please try a different year.`
              );
              return;
            }

            const exam = examResponse.data.data[0];
            if (!firstExamId) {
              firstExamId = exam.id;
            }

            // Get questions for this subject's exam
            const questionsResponse = await api.get(`/exams/${exam.id}/questions`);

            if (!questionsResponse.data.success) {
              Alert.alert('Error', `Failed to load questions for ${subject}. Please try again.`);
              return;
            }

            const questionsData = questionsResponse.data.data;
            const allQuestions = questionsData.questions || [];

            // Limit questions to selected count for this subject
            const limitedQuestions = allQuestions.slice(0, questionCount);

            // Add subject identifier to questions
            const questionsWithSubject = limitedQuestions.map((q: any) => ({
              ...q,
              subject: subject,
            }));

            subjectsQuestions[subject] = questionsWithSubject;
          }
        } catch (error: any) {
          console.error(`Error loading questions for ${subject}:`, error);
          Alert.alert('Error', `Failed to load questions for ${subject}. Please try again.`);
          return;
        }
      }

      if (!firstExamId) {
        Alert.alert('Error', 'Failed to start exam. Please try again.');
        return;
      }

      // Prepare subjects data
      const subjectsData = selection.subjects.map((subject) => ({
        subject: subject,
        question_count: selection.questionCounts[subject] || 0,
      }));

      // Start exam attempt with subjects and duration
      const attemptResponse = await api.post(`/exams/${firstExamId}/start`, {
        subjects: subjectsData,
        duration_minutes: numMinutes,
      });

      if (!attemptResponse.data.success) {
        Alert.alert('Error', 'Failed to start exam. Please try again.');
        return;
      }

      const attempt = attemptResponse.data.data.attempt;

      // Calculate total questions
      const totalQuestions = Object.values(subjectsQuestions).reduce(
        (sum, qs) => sum + qs.length,
        0
      );

      // Navigate to exam screen with all subjects' questions
      // @ts-ignore
      navigation.navigate('ExamScreen', {
        attemptId: attempt.id,
        examId: firstExamId,
        subjectsQuestions: subjectsQuestions, // Pass all subjects' questions
        exam: {
          id: firstExamId,
          title: `${selection.examType} ${selection.subjects.join(', ')} ${
            selection.questionMode === 'practice' ? 'Practice' : `${selection.selectedYear} Past Questions`
          }`,
          duration: numMinutes,
          total_questions: totalQuestions,
        },
        timeMinutes: numMinutes,
      });
    } catch (error: any) {
      console.error('Error starting exam:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to start exam. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (value: number) => {
    setMinutes(value.toString());
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Select Duration">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Duration
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isJAMB
              ? `For JAMB (UTME), you can choose any duration between 30 minutes and 2 hours.`
              : isDLI
              ? `Each course takes 30 minutes`
              : selection.subjects.length === 1
              ? `Each subject takes 30 minutes`
              : `You've selected ${selection.subjects.length} subjects. Each subject takes 30 minutes.`}
          </ThemedText>
          <ThemedText style={styles.hint}>
            {isJAMB
              ? `Recommended: ${formatTime(defaultMinutes)} (${selection.subjects.length} × 30 minutes). Maximum: ${formatTime(maxMinutes)}.`
              : `Total time: ${formatTime(maxMinutes)} (${selection.subjects.length} × 30 minutes)`}
          </ThemedText>
        </View>

        <View style={[styles.inputCard, { backgroundColor: cardBackground }]}>
          <View style={styles.inputHeader}>
            <MaterialIcons name="access-time" size={24} color={tintColor} />
            <ThemedText style={styles.inputLabel}>
              Enter duration (minutes)
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, { borderColor: tintColor }]}
            value={minutes}
            onChangeText={setMinutes}
            placeholder={`e.g., ${defaultMinutes}`}
            keyboardType="number-pad"
            placeholderTextColor={useThemeColor({}, "placeholder")}
            editable={!loading} // Allow input for all exam types
          />
          <ThemedText style={styles.hint}>
            {isJAMB
              ? `Minimum: ${minMinutes} minutes, Maximum: ${maxMinutes} minutes (${formatTime(maxMinutes)})`
              : `Minimum: ${minMinutes} minute, Maximum: ${maxMinutes} minutes (${formatTime(maxMinutes)})`}
          </ThemedText>
        </View>

        {quickOptions.length > 0 && (
          <View style={styles.quickOptionsContainer}>
            <ThemedText style={styles.quickOptionsTitle}>
              {isJAMB ? "Duration" : "Quick Select"}
            </ThemedText>
            <View style={styles.quickOptionsGrid}>
              {quickOptions.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.quickOption,
                    {
                      backgroundColor:
                        minutes === value.toString()
                          ? tintColor
                          : cardBackground,
                      borderColor: tintColor,
                      opacity: isJAMB ? 1 : undefined,
                    },
                  ]}
                  onPress={() => handleQuickSelect(value)}
                  disabled={loading} // Allow selection for all exam types
                >
                  <ThemedText
                    style={[
                      styles.quickOptionText,
                      {
                        color:
                          minutes === value.toString() ? "#fff" : undefined,
                      },
                    ]}
                  >
                    {formatTime(value)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Type:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.examType}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Mode:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.questionMode === "practice"
                ? "Practice"
                : "Past Questions"}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>
              {isDLI ? 'Course' : isJAMB ? 'Subjects' : 'Subject'}:
            </ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.join(", ")}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Questions:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.reduce((sum, subject) => {
                return sum + (selection.questionCounts[subject] || 0);
              }, 0)}
            </ThemedText>
          </View>
          {minutes && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Duration:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatTime(parseInt(minutes) || 0)}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Starting Exam..." : "Start Exam"}
          onPress={handleStartExam}
          disabled={
            !minutes || 
            parseInt(minutes) < minMinutes || 
            parseInt(minutes) > maxMinutes ||
            loading
          }
          loading={loading}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
  },
  inputCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  quickOptionsContainer: {
    marginBottom: 24,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  quickOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickOption: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  quickOptionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  summaryLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
});
