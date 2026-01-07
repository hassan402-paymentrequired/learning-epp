import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '@/services/api';

export function QuestionCountSelection() {
  const { selection, setQuestionCount } = useExamSelection();
  const navigation = useNavigation();
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  const quickOptions = [10, 20, 30, 40, 50];

  useEffect(() => {
    // Initialize question counts for each subject
    const initialCounts: Record<string, string> = {};
    selection.subjects.forEach((subject) => {
      if (!questionCounts[subject]) {
        initialCounts[subject] = '';
      }
    });
    if (Object.keys(initialCounts).length > 0) {
      setQuestionCounts((prev) => ({ ...prev, ...initialCounts }));
    }
  }, [selection.subjects]);

  const handleCountChange = (subject: string, count: string) => {
    setQuestionCounts((prev) => ({
      ...prev,
      [subject]: count,
    }));
  };

  const handleQuickSelect = (subject: string, value: number) => {
    handleCountChange(subject, value.toString());
  };

  const handleStartExam = async () => {
    // Validate all subjects have question counts
    const missingSubjects: string[] = [];
    selection.subjects.forEach((subject) => {
      const count = questionCounts[subject];
      if (!count || isNaN(parseInt(count)) || parseInt(count) < 1) {
        missingSubjects.push(subject);
      }
    });

    if (missingSubjects.length > 0) {
      Alert.alert(
        'Incomplete Selection',
        `Please enter question count for: ${missingSubjects.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate question counts
    for (const subject of selection.subjects) {
      const count = parseInt(questionCounts[subject]);
      if (count > 100) {
        Alert.alert(
          'Too Many Questions',
          `Maximum allowed is 100 questions per subject. ${subject} has ${count} questions.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Set question counts in context
    selection.subjects.forEach((subject) => {
      setQuestionCount(subject, parseInt(questionCounts[subject]));
    });

    // Start exam - for now, we'll create a combined exam attempt
    // In the future, this might need to create multiple attempts or a combined one
    try {
      setLoading(true);

      // For JAMB with multiple subjects, we'll need to handle this differently
      // For now, let's use the first subject's exam
      // TODO: Update API to handle multiple subjects
      const examResponse = await api.get('/exams', {
        params: {
          exam_type: selection.examType,
          type: selection.questionMode,
          subject: selection.subjects[0], // Use first subject for now
        },
      });

      if (!examResponse.data.success || examResponse.data.data.length === 0) {
        Alert.alert(
          'No Exam Found',
          'No exam matches your selection. Please try different options.'
        );
        return;
      }

      const exam = examResponse.data.data[0];

      // Get questions for the exam
      const questionsResponse = await api.get(`/exams/${exam.id}/questions`);

      if (!questionsResponse.data.success) {
        Alert.alert('Error', 'Failed to load questions. Please try again.');
        return;
      }

      const questionsData = questionsResponse.data.data;
      const allQuestions = questionsData.questions || [];

      // Limit questions to selected count for first subject
      const limitedQuestions = allQuestions.slice(
        0,
        parseInt(questionCounts[selection.subjects[0]]) || allQuestions.length
      );

      // Start exam attempt
      const attemptResponse = await api.post(`/exams/${exam.id}/start`);

      if (!attemptResponse.data.success) {
        Alert.alert('Error', 'Failed to start exam. Please try again.');
        return;
      }

      const attempt = attemptResponse.data.data.attempt;

      // Navigate to exam screen
      // @ts-ignore
      navigation.navigate('ExamScreen', {
        attemptId: attempt.id,
        examId: exam.id,
        questions: limitedQuestions,
        exam: {
          id: exam.id,
          title: exam.title || `${selection.examType} ${selection.subjects.join(', ')} Practice`,
          duration: selection.timeMinutes || 30,
          total_questions: limitedQuestions.length,
        },
        timeMinutes: selection.timeMinutes || 30,
      });
    } catch (error: any) {
      console.error('Error starting exam:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to start exam. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const allCountsValid = selection.subjects.every((subject) => {
    const count = questionCounts[subject];
    return count && !isNaN(parseInt(count)) && parseInt(count) >= 1 && parseInt(count) <= 100;
  });

  return (
    <AppLayout showBackButton={true} headerTitle="Question Count">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Questions Per Subject
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter the number of questions you want to practice for each subject
          </ThemedText>
        </View>

        {selection.subjects.map((subject) => {
          const count = questionCounts[subject] || '';
          return (
            <View
              key={subject}
              style={[styles.subjectCard, { backgroundColor: cardBackground }]}
            >
              <View style={styles.subjectHeader}>
                <MaterialIcons name="menu-book" size={24} color={tintColor} />
                <ThemedText type="subtitle" style={styles.subjectName}>
                  {subject}
                </ThemedText>
              </View>

              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>
                  Number of questions
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: count && parseInt(count) > 0 ? tintColor : borderColor,
                    },
                  ]}
                  value={count}
                  onChangeText={(text) => handleCountChange(subject, text)}
                  placeholder="e.g., 25"
                  keyboardType="number-pad"
                  placeholderTextColor={useThemeColor({}, 'placeholder')}
                />
                <ThemedText style={styles.hint}>
                  Minimum: 1, Maximum: 100
                </ThemedText>
              </View>

              <View style={styles.quickOptionsContainer}>
                <ThemedText style={styles.quickOptionsTitle}>Quick Select</ThemedText>
                <View style={styles.quickOptionsGrid}>
                  {quickOptions.map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.quickOption,
                        {
                          backgroundColor:
                            count === value.toString() ? tintColor : cardBackground,
                          borderColor: tintColor,
                        },
                      ]}
                      onPress={() => handleQuickSelect(subject, value)}
                    >
                      <ThemedText
                        style={[
                          styles.quickOptionText,
                          {
                            color: count === value.toString() ? '#fff' : undefined,
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
          );
        })}

        <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Subjects:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.length}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Questions:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.reduce((sum, subject) => {
                const count = parseInt(questionCounts[subject] || '0');
                return sum + count;
              }, 0)}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Duration:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.timeMinutes ? `${selection.timeMinutes} minutes` : 'Not set'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Starting Exam...' : 'Start Exam'}
          onPress={handleStartExam}
          disabled={!allCountsValid || loading}
          loading={loading}
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
  },
  subjectCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: '600',
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
  hint: {
    fontSize: 12,
    opacity: 0.6,
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
    borderBottomColor: '#e9ecef',
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
