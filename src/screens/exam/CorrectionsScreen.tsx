import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import api, { BACKEND_BASE_URL } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface QuestionResult {
  question: {
    id: number;
    question_text: string;
    question_type: string;
    explanation: string | null;
    points: number;
    subject?: string;
    image?: string | null;
    expected_answer?: string | null;
    answers?: any[];
  };
  user_answer: {
    id: number | null;
    answer_text: string;
    order: string | null;
  } | null;
  correct_answer: {
    id: number | null;
    answer_text: string;
    order: string | null;
  } | null;
  is_correct: boolean;
  time_spent: number | null;
}

interface AttemptData {
  id: number;
  score: number;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  time_spent: number;
  completed_at: string;
  subjects?: (string | { subject: string; question_count: number })[];
}

interface RouteParams {
  attemptId: number;
  subjects?: (string | { subject: string; question_count: number })[];
}

export function CorrectionsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [resultsBySubject, setResultsBySubject] = useState<Record<string, QuestionResult[]>>({});
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [subjectCurrentIndex, setSubjectCurrentIndex] = useState<Record<string, number>>({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = '#10B981';
  const errorColor = '#EF4444';
  const backgroundSecondary = useThemeColor({}, 'cardBackground');

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exam-attempts/${params.attemptId}/results`);

      if (response.data.success) {
        const allResults = response.data.data.results;
        const attemptData = response.data.data.attempt;
        setResults(allResults);
        setAttempt(attemptData);

        // Group results by subject using the explicit subject field from API
        const grouped: Record<string, QuestionResult[]> = {};
        const subjectList: string[] = [];

        allResults.forEach((result: QuestionResult) => {
          const subject = result.question.subject || 'General';
          if (!grouped[subject]) {
            grouped[subject] = [];
            subjectList.push(subject);
          }
          grouped[subject].push(result);
        });

        // Ensure subjects are in the expected order if provided in params/attempt
        const orderedSubjectList: string[] = [];
        const attemptSubjects = attemptData?.subjects || params.subjects || [];
        attemptSubjects.forEach((subj: any) => {
          const name = typeof subj === 'string' ? subj : subj.subject;
          if (subjectList.includes(name)) {
            orderedSubjectList.push(name);
          }
        });

        // Add any subjects found in results but not in the attempt list
        subjectList.forEach(s => {
          if (!orderedSubjectList.includes(s)) {
            orderedSubjectList.push(s);
          }
        });

        setResultsBySubject(grouped);
        setSubjects(orderedSubjectList);

        // Initialize indices
        const initialIndices: Record<string, number> = {};
        orderedSubjectList.forEach(s => {
          initialIndices[s] = 0;
        });
        setSubjectCurrentIndex(initialIndices);

        if (orderedSubjectList.length > 0) {
          setCurrentSubject(orderedSubjectList[0]);
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

  useEffect(() => {
    loadResults();
  }, [params.attemptId]);

  const handleNext = () => {
    const currentQuestions = resultsBySubject[currentSubject] || [];
    const currentQuestionIndex = subjectCurrentIndex[currentSubject] || 0;
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setSubjectCurrentIndex({
        ...subjectCurrentIndex,
        [currentSubject]: currentQuestionIndex + 1,
      });
    }
  };

  const handlePrevious = () => {
    const currentQuestionIndex = subjectCurrentIndex[currentSubject] || 0;
    if (currentQuestionIndex > 0) {
      setSubjectCurrentIndex({
        ...subjectCurrentIndex,
        [currentSubject]: currentQuestionIndex - 1,
      });
    }
  };

  const handleSwitchSubject = (subject: string) => {
    setCurrentSubject(subject);
    setShowSubjectModal(false);
  };

  const goToQuestion = (index: number) => {
    setSubjectCurrentIndex({
      ...subjectCurrentIndex,
      [currentSubject]: index,
    });
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
  const currentQuestionIndex = subjectCurrentIndex[currentSubject] || 0;
  const currentResult = currentQuestions[currentQuestionIndex];

  if (!currentResult) {
    return (
      <AppLayout showBackButton={true} headerTitle="Corrections">
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>No corrections found for this subject.</ThemedText>
          <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 16 }} />
        </View>
      </AppLayout>
    );
  }

  const baseUrl = BACKEND_BASE_URL;
  const imageUrl = currentResult.question.image
    ? currentResult.question.image.startsWith("http")
      ? currentResult.question.image
      : `${baseUrl}/storage/${currentResult.question.image}`
    : null;

  return (
    <AppLayout showHeader={false}>
      <View style={styles.container}>
        {/* Custom Header with Subject Selector to match ExamScreen */}
        <View
          style={[
            styles.header,
            { backgroundColor: cardBackground, borderBottomColor: borderColor },
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.subjectSelector}
              onPress={() => setShowSubjectModal(true)}
            >
              <ThemedText type="subtitle" style={styles.headerTitle}>
                {currentSubject}
              </ThemedText>
              <MaterialIcons
                name="arrow-drop-down"
                size={20}
                color={textColor}
              />
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <ThemedText style={styles.correctionsTitle}>Corrections</ThemedText>
            </View>
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
            <View
              style={[styles.modalContent, { backgroundColor: cardBackground }]}
            >
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
                  const items = resultsBySubject[subject] || [];
                  const correct = items.filter(r => r.is_correct).length;
                  const isCurrent = subject === currentSubject;
                  return (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        styles.subjectOption,
                        {
                          backgroundColor: isCurrent
                            ? tintColor + "20"
                            : backgroundSecondary,
                          borderColor: isCurrent ? tintColor : borderColor,
                        },
                      ]}
                      onPress={() => handleSwitchSubject(subject)}
                    >
                      <View style={styles.subjectOptionContent}>
                        <ThemedText
                          type="subtitle"
                          style={styles.subjectOptionName}
                        >
                          {subject}
                        </ThemedText>
                        <ThemedText style={styles.subjectOptionProgress}>
                          {correct} / {items.length} correct
                        </ThemedText>
                      </View>
                      {isCurrent && (
                        <MaterialIcons
                          name="check-circle"
                          size={24}
                          color={tintColor}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Question Card Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={[styles.questionCard, { backgroundColor: cardBackground }]}
          >
            <ThemedText type="subtitle" style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
              {currentResult.is_correct ? (
                <ThemedText style={{ color: successColor }}> • Correct</ThemedText>
              ) : (
                <ThemedText style={{ color: errorColor }}> • Incorrect</ThemedText>
              )}
            </ThemedText>
            <ThemedText style={styles.questionText}>
              {currentResult.question.question_text}
            </ThemedText>
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Answers and Explanation */}
          <View style={styles.answersContainer}>
            {/* Multiple Choice / True False */}
            {(currentResult.question.question_type === 'multiple_choice' || currentResult.question.question_type === 'true_false') &&
              currentResult.question.answers?.map((answer) => {
                const isUserSelected = currentResult.user_answer?.id === answer.id;
                const isCorrect = currentResult.correct_answer?.id === answer.id || answer.is_correct;

                let cardStyle = {};
                let indicatorStyle = {};
                let iconName: any = null;
                let iconColor = '#fff';

                if (isCorrect) {
                  cardStyle = { backgroundColor: successColor + '15', borderColor: successColor };
                  indicatorStyle = { backgroundColor: successColor, borderColor: successColor };
                  iconName = 'check';
                } else if (isUserSelected && !isCorrect) {
                  cardStyle = { backgroundColor: errorColor + '15', borderColor: errorColor };
                  indicatorStyle = { backgroundColor: errorColor, borderColor: errorColor };
                  iconName = 'close';
                } else {
                  cardStyle = { backgroundColor: cardBackground, borderColor: borderColor };
                  indicatorStyle = { backgroundColor: 'transparent', borderColor: borderColor };
                }

                return (
                  <View
                    key={answer.id}
                    style={[styles.answerCard, cardStyle]}
                  >
                    <View style={[styles.answerIndicator, indicatorStyle]}>
                      {iconName && <MaterialIcons name={iconName} size={16} color={iconColor} />}
                    </View>
                    <ThemedText style={styles.answerText}>
                      {answer.order ? `${answer.order}. ` : ''}{answer.answer_text}
                    </ThemedText>
                  </View>
                );
              })
            }

            {/* Input Questions */}
            {(currentResult.question.question_type === 'text_input' || currentResult.question.question_type === 'numeric_input') && (
              <View style={styles.inputResultsContainer}>
                <View style={[styles.inputBox, { borderColor: borderColor }]}>
                  <ThemedText style={styles.inputLabel}>Your Answer:</ThemedText>
                  <ThemedText style={[styles.inputValue, { color: currentResult.is_correct ? successColor : errorColor }]}>
                    {currentResult.user_answer?.answer_text || 'No answer provided'}
                  </ThemedText>
                </View>
                {!currentResult.is_correct && (
                  <View style={[styles.inputBox, { borderColor: successColor }]}>
                    <ThemedText style={styles.inputLabel}>Correct Answer:</ThemedText>
                    <ThemedText style={[styles.inputValue, { color: successColor }]}>
                      {currentResult.correct_answer?.answer_text || currentResult.question.expected_answer}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Explanation */}
            {currentResult.question.explanation && (
              <View style={[styles.explanationCard, { backgroundColor: backgroundSecondary }]}>
                <View style={styles.explanationHeader}>
                  <MaterialIcons name="info" size={20} color={tintColor} />
                  <ThemedText type="subtitle" style={styles.explanationTitle}>Explanation</ThemedText>
                </View>
                <ThemedText style={styles.explanationText}>
                  {currentResult.question.explanation}
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Navigation Footer to match ExamScreen */}
        <View
          style={[
            styles.footer,
            { backgroundColor: cardBackground, borderTopColor: borderColor },
          ]}
        >
          <View style={styles.questionGrid}>
            {currentQuestions.map((q, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isCorrect = q.is_correct;
              const isAnswered = q.user_answer !== null && q.user_answer !== undefined;

              return (
                <TouchableOpacity
                  key={q.question.id}
                  style={[
                    styles.questionDot,
                    {
                      backgroundColor: isCurrent
                        ? tintColor
                        : isAnswered
                          ? isCorrect ? successColor + '80' : errorColor + '80'
                          : 'transparent',
                      borderColor: isCurrent
                        ? tintColor
                        : isAnswered
                          ? isCorrect ? successColor : errorColor
                          : borderColor,
                    },
                  ]}
                  onPress={() => goToQuestion(index)}
                >
                  <ThemedText
                    style={[
                      styles.questionDotText,
                      { color: isCurrent || isAnswered ? '#fff' : textColor },
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
              title="Next"
              onPress={handleNext}
              disabled={currentQuestionIndex === currentQuestions.length - 1}
              style={styles.footerButton}
            />
          </View>
          <Button
            title="Back to Results"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={StyleSheet.flatten([styles.footerButton, { marginTop: 12 }])}
          />
        </View>
      </View>
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
    padding: 20,
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginTop: 16,
    borderRadius: 8,
  },
  answersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  answerIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  inputResultsContainer: {
    gap: 12,
  },
  inputBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanationCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
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
    marginBottom: 12
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  questionDot: {
    width: 36,
    height: 36,
    borderRadius: 2,
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
    maxHeight: '70%',
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
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  subjectOptionContent: {
    flex: 1,
  },
  subjectOptionName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectOptionProgress: {
    fontSize: 14,
    opacity: 0.7,
  },
});
