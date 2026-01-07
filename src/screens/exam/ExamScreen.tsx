import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation, useRoute } from '@react-navigation/native';
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

interface ExamData {
  id: number;
  title: string;
  duration: number;
  total_questions: number;
}

interface RouteParams {
  attemptId: number;
  examId: number;
  questions: Question[];
  exam: ExamData;
  timeMinutes: number;
}

export function ExamScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { incrementPracticeSession, selection } = useExamSelection();
  const params = route.params as RouteParams;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(params.timeMinutes * 60); // in seconds
  const [loading, setLoading] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const questions = params.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleCompleteExam();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (answerId: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteExam = async () => {
    Alert.alert(
      'Complete Exam',
      `You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            await submitExam();
          },
        },
      ]
    );
  };

  const submitExam = async () => {
    try {
      setLoading(true);
      
      // Submit all answers
      for (const [questionId, answerId] of Object.entries(selectedAnswers)) {
        await api.post(`/exam-attempts/${params.attemptId}/submit-answer`, {
          question_id: parseInt(questionId),
          answer_id: answerId,
        });
      }

      // Complete the exam
      const response = await api.post(`/exam-attempts/${params.attemptId}/complete`);
      
      // Increment practice session if it was a practice exam
      if (selection.questionMode === 'practice' && selection.subject) {
        incrementPracticeSession(selection.subject);
      }

      // Navigate back to home for now (results screen can be added later)
      Alert.alert(
        'Exam Submitted',
        `You answered ${answeredCount} out of ${totalQuestions} questions. Results will be available soon.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // @ts-ignore
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (!currentQuestion) {
    return (
      <AppLayout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading exam...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <AppLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={tintColor} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {params.exam.title}
            </ThemedText>
            <View style={styles.timerContainer}>
              <MaterialIcons name="access-time" size={20} color={timeRemaining < 300 ? '#EF4444' : tintColor} />
              <ThemedText style={[styles.timer, { color: timeRemaining < 300 ? '#EF4444' : undefined }]}>
                {formatTime(timeRemaining)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`, backgroundColor: tintColor },
              ]}
            />
          </View>
          <ThemedText style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </ThemedText>
        </View>

        {/* Question */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.questionCard, { backgroundColor: cardBackground }]}>
            <ThemedText type="subtitle" style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
            </ThemedText>
            <ThemedText style={styles.questionText}>
              {currentQuestion.question_text}
            </ThemedText>
          </View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = selectedAnswerId === answer.id;
              return (
                <TouchableOpacity
                  key={answer.id}
                  style={[
                    styles.answerCard,
                    {
                      backgroundColor: isSelected ? tintColor + '20' : cardBackground,
                      borderColor: isSelected ? tintColor : borderColor,
                    },
                  ]}
                  onPress={() => handleSelectAnswer(answer.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.answerIndicator, { backgroundColor: isSelected ? tintColor : 'transparent', borderColor: tintColor }]}>
                    {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                  <ThemedText style={[styles.answerText, { color: isSelected ? tintColor : undefined }]}>
                    {answer.order}. {answer.answer_text}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Navigation Footer */}
        <View style={[styles.footer, { backgroundColor: cardBackground, borderTopColor: borderColor }]}>
          <View style={styles.questionGrid}>
            {questions.map((q, index) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.questionDot,
                    {
                      backgroundColor: isCurrent
                        ? tintColor
                        : isAnswered
                        ? tintColor + '80'
                        : 'transparent',
                      borderColor: tintColor,
                    },
                  ]}
                  onPress={() => goToQuestion(index)}
                >
                  <ThemedText
                    style={[
                      styles.questionDotText,
                      { color: isCurrent || isAnswered ? '#fff' : tintColor },
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
            {isLastQuestion ? (
              <Button
                title={loading ? "Submitting..." : "Submit Exam"}
                onPress={handleCompleteExam}
                disabled={loading}
                style={styles.footerButton}
              />
            ) : (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.footerButton}
              />
            )}
          </View>
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
  },
  loadingText: {
    marginTop: 16,
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
    marginBottom: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timer: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  answersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
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
});
