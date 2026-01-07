import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AppLayout } from '@/components/AppLayout';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function QuestionModeSelection() {
  const { selection, setQuestionMode } = useExamSelection();
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  
  // DLI can only practice past questions
  const isDLI = selection.examType === 'DLI';

  const handleSelectMode = (mode: 'past_question' | 'practice') => {
    setQuestionMode(mode);
    // @ts-ignore
    navigation.navigate('SubjectSelection');
  };
  
  // For DLI, automatically select past_question mode and navigate
  React.useEffect(() => {
    if (isDLI && !selection.questionMode) {
      setQuestionMode('past_question');
      // @ts-ignore
      navigation.navigate('SubjectSelection');
    }
  }, [isDLI, selection.questionMode, setQuestionMode, navigation]);
  
  // If DLI, don't show this screen - redirect will happen via useEffect
  if (isDLI) {
    return (
      <AppLayout showBackButton={true} headerTitle="Question Mode">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Question Mode">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Question Mode
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose how you want to practice {selection.examType} questions
          </ThemedText>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectMode('past_question')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[tintColor, tintColor + 'DD']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="description" size={40} color="#fff" />
              </View>
              <ThemedText type="subtitle" style={styles.optionTitle}>
                Past Questions
              </ThemedText>
              <ThemedText style={styles.optionDescription}>
                Practice with previous exam questions
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectMode('practice')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[tintColor, tintColor + 'DD']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="menu-book" size={40} color="#fff" />
              </View>
              <ThemedText type="subtitle" style={styles.optionTitle}>
                Practice Questions
              </ThemedText>
              <ThemedText style={styles.optionDescription}>
                Practice mode (max 4 sessions per subject)
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
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
  warningCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  disabledCard: {
    opacity: 0.6,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
