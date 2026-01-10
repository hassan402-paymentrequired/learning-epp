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
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/components/ui/Button';

export function SubjectSelection() {
  const { 
    selection, 
    addSubject, 
    removeSubject,
    setQuestionCount,
    canAddMoreSubjects,
    getMaxSubjects,
  } = useExamSelection();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // Check if user has active subscription
  const hasActiveSubscription = user?.subscription_status === 'active' 
    && user?.subscription_expires_at 
    && new Date(user.subscription_expires_at) > new Date();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});
  
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');

  const quickOptions = [10, 20, 30, 40, 50];

  useEffect(() => {
    // Only load subjects if examType is set
    if (selection.examType) {
      loadSubjects();
    }
  }, [selection.examType, selection.questionMode]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      // For DLI, always use 'past_question' mode (DLI only supports past questions)
      // For other exam types, use the selected questionMode or default to 'past_question'
      const questionMode = selection.examType === 'DLI' 
        ? 'past_question' 
        : (selection.questionMode || 'past_question');
      
      const response = await api.get('/exams/subjects', {
        params: {
          exam_type: selection.examType,
          type: questionMode === 'practice' ? 'practice' : 'past_question',
        },
      });
      
      if (response.data.success) {
        const subjects = response.data.data || [];
        setSubjectsList(subjects);
        
        // If no subjects found for DLI, show an error
        if (subjects.length === 0 && selection.examType === 'DLI') {
          Alert.alert(
            'No Subjects Available',
            'No DLI past question subjects are available at the moment. Please try again later.',
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

  const handleToggleSubject = (subject: string) => {
    if (selection.subjects.includes(subject)) {
      removeSubject(subject);
      setExpandedSubjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(subject);
        return newSet;
      });
      // Remove question count when subject is deselected
      setQuestionCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[subject];
        return newCounts;
      });
    } else {
        if (canAddMoreSubjects()) {
        // For DLI, remove any previously selected subject first (only 1 allowed)
        if (isDLI && selection.subjects.length > 0) {
          const previousSubject = selection.subjects[0];
          removeSubject(previousSubject);
          setExpandedSubjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(previousSubject);
            return newSet;
          });
          setQuestionCounts((prev) => {
            const newCounts = { ...prev };
            delete newCounts[previousSubject];
            return newCounts;
          });
        }
        addSubject(subject);
        setExpandedSubjects((prev) => new Set(prev).add(subject));
      } else {
        Alert.alert(
          `Maximum ${isDLI ? 'Course' : 'Subject'}${getMaxSubjects() === 1 ? '' : 's'} Reached`,
          `You can select a maximum of ${getMaxSubjects()} ${isDLI ? 'course' : getMaxSubjects() === 1 ? 'subject' : 'subjects'} for ${selection.examType}.`,
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

  const handleCountChange = (subject: string, count: string) => {
    setQuestionCounts((prev) => ({
      ...prev,
      [subject]: count,
    }));
  };

  const handleQuickSelect = (subject: string, value: number) => {
    handleCountChange(subject, value.toString());
    setQuestionCount(subject, value);
  };

  const handleContinue = () => {
      if (selection.subjects.length === 0) {
      Alert.alert(
        `No ${isDLI ? 'Course' : 'Subject'} Selected`,
        `Please select at least one ${isDLI ? 'course' : 'subject'} to continue.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate all selected subjects have question counts
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
    
    // For DLI, ensure question mode is past_question
    if (isDLI && selection.questionMode !== 'past_question') {
      Alert.alert(
        'Invalid Mode',
        'DLI can only practice past questions. Please select past questions mode.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate question counts based on mode and subscription status
    for (const subject of selection.subjects) {
      const count = parseInt(questionCounts[subject]);
      let maxAllowed: number;
      let errorMessage: string;
      
      if (isPracticeMode) {
        // Practice mode: 5 for non-subscribed, 100 for subscribed
        maxAllowed = hasActiveSubscription ? 100 : 5;
        if (!hasActiveSubscription && count > 5) {
          Alert.alert(
            'Subscription Required',
            'Non-subscribed users are limited to 5 questions per practice session. Subscribe to unlock unlimited practice questions.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Subscribe', 
                onPress: () => navigation.navigate('Subscription' as never)
              }
            ]
          );
          return;
        }
      } else {
        // Past questions mode
        maxAllowed = isDLI ? 50 : 100;
      }
      
      if (count > maxAllowed) {
        Alert.alert(
          'Too Many Questions',
          `Maximum allowed is ${maxAllowed} questions per ${isDLI ? 'course' : 'subject'}. ${subject} has ${count} questions.`,
          [{ text: 'OK' }]
        );
        return;
      }
      // Set question count in context
      setQuestionCount(subject, count);
    }

    // Navigate based on question mode and exam type
    // Only JAMB past questions need year selection
    // DLI past questions and practice questions skip year selection
    if (selection.questionMode === 'past_question' && selection.examType === 'JAMB') {
      // @ts-ignore
      navigation.navigate('YearSelection');
    } else {
      // @ts-ignore - DLI past questions and practice go directly to time selection
      navigation.navigate('TimeSelection');
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Select Subjects">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading subjects...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  const maxSubjects = getMaxSubjects();
  const isJAMB = selection.examType === 'JAMB';
  const isDLI = selection.examType === 'DLI';
  const isPracticeMode = selection.questionMode === 'practice';
  
  // For practice mode: non-subscribed users limited to 5 questions, subscribed users up to 100
  // For past questions (DLI or JAMB): DLI max 50, JAMB max 100
  const maxQuestionsPerSubject = isPracticeMode 
    ? (hasActiveSubscription ? 100 : 5)
    : (isDLI ? 50 : 100);
    
  const totalQuestions = selection.subjects.reduce((sum, subject) => {
    const count = parseInt(questionCounts[subject] || '0');
    return sum + count;
  }, 0);

  return (
    <AppLayout showBackButton={true} headerTitle="Select Subjects">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select {isDLI ? 'Course' : isJAMB ? 'Subjects' : 'Subject'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isDLI
              ? 'Choose the course you want to practice (past questions only)'
              : isJAMB 
              ? `Choose up to ${maxSubjects} subjects and set question count for each (${selection.subjects.length}/${maxSubjects} selected)`
              : 'Choose the subject you want to practice'
            }
          </ThemedText>
          {isDLI && (
            <ThemedText style={styles.hint}>
              DLI courses can only practice past questions. Maximum 50 questions per course.
            </ThemedText>
          )}
          {isJAMB && (
            <ThemedText style={styles.hint}>
              Each subject takes 30 minutes. Total time will be calculated automatically.
            </ThemedText>
          )}
          {isPracticeMode && !hasActiveSubscription && (
            <ThemedText style={[styles.hint, { color: tintColor, fontWeight: '600' }]}>
              ⚠️ Non-subscribed users are limited to 5 questions per practice session. Subscribe to unlock unlimited practice questions.
            </ThemedText>
          )}
        </View>

        <View style={styles.subjectsContainer}>
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              const isSelected = selection.subjects.includes(subject);
              const isExpanded = expandedSubjects.has(subject);
              const count = questionCounts[subject] || '';
              
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
                        {isSelected && count && (
                          <ThemedText style={styles.questionCountPreview}>
                            {count} question{parseInt(count) !== 1 ? 's' : ''}
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

                  {/* Accordion Content - Question Count Selection */}
                  {isSelected && isExpanded && (
                    <View style={styles.accordionContent}>
                      <View style={styles.inputSection}>
                        <ThemedText style={styles.inputLabel}>
                          Number of questions
                        </ThemedText>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              borderColor: count && parseInt(count) > 0 ? tintColor : borderColor,
                              color: textColor,
                            },
                          ]}
                          value={count}
                          onChangeText={(text) => {
                            handleCountChange(subject, text);
                            if (text && !isNaN(parseInt(text)) && parseInt(text) > 0) {
                              const numValue = parseInt(text);
                              
                              // Enforce max limit based on mode and subscription status
                              if (numValue <= maxQuestionsPerSubject) {
                                setQuestionCount(subject, numValue);
                              } else {
                                if (isPracticeMode && !hasActiveSubscription && numValue > 5) {
                                  Alert.alert(
                                    'Subscription Required',
                                    'Non-subscribed users are limited to 5 questions per practice session. Subscribe to unlock unlimited practice questions.',
                                    [
                                      { text: 'OK' },
                                      { 
                                        text: 'Subscribe', 
                                        onPress: () => navigation.navigate('Subscription' as never)
                                      }
                                    ]
                                  );
                                } else {
                                  Alert.alert(
                                    'Maximum Limit',
                                    `Maximum allowed is ${maxQuestionsPerSubject} questions per ${isDLI ? 'course' : 'subject'}.`
                                  );
                                }
                                handleCountChange(subject, maxQuestionsPerSubject.toString());
                                setQuestionCount(subject, maxQuestionsPerSubject);
                              }
                            }
                          }}
                          placeholder="e.g., 25"
                          keyboardType="number-pad"
                          placeholderTextColor={placeholderColor}
                          maxLength={3}
                        />
                        <ThemedText style={styles.hint}>
                          Minimum: 1, Maximum: {maxQuestionsPerSubject} {isDLI ? '(DLI courses)' : isPracticeMode && !hasActiveSubscription ? '(Free users)' : ''}
                        </ThemedText>
                        {isPracticeMode && !hasActiveSubscription && (
                          <ThemedText style={[styles.hint, { color: tintColor, marginTop: 4 }]}>
                            💡 Subscribe to practice up to 100 questions per session
                          </ThemedText>
                        )}
                      </View>

                      <View style={styles.quickOptionsContainer}>
                        <ThemedText style={styles.quickOptionsTitle}>Quick Select</ThemedText>
                        <View style={styles.quickOptionsGrid}>
                          {quickOptions
                            .filter(value => value <= maxQuestionsPerSubject)
                            .map((value) => {
                              const isDisabled = isPracticeMode && !hasActiveSubscription && value > 5;
                              return (
                                <TouchableOpacity
                                  key={value}
                                  style={[
                                    styles.quickOption,
                                    {
                                      backgroundColor:
                                        count === value.toString() ? tintColor : cardBackground,
                                      borderColor: tintColor,
                                      opacity: isDisabled ? 0.5 : 1,
                                    },
                                  ]}
                                  onPress={() => {
                                    if (isDisabled) {
                                      Alert.alert(
                                        'Subscription Required',
                                        'Non-subscribed users are limited to 5 questions per practice session. Subscribe to unlock unlimited practice questions.',
                                        [
                                          { text: 'OK' },
                                          { 
                                            text: 'Subscribe', 
                                            onPress: () => navigation.navigate('Subscription' as never)
                                          }
                                        ]
                                      );
                                    } else {
                                      handleQuickSelect(subject, value);
                                    }
                                  }}
                                  disabled={isDisabled}
                                >
                                  <ThemedText
                                    style={[
                                      styles.quickOptionText,
                                      {
                                        color: count === value.toString() ? '#fff' : textColor,
                                      },
                                    ]}
                                  >
                                    {value}
                                  </ThemedText>
                                </TouchableOpacity>
                              );
                            })}
                        </View>
                        {isPracticeMode && !hasActiveSubscription && (
                          <ThemedText style={[styles.hint, { marginTop: 8, color: tintColor }]}>
                            Options above 5 require subscription
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No {isDLI ? 'courses' : 'subjects'} available for {selection.examType} {isDLI ? 'past questions' : selection.questionMode === 'practice' ? 'practice' : 'past questions'}
              </ThemedText>
            </View>
          )}
        </View>

        {selection.subjects.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>
                Selected {isDLI ? 'Course' : isJAMB ? 'Subjects' : 'Subject'}:
              </ThemedText>
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

      <View style={styles.footer}>
        <Button
          title={`Continue (${selection.subjects.length} ${isDLI ? 'course' : selection.subjects.length === 1 ? 'subject' : 'subjects'})`}
          onPress={handleContinue}
          disabled={selection.subjects.length === 0}
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
