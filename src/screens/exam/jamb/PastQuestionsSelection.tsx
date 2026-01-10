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

interface SubjectSelection {
  subject: string;
  questionCount: number;
  year: number | null;
}

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

export function JAMBPastQuestionsSelection() {
  const {
    selection,
    addSubject,
    removeSubject,
    setQuestionCount,
    setSelectedYear,
    setTimeMinutes,
  } = useExamSelection();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [yearsBySubject, setYearsBySubject] = useState<
    Record<string, number[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadingYears, setLoadingYears] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set()
  );
  const [subjectSelections, setSubjectSelections] = useState<
    Record<string, SubjectSelection>
  >({});
  const [showYearModal, setShowYearModal] = useState(false);
  const [currentSubjectForYear, setCurrentSubjectForYear] = useState<
    string | null
  >(null);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] =
    useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);

  // Check if user has active subscription
  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  // Generate question count options based on subscription
  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({}, "placeholder");

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/exams/subjects", {
        params: {
          exam_type: "JAMB",
          type: "past_question",
        },
      });

      if (response.data.success) {
        const subjectsList = response.data.data || [];
        setSubjectsList(subjectsList);

        if (subjectsList.length === 0) {
          Alert.alert(
            "No Subjects Available",
            "No JAMB past question subjects are available at the moment. Please try again later.",
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

  const loadYearsForSubject = async (subject: string) => {
    // If years already loaded for this subject, don't load again
    if (yearsBySubject[subject] && yearsBySubject[subject].length > 0) {
      return;
    }

    try {
      setLoadingYears(true);
      const response = await api.get("/exams/years", {
        params: {
          exam_type: "JAMB",
          subjects: [subject], // Send as array with single subject
        },
      });

      if (response.data.success) {
        const subjectYears = response.data.data || [];
        setYearsBySubject((prev) => ({
          ...prev,
          [subject]: subjectYears,
        }));
        // Also update the main years state for backward compatibility
        setYears(subjectYears);
      }
    } catch (error: any) {
      console.error("Error loading years:", error);
      setYearsBySubject((prev) => ({
        ...prev,
        [subject]: [],
      }));
    } finally {
      setLoadingYears(false);
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
      setSubjectSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[subject];
        return newSelections;
      });
    } else {
      if (selection.subjects.length < 4) {
        addSubject(subject);
        setExpandedSubjects((prev) => new Set(prev).add(subject));
        setSubjectSelections((prev) => ({
          ...prev,
          [subject]: {
            subject,
            questionCount: 0,
            year: null,
          },
        }));
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
      const wasExpanded = newSet.has(subject);

      if (wasExpanded) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
        // Load years when expanding the accordion
        loadYearsForSubject(subject);
      }
      return newSet;
    });
  };

  const handleQuestionCountChange = (subject: string, count: string) => {
    const numCount = parseInt(count) || 0;
    setSubjectSelections((prev) => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        questionCount: numCount,
      },
    }));
  };

  const openYearModal = (subject: string) => {
    // Ensure years are loaded for this subject
    if (!yearsBySubject[subject] || yearsBySubject[subject].length === 0) {
      loadYearsForSubject(subject);
    }
    setCurrentSubjectForYear(subject);
    setShowYearModal(true);
  };

  const selectYear = (year: number) => {
    if (currentSubjectForYear) {
      setSubjectSelections((prev) => ({
        ...prev,
        [currentSubjectForYear]: {
          ...prev[currentSubjectForYear],
          year,
        },
      }));
      setShowYearModal(false);
      setCurrentSubjectForYear(null);
    }
  };

  const selectQuestionCount = (count: number) => {
    if (currentSubjectForQuestionCount) {
      handleQuestionCountChange(
        currentSubjectForQuestionCount,
        count.toString()
      );
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

    // Validate all subjects have question counts and years
    const missingData: string[] = [];
    selection.subjects.forEach((subject) => {
      const selection = subjectSelections[subject];
      if (
        !selection ||
        !selection.questionCount ||
        selection.questionCount < 1
      ) {
        missingData.push(`${subject} - question count`);
      }
      if (!selection || !selection.year) {
        missingData.push(`${subject} - year`);
      }
    });

    if (missingData.length > 0) {
      Alert.alert(
        "Incomplete Selection",
        `Please complete the following:\n${missingData.join("\n")}`,
        [{ text: "OK" }]
      );
      return;
    }

    // Validate question counts based on subscription
    for (const subject of selection.subjects) {
      const subjectSelection = subjectSelections[subject];
      if (subjectSelection.questionCount > maxQuestionsPerSubject) {
        Alert.alert(
          "Too Many Questions",
          `Maximum allowed is ${maxQuestionsPerSubject} questions per subject. ${subject} has ${subjectSelection.questionCount} questions.`,
          [{ text: "OK" }]
        );
        return;
      }
    }

    try {
      setStartingExam(true);

      // Set values in context
      selection.subjects.forEach((subject) => {
        const subjectSelection = subjectSelections[subject];
        setQuestionCount(subject, subjectSelection.questionCount);
      });

      // Use the first subject's year as the selected year (for compatibility)
      const firstYear = subjectSelections[selection.subjects[0]].year;
      if (firstYear) {
        setSelectedYear(firstYear);
      }

      // Calculate default time (30 minutes per subject)
      const timeMinutesNum = selection.subjects.length * 30;
      setTimeMinutes(timeMinutesNum);

      // Fetch questions for all subjects
      const subjectsQuestions: Record<string, Question[]> = {};
      let firstExamId: number | null = null;

      for (const subject of selection.subjects) {
        const subjectSelection = subjectSelections[subject];

        const examResponse = await api.get("/exams", {
          params: {
            exam_type: "JAMB",
            subject: subject,
            year: subjectSelection.year,
          },
        });

        if (!examResponse.data.success || examResponse.data.data.length === 0) {
          Alert.alert(
            "No Exam Found",
            `No past questions found for ${subject} in ${subjectSelection.year}. Please try a different year.`
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
          Alert.alert(
            "Error",
            `Failed to load questions for ${subject}. Please try again.`
          );
          return;
        }

        const questionsData = questionsResponse.data.data;
        const allQuestions = questionsData.questions || [];

        // Limit questions to selected count for this subject
        const limitedQuestions = allQuestions.slice(
          0,
          subjectSelection.questionCount
        );

        // Add subject identifier to questions
        const questionsWithSubject = limitedQuestions.map((q: any) => ({
          ...q,
          subject: subject,
        }));

        subjectsQuestions[subject] = questionsWithSubject;
      }

      if (!firstExamId) {
        Alert.alert("Error", "Failed to start exam. Please try again.");
        return;
      }

      // Prepare subjects data
      const subjectsData = selection.subjects.map((subject) => {
        const subjectSelection = subjectSelections[subject];
        return {
          subject: subject,
          question_count: subjectSelection.questionCount,
        };
      });

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
          title: `JAMB ${selection.subjects.join(", ")} Past Questions`,
          duration: timeMinutesNum,
          total_questions: totalQuestions,
        },
        timeMinutes: timeMinutesNum,
      });
    } catch (error: any) {
      console.error("Error starting exam:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to start exam. Please check your connection and try again."
      );
    } finally {
      setStartingExam(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="JAMB Past Questions">
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
    const selection = subjectSelections[subject];
    return sum + (selection?.questionCount || 0);
  }, 0);

  return (
    <AppLayout showBackButton={true} headerTitle="JAMB Past Questions">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Subjects
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose up to 4 subjects and set question count and year for each (
            {selection.subjects.length}/4 selected)
          </ThemedText>
          {!hasActiveSubscription && (
            <ThemedText
              style={[styles.hint, { color: tintColor, fontWeight: "600" }]}
            >
              ⚠️ Non-subscribed users are limited to 5 questions per subject.
              Subscribe to unlock up to 100 questions per subject.
            </ThemedText>
          )}
          <ThemedText style={styles.hint}>
            Each subject takes 30 minutes. Total time will be calculated
            automatically.
          </ThemedText>
        </View>

        <View style={styles.subjectsContainer}>
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              const isSelected = selection.subjects.includes(subject);
              const isExpanded = expandedSubjects.has(subject);
              const subjectSelection = subjectSelections[subject];

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
                        {isSelected && subjectSelection && (
                          <ThemedText style={styles.questionCountPreview}>
                            {subjectSelection.questionCount} questions
                            {subjectSelection.year &&
                              ` • Year ${subjectSelection.year}`}
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

                  {/* Accordion Content - Question Count and Year Selection */}
                  {isSelected && isExpanded && (
                    <View style={styles.accordionContent}>
                      {/* Question Count */}
                      <View style={styles.inputSection}>
                        <ThemedText style={styles.inputLabel}>
                          Number of questions
                        </ThemedText>
                        <TouchableOpacity
                          style={[
                            styles.yearSelector,
                            {
                              borderColor:
                                subjectSelection?.questionCount &&
                                subjectSelection.questionCount > 0
                                  ? tintColor
                                  : borderColor,
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
                                subjectSelection?.questionCount &&
                                subjectSelection.questionCount > 0
                                  ? textColor
                                  : placeholderColor,
                              fontSize: 16,
                            }}
                          >
                            {subjectSelection?.questionCount
                              ? `${subjectSelection.questionCount}`
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
                            subject
                          </ThemedText>
                        )}
                      </View>

                      {/* Year Selection */}
                      <View style={styles.inputSection}>
                        <ThemedText style={styles.inputLabel}>Year</ThemedText>
                        <TouchableOpacity
                          style={[
                            styles.yearSelector,
                            {
                              borderColor: subjectSelection?.year
                                ? tintColor
                                : borderColor,
                              backgroundColor: cardBackground,
                            },
                          ]}
                          onPress={() => openYearModal(subject)}
                        >
                          <ThemedText
                            style={{
                              color: subjectSelection?.year
                                ? textColor
                                : placeholderColor,
                              fontSize: 16,
                            }}
                          >
                            {subjectSelection?.year
                              ? `${subjectSelection.year}`
                              : "Select year"}
                          </ThemedText>
                          <MaterialIcons
                            name="arrow-drop-down"
                            size={24}
                            color={textColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No subjects available for JAMB past questions
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
              {questionCountOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.yearOption,
                    {
                      backgroundColor:
                        subjectSelections[currentSubjectForQuestionCount || ""]
                          ?.questionCount === count
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
                        color:
                          subjectSelections[
                            currentSubjectForQuestionCount || ""
                          ]?.questionCount === count
                            ? tintColor
                            : textColor,
                        fontWeight:
                          subjectSelections[
                            currentSubjectForQuestionCount || ""
                          ]?.questionCount === count
                            ? "600"
                            : "400",
                      },
                    ]}
                  >
                    {count}
                  </ThemedText>
                  {subjectSelections[currentSubjectForQuestionCount || ""]
                    ?.questionCount === count && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Selection Modal */}
      <Modal
        visible={showYearModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: cardBackground }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Select Year
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowYearModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {loadingYears ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color={tintColor} />
                  <ThemedText style={styles.modalLoadingText}>
                    Loading years...
                  </ThemedText>
                </View>
              ) : currentSubjectForYear &&
                yearsBySubject[currentSubjectForYear] &&
                yearsBySubject[currentSubjectForYear].length > 0 ? (
                yearsBySubject[currentSubjectForYear].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      {
                        backgroundColor:
                          subjectSelections[currentSubjectForYear || ""]
                            ?.year === year
                            ? tintColor + "20"
                            : "transparent",
                      },
                    ]}
                    onPress={() => selectYear(year)}
                  >
                    <ThemedText
                      style={[
                        styles.yearOptionText,
                        {
                          color:
                            subjectSelections[currentSubjectForYear || ""]
                              ?.year === year
                              ? tintColor
                              : textColor,
                          fontWeight:
                            subjectSelections[currentSubjectForYear || ""]
                              ?.year === year
                              ? "600"
                              : "400",
                        },
                      ]}
                    >
                      {year}
                    </ThemedText>
                    {subjectSelections[currentSubjectForYear || ""]?.year ===
                      year && (
                      <MaterialIcons name="check" size={24} color={tintColor} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalEmptyContainer}>
                  <ThemedText style={styles.modalEmptyText}>
                    No years available for this subject
                  </ThemedText>
                </View>
              )}
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
    borderRadius: 12,
    overflow: "hidden",
    // elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
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
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
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
    borderRadius: 5,
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
    borderStyle: "dashed",
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
  modalLoadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  modalEmptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
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
