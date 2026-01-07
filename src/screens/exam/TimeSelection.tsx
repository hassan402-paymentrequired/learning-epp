import React, { useState, useEffect } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function TimeSelection() {
  const { selection, setTimeMinutes } = useExamSelection();
  const navigation = useNavigation();
  const [minutes, setMinutes] = useState<string>("");
  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "backgroundSecondary");

  // Calculate default time based on number of subjects (30 min per subject)
  const defaultMinutes = selection.subjects.length * 30;
  const maxMinutes = selection.subjects.length * 30; // Max is 30 min per subject

  useEffect(() => {
    // Set default time when component mounts
    if (!minutes && defaultMinutes > 0) {
      setMinutes(defaultMinutes.toString());
    }
  }, [defaultMinutes, minutes]);

  const quickOptions =
    selection.subjects.length === 1
      ? [30]
      : selection.subjects.length === 2
      ? [60]
      : selection.subjects.length === 3
      ? [90]
      : [120]; // For 4 subjects

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ""}`;
    }
    return `${mins}m`;
  };

  const handleContinue = () => {
    const numMinutes = parseInt(minutes);

    if (!minutes || isNaN(numMinutes) || numMinutes < 1) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid duration (minimum 1 minute)"
      );
      return;
    }

    if (numMinutes > maxMinutes) {
      Alert.alert(
        "Time Limit Exceeded",
        `Maximum allowed time is ${maxMinutes} minutes (${formatTime(
          maxMinutes
        )}) for ${selection.subjects.length} ${
          selection.subjects.length === 1 ? "subject" : "subjects"
        }`
      );
      return;
    }

    setTimeMinutes(numMinutes);
    // @ts-ignore
    navigation.navigate("QuestionCountSelection");
  };

  const handleQuickSelect = (value: number) => {
    setMinutes(value.toString());
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Select Duration">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Duration
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {selection.subjects.length === 1
              ? `Each subject takes 30 minutes`
              : `You've selected ${selection.subjects.length} subjects. Each subject takes 30 minutes.`}
          </ThemedText>
          <ThemedText style={styles.hint}>
            Total time: {formatTime(maxMinutes)} ({selection.subjects.length} ×
            30 minutes)
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
            placeholder={`e.g., ${defaultMinutes}`}
            keyboardType="number-pad"
            placeholderTextColor={useThemeColor({}, "placeholder")}
          />
          <ThemedText style={styles.hint}>
            Minimum: 1 minute, Maximum: {maxMinutes} minutes (
            {formatTime(maxMinutes)})
          </ThemedText>
        </View>

        {quickOptions.length > 0 && (
          <View style={styles.quickOptionsContainer}>
            <ThemedText style={styles.quickOptionsTitle}>
              Quick Select
            </ThemedText>
            <View style={styles.quickOptionsGrid}>
              {quickOptions.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.quickOption,
                    {
                      backgroundColor:
                        minutes === value.toString()
                          ? tintColor
                          : cardBackground,
                      borderColor: tintColor,
                    },
                  ]}
                  onPress={() => handleQuickSelect(value)}
                >
                  <ThemedText
                    style={[
                      styles.quickOptionText,
                      {
                        color:
                          minutes === value.toString() ? "#fff" : undefined,
                      },
                    ]}
                  >
                    {formatTime(value)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Type:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.examType}
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
            <ThemedText style={styles.summaryLabel}>Subjects:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.join(", ")}
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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={
            !minutes || parseInt(minutes) < 1 || parseInt(minutes) > maxMinutes
          }
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
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
    fontStyle: "italic",
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
});
