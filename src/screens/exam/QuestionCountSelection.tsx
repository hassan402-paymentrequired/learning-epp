import React, { useState } from 'react';
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

export function QuestionCountSelection() {
  const { selection, setQuestionCount } = useExamSelection();
  const navigation = useNavigation();
  const [count, setCount] = useState<string>('');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'card');

  const quickOptions = [10, 20, 30, 40, 50];

  const handleContinue = () => {
    const numCount = parseInt(count);
    
    if (!count || isNaN(numCount) || numCount < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of questions (minimum 1)');
      return;
    }

    if (numCount > 100) {
      Alert.alert('Too Many Questions', 'Maximum allowed is 100 questions per session');
      return;
    }

    setQuestionCount(numCount);
    // @ts-ignore
    navigation.navigate('TimeSelection');
  };

  const handleQuickSelect = (value: number) => {
    setCount(value.toString());
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Number of Questions">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Number of Questions
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            How many questions would you like to attempt?
          </ThemedText>
        </View>

        <View style={[styles.inputCard, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.inputLabel}>Enter number of questions</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: tintColor }]}
            value={count}
            onChangeText={setCount}
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
                    backgroundColor: count === value.toString() ? tintColor : cardBackground,
                    borderColor: tintColor,
                  }
                ]}
                onPress={() => handleQuickSelect(value)}
              >
                <ThemedText
                  style={[
                    styles.quickOptionText,
                    { color: count === value.toString() ? '#fff' : undefined }
                  ]}
                >
                  {value}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
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
    marginBottom: 32,
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
  inputCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    opacity: 0.6,
  },
  quickOptionsContainer: {
    marginBottom: 32,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickOption: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickOptionText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  continueButton: {
    marginTop: 'auto',
  },
});
