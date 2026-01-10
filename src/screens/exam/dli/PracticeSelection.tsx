import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function DLIPracticeSelection() {
  const {
    setQuestionMode,
    addSubject,
    removeSubject,
    setQuestionCount,
    setTimeMinutes,
  } = useExamSelection();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCountLocal] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutesLocal] = useState<number | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [startingExam, setStartingExam] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({}, "placeholder");

  // Check if user has active subscription
  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const maxQuestionsPerSubject = hasActiveSubscription ? 50 : 5;
  // Generate question count options based on subscription (1-50 for DLI, but limited for free users)
  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );
  // Generate time options (1-120 minutes)
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  useEffect(() => {
    // Set DLI to practice mode
    setQuestionMode("practice");
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/exams/subjects", {
        params: {
          exam_type: "DLI",
          type: "practice",
        },
      });

      if (response.data.success) {
        const subjectsList = response.data.data || [];
        setSubjectsList(subjectsList);

        if (subjectsList.length === 0) {
          Alert.alert(
            "No Subjects Available",
            "No DLI practice subjects are available at the moment. Please try again later.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
      } else {
        setSubjectsList([]);
      }
    } catch (error: any) {
      console.error("Error loading subjects:", error);
      setSubjectsList([]);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to load subjects. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const selectSubject = (subject: string) => {
    if (selectedSubject === subject) {
      // If clicking the same subject, deselect it
      setSelectedSubject(null);
      removeSubject(subject);
    } else {
      // Remove previous subject if any
      if (selectedSubject) {
        removeSubject(selectedSubject);
      }
      // Select new subject
      setSelectedSubject(subject);
      addSubject(subject);
      // Reset dependent fields
      setQuestionCountLocal(null);
      setTimeMinutesLocal(null);
    }
    setShowSubjectModal(false);
  };

  const selectQuestionCount = (count: number) => {
    setQuestionCountLocal(count);
    setShowQuestionCountModal(false);
  };

  const selectTime = (minutes: number) => {
    setTimeMinutesLocal(minutes);
    setShowTimeModal(false);
  };

  const handleStartPractice = async () => {
    if (!selectedSubject) {
      Alert.alert("No Course Selected", "Please select a course to continue.");
      return;
    }

    if (!questionCount || questionCount < 1) {
      Alert.alert(
        "Invalid Question Count",
        "Please select a valid number of questions."
      );
      return;
    }

    if (questionCount > maxQuestionsPerSubject) {
      Alert.alert(
        "Too Many Questions",
        `Maximum allowed is ${maxQuestionsPerSubject} questions per course for DLI.`
      );
      return;
    }

    if (!timeMinutes || timeMinutes < 1) {
      Alert.alert("Invalid Time", "Please select a valid duration in minutes.");
      return;
    }

    if (timeMinutes > 120) {
      Alert.alert(
        "Time Limit Exceeded",
        "Maximum allowed time is 120 minutes (2 hours)."
      );
      return;
    }

    try {
      setStartingExam(true);

      // Set values in context
      setQuestionCount(selectedSubject, questionCount);
      setTimeMinutes(timeMinutes);

      // Fetch practice questions
      const questionsResponse = await api.get("/questions/practice", {
        params: {
          exam_type: "DLI",
          subject: selectedSubject,
          count: questionCount,
        },
      });

      if (!questionsResponse.data.success) {
        Alert.alert(
          "Error",
          `Failed to load questions for ${selectedSubject}. Please try again.`
        );
        return;
      }

      const allQuestions = questionsResponse.data.data || [];

      if (allQuestions.length === 0) {
        Alert.alert(
          "No Questions Found",
          `No practice questions available for ${selectedSubject}. Please try a different course.`
        );
        return;
      }

      if (allQuestions.length < questionCount) {
        Alert.alert(
          "Limited Questions",
          `Only ${allQuestions.length} questions available for ${selectedSubject} (requested ${questionCount}).`
        );
      }

      // Add subject identifier to questions
      const questionsWithSubject = allQuestions.map((q: any) => ({
        ...q,
        subject: selectedSubject,
      }));

      // Get an exam for the attempt (placeholder)
      const examResponse = await api.get("/exams", {
        params: {
          exam_type: "DLI",
          subject: selectedSubject,
        },
      });

      let examId: number;
      if (examResponse.data.success && examResponse.data.data.length > 0) {
        examId = examResponse.data.data[0].id;
      } else {
        Alert.alert(
          "Error",
          "Unable to create exam attempt. Please contact support."
        );
        return;
      }

      // Prepare subjects data
      const subjectsData = [
        {
          subject: selectedSubject,
          question_count: questionCount,
        },
      ];

      // Start exam attempt
      const attemptResponse = await api.post(`/exams/${examId}/start`, {
        subjects: subjectsData,
        duration_minutes: timeMinutes,
      });

      if (!attemptResponse.data.success) {
        Alert.alert("Error", "Failed to start exam. Please try again.");
        return;
      }

      const attempt = attemptResponse.data.data.attempt;

      // Navigate to exam screen
      // @ts-ignore
      navigation.navigate("ExamScreen", {
        attemptId: attempt.id,
        examId: examId,
        subjectsQuestions: {
          [selectedSubject]: questionsWithSubject,
        },
        exam: {
          id: examId,
          title: `DLI ${selectedSubject} Practice Questions`,
          duration: timeMinutes,
          total_questions: questionsWithSubject.length,
        },
        timeMinutes: timeMinutes,
      });
    } catch (error: any) {
      console.error("Error starting practice:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to start practice. Please check your connection and try again."
      );
    } finally {
      setStartingExam(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="DLI Practice">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading courses...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="DLI Practice">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            DLI Practice
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Select your course, number of questions, and time. Practice with
            random questions.
          </ThemedText>
          {!hasActiveSubscription && (
            <ThemedText
              style={[styles.hint, { color: tintColor, fontWeight: "600" }]}
            >
              ⚠️ Non-subscribed users are limited to 5 questions per practice
              session. Subscribe to unlock up to 50 questions per session.
            </ThemedText>
          )}
        </View>

        {/* Course Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Course</ThemedText>
          <TouchableOpacity
            style={[
              styles.yearSelector,
              {
                borderColor: selectedSubject ? tintColor : borderColor,
                backgroundColor: cardBackground,
              },
            ]}
            onPress={() => setShowSubjectModal(true)}
            disabled={subjects.length === 0}
          >
            <ThemedText
              style={{
                color: selectedSubject ? textColor : placeholderColor,
                fontSize: 16,
              }}
            >
              {selectedSubject || "Select a course"}
            </ThemedText>
            <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
          </TouchableOpacity>
          {subjects.length === 0 && (
            <ThemedText style={styles.hint}>
              No courses available for DLI practice
            </ThemedText>
          )}
        </View>

        {/* Number of Questions Selection */}
        {selectedSubject && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Number of Questions
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.yearSelector,
                {
                  borderColor:
                    questionCount && questionCount > 0
                      ? tintColor
                      : borderColor,
                  backgroundColor: cardBackground,
                },
              ]}
              onPress={() => setShowQuestionCountModal(true)}
            >
              <ThemedText
                style={{
                  color:
                    questionCount && questionCount > 0
                      ? textColor
                      : placeholderColor,
                  fontSize: 16,
                }}
              >
                {questionCount
                  ? `${questionCount}`
                  : "Select number of questions"}
              </ThemedText>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
            <ThemedText style={styles.hint}>
              Minimum: 1, Maximum: {maxQuestionsPerSubject}{" "}
              {!hasActiveSubscription ? "(Free users)" : "(DLI courses)"}
            </ThemedText>
            {!hasActiveSubscription && (
              <ThemedText
                style={[styles.hint, { color: tintColor, marginTop: 4 }]}
              >
                💡 Subscribe to practice up to 50 questions per session
              </ThemedText>
            )}
          </View>
        )}

        {/* Time Selection */}
        {selectedSubject && questionCount && questionCount > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Time (Minutes)</ThemedText>
            <TouchableOpacity
              style={[
                styles.yearSelector,
                {
                  borderColor:
                    timeMinutes && timeMinutes > 0 ? tintColor : borderColor,
                  backgroundColor: cardBackground,
                },
              ]}
              onPress={() => setShowTimeModal(true)}
            >
              <ThemedText
                style={{
                  color:
                    timeMinutes && timeMinutes > 0
                      ? textColor
                      : placeholderColor,
                  fontSize: 16,
                }}
              >
                {timeMinutes ? `${timeMinutes}` : "Select time in minutes"}
              </ThemedText>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
            <ThemedText style={styles.hint}>
              Minimum: 1 minute, Maximum: 120 minutes (2 hours)
            </ThemedText>
          </View>
        )}

        {/* Summary */}
        {selectedSubject && questionCount && timeMinutes && (
          <View
            style={[styles.summaryCard, { backgroundColor: cardBackground }]}
          >
            <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Course:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selectedSubject}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Questions:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {questionCount || "Not set"}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Time:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {timeMinutes ? `${timeMinutes} minutes` : "Not set"}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: cardBackground }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Select Course
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowSubjectModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.yearOption,
                      {
                        backgroundColor:
                          selectedSubject === subject
                            ? tintColor + "20"
                            : "transparent",
                      },
                    ]}
                    onPress={() => selectSubject(subject)}
                  >
                    <ThemedText
                      style={[
                        styles.yearOptionText,
                        {
                          color:
                            selectedSubject === subject ? tintColor : textColor,
                          fontWeight:
                            selectedSubject === subject ? "600" : "400",
                        },
                      ]}
                    >
                      {subject}
                    </ThemedText>
                    {selectedSubject === subject && (
                      <MaterialIcons name="check" size={24} color={tintColor} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                    No courses available
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Question Count Selection Modal */}
      <Modal
        visible={showQuestionCountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQuestionCountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: cardBackground }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Select Number of Questions
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowQuestionCountModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {questionCountOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.yearOption,
                    {
                      backgroundColor:
                        questionCount === count
                          ? tintColor + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => selectQuestionCount(count)}
                >
                  <ThemedText
                    style={[
                      styles.yearOptionText,
                      {
                        color: questionCount === count ? tintColor : textColor,
                        fontWeight: questionCount === count ? "600" : "400",
                      },
                    ]}
                  >
                    {count}
                  </ThemedText>
                  {questionCount === count && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: cardBackground }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Select Time (Minutes)
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowTimeModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {timeOptions.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.yearOption,
                    {
                      backgroundColor:
                        timeMinutes === minutes
                          ? tintColor + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => selectTime(minutes)}
                >
                  <ThemedText
                    style={[
                      styles.yearOptionText,
                      {
                        color: timeMinutes === minutes ? tintColor : textColor,
                        fontWeight: timeMinutes === minutes ? "600" : "400",
                      },
                    ]}
                  >
                    {minutes}
                  </ThemedText>
                  {timeMinutes === minutes && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Button
          title={startingExam ? "Starting Practice..." : "Start Practice"}
          onPress={handleStartPractice}
          disabled={
            !selectedSubject ||
            !questionCount ||
            !timeMinutes ||
            questionCount < 1 ||
            timeMinutes < 1 ||
            startingExam
          }
          loading={startingExam}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
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
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
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
    borderBottomColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  yearOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  yearOptionText: {
    fontSize: 18,
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
