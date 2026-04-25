import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

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

export function StandardPastQuestionsSelection() {
  const { user } = useAuth();
  const { selection } = useExamSelection();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [yearsBySubject, setYearsBySubject] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingYears, setLoadingYears] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<Record<string, SubjectSelection>>({});
  
  const [showYearModal, setShowYearModal] = useState(false);
  const [currentSubjectForYear, setCurrentSubjectForYear] = useState<string | null>(null);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);

  const examType = selection.examType || "JAMB";
  const examTypeLabel = selection.examTypeSlug || "JAMB";

  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  const questionCountOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100].filter(c => c <= maxQuestionsPerSubject);

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/exams/subjects", {
        params: { exam_type: examType, type: "past_question" },
      });

      if (response.data.success) {
        setSubjectsList(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadYearsForSubject = async (subject: string) => {
    if (yearsBySubject[subject]?.length > 0) return;
    try {
      setLoadingYears(true);
      const response = await api.get("/exams/years", {
        params: { exam_type: examType, subjects: [subject] },
      });
      if (response.data.success) {
        setYearsBySubject(prev => ({ ...prev, [subject]: response.data.data || [] }));
      }
    } catch (error) {
      console.error("Error loading years:", error);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subject));
      setSubjectSelections(prev => {
        const next = { ...prev };
        delete next[subject];
        return next;
      });
      if (expandedSubject === subject) setExpandedSubject(null);
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects(prev => [...prev, subject]);
        setSubjectSelections(prev => ({
          ...prev,
          [subject]: { subject, questionCount: 10 > maxQuestionsPerSubject ? maxQuestionsPerSubject : 10, year: null }
        }));
        setExpandedSubject(subject);
        loadYearsForSubject(subject);
      } else {
        Alert.alert("Max Subjects", "You can select up to 4 subjects.");
      }
    }
  };

  const handleStartExam = async () => {
    // Validation
    const incomplete = selectedSubjects.filter(s => !subjectSelections[s].year || !subjectSelections[s].questionCount);
    if (incomplete.length > 0) {
      Alert.alert("Incomplete", "Please select a year and question count for all subjects.");
      return;
    }

    try {
      setStartingExam(true);
      const subjectsQuestions: Record<string, Question[]> = {};
      let firstExamId: number | null = null;

      for (const subject of selectedSubjects) {
        const sel = subjectSelections[subject];
        const examResponse = await api.get("/exams", {
          params: { exam_type: examType, subject, year: sel.year }
        });

        if (examResponse.data.success && examResponse.data.data.length > 0) {
          const exam = examResponse.data.data[0];
          if (!firstExamId) firstExamId = exam.id;
          
          const questionsResponse = await api.get(`/exams/${exam.id}/questions`);
          const questions = questionsResponse.data.data.questions || [];
          subjectsQuestions[subject] = questions.slice(0, sel.questionCount).map((q: any) => ({ ...q, subject }));
        }
      }

      if (!firstExamId) throw new Error("No exam data found");

      const attemptResponse = await api.post(`/exams/${firstExamId}/start`, {
        subjects: selectedSubjects.map(s => ({ subject: s, question_count: subjectSelections[s].questionCount })),
        duration_minutes: selectedSubjects.length * 30,
      });

      const attempt = attemptResponse.data.data.attempt;
      navigation.navigate("ExamScreen" as never, {
        attemptId: attempt.id,
        examId: firstExamId,
        subjectsQuestions,
        exam: { id: firstExamId, title: `${examTypeLabel} Past Questions`, duration: selectedSubjects.length * 30, total_questions: Object.values(subjectsQuestions).flat().length },
        timeMinutes: selectedSubjects.length * 30,
        subjects: selectedSubjects,
        isPractice: false,
      } as never);
    } catch (e) {
      Alert.alert("Error", "Failed to start. Please check your connection.");
    } finally {
      setStartingExam(false);
    }
  };

  return (
    <AppLayout showBackButton={true} headerTitle="">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.badge}>{examTypeLabel.toUpperCase()}</ThemedText>
          <ThemedText type="title" style={styles.title}>Past Questions</ThemedText>
          <ThemedText style={styles.subtitle}>Select up to 4 subjects and choose your preferred years.</ThemedText>
          
          {!hasActiveSubscription && (
            <TouchableOpacity style={[styles.proBanner, { backgroundColor: tintColor + "10" }]}>
                <MaterialIcons name="stars" size={20} color={tintColor} />
                <ThemedText style={[styles.proText, { color: tintColor }]}>Upgrade to Pro for more questions</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="large" color={tintColor} style={{ marginTop: 40 }} />
          ) : (
            subjects.map(subject => {
              const isSelected = selectedSubjects.includes(subject);
              const isExpanded = expandedSubject === subject;
              const sel = subjectSelections[subject];

              return (
                <View key={subject} style={[styles.card, { backgroundColor: cardBackground, borderColor: isSelected ? tintColor : borderColor }]}>
                  <TouchableOpacity 
                    style={styles.cardHeader} 
                    onPress={() => handleToggleSubject(subject)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.check, { backgroundColor: isSelected ? tintColor : backgroundSecondary }]}>
                        {isSelected && <MaterialIcons name="check" size={16} color="white" />}
                    </View>
                    <View style={styles.subjectInfo}>
                        <ThemedText style={[styles.subjectName, isSelected && { color: tintColor }]}>{subject}</ThemedText>
                        {isSelected && sel.year && (
                             <ThemedText style={styles.subjectSub}>Year {sel.year} • {sel.questionCount} Qs</ThemedText>
                        )}
                    </View>
                    {isSelected && (
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); setExpandedSubject(isExpanded ? null : subject); }}>
                            <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={24} color={tintColor} />
                        </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandArea}>
                        <View style={styles.divider} />
                        <View style={styles.settingsRow}>
                            <TouchableOpacity 
                                style={[styles.settingBtn, { borderColor: borderColor }]}
                                onPress={() => { setCurrentSubjectForYear(subject); setShowYearModal(true); loadYearsForSubject(subject); }}
                            >
                                <ThemedText style={styles.settingLabel}>Year</ThemedText>
                                <ThemedText style={styles.settingVal}>{sel.year || "Select"}</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.settingBtn, { borderColor: borderColor }]}
                                onPress={() => { setCurrentSubjectForQuestionCount(subject); setShowQuestionCountModal(true); }}
                            >
                                <ThemedText style={styles.settingLabel}>Questions</ThemedText>
                                <ThemedText style={styles.settingVal}>{sel.questionCount}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {selectedSubjects.length > 0 && (
        <View style={[styles.footer, { borderTopColor: borderColor, backgroundColor: cardBackground }]}>
          <View style={styles.footerInfo}>
             <ThemedText style={styles.footerLabel}>{selectedSubjects.length} Subjects</ThemedText>
             <ThemedText style={styles.footerSub}>{selectedSubjects.join(", ")}</ThemedText>
          </View>
          <Button 
            title={startingExam ? "Starting..." : "Start Now"} 
            onPress={handleStartExam} 
            disabled={startingExam}
            style={styles.startBtn}
          />
        </View>
      )}

      {/* Modals for selection */}
      <SelectionModal 
        visible={showYearModal}
        title="Select Year"
        options={yearsBySubject[currentSubjectForYear || ""] || []}
        selected={subjectSelections[currentSubjectForYear || ""]?.year}
        onSelect={(val: any) => {
            setSubjectSelections(prev => ({ ...prev, [currentSubjectForYear!]: { ...prev[currentSubjectForYear!], year: val }}));
            setShowYearModal(false);
        }}
        onClose={() => setShowYearModal(false)}
        loading={loadingYears}
      />

    <SelectionModal 
        visible={showQuestionCountModal}
        title="Question Count"
        options={questionCountOptions}
        selected={subjectSelections[currentSubjectForQuestionCount || ""]?.questionCount}
        onSelect={(val: any) => {
            setSubjectSelections(prev => ({ ...prev, [currentSubjectForQuestionCount!]: { ...prev[currentSubjectForQuestionCount!], questionCount: val }}));
            setShowQuestionCountModal(false);
        }}
        onClose={() => setShowQuestionCountModal(false)}
      />
    </AppLayout>
  );
}

