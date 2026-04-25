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

interface SubjectSelection {
  year: string | null;
  questionCount: number;
}

export function StandardPastQuestionsSelection() {
  const { user } = useAuth();
  const { selection, setQuestionCount: setGlobalCount, setTimeMinutes: setGlobalTime } = useExamSelection();
  const navigation = useNavigation();
  
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<Record<string, SubjectSelection>>({});
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentConfigSubject, setCurrentConfigSubject] = useState<string | null>(null);
  
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  
  const [startingExam, setStartingExam] = useState(false);

  const examType = selection.examTypeSlug || "JAMB";
  const examTypeLabel = selection.examTypeName || "JAMB";

  const tintColor = "#4800b2";
  const borderColor = "#f1f5f9";

  const hasActiveSubscription =
    user?.subscription_status === "active" &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const countOptions = [10, 15, 20, 25, 30, 40, 50, 60, 100];

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
        const raw = response.data.data || [];
        setSubjectsList(raw.map((s: any, idx: number) => ({
             id: idx,
             name: s,
             description: `Past questions for ${s}`
        })));
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubjectPress = (subjectName: string) => {
    setCurrentConfigSubject(subjectName);
    if (!subjectSelections[subjectName]) {
      setSubjectSelections(prev => ({
        ...prev,
        [subjectName]: { year: null, questionCount: 40 }
      }));
    }
    setShowConfigModal(true);
    loadYearsForSubject(subjectName);
  };

  const loadYearsForSubject = async (subjectName: string) => {
    try {
      setLoadingYears(true);
      const response = await api.get("/exams/years", {
        params: { exam_type: examType, subjects: [subjectName] },
      });
      if (response.data.success) {
        setAvailableYears(response.data.data || []);
      }
    } catch (e) {
      console.error("Error loading years:", e);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleToggleSelection = (subjectName: string) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subjectName));
    } else {
      const sel = subjectSelections[subjectName];
      if (!sel || !sel.year) {
        handleSubjectPress(subjectName);
        return;
      }
      if (selectedSubjects.length < 4) {
        setSelectedSubjects(prev => [...prev, subjectName]);
      } else {
        Alert.alert("Limit Reached", "Max 4 subjects allowed.");
      }
    }
  };

  const handleSaveConfig = () => {
    const subj = currentConfigSubject!;
    const sel = subjectSelections[subj];
    if (sel.year && !selectedSubjects.includes(subj)) {
       if (selectedSubjects.length < 4) {
         setSelectedSubjects(prev => [...prev, subj]);
       }
    }
    setShowConfigModal(false);
  };

  const handleStartExam = async () => {
    try {
      setStartingExam(true);
      
      // Validations
      for (const subj of selectedSubjects) {
          if (!subjectSelections[subj]?.year) {
              Alert.alert("Setting Required", `Please select a year for ${subj}`);
              setStartingExam(false);
              return;
          }
      }

      const subjectsData = selectedSubjects.map(s => ({
          subject: s,
          year: parseInt(subjectSelections[s].year!),
          question_count: subjectSelections[s].questionCount
      }));

      const duration = selectedSubjects.length * 45;
      
      const attemptRes = await api.post("/practice/start", {
        exam_type: selection.examTypeSlug || selection.examType,
        subjects: subjectsData,
        duration_minutes: duration
      });

      if (attemptRes.data.success && attemptRes.data.data) {
        const { attempt, questions: subjectsQuestions } = attemptRes.data.data;
        
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
            title: `${examTypeLabel} Past Questions`, 
            duration, 
            total_questions: Object.values(subjectsQuestions).flat().length 
          },
          timeMinutes: duration,
          subjects: selectedSubjects,
          isPractice: false,
        } as never);
      }
    } catch (e: any) {
      console.error("Start exam error:", e);
      Alert.alert("Error", e.response?.data?.message || "Failed to start exam.");
    } finally {
      setStartingExam(false);
    }
  };

  const filteredSubjects = subjectsList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Past Questions">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Select Past Questions">
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
        <TextInput
          placeholder="Search subjects..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#a1a1aa"
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSubjects} />}
      >
        <View style={styles.headerArea}>
           <ThemedText style={styles.badge}>{examTypeLabel.toUpperCase()}</ThemedText>
           <ThemedText style={styles.title}>Yearly Practice</ThemedText>
           <ThemedText style={styles.subtitle}>Select subjects and specific years to practice previous exams.</ThemedText>
        </View>

        <View style={styles.listContainer}>
          {filteredSubjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.name);
            const sel = subjectSelections[subject.name];

            return (
              <TouchableOpacity 
                key={subject.id} 
                style={[styles.listItem, isSelected && { borderColor: tintColor, backgroundColor: tintColor + '05' }]}
                onPress={() => isSelected ? handleToggleSelection(subject.name) : handleSubjectPress(subject.name)}
                activeOpacity={0.6}
              >
                <View style={[styles.iconBox, isSelected && { backgroundColor: tintColor + '20' }]}>
                  <MaterialIcons name="history-edu" size={32} color={isSelected ? tintColor : '#a1a1aa'} style={{ opacity: isSelected ? 1 : 0.2 }} />
                </View>
                <View style={styles.infoBox}>
                  <ThemedText style={[styles.subjectTitle, isSelected && { color: tintColor }]}>{subject.name}</ThemedText>
                  {isSelected && sel?.year ? (
                      <TouchableOpacity 
                          style={styles.configPill} 
                          onPress={(e) => { e.stopPropagation(); handleSubjectPress(subject.name); }}
                      >
                          <ThemedText style={styles.pillText}>Year {sel.year} • {sel.questionCount} Qs</ThemedText>
                          <MaterialIcons name="settings" size={12} color={tintColor} />
                      </TouchableOpacity>
                  ) : (
                      <ThemedText style={styles.subjectSubtitle}>{subject.description}</ThemedText>
                  )}
                </View>
                <TouchableOpacity 
                    style={[styles.checkCircle, isSelected && { backgroundColor: tintColor, borderColor: tintColor }]}
                    onPress={(e) => { e.stopPropagation(); handleToggleSelection(subject.name); }}
                >
                   {isSelected && <MaterialIcons name="check" size={16} color="white" />}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedSubjects.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTextContainer}>
             <ThemedText style={styles.footerLabel}>{selectedSubjects.length} Selected</ThemedText>
             <ThemedText style={styles.footerSub} numberOfLines={1}>{selectedSubjects.join(", ")}</ThemedText>
          </View>
          <Button 
            title={startingExam ? "Preparing..." : "Start Now"} 
            onPress={handleStartExam} 
            disabled={startingExam}
            style={styles.startBtn}
          />
        </View>
      )}

      {/* Config Modal */}
      <Modal visible={showConfigModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Config: {currentConfigSubject}</ThemedText>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <MaterialIcons name="close" size={24} color="#1a1c1d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.configBody}>
               <TouchableOpacity style={styles.configInput} onPress={() => setShowYearModal(true)}>
                  <ThemedText style={styles.inputText}>
                    {subjectSelections[currentConfigSubject!]?.year || 'Select Year'}
                  </ThemedText>
                  <MaterialIcons name="calendar-today" size={20} color="#a1a1aa" />
               </TouchableOpacity>

               <TouchableOpacity style={styles.configInput} onPress={() => setShowQuestionCountModal(true)}>
                  <ThemedText style={styles.inputText}>
                    {subjectSelections[currentConfigSubject!]?.questionCount} Questions
                  </ThemedText>
                  <MaterialIcons name="numbers" size={20} color="#a1a1aa" />
               </TouchableOpacity>

               <Button title="Save Settings" onPress={handleSaveConfig} disabled={!subjectSelections[currentConfigSubject!]?.year} style={{marginTop: 8}} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Year Modal */}
      <Modal visible={showYearModal} transparent animationType="fade">
        <View style={styles.nestedModalOverlay}>
          <View style={styles.nestedModalContent}>
             <View style={styles.modalHeader}>
               <ThemedText style={styles.modalTitle}>Select Year</ThemedText>
               <TouchableOpacity onPress={() => setShowYearModal(false)}>
                 <MaterialIcons name="close" size={24} color="#1a1c1d" />
               </TouchableOpacity>
             </View>
             {loadingYears ? <ActivityIndicator size="small" color={tintColor} /> : (
                <ScrollView style={{maxHeight: 400}}>
                   {availableYears.map(y => (
                      <TouchableOpacity 
                        key={y} 
                        style={styles.optionItem}
                        onPress={() => {
                            setSubjectSelections(prev => ({
                                ...prev,
                                [currentConfigSubject!]: { ...prev[currentConfigSubject!], year: String(y) }
                            }));
                            setShowYearModal(false);
                        }}
                      >
                         <ThemedText style={[styles.optionText, subjectSelections[currentConfigSubject!]?.year === String(y) && { color: tintColor, fontFamily: Fonts.primary.bold }]}>{y}</ThemedText>
                         {subjectSelections[currentConfigSubject!]?.year === String(y) && <MaterialIcons name="check-circle" size={20} color={tintColor} />}
                      </TouchableOpacity>
                   ))}
                </ScrollView>
             )}
          </View>
        </View>
      </Modal>

      {/* Questions Modal */}
      <Modal visible={showQuestionCountModal} transparent animationType="fade">
        <View style={styles.nestedModalOverlay}>
          <View style={styles.nestedModalContent}>
             <View style={styles.modalHeader}>
               <ThemedText style={styles.modalTitle}>Questions</ThemedText>
               <TouchableOpacity onPress={() => setShowQuestionCountModal(false)}>
                 <MaterialIcons name="close" size={24} color="#1a1c1d" />
               </TouchableOpacity>
             </View>
             <ScrollView style={{maxHeight: 400}}>
                {countOptions.map(c => (
                   <TouchableOpacity 
                    key={c} 
                    style={styles.optionItem}
                    onPress={() => {
                        setSubjectSelections(prev => ({
                            ...prev,
                            [currentConfigSubject!]: { ...prev[currentConfigSubject!], questionCount: c }
                        }));
                        setShowQuestionCountModal(false);
                    }}
                   >
                     <ThemedText style={[styles.optionText, subjectSelections[currentConfigSubject!]?.questionCount === c && { color: tintColor, fontFamily: Fonts.primary.bold }]}>{c} Questions</ThemedText>
                     {subjectSelections[currentConfigSubject!]?.questionCount === c && <MaterialIcons name="check-circle" size={20} color={tintColor} />}
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
  headerArea: { paddingHorizontal: 16, marginBottom: 20 },
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
  configPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontFamily: Fonts.primary.semiBold, color: '#4800b2' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: Fonts.primary.bold, color: '#1a1c1d', flex: 1 },
  configBody: { gap: 16 },
  configInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fafafa' },
  inputText: { fontSize: 15, fontFamily: Fonts.primary.regular, color: '#1a1c1d' },
  nestedModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 },
  nestedModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionText: { fontSize: 15, fontFamily: Fonts.primary.regular, color: '#4b5563' },
});
