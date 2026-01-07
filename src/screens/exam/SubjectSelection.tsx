import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
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
    setSubjects,
    canAddMoreSubjects,
    getMaxSubjects,
  } = useExamSelection();
  const navigation = useNavigation();
  const [subjects, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    loadSubjects();
  }, [selection.examType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/subjects', {
        params: {
          exam_type: selection.examType,
          type: selection.questionMode === 'practice' ? 'practice' : 'past_question',
        },
      });
      
      if (response.data.success) {
        setSubjectsList(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      // Fallback to common subjects if API fails
      setSubjectsList([
        'Mathematics',
        'English',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Government',
        'Literature',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubject = (subject: string) => {
    if (selection.subjects.includes(subject)) {
      removeSubject(subject);
    } else {
      if (canAddMoreSubjects()) {
        addSubject(subject);
      } else {
        Alert.alert(
          'Maximum Subjects Reached',
          `You can select a maximum of ${getMaxSubjects()} ${getMaxSubjects() === 1 ? 'subject' : 'subjects'} for ${selection.examType} practice.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleContinue = () => {
    if (selection.subjects.length === 0) {
      Alert.alert(
        'No Subject Selected',
        'Please select at least one subject to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    // @ts-ignore
    navigation.navigate('TimeSelection');
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

  return (
    <AppLayout showBackButton={true} headerTitle="Select Subjects">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select {isJAMB ? 'Subjects' : 'Subject'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isJAMB 
              ? `Choose up to ${maxSubjects} subjects to practice (${selection.subjects.length}/${maxSubjects} selected)`
              : 'Choose the subject you want to practice'
            }
          </ThemedText>
          {isJAMB && (
            <ThemedText style={styles.hint}>
              Each subject takes 30 minutes. Total time will be calculated automatically.
            </ThemedText>
          )}
        </View>

        <View style={styles.subjectsContainer}>
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              const isSelected = selection.subjects.includes(subject);
              return (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectCard,
                    {
                      backgroundColor: isSelected ? tintColor + '20' : cardBackground,
                      borderColor: isSelected ? tintColor : borderColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => handleToggleSubject(subject)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectContent}>
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
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={24} color={tintColor} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No subjects available for {selection.examType} {selection.questionMode === 'practice' ? 'practice' : 'past questions'}
              </ThemedText>
            </View>
          )}
        </View>

        {selection.subjects.length > 0 && (
          <View style={styles.selectedContainer}>
            <ThemedText style={styles.selectedTitle}>Selected Subjects:</ThemedText>
            <View style={styles.selectedTags}>
              {selection.subjects.map((subject) => (
                <View
                  key={subject}
                  style={[styles.tag, { backgroundColor: tintColor }]}
                >
                  <ThemedText style={styles.tagText}>{subject}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Continue (${selection.subjects.length} ${selection.subjects.length === 1 ? 'subject' : 'subjects'})`}
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
    paddingBottom: 100, // Space for footer button
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
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  selectedContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
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
