import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  const { selection, addSubject, removeSubject, setQuestionCount, setSelectedYear, setTimeMinutes } = useExamSelection();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [subjectSelections, setSubjectSelections] = useState<Record<string, SubjectSelection>>({});
  const [showYearModal, setShowYearModal] = useState(false);
  const [currentSubjectForYear, setCurrentSubjectForYear] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');

  const quickOptions = [10, 20, 30, 40, 50];

  useEffect(() => {
    loadSubjects();
    loadYears();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/subjects', {
        params: {
          exam_type: 'JAMB',
          type: 'past_question',
        },
      });
      
      if (response.data.success) {
        const subjectsList = response.data.data || [];
        setSubjectsList(subjectsList);
        
        if (subjectsList.length === 0) {
          Alert.alert(
            'No Subjects Available',
            'No JAMB past question subjects are available at the moment. Please try again later.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        setSubjectsList([]);
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      setSubjectsList([]);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load subjects. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadYears = async () => {
    try {
      const response = await api.get('/exams/years', {
        params: {
          exam_type: 'JAMB',
        },
      });

      if (response.data.success) {
        setYears(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading years:', error);
      setYears([]);
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
          'Maximum Subjects Reached',
          'You can select a maximum of 4 subjects for JAMB.',
          [{ text: 'OK' }]
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

  const handleStartExam = async () => {
    if (selection.subjects.length === 0) {
      Alert.alert('No Subjects Selected', 'Please select at least one subject to continue.');
      return;
    }

    // Validate all subjects have question counts and years
    const missingData: string[] = [];
    selection.subjects.forEach((subject) => {
      const selection = subjectSelections[subject];
      if (!selection || !selection.questionCount || selection.questionCount < 1) {
        missingData.push(`${subject} - question count`);
      }
      if (!selection || !selection.year) {
        missingData.push(`${subject} - year`);
      }
    });

    if (missingData.length > 0) {
      Alert.alert(
        'Incomplete Selection',
        `Please complete the following:\n${missingData.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate question counts (max 100 per subject for JAMB)
    for (const subject of selection.subjects) {
      const subjectSelection = subjectSelections[subject];
      if (subjectSelection.questionCount > 100) {
        Alert.alert(
          'Too Many Questions',
          `Maximum allowed is 100 questions per subject. ${subject} has ${subjectSelection.questionCount} questions.`,
          [{ text: 'OK' }]
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
        
        const examResponse = await api.get('/exams', {
          params: {
            exam_type: 'JAMB',
            subject: subject,
            year: subjectSelection.year,
          },
        });

        if (!examResponse.data.success || examResponse.data.data.length === 0) {
          Alert.alert(
            'No Exam Found',
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
          Alert.alert('Error', `Failed to load questions for ${subject}. Please try again.`);
          return;
        }

        const questionsData = questionsResponse.data.data;
        const allQuestions = questionsData.questions || [];

        // Limit questions to selected count for this subject
        const limitedQuestions = allQuestions.slice(0, subjectSelection.questionCount);

        // Add subject identifier to questions
        const questionsWithSubject = limitedQuestions.map((q: any) => ({
          ...q,
          subject: subject,
        }));

        subjectsQuestions[subject] = questionsWithSubject;
      }

      if (!firstExamId) {
        Alert.alert('Error', 'Failed to start exam. Please try again.');
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
        Alert.alert('Error', 'Failed to start exam. Please try again.');
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
      navigation.navigate('ExamScreen', {
        attemptId: attempt.id,
        examId: firstExamId,
        subjectsQuestions: subjectsQuestions,
        exam: {
          id: firstExamId,
          title: `JAMB ${selection.subjects.join(', ')} Past Questions`,
          duration: timeMinutesNum,
          total_questions: totalQuestions,
        },
        timeMinutes: timeMinutesNum,
      });
    } catch (error: any) {
      console.error('Error starting exam:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to start exam. Please check your connection and try again.'
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
          <ThemedText style={styles.loadingText}>Loading subjects...</ThemedText>
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
            Choose up to 4 subjects and set question count and year for each ({selection.subjects.length}/4 selected)
          </ThemedText>
          <ThemedText style={styles.hint}>
            Each subject takes 30 minutes. Total time will be calculated automatically.
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
                      backgroundColor: isSelected ? tintColor + '10' : cardBackground,
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
                            backgroundColor: isSelected ? tintColor : 'transparent',
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
                            {subjectSelection.year && ` • Year ${subjectSelection.year}`}
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
                          name={isExpanded ? 'expand-less' : 'expand-more'}
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
                        <TextInput
                          style={[
                            styles.input,
                            {
                              borderColor: subjectSelection?.questionCount && subjectSelection.questionCount > 0 ? tintColor : borderColor,
                              color: textColor,
                            },
                          ]}
                          value={subjectSelection?.questionCount?.toString() || ''}
                          onChangeText={(text) => {
                            handleQuestionCountChange(subject, text);
                            if (text && !isNaN(parseInt(text)) && parseInt(text) > 0) {
                              const numValue = parseInt(text);
                              if (numValue <= 100) {
                                setQuestionCount(subject, numValue);
                              } else {
                                Alert.alert(
                                  'Maximum Limit',
                                  'Maximum allowed is 100 questions per subject.'
                                );
                                handleQuestionCountChange(subject, '100');
                                setQuestionCount(subject, 100);
                              }
                            }
                          }}
                          placeholder="e.g., 25"
                          keyboardType="number-pad"
                          placeholderTextColor={placeholderColor}
                          maxLength={3}
                        />
                        <ThemedText style={styles.hint}>
                          Minimum: 1, Maximum: 100
                        </ThemedText>
                      </View>

                      <View style={styles.quickOptionsContainer}>
                        <ThemedText style={styles.quickOptionsTitle}>Quick Select</ThemedText>
                        <View style={styles.quickOptionsGrid}>
                          {quickOptions
                            .filter(value => value <= 100)
                            .map((value) => (
                              <TouchableOpacity
                                key={value}
                                style={[
                                  styles.quickOption,
                                  {
                                    backgroundColor:
                                      subjectSelection?.questionCount === value ? tintColor : cardBackground,
                                    borderColor: tintColor,
                                  },
                                ]}
                                onPress={() => {
                                  handleQuestionCountChange(subject, value.toString());
                                  setQuestionCount(subject, value);
                                }}
                              >
                                <ThemedText
                                  style={[
                                    styles.quickOptionText,
                                    {
                                      color: subjectSelection?.questionCount === value ? '#fff' : textColor,
                                    },
                                  ]}
                                >
                                  {value}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                        </View>
                      </View>

                      {/* Year Selection */}
                      <View style={styles.inputSection}>
                        <ThemedText style={styles.inputLabel}>
                          Year
                        </ThemedText>
                        <TouchableOpacity
                          style={[
                            styles.yearSelector,
                            {
                              borderColor: subjectSelection?.year ? tintColor : borderColor,
                              backgroundColor: cardBackground,
                            },
                          ]}
                          onPress={() => openYearModal(subject)}
                        >
                          <ThemedText
                            style={{
                              color: subjectSelection?.year ? textColor : placeholderColor,
                              fontSize: 16,
                            }}
                          >
                            {subjectSelection?.year ? `${subjectSelection.year}` : 'Select year'}
                          </ThemedText>
                          <MaterialIcons name="arrow-drop-down" size={24} color={textColor} />
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
          <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Selected Subjects:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selection.subjects.length}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total Questions:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {totalQuestions || 'Not set'}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Year Selection Modal */}
      <Modal
        visible={showYearModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
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
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    {
                      backgroundColor:
                        subjectSelections[currentSubjectForYear || '']?.year === year
                          ? tintColor + '20'
                          : 'transparent',
                    },
                  ]}
                  onPress={() => selectYear(year)}
                >
                  <ThemedText
                    style={[
                      styles.yearOptionText,
                      {
                        color:
                          subjectSelections[currentSubjectForYear || '']?.year === year
                            ? tintColor
                            : textColor,
                        fontWeight:
                          subjectSelections[currentSubjectForYear || '']?.year === year
                            ? '600'
                            : '400',
                      },
                    ]}
                  >
                    {year}
                  </ThemedText>
                  {subjectSelections[currentSubjectForYear || '']?.year === year && (
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
          title={`Continue (${selection.subjects.length} subject${selection.subjects.length === 1 ? '' : 's'})`}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
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
    fontStyle: 'italic',
  },
  subjectsContainer: {
    gap: 12,
  },
  subjectCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  subjectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
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
    borderTopColor: '#E5E7EB',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  quickOptionsContainer: {
    marginTop: 8,
  },
  quickOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  yearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  yearOptionText: {
    fontSize: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
});
