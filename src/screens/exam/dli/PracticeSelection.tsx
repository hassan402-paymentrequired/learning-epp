import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
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

export function DLIPracticeSelection() {
  const { selection, setQuestionMode, addSubject, removeSubject, setQuestionCount, setTimeMinutes } = useExamSelection();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCountLocal] = useState<string>('');
  const [timeMinutes, setTimeMinutesLocal] = useState<string>('');
  const [startingExam, setStartingExam] = useState(false);
  
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');

  const quickQuestionOptions = [10, 20, 30, 40, 50];
  const quickTimeOptions = [30, 45, 60];

  useEffect(() => {
    // Set DLI to practice mode
    setQuestionMode('practice');
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/subjects', {
        params: {
          exam_type: 'DLI',
          type: 'practice',
        },
      });
      
      if (response.data.success) {
        const subjectsList = response.data.data || [];
        setSubjectsList(subjectsList);
        
        if (subjectsList.length === 0) {
          Alert.alert(
            'No Subjects Available',
            'No DLI practice subjects are available at the moment. Please try again later.',
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

  const handleSubjectSelect = (subject: string) => {
    if (selectedSubject === subject) {
      setSelectedSubject(null);
      removeSubject(subject);
    } else {
      if (selectedSubject) {
        removeSubject(selectedSubject);
      }
      setSelectedSubject(subject);
      addSubject(subject);
    }
  };

  const handleStartPractice = async () => {
    if (!selectedSubject) {
      Alert.alert('No Course Selected', 'Please select a course to continue.');
      return;
    }

    const questionCountNum = parseInt(questionCount);
    const timeMinutesNum = parseInt(timeMinutes);

    if (!questionCount || isNaN(questionCountNum) || questionCountNum < 1) {
      Alert.alert('Invalid Question Count', 'Please enter a valid number of questions (minimum 1).');
      return;
    }

    if (questionCountNum > 50) {
      Alert.alert('Too Many Questions', 'Maximum allowed is 50 questions per course for DLI.');
      return;
    }

    if (!timeMinutes || isNaN(timeMinutesNum) || timeMinutesNum < 1) {
      Alert.alert('Invalid Time', 'Please enter a valid duration in minutes (minimum 1 minute).');
      return;
    }

    if (timeMinutesNum > 120) {
      Alert.alert('Time Limit Exceeded', 'Maximum allowed time is 120 minutes (2 hours).');
      return;
    }

    try {
      setStartingExam(true);

      // Set values in context
      setQuestionCount(selectedSubject, questionCountNum);
      setTimeMinutes(timeMinutesNum);

      // Fetch practice questions
      const questionsResponse = await api.get('/questions/practice', {
        params: {
          exam_type: 'DLI',
          subject: selectedSubject,
          count: questionCountNum,
        },
      });

      if (!questionsResponse.data.success) {
        Alert.alert('Error', `Failed to load questions for ${selectedSubject}. Please try again.`);
        return;
      }

      const allQuestions = questionsResponse.data.data || [];

      if (allQuestions.length === 0) {
        Alert.alert(
          'No Questions Found',
          `No practice questions available for ${selectedSubject}. Please try a different course.`
        );
        return;
      }

      if (allQuestions.length < questionCountNum) {
        Alert.alert(
          'Limited Questions',
          `Only ${allQuestions.length} questions available for ${selectedSubject} (requested ${questionCountNum}).`
        );
      }

      // Add subject identifier to questions
      const questionsWithSubject = allQuestions.map((q: any) => ({
        ...q,
        subject: selectedSubject,
      }));

      // Get an exam for the attempt (placeholder)
      const examResponse = await api.get('/exams', {
        params: {
          exam_type: 'DLI',
          subject: selectedSubject,
        },
      });

      let examId: number;
      if (examResponse.data.success && examResponse.data.data.length > 0) {
        examId = examResponse.data.data[0].id;
      } else {
        Alert.alert(
          'Error',
          'Unable to create exam attempt. Please contact support.'
        );
        return;
      }

      // Prepare subjects data
      const subjectsData = [{
        subject: selectedSubject,
        question_count: questionCountNum,
      }];

      // Start exam attempt
      const attemptResponse = await api.post(`/exams/${examId}/start`, {
        subjects: subjectsData,
        duration_minutes: timeMinutesNum,
      });

      if (!attemptResponse.data.success) {
        Alert.alert('Error', 'Failed to start exam. Please try again.');
        return;
      }

      const attempt = attemptResponse.data.data.attempt;

      // Navigate to exam screen
      // @ts-ignore
      navigation.navigate('ExamScreen', {
        attemptId: attempt.id,
        examId: examId,
        subjectsQuestions: {
          [selectedSubject]: questionsWithSubject,
        },
        exam: {
          id: examId,
          title: `DLI ${selectedSubject} Practice Questions`,
          duration: timeMinutesNum,
          total_questions: questionsWithSubject.length,
        },
        timeMinutes: timeMinutesNum,
      });
    } catch (error: any) {
      console.error('Error starting practice:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to start practice. Please check your connection and try again.'
      );
    } finally {
      setStartingExam(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="DLI Practice">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading courses...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="DLI Practice">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            DLI Practice
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Select your course, number of questions, and time. Practice with random questions.
          </ThemedText>
        </View>

        {/* Course Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Course</ThemedText>
          {subjects.length > 0 ? (
            <View style={styles.subjectsContainer}>
              {subjects.map((subject) => {
                const isSelected = selectedSubject === subject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectCard,
                      {
                        backgroundColor: isSelected ? tintColor + '10' : cardBackground,
                        borderColor: isSelected ? tintColor : borderColor,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSubjectSelect(subject)}
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
                      <ThemedText type="subtitle" style={styles.subjectName}>
                        {subject}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No courses available for DLI practice
              </ThemedText>
            </View>
          )}
        </View>

        {/* Number of Questions Selection */}
        {selectedSubject && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Number of Questions</ThemedText>
            <View style={[styles.inputCard, { backgroundColor: cardBackground }]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: questionCount && parseInt(questionCount) > 0 ? tintColor : borderColor,
                    color: textColor,
                  },
                ]}
                value={questionCount}
                onChangeText={(text) => {
                  setQuestionCountLocal(text);
                }}
                placeholder="e.g., 25"
                keyboardType="number-pad"
                placeholderTextColor={placeholderColor}
                maxLength={3}
              />
              <ThemedText style={styles.hint}>
                Minimum: 1, Maximum: 50 (DLI courses)
              </ThemedText>
            </View>
            <View style={styles.quickOptionsContainer}>
              <View style={styles.quickOptionsGrid}>
                {quickQuestionOptions.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickOption,
                      {
                        backgroundColor: questionCount === value.toString() ? tintColor : cardBackground,
                        borderColor: tintColor,
                      },
                    ]}
                    onPress={() => setQuestionCountLocal(value.toString())}
                  >
                    <ThemedText
                      style={[
                        styles.quickOptionText,
                        {
                          color: questionCount === value.toString() ? '#fff' : textColor,
                        },
                      ]}
                    >
                      {value}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Time Selection */}
        {selectedSubject && questionCount && parseInt(questionCount) > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Time (Minutes)</ThemedText>
            <View style={[styles.inputCard, { backgroundColor: cardBackground }]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: timeMinutes && parseInt(timeMinutes) > 0 ? tintColor : borderColor,
                    color: textColor,
                  },
                ]}
                value={timeMinutes}
                onChangeText={(text) => {
                  setTimeMinutesLocal(text);
                }}
                placeholder="e.g., 30"
                keyboardType="number-pad"
                placeholderTextColor={placeholderColor}
                maxLength={3}
              />
              <ThemedText style={styles.hint}>
                Minimum: 1 minute, Maximum: 120 minutes (2 hours)
              </ThemedText>
            </View>
            <View style={styles.quickOptionsContainer}>
              <View style={styles.quickOptionsGrid}>
                {quickTimeOptions.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickOption,
                      {
                        backgroundColor: timeMinutes === value.toString() ? tintColor : cardBackground,
                        borderColor: tintColor,
                      },
                    ]}
                    onPress={() => setTimeMinutesLocal(value.toString())}
                  >
                    <ThemedText
                      style={[
                        styles.quickOptionText,
                        {
                          color: timeMinutes === value.toString() ? '#fff' : textColor,
                        },
                      ]}
                    >
                      {value}m
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Summary */}
        {selectedSubject && questionCount && timeMinutes && (
          <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Course:</ThemedText>
              <ThemedText style={styles.summaryValue}>{selectedSubject}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Questions:</ThemedText>
              <ThemedText style={styles.summaryValue}>{questionCount}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Time:</ThemedText>
              <ThemedText style={styles.summaryValue}>{timeMinutes} minutes</ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={startingExam ? 'Starting Practice...' : 'Start Practice'}
          onPress={handleStartPractice}
          disabled={
            !selectedSubject ||
            !questionCount ||
            !timeMinutes ||
            parseInt(questionCount) < 1 ||
            parseInt(timeMinutes) < 1 ||
            startingExam
          }
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
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subjectsContainer: {
    gap: 12,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
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
  inputCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  quickOptionsContainer: {
    marginTop: 8,
  },
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickOption: {
    width: 70,
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
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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
