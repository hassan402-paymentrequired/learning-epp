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
  TextInput,
  RefreshControl,
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
import { Fonts } from "@/constants/Fonts";

const { width } = Dimensions.get("window");

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  subject: string;
}

export function StandardPracticeQuestionsSelection() {
  const { user } = useAuth();
  const { selection, setQuestionCount: setGlobalCount, setTimeMinutes: setGlobalTime } = useExamSelection();
  const navigation = useNavigation();
  
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [currentSubjectForCount, setCurrentSubjectForCount] = useState<string | null>(null);
  const [startingPractice, setStartingPractice] = useState(false);

  const examType = selection.examTypeSlug || "JAMB";
  const examTypeLabel = selection.examTypeName || "JAMB";

  const tintColor = "#4800b2";
  const borderColor = "#f1f5f9";
  const backgroundSecondary = "#ebe2f5ff";

  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  const countOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100].filter(c => c <= maxQuestionsPerSubject);

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
        // API returns names, we map to match the departmental structure for UI consistency
        const rawSubjects = response.data.data || [];
        setSubjectsList(rawSubjects.map((s: any, idx: number) => ({
             id: idx,
             name: s,
             description: `Practice questions for ${s}`
        })));
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleSubject = (subjectName: string) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subjectName));
      setQuestionCounts(prev => {
        const next = { ...prev };
        delete next[subjectName];
        return next;
      });
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects(prev => [...prev, subjectName]);
        setQuestionCounts(prev => ({ ...prev, [subjectName]: 10 > maxQuestionsPerSubject ? maxQuestionsPerSubject : 10 }));
      } else {
        Alert.alert("Maximum Subjects", "You can select up to 4 subjects for a combined practice session.");
      }
    }
  };

  const handleStartPractice = async () => {
    try {
      setStartingPractice(true);

      const subjectsData = selectedSubjects.map(s => ({ subject: s, question_count: questionCounts[s] }));
      const duration = selectedSubjects.length * 30;

      const attemptRes = await api.post("/practice/start", {
        exam_type: selection.examTypeSlug || selection.examType, // Use slug if available for practice filtering
        subjects: subjectsData,
        duration_minutes: duration,
      });

      if (attemptRes.data.success && attemptRes.data.data) {
        const { attempt, questions: backendQuestions } = attemptRes.data.data;
        
        // backendQuestions is Record<string, Question[]>
        const subjectsQuestions = backendQuestions;
        
        // Update context
        selectedSubjects.forEach(s => {
             const qCount = subjectsQuestions[s]?.length || 0;
             setGlobalCount(s, qCount);
        });
        setGlobalTime(duration);

        navigation.navigate("ExamScreen" as never, {
          attemptId: attempt.id,
          examId: attempt.exam_id || 0,
          subjectsQuestions,
          exam: { 
            id: attempt.exam_id || 0, 
            title: `${examTypeLabel} Practice`, 
            duration, 
            total_questions: Object.values(subjectsQuestions).flat().length 
          },
          timeMinutes: duration,
          subjects: selectedSubjects,
          isPractice: true,
        } as never);
      }
    } catch (e: any) {
      console.error("Start practice error:", e);
      Alert.alert("Error", e.response?.data?.message || "Failed to start practice session.");
    } finally {
      setStartingPractice(false);
    }
  };

  const filteredSubjects = subjectsList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Study Mode">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Select Practice Subjects">

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSubjects} />}
      >
        <View style={styles.headerArea}>
           <ThemedText style={styles.title}>Study Mode</ThemedText>
           <ThemedText style={styles.subtitle}>Select up to 4 subjects for a combined practice session.</ThemedText>
        </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for a subject..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#a1a1aa"
        />
      </View>

        <View style={styles.listContainer}>
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.name);
              const count = questionCounts[subject.name];

              return (
                <TouchableOpacity 
                  key={subject.id} 
                  style={[styles.listItem, isSelected && { borderColor: tintColor, backgroundColor: tintColor + '05' }]}
                  onPress={() => handleToggleSubject(subject.name)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.iconBox, isSelected && { backgroundColor: tintColor + '20' }]}>
                    <MaterialIcons name="school" size={32} color={isSelected ? tintColor : '#a1a1aa'} style={{ opacity: isSelected ? 1 : 0.2 }} />
                  </View>
                  <View style={styles.infoBox}>
                    <ThemedText style={[styles.subjectTitle, isSelected && { color: tintColor }]}>{subject.name}</ThemedText>
                    {isSelected ? (
                        <TouchableOpacity 
                            style={styles.countBadge} 
                            onPress={(e) => { e.stopPropagation(); setCurrentSubjectForCount(subject.name); setShowCountModal(true); }}
                        >
                            <ThemedText style={styles.countText}>{count} Questions</ThemedText>
                            <MaterialIcons name="edit" size={12} color={tintColor} />
                        </TouchableOpacity>
                    ) : (
                        <ThemedText style={styles.subjectSubtitle}>{subject.description}</ThemedText>
                    )}
                  </View>
                  <View style={[styles.checkCircle, isSelected && { backgroundColor: tintColor, borderColor: tintColor }]}>
                     {isSelected && <MaterialIcons name="check" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
               <MaterialIcons name="search-off" size={48} color="#e2e8f0" />
               <ThemedText style={styles.emptyText}>No subjects matches your search.</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {selectedSubjects.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTextContainer}>
             <ThemedText style={styles.footerLabel}>{selectedSubjects.length} Selected</ThemedText>
             <ThemedText style={styles.footerSub} numberOfLines={1}>{selectedSubjects.join(", ")}</ThemedText>
          </View>
          <Button 
            title={startingPractice ? "Preparing..." : "Start Now"} 
            onPress={handleStartPractice} 
            disabled={startingPractice}
            style={styles.startBtn}
          />
        </View>
      )}

      {/* Question Count Modal */}
      <Modal visible={showCountModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Questions for {currentSubjectForCount}</ThemedText>
              <TouchableOpacity onPress={() => setShowCountModal(false)}>
                <MaterialIcons name="close" size={24} color="#1a1c1d" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: 400}}>
              {countOptions.map((c) => (
                <TouchableOpacity 
                  key={c} 
                  style={styles.optionItem}
                  onPress={() => { 
                    setQuestionCounts(prev => ({ ...prev, [currentSubjectForCount!]: c })); 
                    setShowCountModal(false); 
                  }}
                >
                  <ThemedText style={[styles.optionText, questionCounts[currentSubjectForCount!] === c && { color: tintColor, fontFamily: Fonts.primary.bold }]}>{c} Questions</ThemedText>
                  {questionCounts[currentSubjectForCount!] === c && <MaterialIcons name="check-circle" size={20} color={tintColor} />}
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 120 },
  headerArea: { paddingHorizontal: 16, marginBottom: 20, marginTop: 16, },
  badge: { fontSize: 12, fontFamily: Fonts.primary.bold, color: "#8B5CF6", letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: Fonts.primary.bold, color: '#4800b2', marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: Fonts.primary.regular, color: '#71717a', lineHeight: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontFamily: Fonts.primary.regular, fontSize: 14, color: '#1a1c1d' },
  listContainer: { marginHorizontal: 16, gap: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoBox: { flex: 1 },
  subjectTitle: { fontSize: 16, fontFamily: Fonts.primary.bold, color: '#1a1c1d', marginBottom: 2 },
  subjectSubtitle: { fontSize: 13, fontFamily: Fonts.primary.regular, color: '#71717a' },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  countText: { fontSize: 12, fontFamily: Fonts.primary.semiBold, color: '#4800b2' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: width, 
    padding: 20, 
    paddingBottom: 34, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#f1f5f9'
  },
  footerTextContainer: { flex: 1 },
  footerLabel: { fontSize: 16, fontFamily: Fonts.primary.bold, color: '#1a1c1d' },
  footerSub: { fontSize: 12, fontFamily: Fonts.primary.regular, color: '#71717a', marginTop: 2 },
  startBtn: { minWidth: 130 },
  emptyContainer: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: Fonts.primary.regular, color: '#94a3b8', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: Fonts.primary.bold, color: '#1a1c1d', flex: 1 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionText: { fontSize: 15, fontFamily: Fonts.primary.regular, color: '#4b5563' },
});
