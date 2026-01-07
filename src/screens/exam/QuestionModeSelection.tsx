import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function QuestionModeSelection() {
  const { selection, setQuestionMode, getPracticeSessionCount } = useExamSelection();
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const practiceCount = selection.subject ? getPracticeSessionCount(selection.subject) : 0;
  const canPractice = practiceCount < 4;

  const handleSelectMode = (mode: 'past_question' | 'practice') => {
    if (mode === 'practice' && !canPractice) {
      Alert.alert(
        'Practice Limit Reached',
        `You have already completed ${practiceCount} practice sessions for ${selection.subject}. Maximum allowed is 4 sessions per subject.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setQuestionMode(mode);
    // @ts-ignore
    navigation.navigate('QuestionCountSelection');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Question Mode
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose how you want to practice {selection.subject}
          </ThemedText>
        </View>

        {!canPractice && (
          <View style={[styles.warningCard, { backgroundColor: '#FFF3CD' }]}>
            <MaterialIcons name="warning" size={20} color="#856404" />
            <ThemedText style={[styles.warningText, { color: '#856404' }]}>
              You have reached the maximum of 4 practice sessions for {selection.subject}. 
              Please select Past Questions instead.
            </ThemedText>
          </View>
        )}

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
            style={[styles.optionCard, !canPractice && styles.disabledCard]}
            onPress={() => handleSelectMode('practice')}
            activeOpacity={0.8}
            disabled={!canPractice}
          >
            <LinearGradient
              colors={canPractice ? [tintColor, tintColor + 'DD'] : ['#999', '#777']}
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
                {canPractice 
                  ? `Practice mode (${practiceCount}/4 sessions used)`
                  : 'Practice limit reached (4/4 sessions)'
                }
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
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
});
