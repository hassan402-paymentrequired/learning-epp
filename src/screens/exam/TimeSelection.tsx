import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function TimeSelection() {
  const { selection, setTimeMinutes } = useExamSelection();
  const navigation = useNavigation();
  const [minutes, setMinutes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "backgroundSecondary");

  const quickOptions = [30, 60, 90, 120];

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ""}`;
    }
    return `${mins}m`;
  };

  const handleStartExam = async () => {
    const numMinutes = parseInt(minutes);

    if (!minutes || isNaN(numMinutes) || numMinutes < 1) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid duration (minimum 1 minute)"
      );
      return;
    }

    if (numMinutes > 120) {
      Alert.alert(
        "Time Limit Exceeded",
        "Maximum allowed time is 120 minutes (2 hours)"
      );
      return;
    }

    setTimeMinutes(numMinutes);

    // Find matching exam
    try {
      setLoading(true);

      const examResponse = await api.get("/exams", {
        params: {
          exam_type: selection.examType,
          type: selection.questionMode,
          subject: selection.subject,
        },
      });

      if (!examResponse.data.success || examResponse.data.data.length === 0) {
        Alert.alert(
          "No Exam Found",
          "No exam matches your selection. Please try different options."
        );
        return;
      }

      // Get the first matching exam
      const exam = examResponse.data.data[0];

      // Get questions for the exam
      const questionsResponse = await api.get(`/exams/${exam.id}/questions`);

      if (!questionsResponse.data.success) {
        Alert.alert("Error", "Failed to load questions. Please try again.");
        return;
      }

      const questionsData = questionsResponse.data.data;
      const allQuestions = questionsData.questions || [];

      // Limit questions to selected count
      const limitedQuestions = allQuestions.slice(
        0,
        selection.questionCount || allQuestions.length
      );

      // Start exam attempt
      const attemptResponse = await api.post(`/exams/${exam.id}/start`);

      if (!attemptResponse.data.success) {
        Alert.alert("Error", "Failed to start exam. Please try again.");
        return;
      }

      const attempt = attemptResponse.data.data.attempt;

      // Navigate to exam screen
      // @ts-ignore
      navigation.navigate("ExamScreen", {
        attemptId: attempt.id,
        examId: exam.id,
        questions: limitedQuestions,
        exam: questionsData.exam,
        timeMinutes: numMinutes,
      });
    } catch (error: any) {
      console.error("Error starting exam:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to start exam. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (value: number) => {
    setMinutes(value.toString());
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Exam Duration">
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
            <ThemedText style={styles.inputLabel}>
              Enter duration (minutes)
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, { borderColor: tintColor }]}
            value={minutes}
            onChangeText={setMinutes}
            placeholder="e.g., 60"
            keyboardType="number-pad"
            placeholderTextColor={useThemeColor({}, "placeholder")}
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
                    backgroundColor:
                      minutes === value.toString() ? tintColor : cardBackground,
                    borderColor: tintColor,
                  },
                ]}
                onPress={() => handleQuickSelect(value)}
              >
                <ThemedText
                  style={[
                    styles.quickOptionText,
                    {
                      color: minutes === value.toString() ? "#fff" : undefined,
                    },
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
            <ThemedText style={styles.summaryValue}>
              {selection.examType}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subject:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subject}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Mode:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.questionMode === "practice"
                ? "Practice"
                : "Past Questions"}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Questions:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.questionCount}
            </ThemedText>
          </View>
          {minutes && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Duration:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatTime(parseInt(minutes) || 0)}
              </ThemedText>
            </View>
          )}
        </View>

        <Button
          title={loading ? "Starting..." : "Start Exam"}
          onPress={handleStartExam}
          style={styles.startButton}
          disabled={loading}
          loading={loading}
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
    fontWeight: "bold",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "600",
    marginBottom: 16,
  },
  quickOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickOption: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  quickOptionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  summaryLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  startButton: {
    marginTop: "auto",
  },
});
