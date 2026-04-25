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

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  subject: string;
}

export function StandardPracticeQuestionsSelection() {
  const { user } = useAuth();
  const { selection } = useExamSelection();
  const navigation = useNavigation();
  
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  
  const [showCountModal, setShowCountModal] = useState(false);
  const [currentSubjectForCount, setCurrentSubjectForCount] = useState<string | null>(null);
  const [startingPractice, setStartingPractice] = useState(false);

  const examType = selection.examType || "JAMB";

  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  const countOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100].filter(c => c <= maxQuestionsPerSubject);

  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/exams/subjects", {
        params: { exam_type: examType, type: "practice" },
      });
      if (response.data.success) {
        setSubjectsList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subject));
      setQuestionCounts(prev => {
        const next = { ...prev };
        delete next[subject];
        return next;
      });
      if (expandedSubject === subject) setExpandedSubject(null);
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects(prev => [...prev, subject]);
        setQuestionCounts(prev => ({ ...prev, [subject]: 10 > maxQuestionsPerSubject ? maxQuestionsPerSubject : 10 }));
        setExpandedSubject(subject);
      } else {
        Alert.alert("Maximum Subjects", "You can select up to 4 subjects.");
      }
    }
  };

  const handleStartPractice = async () => {
    try {
      setStartingPractice(true);
      const subjectsQuestions: Record<string, Question[]> = {};

      for (const subject of selectedSubjects) {
        const count = questionCounts[subject];
        const res = await api.get("/questions/practice", {
          params: { exam_type: examType, subject, count }
        });
        if (res.data.success) {
          subjectsQuestions[subject] = (res.data.data || []).map((q: any) => ({ ...q, subject }));
        }
      }

      const subjectsData = selectedSubjects.map(s => ({ subject: s, question_count: questionCounts[s] }));
      const duration = selectedSubjects.length * 30;

      const attemptRes = await api.post("/practice/start", {
        exam_type: examType,
        subjects: subjectsData,
        duration_minutes: duration,
      });

      if (attemptRes.data.success) {
        const attempt = attemptRes.data.data.attempt;
        navigation.navigate("ExamScreen" as never, {
          attemptId: attempt.id,
          examId: attempt.exam_id,
          subjectsQuestions,
          exam: { id: attempt.exam_id, title: `${examType} Practice Questions`, duration, total_questions: Object.values(subjectsQuestions).flat().length },
          timeMinutes: duration,
          subjects: selectedSubjects,
          isPractice: true,
        } as never);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to start practice session.");
    } finally {
      setStartingPractice(false);
    }
  };

  return (
    <AppLayout showBackButton={true} headerTitle="">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.badge}>{examType}</ThemedText>
          <ThemedText type="title" style={styles.title}>Study Mode</ThemedText>
          <ThemedText style={styles.subtitle}>Select subjects to study. Randomized questions to help you master topics.</ThemedText>

          {!hasActiveSubscription && (
            <TouchableOpacity style={[styles.proBanner, { backgroundColor: tintColor + "10" }]}>
                <MaterialIcons name="stars" size={20} color={tintColor} />
                <ThemedText style={[styles.proText, { color: tintColor }]}>Unlimited questions with Pro</ThemedText>
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
              const count = questionCounts[subject];

              return (
                <View key={subject} style={[styles.card, { backgroundColor: cardBg, borderColor: isSelected ? tintColor : borderColor }]}>
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
                        {isSelected && count && (
                             <ThemedText style={styles.subjectSub}>{count} Random Questions</ThemedText>
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
                        <TouchableOpacity 
                            style={[styles.countBtn, { borderColor: borderColor }]}
                            onPress={() => { setCurrentSubjectForCount(subject); setShowCountModal(true); }}
                        >
                            <View>
                                <ThemedText style={styles.countLabel}>Number of Questions</ThemedText>
                                <ThemedText style={styles.countVal}>{count}</ThemedText>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={borderColor} />
                        </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {selectedSubjects.length > 0 && (
        <View style={[styles.footer, { borderTopColor: borderColor, backgroundColor: cardBg }]}>
          <View style={styles.footerInfo}>
             <ThemedText style={styles.footerLabel}>{selectedSubjects.length} Modeled Subjects</ThemedText>
             <ThemedText style={styles.footerSub}>{selectedSubjects.join(", ")}</ThemedText>
          </View>
          <Button 
            title={startingPractice ? "Preparing..." : "Start Practice"} 
            onPress={handleStartPractice} 
            disabled={startingPractice}
            style={styles.startBtn}
          />
        </View>
      )}

      <Modal visible={showCountModal} transparent animationType="slide" onRequestClose={() => setShowCountModal(false)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Question Count</ThemedText>
                    <TouchableOpacity onPress={() => setShowCountModal(false)}><MaterialIcons name="close" size={24} color="#666" /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.modalList}>
                    {countOptions.map(opt => (
                        <TouchableOpacity 
                            key={opt} 
                            style={[styles.modalItem, { borderColor: borderColor }, questionCounts[currentSubjectForCount!] === opt && { backgroundColor: tintColor + "10", borderColor: tintColor }]}
                            onPress={() => {
                                setQuestionCounts(prev => ({ ...prev, [currentSubjectForCount!]: opt }));
                                setShowCountModal(false);
                            }}
                        >
                            <ThemedText style={[styles.modalItemText, questionCounts[currentSubjectForCount!] === opt && { color: tintColor, fontWeight: '700' }]}>{opt} Questions</ThemedText>
                            {questionCounts[currentSubjectForCount!] === opt && <MaterialIcons name="check" size={20} color={tintColor} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>
    </AppLayout>
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
  countBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1 },
  countLabel: { fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2, fontWeight: '700' },
  countVal: { fontSize: 16, fontWeight: '700' },
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
