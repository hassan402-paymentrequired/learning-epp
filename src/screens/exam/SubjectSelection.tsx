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
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function SubjectSelection() {
  const { selection, setSubject } = useExamSelection();
  const navigation = useNavigation();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'card');

  useEffect(() => {
    loadSubjects();
  }, [selection.examType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/subjects', {
        params: {
          exam_type: selection.examType,
          type: 'practice', // For now, we'll get practice subjects
        },
      });
      
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      // Fallback to common subjects if API fails
      setSubjects([
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

  const handleSelectSubject = (subject: string) => {
    setSubject(subject);
    // @ts-ignore
    navigation.navigate('QuestionModeSelection');
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading subjects...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Subject
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose the subject you want to practice
          </ThemedText>
        </View>

        <View style={styles.subjectsContainer}>
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[styles.subjectCard, { backgroundColor: cardBackground }]}
                onPress={() => handleSelectSubject(subject)}
                activeOpacity={0.7}
              >
                <View style={styles.subjectContent}>
                  <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
                    <MaterialIcons name="menu-book" size={24} color={tintColor} />
                  </View>
                  <View style={styles.subjectInfo}>
                    <ThemedText type="subtitle" style={styles.subjectName}>
                      {subject}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={tintColor} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No subjects available for {selection.examType} practice
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
});
