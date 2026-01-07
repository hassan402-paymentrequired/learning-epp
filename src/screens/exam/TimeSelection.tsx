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
import { Button } from '@/components/ui/Button';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function TimeSelection() {
  const { selection, setTimeMinutes } = useExamSelection();
  const navigation = useNavigation();
  const [minutes, setMinutes] = useState<string>('');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'card');

  const quickOptions = [30, 60, 90, 120];

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const handleStartExam = () => {
    const numMinutes = parseInt(minutes);
    
    if (!minutes || isNaN(numMinutes) || numMinutes < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid duration (minimum 1 minute)');
      return;
    }

    if (numMinutes > 120) {
      Alert.alert('Time Limit Exceeded', 'Maximum allowed time is 120 minutes (2 hours)');
      return;
    }

    setTimeMinutes(numMinutes);
    // TODO: Navigate to exam screen
    Alert.alert(
      'Ready to Start',
      `Starting exam with:\n\n` +
      `Exam Type: ${selection.examType}\n` +
      `Subject: ${selection.subject}\n` +
      `Mode: ${selection.questionMode === 'practice' ? 'Practice' : 'Past Questions'}\n` +
      `Questions: ${selection.questionCount}\n` +
      `Duration: ${formatTime(numMinutes)}\n\n` +
      `Exam screen will be implemented next.`
    );
  };

  const handleQuickSelect = (value: number) => {
    setMinutes(value.toString());
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Exam Duration
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            How much time do you want for this exam?
          </ThemedText>
        </View>

        <View style={[styles.inputCard, { backgroundColor: cardBackground }]}>
          <View style={styles.inputHeader}>
            <MaterialIcons name="access-time" size={24} color={tintColor} />
            <ThemedText style={styles.inputLabel}>Enter duration (minutes)</ThemedText>
          </View>
          <TextInput
            style={[styles.input, { borderColor: tintColor }]}
            value={minutes}
            onChangeText={setMinutes}
            placeholder="e.g., 60"
            keyboardType="number-pad"
            placeholderTextColor={useThemeColor({}, 'placeholder')}
          />
          <ThemedText style={styles.hint}>
            Maximum: 120 minutes (2 hours)
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
                    backgroundColor: minutes === value.toString() ? tintColor : cardBackground,
                    borderColor: tintColor,
                  }
                ]}
                onPress={() => handleQuickSelect(value)}
              >
                <ThemedText
                  style={[
                    styles.quickOptionText,
                    { color: minutes === value.toString() ? '#fff' : undefined }
                  ]}
                >
                  {formatTime(value)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.summaryTitle}>Exam Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Type:</ThemedText>
            <ThemedText style={styles.summaryValue}>{selection.examType}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subject:</ThemedText>
            <ThemedText style={styles.summaryValue}>{selection.subject}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Mode:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.questionMode === 'practice' ? 'Practice' : 'Past Questions'}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Questions:</ThemedText>
            <ThemedText style={styles.summaryValue}>{selection.questionCount}</ThemedText>
          </View>
          {minutes && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Duration:</ThemedText>
              <ThemedText style={styles.summaryValue}>{formatTime(parseInt(minutes) || 0)}</ThemedText>
            </View>
          )}
        </View>

        <Button
          title="Start Exam"
          onPress={handleStartExam}
          style={styles.startButton}
        />
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
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 24,
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
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickOptionText: {
    fontSize: 16,
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
  startButton: {
    marginTop: 'auto',
  },
});
