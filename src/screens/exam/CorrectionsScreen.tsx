import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface QuestionResult {
  question: {
    id: number;
    question_text: string;
    explanation: string | null;
    points: number;
  };
  user_answer: {
    id: number;
    answer_text: string;
    order: string;
  } | null;
  correct_answer: {
    id: number;
    answer_text: string;
    order: string;
  } | null;
  is_correct: boolean;
  time_spent: number | null;
}

interface RouteParams {
  attemptId: number;
  subjects?: string[]; // List of subjects from the attempt
}

export function CorrectionsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [resultsBySubject, setResultsBySubject] = useState<Record<string, QuestionResult[]>>({});
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const successColor = '#10B981';
  const errorColor = '#EF4444';

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exam-attempts/${params.attemptId}/results`);
      
      if (response.data.success) {
        const allResults = response.data.data.results;
        const attemptData = response.data.data.attempt;
        setResults(allResults);

        // Group results by subject
        const grouped: Record<string, QuestionResult[]> = {};
        const subjectList: string[] = [];

        // Get subjects from attempt data
        const attemptSubjects = attemptData?.subjects || params.subjects || [];
        
        // Extract subject names
        const subjectNames: string[] = [];
        if (Array.isArray(attemptSubjects) && attemptSubjects.length > 0) {
          attemptSubjects.forEach((subj: any) => {
            if (typeof subj === 'string') {
              subjectNames.push(subj);
            } else if (subj && typeof subj === 'object' && subj.subject) {
              subjectNames.push(subj.subject);
            }
          });
        }

        // If we have subjects, use them
        if (subjectNames.length > 0) {
          subjectNames.forEach((subject) => {
            grouped[subject] = [];
            subjectList.push(subject);
          });

          // Group results by subject based on question count per subject
          let questionIndex = 0;
          subjectNames.forEach((subject) => {
            // Find question count for this subject
            const subjectData = attemptSubjects.find((s: any) => {
              if (typeof s === 'string') return s === subject;
              return s.subject === subject;
            });
            const questionCount = typeof subjectData === 'object' && subjectData?.question_count 
              ? subjectData.question_count 
              : Math.floor(allResults.length / subjectNames.length);
            
            // Assign questions to this subject
            for (let i = 0; i < questionCount && questionIndex < allResults.length; i++) {
              grouped[subject].push(allResults[questionIndex]);
              questionIndex++;
            }
          });
          
          // Assign any remaining questions to the last subject
          while (questionIndex < allResults.length && subjectNames.length > 0) {
            const lastSubject = subjectNames[subjectNames.length - 1];
            grouped[lastSubject].push(allResults[questionIndex]);
            questionIndex++;
          }
        } else {
          // Fallback: group all in one subject
          if (!grouped['All Questions']) {
            grouped['All Questions'] = [];
            subjectList.push('All Questions');
          }
          allResults.forEach((result: QuestionResult) => {
            grouped['All Questions'].push(result);
          });
        }

        setResultsBySubject(grouped);
        setSubjects(subjectList);
        
        if (subjectList.length > 0) {
          setCurrentSubject(subjectList[0]);
        }
      } else {
        Alert.alert('Error', 'Failed to load corrections. Please try again.');
      }
    } catch (error: any) {
      console.error('Error loading corrections:', error);
      Alert.alert('Error', 'Failed to load corrections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentQuestionIndex(0);
    setShowSubjectModal(false);
  };

  const handleNext = () => {
    const currentQuestions = resultsBySubject[currentSubject] || [];
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Corrections">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading corrections...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  const currentQuestions = resultsBySubject[currentSubject] || [];
  const currentResult = currentQuestions[currentQuestionIndex];

  if (!currentResult) {
    return (
      <AppLayout showBackButton={true} headerTitle="Corrections">
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>No corrections found</ThemedText>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </AppLayout>
    );
  }

  const totalQuestionsForSubject = currentQuestions.length;

  return (
    <AppLayout showBackButton={true} headerTitle="Corrections">
      {/* Subject Header */}
      <View style={[styles.subjectHeader, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.subjectSelector}
          onPress={() => setShowSubjectModal(true)}
        >
          <MaterialIcons name="menu-book" size={20} color={tintColor} />
          <ThemedText type="subtitle" style={styles.subjectName}>
            {currentSubject}
          </ThemedText>
          <MaterialIcons name="arrow-drop-down" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText style={styles.questionCounter}>
          {currentQuestionIndex + 1} / {totalQuestionsForSubject}
        </ThemedText>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: cardBackground }]}>
          <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestionIndex + 1) / totalQuestionsForSubject) * 100}%`,
                  backgroundColor: tintColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Question Card */}
        <View style={[styles.correctionCard, { backgroundColor: cardBackground }]}>
          <View style={styles.correctionHeader}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: currentResult.is_correct
                    ? successColor + '20'
                    : errorColor + '20',
                },
              ]}
            >
              <MaterialIcons
                name={currentResult.is_correct ? 'check-circle' : 'cancel'}
                size={20}
                color={currentResult.is_correct ? successColor : errorColor}
              />
              <ThemedText
                style={[
                  styles.statusText,
                  {
                    color: currentResult.is_correct ? successColor : errorColor,
                  },
                ]}
              >
                {currentResult.is_correct ? 'Correct' : 'Incorrect'}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.questionText}>
            {currentResult.question.question_text}
          </ThemedText>

          <View style={styles.answersSection}>
            {currentResult.user_answer && (
              <View
                style={[
                  styles.answerBox,
                  {
                    backgroundColor: currentResult.is_correct
                      ? successColor + '10'
                      : errorColor + '10',
                    borderColor: currentResult.is_correct ? successColor : errorColor,
                  },
                ]}
              >
                <View style={styles.answerHeader}>
                  <MaterialIcons
                    name={currentResult.is_correct ? 'check-circle' : 'cancel'}
                    size={18}
                    color={currentResult.is_correct ? successColor : errorColor}
                  />
                  <ThemedText
                    style={[
                      styles.answerLabel,
                      {
                        color: currentResult.is_correct ? successColor : errorColor,
                      },
                    ]}
                  >
                    Your Answer
                  </ThemedText>
                </View>
                <ThemedText style={styles.answerText}>
                  {currentResult.user_answer.order}. {currentResult.user_answer.answer_text}
                </ThemedText>
              </View>
            )}

            {!currentResult.is_correct && currentResult.correct_answer && (
              <View
                style={[
                  styles.answerBox,
                  {
                    backgroundColor: successColor + '10',
                    borderColor: successColor,
                  },
                ]}
              >
                <View style={styles.answerHeader}>
                  <MaterialIcons name="check-circle" size={18} color={successColor} />
                  <ThemedText
                    style={[styles.answerLabel, { color: successColor }]}
                  >
                    Correct Answer
                  </ThemedText>
                </View>
                <ThemedText style={styles.answerText}>
                  {currentResult.correct_answer.order}. {currentResult.correct_answer.answer_text}
                </ThemedText>
              </View>
            )}

            {!currentResult.user_answer && (
              <View
                style={[
                  styles.answerBox,
                  {
                    backgroundColor: '#6B7280' + '10',
                    borderColor: '#6B7280',
                  },
                ]}
              >
                <View style={styles.answerHeader}>
                  <MaterialIcons name="help-outline" size={18} color="#6B7280" />
                  <ThemedText style={[styles.answerLabel, { color: '#6B7280' }]}>
                    Not Answered
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {currentResult.question.explanation && (
            <View style={[styles.explanationBox, { backgroundColor: tintColor + '10' }]}>
              <View style={styles.explanationHeader}>
                <MaterialIcons name="lightbulb" size={18} color={tintColor} />
                <ThemedText style={[styles.explanationLabel, { color: tintColor }]}>
                  Explanation
                </ThemedText>
              </View>
              <ThemedText style={styles.explanationText}>
                {currentResult.question.explanation}
              </ThemedText>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { backgroundColor: cardBackground, borderTopColor: borderColor }]}>
        <View style={styles.questionGrid}>
          {currentQuestions.map((result, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isCorrect = result.is_correct;
            
            return (
              <TouchableOpacity
                key={result.question.id}
                style={[
                  styles.questionDot,
                  {
                    backgroundColor: isCurrent
                      ? tintColor
                      : isCorrect
                      ? successColor
                      : errorColor,
                    borderColor: isCurrent ? tintColor : isCorrect ? successColor : errorColor,
                    opacity: isCurrent ? 1 : 0.8,
                  },
                ]}
                onPress={() => goToQuestion(index)}
              >
                <ThemedText
                  style={[
                    styles.questionDotText,
                    { color: isCurrent ? "#fff" : "#fff" },
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
          <Button
            title={currentQuestionIndex === totalQuestionsForSubject - 1 ? 'Finish' : 'Next'}
            onPress={currentQuestionIndex === totalQuestionsForSubject - 1 
              ? () => navigation.goBack()
              : handleNext}
            style={styles.footerButton}
          />
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
          <View style={[styles.modalContent, { backgroundColor: backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Select Subject
              </ThemedText>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {subjects.map((subject) => {
                const subjectQuestions = resultsBySubject[subject] || [];
                const correctCount = subjectQuestions.filter((r) => r.is_correct).length;
                const isSelected = subject === currentSubject;
                
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectOption,
                      {
                        backgroundColor: isSelected ? tintColor + '20' : cardBackground,
                        borderColor: isSelected ? tintColor : borderColor,
                      },
                    ]}
                    onPress={() => handleSelectSubject(subject)}
                  >
                    <View style={styles.subjectOptionContent}>
                      <ThemedText
                        type="defaultSemiBold"
                        style={[
                          styles.subjectOptionName,
                          { color: isSelected ? tintColor : textColor },
                        ]}
                      >
                        {subject}
                      </ThemedText>
                      <ThemedText style={styles.subjectOptionStats}>
                        {correctCount} / {subjectQuestions.length} correct
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={24} color={tintColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
  },
  questionCounter: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressBar: {
    padding: 16,
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  correctionCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  correctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: '600',
  },
  answersSection: {
    gap: 12,
    marginBottom: 16,
  },
  answerBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
  explanationBox: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  questionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionDotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  subjectOptionContent: {
    flex: 1,
  },
  subjectOptionName: {
    fontSize: 16,
    marginBottom: 4,
  },
  subjectOptionStats: {
    fontSize: 14,
    opacity: 0.7,
  },
});
