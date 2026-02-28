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
import { useNavigation, useRoute } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SubjectTest {
  id: number;
  subject_id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  slug: string;
  tests?: SubjectTest[];
}

export function DepartmentSubjects() {
  const { setQuestionMode, addSubject, removeSubject, setQuestionCount, setTimeMinutes } =
    useExamSelection();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const departmentId = (route.params as { departmentId?: number })?.departmentId;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [questionCount, setQuestionCountLocal] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutesLocal] = useState<number | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [startingExam, setStartingExam] = useState(false);
  const [showLimitedModal, setShowLimitedModal] = useState(false);
  const [limitedData, setLimitedData] = useState<{
    available: number;
    requested: number;
    subject: string;
  } | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({}, "placeholder");

  const selectedSubjectData = subjects.find((s) => s.name === selectedSubject);
  const testsForSubject = selectedSubjectData?.tests ?? [];
  const requiresTestSelection = testsForSubject.length > 0;

  const maxQuestionsPerSubject = hasActiveSubscription ? 50 : 5;
  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  useEffect(() => {
    setQuestionMode("practice");
  }, [setQuestionMode]);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/status");
        if (response.data.success && response.data.data) {
          setHasActiveSubscription(
            response.data.data.has_active_subscription || false
          );
        } else {
          const userActive =
            user?.subscription_status === "active" &&
            user?.subscription_expires_at &&
            new Date(user.subscription_expires_at) > new Date();
          setHasActiveSubscription(userActive || false);
        }
      } catch {
        const userActive =
          user?.subscription_status === "active" &&
          user?.subscription_expires_at &&
          new Date(user.subscription_expires_at) > new Date();
        setHasActiveSubscription(userActive || false);
      }
    };
    if (user) checkSubscription();
  }, [user]);

  useEffect(() => {
    if (!departmentId) {
      // @ts-ignore
      navigation.navigate("DepartmentsList");
      return;
    }
    loadSubjects();
  }, [departmentId]);

  const loadSubjects = async () => {
    if (!departmentId) return;
    try {
      setLoading(true);
      const response = await api.get(`/departments/${departmentId}/subjects`, {
        params: { exam_type: "DLI" },
      });
      if (response.data.success && response.data.data) {
        setSubjects(response.data.data);
        if (response.data.data.length === 0) {
          Alert.alert(
            "No Subjects",
            "No subjects are available for this department at the moment.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to load subjects. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const selectSubject = (subject: string) => {
    if (selectedSubject === subject) {
      setSelectedSubject(null);
      removeSubject(subject);
    } else {
      if (selectedSubject) removeSubject(selectedSubject);
      setSelectedSubject(subject);
      addSubject(subject);
    }
    setSelectedTestId(null);
    setQuestionCountLocal(null);
    setTimeMinutesLocal(null);
    setShowSubjectModal(false);
  };

  const selectTest = (testId: number) => {
    setSelectedTestId(testId);
    setQuestionCountLocal(null);
    setTimeMinutesLocal(null);
    setShowTestModal(false);
  };

  const selectQuestionCount = (count: number) => {
    setQuestionCountLocal(count);
    setTimeMinutesLocal(null);
    setShowQuestionCountModal(false);
  };

  const selectTime = (minutes: number) => {
    setTimeMinutesLocal(minutes);
    setShowTimeModal(false);
  };

  const proceedWithPractice = async (
    allQuestions: any[],
    subj: string,
    count: number,
    mins: number
  ) => {
    const questionsWithSubject = allQuestions.map((q: any) => ({
      ...q,
      subject: subj,
    }));

    const sessionResponse = await api.post("/practice/start", {
      exam_type: "DLI",
      subjects: [{ subject: subj, question_count: Math.min(count, allQuestions.length) }],
      duration_minutes: mins,
    });

    if (sessionResponse.data.success && sessionResponse.data.data?.attempt) {
      const attempt = sessionResponse.data.data.attempt;
      setQuestionCount(subj, Math.min(count, allQuestions.length));
      setTimeMinutes(mins);

      // @ts-ignore
      navigation.navigate("ExamScreen", {
        attemptId: attempt.id,
        examId: attempt.exam_id || 0,
        subjectsQuestions: { [subj]: questionsWithSubject },
        exam: {
          id: attempt.exam_id || 0,
          title: `DLI ${subj} Practice Questions`,
          duration: mins,
          total_questions: questionsWithSubject.length,
        },
        timeMinutes: mins,
        subjects: [subj],
        isPractice: true,
      });
    } else {
      Alert.alert(
        "Error",
        sessionResponse.data?.message || "Failed to start practice session."
      );
    }
  };

  const handleStartPractice = async () => {
    if (!selectedSubject) {
      Alert.alert("No Course", "Please select a course to continue.");
      return;
    }
    if (requiresTestSelection && !selectedTestId) {
      Alert.alert("No Test", "Please select a test to continue.");
      return;
    }
    if (!questionCount || questionCount < 1) {
      Alert.alert("Invalid Count", "Please select a valid number of questions.");
      return;
    }
    if (questionCount > maxQuestionsPerSubject) {
      Alert.alert(
        "Too Many",
        `Maximum allowed is ${maxQuestionsPerSubject} questions per course.`
      );
      return;
    }
    if (!timeMinutes || timeMinutes < 1) {
      Alert.alert("Invalid Time", "Please select a valid duration.");
      return;
    }
    if (timeMinutes > 120) {
      Alert.alert("Time Limit", "Maximum allowed time is 120 minutes.");
      return;
    }

    try {
      setStartingExam(true);

      const params: Record<string, string | number> = {
        exam_type: "DLI",
        subject: selectedSubject,
        count: questionCount,
      };
      if (selectedTestId) params.subject_test_id = selectedTestId;

      const questionsResponse = await api.get("/questions/practice", {
        params,
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
          "No Questions",
          `No practice questions available for ${selectedSubject}. Please try a different course.`
        );
        return;
      }

      if (allQuestions.length < questionCount) {
        setLimitedData({
          available: allQuestions.length,
          requested: questionCount,
          subject: selectedSubject,
        });
        setPendingQuestions(allQuestions);
        setShowLimitedModal(true);
        return;
      }

      await proceedWithPractice(
        allQuestions,
        selectedSubject,
        questionCount,
        timeMinutes
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to start practice. Please try again."
      );
    } finally {
      setStartingExam(false);
    }
  };

  const handleLimitedProceed = async () => {
    if (
      limitedData &&
      selectedSubject &&
      timeMinutes &&
      pendingQuestions.length > 0
    ) {
      setShowLimitedModal(false);
      await proceedWithPractice(
        pendingQuestions,
        limitedData.subject,
        limitedData.available,
        timeMinutes
      );
      setLimitedData(null);
      setPendingQuestions([]);
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Select Subject">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading subjects...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Select Subject">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Subject
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Select your course, number of questions, and time.
          </ThemedText>
          {!hasActiveSubscription && (
            <ThemedText
              style={[styles.hint, { color: tintColor, fontWeight: "600" }]}
            >
              ⚠️ Non-subscribed users are limited to 5 questions per session.
            </ThemedText>
          )}
        </View>

        {/* Subject Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Course *</ThemedText>
          <TouchableOpacity
            style={[
              styles.selector,
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
              {selectedSubject || "Choose a course"}
            </ThemedText>
            <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Test Selection - only when subject has tests */}
        {selectedSubject && requiresTestSelection && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Select Test *</ThemedText>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  borderColor: selectedTestId ? tintColor : borderColor,
                  backgroundColor: cardBackground,
                },
              ]}
              onPress={() => setShowTestModal(true)}
            >
              <ThemedText
                style={{
                  color: selectedTestId ? textColor : placeholderColor,
                  fontSize: 16,
                }}
              >
                {selectedTestId
                  ? testsForSubject.find((t) => t.id === selectedTestId)?.name
                  : "Choose a test"}
              </ThemedText>
              <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        )}

        {/* Question Count - show when subject (and test if required) selected */}
        {selectedSubject && (!requiresTestSelection || selectedTestId) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Number of Questions *
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  borderColor: questionCount ? tintColor : borderColor,
                  backgroundColor: cardBackground,
                },
              ]}
              onPress={() => setShowQuestionCountModal(true)}
            >
              <ThemedText
                style={{
                  color: questionCount ? textColor : placeholderColor,
                  fontSize: 16,
                }}
              >
                {questionCount || "Select number of questions"}
              </ThemedText>
              <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        )}

        {/* Time */}
        {selectedSubject &&
          (!requiresTestSelection || selectedTestId) &&
          questionCount && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Time (Minutes) *</ThemedText>
              <TouchableOpacity
                style={[
                  styles.selector,
                  {
                    borderColor: timeMinutes ? tintColor : borderColor,
                    backgroundColor: cardBackground,
                  },
                ]}
                onPress={() => setShowTimeModal(true)}
              >
                <ThemedText
                  style={{
                    color: timeMinutes ? textColor : placeholderColor,
                    fontSize: 16,
                  }}
                >
                  {timeMinutes || "Select duration"}
                </ThemedText>
                <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
          )}
      </ScrollView>

      {/* Subject Modal */}
      <Modal
        visible={showSubjectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
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
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.option,
                    { backgroundColor: selectedSubject === s.name ? tintColor + "20" : "transparent" },
                  ]}
                  onPress={() => selectSubject(s.name)}
                >
                  <ThemedText
                    style={{
                      color: selectedSubject === s.name ? tintColor : textColor,
                      fontWeight: selectedSubject === s.name ? "600" : "400",
                    }}
                  >
                    {s.name}
                  </ThemedText>
                  {selectedSubject === s.name && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Test Modal */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Select Test
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowTestModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {testsForSubject.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.option,
                    { backgroundColor: selectedTestId === t.id ? tintColor + "20" : "transparent" },
                  ]}
                  onPress={() => selectTest(t.id)}
                >
                  <ThemedText
                    style={{
                      color: selectedTestId === t.id ? tintColor : textColor,
                      fontWeight: selectedTestId === t.id ? "600" : "400",
                    }}
                  >
                    {t.name}
                  </ThemedText>
                  {selectedTestId === t.id && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Question Count Modal */}
      <Modal
        visible={showQuestionCountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuestionCountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Number of Questions
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowQuestionCountModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {questionCountOptions.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.option,
                    { backgroundColor: questionCount === c ? tintColor + "20" : "transparent" },
                  ]}
                  onPress={() => selectQuestionCount(c)}
                >
                  <ThemedText
                    style={{
                      color: questionCount === c ? tintColor : textColor,
                      fontWeight: questionCount === c ? "600" : "400",
                    }}
                  >
                    {c} question{c !== 1 ? "s" : ""}
                  </ThemedText>
                  {questionCount === c && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Time (Minutes)
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowTimeModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {timeOptions.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.option,
                    { backgroundColor: timeMinutes === m ? tintColor + "20" : "transparent" },
                  ]}
                  onPress={() => selectTime(m)}
                >
                  <ThemedText
                    style={{
                      color: timeMinutes === m ? tintColor : textColor,
                      fontWeight: timeMinutes === m ? "600" : "400",
                    }}
                  >
                    {m} min
                  </ThemedText>
                  {timeMinutes === m && (
                    <MaterialIcons name="check" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Limited Questions Modal */}
      <Modal
        visible={showLimitedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitedModal(false)}
      >
        <View style={styles.limitedOverlay}>
          <View style={[styles.limitedContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.limitedTitle}>Limited Questions Available</ThemedText>
            <ThemedText style={styles.limitedText}>
              Only {limitedData?.available} question{limitedData?.available !== 1 ? "s" : ""}{" "}
              available for {limitedData?.subject} (requested {limitedData?.requested}). Proceed
              with {limitedData?.available}?
            </ThemedText>
            <View style={styles.limitedActions}>
              <Button title="Proceed" onPress={handleLimitedProceed} />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowLimitedModal(false);
                  setLimitedData(null);
                  setPendingQuestions([]);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Button
          title={startingExam ? "Starting..." : "Start Practice"}
          onPress={handleStartPractice}
          disabled={
            !selectedSubject ||
            (requiresTestSelection && !selectedTestId) ||
            !questionCount ||
            !timeMinutes ||
            startingExam
          }
          loading={startingExam}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, opacity: 0.7 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 8 },
  hint: { fontSize: 14, opacity: 0.6, fontStyle: "italic", marginTop: 8 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  closeButton: { padding: 4 },
  modalScrollView: { maxHeight: 400 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  limitedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  limitedContent: {
    borderRadius: 16,
    padding: 24,
  },
  limitedTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  limitedText: { opacity: 0.8, marginBottom: 24, textAlign: "center" },
  limitedActions: { gap: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
});