function SelectionModal({ visible, title, options, selected, onSelect, onClose, loading = false }: any) {
  const cardBg = useThemeColor({}, "cardBackground");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>{title}</ThemedText>
                    <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.modalList}>
                    {loading ? <ActivityIndicator color={tintColor} style={{ padding: 40 }} /> : 
                     options.map((opt: any) => (
                        <TouchableOpacity 
                            key={opt} 
                            style={[styles.modalItem, { borderColor: borderColor }, selected === opt && { backgroundColor: tintColor + "10", borderColor: tintColor }]}
                            onPress={() => onSelect(opt)}
                        >
                            <ThemedText style={[styles.modalItemText, selected === opt && { color: tintColor, fontWeight: '700' }]}>{opt}</ThemedText>
                            {selected === opt && <MaterialIcons name="check" size={20} color={tintColor} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 120 },
  header: { marginBottom: 32 },
  badge: { fontSize: 12, fontWeight: "900", color: "#8B5CF6", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, opacity: 0.6, lineHeight: 22 },
  proBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 16, gap: 8 },
  proText: { fontSize: 13, fontWeight: '700' },
  list: { gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  check: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  subjectInfo: { flex: 1, marginLeft: 16 },
  subjectName: { fontSize: 17, fontWeight: '700' },
  subjectSub: { fontSize: 13, opacity: 0.5, marginTop: 2 },
  expandArea: { padding: 16, paddingTop: 0 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 16 },
  settingsRow: { flexDirection: 'row', gap: 12 },
  settingBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  settingLabel: { fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 4, fontWeight: '700' },
  settingVal: { fontSize: 15, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, width: width, padding: 20, paddingBottom: 34, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1 },
  footerInfo: { flex: 1 },
  footerLabel: { fontSize: 16, fontWeight: '800' },
  footerSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  startBtn: { minWidth: 120 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalList: { gap: 8, paddingBottom: 20 },
  modalItem: { padding: 18, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { fontSize: 16, fontWeight: '600' }
});
