import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  BackHandler,
  TextInput,
  Image,
} from "react-native";
import * as ScreenCapture from 'expo-screen-capture';
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api, { BACKEND_BASE_URL } from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CalculatorModal } from "@/components/CalculatorModal";

// Types
interface Question {
  id: number;
  question_text: string;
  image?: string | null;
  question_type: string;
  points: number;
  order: number;
  answers: Answer[];
  subject?: string; // Subject name for organization
}

interface Answer {
  id: number;
  answer_text: string;
  order: string;
}

interface ExamData {
  id: number;
  title: string;
  duration: number;
  total_questions: number;
}

interface RouteParams {
  attemptId: number;
  examId: number;
  subjectsQuestions: Record<string, Question[]>; // Subject -> Questions mapping
  exam: ExamData;
  timeMinutes: number;
  subjects?: string[];
  questionCounts?: Record<string, number>;
  isPractice?: boolean;
}

export function ExamScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { incrementPracticeSession, selection } = useExamSelection();
  const params = route.params as RouteParams;

  const routeSubjects = params?.subjects || selection.subjects || [];


  const routeQuestionCounts = params?.questionCounts || selection.questionCounts || {};


  const routeTimeMinutes = params?.timeMinutes || selection.timeMinutes || 30;
  const routeIsPractice = params?.isPractice ?? (selection.questionMode === "practice");

  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] =
    useState<string | null>(null);

  const hasSubmittedRef = useRef(false);
  const selectedAnswersRef = useRef<Record<number, number>>({});
  const textInputAnswersRef = useRef<Record<number, string>>({});

  const [currentSubject, setCurrentSubject] = useState<string>(
    routeSubjects[0] || ""
  );
  const [subjectsQuestions, setSubjectsQuestions] = useState<
    Record<string, Question[]>
  >(params?.subjectsQuestions || {});
  const [subjectCurrentIndex, setSubjectCurrentIndex] = useState<
    Record<string, number>
  >(() => {
    // Initialize current index for each subject to 0
    const indices: Record<string, number> = {};
    routeSubjects.forEach((subject) => {
      indices[subject] = 0;
    });
    return indices;
  });
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [textInputAnswers, setTextInputAnswers] = useState<
    Record<number, string>
  >({});
  const [timeRemaining, setTimeRemaining] = useState(
    routeTimeMinutes * 60
  ); // in seconds
  const [loading, setLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
    textInputAnswersRef.current = textInputAnswers;
  }, [selectedAnswers, textInputAnswers]);

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  // const backgroundSecondary = useThemeColor({}, "backgroundSecondary");
  const backgroundSecondary = useThemeColor({}, 'cardBackground');

  // Get current subject's questions and progress
  const currentQuestions = subjectsQuestions[currentSubject] || [];
  const currentQuestionIndex = subjectCurrentIndex[currentSubject] || 0;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const totalQuestionsForSubject = currentQuestions.length;

  const baseUrl = BACKEND_BASE_URL;
  const imageUrl = currentQuestion.image
    ? currentQuestion.image.startsWith("http")
      ? currentQuestion.image
      : `${baseUrl}/storage/${currentQuestion.image}`
    : currentQuestion.image
      ? currentQuestion.image.startsWith("http")
        ? currentQuestion.image
        : `${baseUrl}${currentQuestion.image}`
      : currentQuestion.image
        ? `${baseUrl}/storage/${currentQuestion.image}`
        : null;

  console.log(imageUrl)

  // Check if all subjects are completed
  const allSubjectsCompleted = routeSubjects.every((subject) => {
    const questions = subjectsQuestions[subject] || [];
    return questions.every((q) => {
      if (q.question_type === 'text_input' || q.question_type === 'numeric_input') {
        return textInputAnswers[q.id] !== undefined && textInputAnswers[q.id].trim() !== '';
      }
      return selectedAnswers[q.id] !== undefined;
    });
  });

  // Handle back button press - ask permission before leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If already submitted, let them leave
      if (hasSubmittedRef.current) return;

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Prompt the user
      Alert.alert(
        "Submit Practice Exam?",
        "Are you sure you want to leave? Your exam will be submitted.",
        [
          { text: "Cancel", style: "cancel", onPress: () => { } },
          {
            text: "Submit & Leave",
            style: "destructive",
            onPress: () => {
              // Submit exam and dispatch the original navigation action
              submitExam().then(() => {
                navigation.dispatch(e.data.action);
              });
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [navigation])
  );

  // Screen Security
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // Define submitExam function
  const submitExam = useCallback(async () => {
    if (!params?.attemptId || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    try {
      setLoading(true);

      // Prepare bulk answers payload
      const answersPayload: any[] = [];

      // Add text/numeric answers
      for (const [questionId, textValue] of Object.entries(textInputAnswersRef.current)) {
        if (!textValue || textValue.trim() === '') continue;
        answersPayload.push({
          question_id: parseInt(questionId),
          answer_text: textValue.trim(),
        });
      }

      // Add multiple choice/true false answers
      for (const [questionId, answerId] of Object.entries(selectedAnswersRef.current)) {
        answersPayload.push({
          question_id: parseInt(questionId),
          answer_id: answerId as number,
        });
      }

      if (answersPayload.length > 0) {
        await api.post(`/exam-attempts/${params.attemptId}/submit-answers-bulk`, {
          answers: answersPayload,
        });
      }

      // Prepare subjects data for multi-subject exams
      const subjectsData = routeSubjects.map((subject) => ({
        subject: subject,
        question_count: routeQuestionCounts[subject] || 0,
      }));

      // Complete the exam with subjects and duration
      await api.post(`/exam-attempts/${params.attemptId}/complete`, {
        subjects: subjectsData,
        duration_minutes: routeTimeMinutes,
      });

      // Increment practice session if it was a practice exam
      if (
        routeIsPractice &&
        routeSubjects.length > 0
      ) {
        routeSubjects.forEach((subject) => {
          incrementPracticeSession(subject);
        });
      }

      // Navigate to results screen
      // @ts-ignore
      navigation.navigate("ExamResults", {
        attemptId: params.attemptId,
      });
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      Alert.alert("Error", "Failed to submit exam. Please try again.");
      hasSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [
    params,
    routeSubjects,
    routeQuestionCounts,
    routeTimeMinutes,
    routeIsPractice,
    incrementPracticeSession,
    navigation,
  ]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      // Auto-submit when time runs out
      submitExam();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, submitExam]);

  // Validate params
  if (
    !params ||
    !subjectsQuestions ||
    Object.keys(subjectsQuestions).length === 0
  ) {
    return (
      <AppLayout>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>
            Invalid exam data. Please try again.
          </ThemedText>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </AppLayout>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSelectAnswer = async (answerId: number) => {
    if (!currentQuestion || !params?.attemptId) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerId,
    });
  };

  const handleTextInputChange = (value: string) => {
    setTextInputAnswers({
      ...textInputAnswers,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestionsForSubject - 1) {
      setSubjectCurrentIndex({
        ...subjectCurrentIndex,
        [currentSubject]: currentQuestionIndex + 1,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setSubjectCurrentIndex({
        ...subjectCurrentIndex,
        [currentSubject]: currentQuestionIndex - 1,
      });
    }
  };

  const handleSwitchSubject = (subject: string) => {
    setCurrentSubject(subject);
    setShowSubjectModal(false);
  };

  const getSubjectProgress = (subject: string) => {
    const questions = subjectsQuestions[subject] || [];
    const answered = questions.filter(
      (q) => selectedAnswers[q.id] !== undefined
    ).length;
    return { answered, total: questions.length };
  };

  const handleCompleteExam = async (autoSubmit = false) => {
    const unansweredSubjects = routeSubjects.filter((subject) => {
      const questions = subjectsQuestions[subject] || [];
      return questions.some((q) => {
        if (q.question_type === 'text_input' || q.question_type === 'numeric_input') {
          return textInputAnswers[q.id] === undefined || textInputAnswers[q.id].trim() === '';
        }
        return selectedAnswers[q.id] === undefined;
      });
    });

    if (!autoSubmit && unansweredSubjects.length > 0) {
      Alert.alert(
        "Complete Exam",
        `You have unanswered questions in ${unansweredSubjects.length} ${unansweredSubjects.length === 1 ? "subject" : "subjects"
        }. Are you sure you want to submit?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Submit",
            style: "destructive",
            onPress: async () => {
              await submitExam();
            },
          },
        ]
      );
      return;
    }

    await submitExam();
  };

  const goToQuestion = (index: number) => {
    setSubjectCurrentIndex({
      ...subjectCurrentIndex,
      [currentSubject]: index,
    });
  };

  if (!currentQuestion) {
    return (
      <AppLayout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading exam...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const isLastQuestionInSubject =
    currentQuestionIndex === totalQuestionsForSubject - 1;
  const currentSubjectProgress = getSubjectProgress(currentSubject);

  return (
    <AppLayout showHeader={false}>
      <View style={styles.container}>
        {/* Custom Header with Timer and Subject Selector */}
        <View
          style={[
            styles.header,
            { backgroundColor: cardBackground, borderBottomColor: borderColor },
          ]}
        >
          <View style={styles.headerTop}>
            {/* Subject Selector */}
            <TouchableOpacity
              style={styles.subjectSelector}
              onPress={() => setShowSubjectModal(true)}
            >
              <ThemedText type="subtitle" style={styles.headerTitle}>
                {currentSubject}
              </ThemedText>
              <MaterialIcons
                name="arrow-drop-down"
                size={20}
                color={textColor}
              />
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => setShowCalculator(true)}
                style={styles.calculatorButton}
              >
                <MaterialIcons name="calculate" size={20} color={tintColor} />
              </TouchableOpacity>
              <View style={styles.timerContainer}>
                <MaterialIcons
                  name="access-time"
                  size={20}
                  color={timeRemaining < 300 ? "#EF4444" : tintColor}
                />
                <ThemedText
                  style={[
                    styles.timer,
                    { color: timeRemaining < 300 ? "#EF4444" : undefined },
                  ]}
                >
                  {formatTime(timeRemaining)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

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
                  Select Subject
                </ThemedText>
                <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {routeSubjects.map((subject) => {
                  const progress = getSubjectProgress(subject);
                  const isCurrent = subject === currentSubject;
                  return (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        styles.subjectOption,
                        {
                          backgroundColor: isCurrent
                            ? tintColor + "20"
                            : backgroundSecondary,
                          borderColor: isCurrent ? tintColor : borderColor,
                        },
                      ]}
                      onPress={() => handleSwitchSubject(subject)}
                    >
                      <View style={styles.subjectOptionContent}>
                        <ThemedText
                          type="subtitle"
                          style={styles.subjectOptionName}
                        >
                          {subject}
                        </ThemedText>
                        <ThemedText style={styles.subjectOptionProgress}>
                          {progress.answered} / {progress.total} answered
                        </ThemedText>
                      </View>
                      {isCurrent && (
                        <MaterialIcons
                          name="check-circle"
                          size={24}
                          color={tintColor}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Calculator Modal */}
        <CalculatorModal
          visible={showCalculator}
          onClose={() => setShowCalculator(false)}
        />

        {/* Question */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={[styles.questionCard, { backgroundColor: cardBackground }]}
          >
            <ThemedText type="subtitle" style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
            </ThemedText>
            <ThemedText style={styles.questionText}>
              {currentQuestion.question_text}
            </ThemedText>
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQuestion.question_type === "multiple_choice" &&
              currentQuestion.answers?.map((answer) => {
                const isSelected = selectedAnswerId === answer.id;
                return (
                  <TouchableOpacity
                    key={answer.id}
                    style={[
                      styles.answerCard,
                      {
                        backgroundColor: isSelected
                          ? tintColor + "20"
                          : cardBackground,
                        borderColor: isSelected ? tintColor : borderColor,
                      },
                    ]}
                    onPress={() => handleSelectAnswer(answer.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.answerIndicator,
                        {
                          backgroundColor: isSelected ? tintColor : "transparent",
                          borderColor: tintColor,
                        },
                      ]}
                    >
                      {isSelected && (
                        <MaterialIcons name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <ThemedText
                      style={[
                        styles.answerText,
                        { color: isSelected ? tintColor : undefined },
                      ]}
                    >
                      {answer.order}. {answer.answer_text}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}

            {currentQuestion.question_type === "true_false" && (() => {
              const trueAnswer = currentQuestion.answers?.find(
                (a) => {
                  const txt = a.answer_text.toLowerCase().trim();
                  return txt === "true" || txt === "1" || txt === "yes";
                }
              ) || currentQuestion.answers?.[0];

              const falseAnswer = currentQuestion.answers?.find(
                (a) => {
                  const txt = a.answer_text.toLowerCase().trim();
                  return txt === "false" || txt === "0" || txt === "no";
                }
              ) || currentQuestion.answers?.[1];

              const virtualTrueId = trueAnswer?.id ?? -1000 - currentQuestion.id;
              const virtualFalseId = falseAnswer?.id ?? -2000 - currentQuestion.id;

              return (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.answerCard,
                      { flex: 1, justifyContent: "center" },
                      selectedAnswerId === (trueAnswer?.id ?? virtualTrueId) && {
                        backgroundColor: tintColor + "20",
                        borderColor: tintColor,
                      },
                    ]}
                    onPress={() => handleSelectAnswer(trueAnswer?.id ?? virtualTrueId)}
                  >
                    <ThemedText
                      style={[
                        { textAlign: "center", fontWeight: "600", fontSize: 16 },
                        selectedAnswerId === (trueAnswer?.id ?? virtualTrueId) && { color: tintColor },
                      ]}
                    >
                      True
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.answerCard,
                      { flex: 1, justifyContent: "center" },
                      selectedAnswerId === (falseAnswer?.id ?? virtualFalseId) && {
                        backgroundColor: tintColor + "20",
                        borderColor: tintColor,
                      },
                    ]}
                    onPress={() => handleSelectAnswer(falseAnswer?.id ?? virtualFalseId)}
                  >
                    <ThemedText
                      style={[
                        { textAlign: "center", fontWeight: "600", fontSize: 16 },
                        selectedAnswerId === (falseAnswer?.id ?? virtualFalseId) && { color: tintColor },
                      ]}
                    >
                      False
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {(currentQuestion.question_type === "text_input" || currentQuestion.question_type === "numeric_input") && (
              <View style={[styles.textInputContainer, { borderColor: tintColor }]}>
                <TextInput
                  style={[styles.textInput, { color: textColor }]}
                  value={textInputAnswers[currentQuestion.id] || ""}
                  onChangeText={handleTextInputChange}
                  placeholder={currentQuestion.question_type === "numeric_input" ? "Enter a number..." : "Type your answer here..."}
                  placeholderTextColor={useThemeColor({}, "placeholder")}
                  keyboardType={currentQuestion.question_type === "numeric_input" ? "numeric" : "default"}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Navigation Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: cardBackground, borderTopColor: borderColor },
          ]}
        >
          <View style={styles.questionGrid}>
            {currentQuestions.map((q, index) => {
              let isAnswered = false;
              if (q.question_type === 'text_input' || q.question_type === 'numeric_input') {
                isAnswered = textInputAnswers[q.id] !== undefined && textInputAnswers[q.id].trim() !== '';
              } else {
                isAnswered = selectedAnswers[q.id] !== undefined;
              }

              const isCurrent = index === currentQuestionIndex;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.questionDot,
                    {
                      backgroundColor: isCurrent
                        ? tintColor
                        : isAnswered
                          ? tintColor + "80"
                          : "transparent",
                      borderColor: tintColor,
                    },
                  ]}
                  onPress={() => goToQuestion(index)}
                >
                  <ThemedText
                    style={[
                      styles.questionDotText,
                      { color: isCurrent || isAnswered ? "#fff" : tintColor },
                    ]}
                  >
                    {index + 1}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.footerButtons}>
            <Button
              title="Previous"
              onPress={handlePrevious}
              variant="outline"
              disabled={currentQuestionIndex === 0}
              style={styles.footerButton}
            />
            {isLastQuestionInSubject && allSubjectsCompleted ? (
              <Button
                title={loading ? "Submitting..." : "Submit Exam"}
                onPress={() => handleCompleteExam(false)}
                disabled={loading}
                style={styles.footerButton}
              />
            ) : isLastQuestionInSubject ? (
              <Button
                title="Next Subject"
                onPress={() => {
                  // Find next incomplete subject
                  const currentIndex =
                    routeSubjects.indexOf(currentSubject);
                  const nextSubjects = routeSubjects.slice(
                    currentIndex + 1
                  );
                  const incompleteSubject = nextSubjects.find((subject) => {
                    const progress = getSubjectProgress(subject);
                    return progress.answered < progress.total;
                  });

                  if (incompleteSubject) {
                    handleSwitchSubject(incompleteSubject);
                  } else {
                    // All subjects done, allow submit
                    handleCompleteExam(false);
                  }
                }}
                style={styles.footerButton}
              />
            ) : (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.footerButton}
              />
            )}
          </View>
          {allSubjectsCompleted && !isLastQuestionInSubject && (
            <Button
              title={loading ? "Submitting..." : "Submit Exam"}
              onPress={() => handleCompleteExam(false)}
              disabled={loading}
              style={StyleSheet.flatten([
                styles.footerButton,
                { marginTop: 12 },
              ])}
            />
          )}
        </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.7,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectSelector: {
    // borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  calculatorButton: {
    padding: 6,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timer: {
    fontSize: 16,
    fontWeight: "600",
  },
  subjectProgress: {
    marginBottom: 8,
  },
  subjectProgressText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  subjectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  subjectOptionContent: {
    flex: 1,
  },
  subjectOptionName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subjectOptionProgress: {
    fontSize: 14,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    marginBottom: 30,
  },
  questionNumber: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
  },
  questionImage: {
    width: "100%",
    height: 200,
    marginTop: 16,
    borderRadius: 8,
  },
  answersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  answerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  answerIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  textInputContainer: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    fontSize: 16,
    minHeight: 40,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  questionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "flex-start",
  },
  questionDot: {
    width: 36,
    height: 36,
    borderRadius: 2,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  questionDotText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
