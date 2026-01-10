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

export function JAMBPracticeQuestionsSelection() {
  const {
    selection,
    addSubject,
    removeSubject,
    setQuestionCount,
    setTimeMinutes,
  } = useExamSelection();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set()
  );
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>(
    {}
  );
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] =
    useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);

  // Check if user has active subscription
  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({}, "placeholder");

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  // Generate question count options based on subscription
  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/exams/subjects", {
        params: {
          exam_type: "JAMB",
          type: "practice",
        },
      });

      if (response.data.success) {
        const subjectsList = response.data.data || [];
        setSubjectsList(subjectsList);

        if (subjectsList.length === 0) {
          Alert.alert(
            "No Subjects Available",
            "No JAMB practice subjects are available at the moment. Please try again later.",
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

  const handleToggleSubject = (subject: string) => {
    if (selection.subjects.includes(subject)) {
      removeSubject(subject);
      setExpandedSubjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(subject);
        return newSet;
      });
      setQuestionCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[subject];
        return newCounts;
      });
    } else {
      if (selection.subjects.length < 4) {
        addSubject(subject);
        setExpandedSubjects((prev) => new Set(prev).add(subject));
      } else {
        Alert.alert(
          "Maximum Subjects Reached",
          "You can select a maximum of 4 subjects for JAMB.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const toggleAccordion = (subject: string) => {
    if (!selection.subjects.includes(subject)) return;

    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const selectQuestionCount = (count: number) => {
    if (currentSubjectForQuestionCount) {
      setQuestionCounts((prev) => ({
        ...prev,
        [currentSubjectForQuestionCount]: count,
      }));
      setQuestionCount(currentSubjectForQuestionCount, count);
      setShowQuestionCountModal(false);
      setCurrentSubjectForQuestionCount(null);
    }
  };

  const handleStartExam = async () => {
    if (selection.subjects.length === 0) {
      Alert.alert(
        "No Subjects Selected",
        "Please select at least one subject to continue."
      );
      return;
    }

    // Validate all selected subjects have question counts
    const missingSubjects: string[] = [];
    selection.subjects.forEach((subject) => {
      const count = questionCounts[subject];
      if (!count || count < 1) {
        missingSubjects.push(subject);
      }
    });

    if (missingSubjects.length > 0) {
      Alert.alert(
        "Incomplete Selection",
        `Please select question count for: ${missingSubjects.join(", ")}`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setStartingExam(true);

      // Calculate default time (30 minutes per subject)
      const timeMinutesNum = selection.subjects.length * 30;
      setTimeMinutes(timeMinutesNum);

      // Fetch questions for all subjects
      const subjectsQuestions: Record<string, Question[]> = {};
      let firstExamId: number | null = null;

      for (const subject of selection.subjects) {
        const questionCount = questionCounts[subject];

        // Get random practice questions
        const questionsResponse = await api.get("/questions/practice", {
          params: {
            exam_type: "JAMB",
            subject: subject,
            count: questionCount,
          },
        });

        if (!questionsResponse.data.success) {
          Alert.alert(
            "Error",
            `Failed to load questions for ${subject}. Please try again.`
          );
          return;
        }

        const allQuestions = questionsResponse.data.data || [];

        if (allQuestions.length === 0) {
          Alert.alert(
            "No Questions Found",
            `No practice questions available for ${subject}. Please try a different subject.`
          );
          return;
        }

        if (allQuestions.length < questionCount) {
          Alert.alert(
            "Limited Questions",
            `Only ${allQuestions.length} questions available for ${subject} (requested ${questionCount}).`
          );
        }

        // Add subject identifier to questions
        const questionsWithSubject = allQuestions.map((q: any) => ({
          ...q,
          subject: subject,
        }));

        subjectsQuestions[subject] = questionsWithSubject;

        // Get an exam for the attempt (placeholder)
        if (!firstExamId) {
          const examResponse = await api.get("/exams", {
            params: {
              exam_type: "JAMB",
              subject: subject,
            },
          });

          if (examResponse.data.success && examResponse.data.data.length > 0) {
            firstExamId = examResponse.data.data[0].id;
          } else {
            Alert.alert(
              "Error",
              "Unable to create exam attempt. Please contact support."
            );
            return;
          }
        }
      }

      if (!firstExamId) {
        Alert.alert("Error", "Failed to start exam. Please try again.");
        return;
      }

      // Prepare subjects data
      const subjectsData = selection.subjects.map((subject) => ({
        subject: subject,
        question_count: questionCounts[subject],
      }));

      // Start exam attempt
      const attemptResponse = await api.post(`/exams/${firstExamId}/start`, {
        subjects: subjectsData,
        duration_minutes: timeMinutesNum,
      });

      if (!attemptResponse.data.success) {
        Alert.alert("Error", "Failed to start exam. Please try again.");
        return;
      }

      const attempt = attemptResponse.data.data.attempt;

      // Calculate total questions
      const totalQuestions = Object.values(subjectsQuestions).reduce(
        (sum, qs) => sum + qs.length,
        0
      );

      // Navigate to exam screen
      // @ts-ignore
      navigation.navigate("ExamScreen", {
        attemptId: attempt.id,
        examId: firstExamId,
        subjectsQuestions: subjectsQuestions,
        exam: {
          id: firstExamId,
          title: `JAMB ${selection.subjects.join(", ")} Practice Questions`,
          duration: timeMinutesNum,
          total_questions: totalQuestions,
        },
        timeMinutes: timeMinutesNum,
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
      <AppLayout showBackButton={true} headerTitle="JAMB Practice Questions">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>
            Loading subjects...
          </ThemedText>
        </View>
      </AppLayout>
    );
  }

  const totalQuestions = selection.subjects.reduce((sum, subject) => {
    const count = questionCounts[subject] || 0;
    return sum + count;
  }, 0);

  return (
    <AppLayout showBackButton={true} headerTitle="JAMB Practice Questions">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Subjects
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose up to 4 subjects and set question count for each (
            {selection.subjects.length}/4 selected)
          </ThemedText>
          {!hasActiveSubscription && (
            <ThemedText
              style={[styles.hint, { color: tintColor, fontWeight: "600" }]}
            >
              ⚠️ Non-subscribed users are limited to 5 questions per practice
              session. Subscribe to unlock unlimited practice questions.
            </ThemedText>
          )}
        </View>

        <View style={styles.subjectsContainer}>
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              const isSelected = selection.subjects.includes(subject);
              const isExpanded = expandedSubjects.has(subject);
              const count = questionCounts[subject];

              return (
                <View
                  key={subject}
                  style={[
                    styles.subjectCard,
                    {
                      backgroundColor: isSelected
                        ? tintColor + "10"
                        : cardBackground,
                      borderColor: isSelected ? tintColor : borderColor,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  {/* Subject Header - Clickable to select/deselect */}
                  <TouchableOpacity
                    style={styles.subjectHeader}
                    onPress={() => handleToggleSubject(subject)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subjectHeaderLeft}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected
                              ? tintColor
                              : "transparent",
                            borderColor: isSelected ? tintColor : borderColor,
                          },
                        ]}
                      >
                        {isSelected && (
                          <MaterialIcons name="check" size={20} color="#fff" />
                        )}
                      </View>
                      <View style={styles.subjectInfo}>
                        <ThemedText type="subtitle" style={styles.subjectName}>
                          {subject}
                        </ThemedText>
                        {isSelected && count && (
                          <ThemedText style={styles.questionCountPreview}>
                            {count} question{count !== 1 ? "s" : ""}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <TouchableOpacity
                        onPress={() => toggleAccordion(subject)}
                        style={styles.expandButton}
                      >
                        <MaterialIcons
                          name={isExpanded ? "expand-less" : "expand-more"}
                          size={24}
                          color={tintColor}
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {/* Accordion Content - Question Count Selection */}
                  {isSelected && isExpanded && (
                    <View style={styles.accordionContent}>
                      <View style={styles.inputSection}>
                        <ThemedText style={styles.inputLabel}>
                          Number of questions
                        </ThemedText>
                        <TouchableOpacity
                          style={[
                            styles.yearSelector,
                            {
                              borderColor:
                                count && count > 0 ? tintColor : borderColor,
                              backgroundColor: cardBackground,
                            },
                          ]}
                          onPress={() => {
                            setCurrentSubjectForQuestionCount(subject);
                            setShowQuestionCountModal(true);
                          }}
                        >
                          <ThemedText
                            style={{
                              color:
                                count && count > 0
                                  ? textColor
                                  : placeholderColor,
                              fontSize: 16,
                            }}
                          >
                            {count ? `${count}` : "Select number of questions"}
                          </ThemedText>
                          <MaterialIcons
                            name="arrow-drop-down"
                            size={24}
                            color={textColor}
                          />
                        </TouchableOpacity>
                        <ThemedText style={styles.hint}>
                          Minimum: 1, Maximum: {maxQuestionsPerSubject}{" "}
                          {!hasActiveSubscription ? "(Free users)" : ""}
                        </ThemedText>
                        {!hasActiveSubscription && (
                          <ThemedText
                            style={[
                              styles.hint,
                              { color: tintColor, marginTop: 4 },
                            ]}
                          >
                            💡 Subscribe to practice up to 100 questions per
                            session
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No subjects available for JAMB practice questions
              </ThemedText>
            </View>
          )}
        </View>

        {selection.subjects.length > 0 && (
          <View
            style={[styles.summaryCard, { backgroundColor: cardBackground }]}
          >
            <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>
                Selected Subjects:
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selection.subjects.length}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>
                Total Questions:
              </ThemedText>
              <ThemedText style={styles.summaryValue}>
                {totalQuestions || "Not set"}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

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
              {questionCountOptions.map((optionCount) => (
                <TouchableOpacity
                  key={optionCount}
                  style={[
                    styles.yearOption,
                    {
                      backgroundColor:
                        questionCounts[currentSubjectForQuestionCount || ""] ===
                        optionCount
                          ? tintColor + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => selectQuestionCount(optionCount)}
                >
                  <ThemedText
                    style={[
                      styles.yearOptionText,
                      {
                        color:
                          questionCounts[
                            currentSubjectForQuestionCount || ""
                          ] === optionCount
                            ? tintColor
                            : textColor,
                        fontWeight:
                          questionCounts[
                            currentSubjectForQuestionCount || ""
                          ] === optionCount
                            ? "600"
                            : "400",
                      },
                    ]}
                  >
                    {optionCount}
                  </ThemedText>
                  {questionCounts[currentSubjectForQuestionCount || ""] ===
                    optionCount && (
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
          title={`Continue (${selection.subjects.length} subject${
            selection.subjects.length === 1 ? "" : "s"
          })`}
          onPress={handleStartExam}
          disabled={selection.subjects.length === 0 || startingExam}
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
  },
  subjectsContainer: {
    gap: 12,
  },
  subjectCard: {
    borderRadius: 6,
    overflow: "hidden",
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
  },
  subjectHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "600",
  },
  questionCountPreview: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  expandButton: {
    padding: 4,
  },
  accordionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  summaryCard: {
    marginVertical: 24,
    padding: 20,
    borderRadius: 2,
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
