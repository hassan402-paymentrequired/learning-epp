import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
  Alert,
  Pressable,
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
import { Fonts } from "@/constants/Fonts";

interface SubjectTest {
  id: number;
  subject_id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  slug: string;
  description: string;
  questions_count: number;
  tests?: SubjectTest[];
}

type ConfigModalStep = "main" | "test" | "count" | "time";

export function DepartmentSubjects() {
  const { selection, setQuestionMode, addSubject, removeSubject, setQuestionCount, setTimeMinutes } =
    useExamSelection();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const departmentId = (route.params as { departmentId?: number })?.departmentId;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedSubjectObj, setSelectedSubjectObj] = useState<Subject | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [questionCount, setQuestionCountLocal] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutesLocal] = useState<number | null>(null);
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalStep, setConfigModalStep] = useState<ConfigModalStep>("main");
  
  const [startingExam, setStartingExam] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tintColor = "#4800b2";
  const borderColor = "#f1f5f9";
  const textColor = "#1a1c1d";

  useEffect(() => {
    setQuestionMode("practice");
    const checkSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/status");
        if (response.data.success && response.data.data) {
          setHasActiveSubscription(response.data.data.has_active_subscription || false);
        }
      } catch (e) {}
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
        params: { exam_type: selection.examType },
      });
      if (response.data.success && response.data.data) {
        setSubjects(response.data.data);
      }
    } catch (err: any) {
    } finally {
      setLoading(false);
      setRefreshing(false)
    }
  };

  const closeConfigModal = () => {
    setShowConfigModal(false);
    setConfigModalStep("main");
  };

  const handleSubjectPress = (subject: Subject) => {
    setSelectedSubjectObj(subject);
    addSubject(subject.name);
    setSelectedTestId(null);
    setQuestionCountLocal(null);
    setTimeMinutesLocal(null);
    setConfigModalStep("main");
    setShowConfigModal(true);
  };

  const startPractice = async () => {
    if (!selectedSubjectObj || !questionCount || !timeMinutes) return;
    
    try {
      setStartingExam(true);
      const subj = selectedSubjectObj.name;
      
      const payload: any = {
        exam_type: selection.examType,
        subjects: [
          { 
            subject: subj, 
            question_count: questionCount,
            subject_test_id: selectedTestId || undefined
          }
        ],
        duration_minutes: timeMinutes,
      };

      const sessionResponse = await api.post("/practice/start", payload);

      if (sessionResponse.data.success && sessionResponse.data.data?.attempt) {
        const { attempt, questions } = sessionResponse.data.data;
        const allQuestions = questions[subj] || [];

        if (allQuestions.length === 0) {
          Alert.alert("No Questions", "Sorry, there are no questions available for this selection yet.");
          return;
        }

        // Update local context state
        setQuestionCount(subj, allQuestions.length);
        setTimeMinutes(timeMinutes);

        // Navigate to ExamScreen
        // @ts-ignore
        navigation.navigate("ExamScreen", {
          attemptId: attempt.id,
          examId: attempt.exam_id || 0,
          subjectsQuestions: { [subj]: allQuestions },
          exam: {
            id: attempt.exam_id || 0,
            title: `${subj} Practice`,
            duration: timeMinutes,
            total_questions: allQuestions.length,
          },
          timeMinutes: timeMinutes,
          subjects: [subj],
          isPractice: true,
        });
        closeConfigModal();
      } else {
        Alert.alert("Error", "Failed to start practice session. Please try again.");
      }
    } catch (e: any) {
      console.error("Start practice error:", e);
      const message = e.response?.data?.message || "An error occurred while starting the practice session.";
      Alert.alert("Error", message);
    } finally {
      setStartingExam(false);
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Select Course">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  const maxQuestions = hasActiveSubscription ? 50 : 5;

  const onRefresh = () => {
    setRefreshing(true);
    loadSubjects();
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Exam Subjects List">
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
        <TextInput
          placeholder="Search Here"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#a1a1aa"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
        >
        <View style={styles.listContainer}>
          {filteredSubjects.map((subject) => (
            <TouchableOpacity 
              key={subject.id} 
              style={styles.listItem}
              onPress={() => handleSubjectPress(subject)}
              activeOpacity={0.6}
            >
              <View style={styles.iconBox}>
                <MaterialIcons name="calculate" size={32} style={{ opacity: 0.2 }} />
              </View>
              <View style={styles.infoBox}>
                <ThemedText style={styles.subjectTitle}>{subject.name}</ThemedText>
                <ThemedText 
                  style={styles.subjectSubtitle} 
                  numberOfLines={2} 
                  ellipsizeMode="tail"
                >
                  {subject.description}
                </ThemedText>
                <ThemedText style={styles.subjectAvailable}>Total questions : {subject.questions_count}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={closeConfigModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeConfigModal} />
          <View style={styles.modalContent}>
            {configModalStep === "main" && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Practice Settings</ThemedText>
                  <TouchableOpacity onPress={closeConfigModal}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>

                <View style={styles.configBody}>
                  <ThemedText style={styles.configLabel}>Faculty Course: {selectedSubjectObj?.name}</ThemedText>

                  {selectedSubjectObj?.tests && selectedSubjectObj.tests.length > 0 && (
                    <TouchableOpacity style={styles.configInput} onPress={() => setConfigModalStep("test")}>
                      <ThemedText style={styles.inputText}>
                        {selectedTestId
                          ? selectedSubjectObj.tests.find((t) => t.id === selectedTestId)?.name
                          : "Select Test"}
                      </ThemedText>
                      <MaterialIcons name="arrow-drop-down" size={24} color="#a1a1aa" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.configInput} onPress={() => setConfigModalStep("count")}>
                    <ThemedText style={styles.inputText}>
                      {questionCount ? `${questionCount} Questions` : "Number of Questions"}
                    </ThemedText>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#a1a1aa" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.configInput} onPress={() => setConfigModalStep("time")}>
                    <ThemedText style={styles.inputText}>
                      {timeMinutes ? `${timeMinutes} Minutes` : "Duration"}
                    </ThemedText>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#a1a1aa" />
                  </TouchableOpacity>

                  <Button
                    title={startingExam ? "Preparing..." : "Start Now"}
                    onPress={startPractice}
                    disabled={!questionCount || !timeMinutes || startingExam}
                    style={styles.startBtn}
                  />
                </View>
              </>
            )}

            {configModalStep === "test" && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setConfigModalStep("main")} style={styles.modalBackButton}>
                    <MaterialIcons name="arrow-back" size={24} color={textColor} />
                  </TouchableOpacity>
                  <ThemedText style={styles.modalTitle}>Select Test</ThemedText>
                  <TouchableOpacity onPress={closeConfigModal}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {selectedSubjectObj?.tests?.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.optionItem}
                      onPress={() => {
                        setSelectedTestId(t.id);
                        setConfigModalStep("main");
                      }}
                    >
                      <ThemedText style={styles.optionText}>{t.name}</ThemedText>
                      {selectedTestId === t.id && <MaterialIcons name="check-circle" size={20} color={tintColor} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {configModalStep === "count" && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setConfigModalStep("main")} style={styles.modalBackButton}>
                    <MaterialIcons name="arrow-back" size={24} color={textColor} />
                  </TouchableOpacity>
                  <ThemedText style={styles.modalTitle}>Questions Count</ThemedText>
                  <TouchableOpacity onPress={closeConfigModal}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {Array.from({ length: maxQuestions }, (_, i) => i + 1).map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={styles.optionItem}
                      onPress={() => {
                        setQuestionCountLocal(c);
                        setConfigModalStep("main");
                      }}
                    >
                      <ThemedText style={styles.optionText}>{c} Questions</ThemedText>
                      {questionCount === c && <MaterialIcons name="check-circle" size={20} color={tintColor} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {configModalStep === "time" && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setConfigModalStep("main")} style={styles.modalBackButton}>
                    <MaterialIcons name="arrow-back" size={24} color={textColor} />
                  </TouchableOpacity>
                  <ThemedText style={styles.modalTitle}>Select Duration</ThemedText>
                  <TouchableOpacity onPress={closeConfigModal}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={styles.optionItem}
                      onPress={() => {
                        setTimeMinutesLocal(m);
                        setConfigModalStep("main");
                      }}
                    >
                      <ThemedText style={styles.optionText}>{m} Minutes</ThemedText>
                      {timeMinutes === m && <MaterialIcons name="check-circle" size={20} color={tintColor} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 40 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontFamily: Fonts.primary.regular, fontSize: 14, color: '#1a1c1d' },
  listContainer: { marginHorizontal: 16, gap: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#ebe2f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoBox: { flex: 1 },
  subjectTitle: { fontSize: 16, fontFamily: Fonts.primary.semiBold, color: '#1a1c1d', marginBottom: 2 },
  subjectSubtitle: { fontSize: 14, fontFamily: Fonts.primary.medium, color: '#71717a', marginBottom: 6 },
  subjectAvailable: { fontSize: 13, fontFamily: Fonts.primary.regular, color: '#71717a' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 8 },
  modalBackButton: { marginRight: 4 },
  modalTitle: { fontSize: 18, fontFamily: Fonts.primary.bold, color: '#1a1c1d', flex: 1 },
  modalScroll: { maxHeight: 400 },
  configBody: { gap: 16 },
  configLabel: { fontSize: 14, fontFamily: Fonts.primary.medium, color: '#615b6e' },
  configInput: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    backgroundColor: '#fafafa'
  },
  inputText: { fontSize: 15, fontFamily: Fonts.primary.regular, color: '#1a1c1d' },
  startBtn: { marginTop: 8 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionText: { fontSize: 15, fontFamily: Fonts.primary.regular, color: '#4b5563' },
});
