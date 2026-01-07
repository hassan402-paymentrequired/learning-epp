import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

export function YearSelection() {
  const { selection, setSelectedYear } = useExamSelection();
  const navigation = useNavigation();
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setLocalSelectedYear] = useState<number | null>(
    selection.selectedYear
  );

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "backgroundSecondary");

  useEffect(() => {
    loadAvailableYears();
  }, []);

  const loadAvailableYears = async () => {
    try {
      setLoading(true);
      const response = await api.get("/exams/years", {
        params: {
          exam_type: selection.examType,
          type: "past_question",
          subject: selection.subjects[0], // Get years for first subject (or all if not specified)
        },
      });

      if (response.data.success) {
        setYears(response.data.data);
      } else {
        Alert.alert("Error", "Failed to load available years. Please try again.");
      }
    } catch (error: any) {
      console.error("Error loading years:", error);
      Alert.alert("Error", "Failed to load available years. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedYear) {
      Alert.alert("No Year Selected", "Please select a year to continue.");
      return;
    }

    setSelectedYear(selectedYear);
    // @ts-ignore
    navigation.navigate("TimeSelection");
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Select Year">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading years...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Select Year">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Year
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose the year of past questions you want to practice
          </ThemedText>
          <ThemedText style={styles.hint}>
            {selection.examType} • {selection.subjects.join(", ")}
          </ThemedText>
        </View>

        {years.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="calendar-today" size={48} color={textColor} />
            <ThemedText style={styles.emptyText}>
              No past questions available for the selected criteria
            </ThemedText>
          </View>
        ) : (
          <View style={styles.yearsContainer}>
            {years.map((year) => {
              const isSelected = selectedYear === year;
              return (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearCard,
                    {
                      backgroundColor: isSelected
                        ? tintColor
                        : cardBackground,
                      borderColor: isSelected ? tintColor : borderColor,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setLocalSelectedYear(year)}
                  activeOpacity={0.7}
                >
                  <View style={styles.yearContent}>
                    <MaterialIcons
                      name="calendar-today"
                      size={24}
                      color={isSelected ? "#fff" : tintColor}
                    />
                    <ThemedText
                      style={[
                        styles.yearText,
                        { color: isSelected ? "#fff" : textColor },
                      ]}
                    >
                      {year}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
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
            <ThemedText style={styles.summaryValue}>Past Questions</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subjects:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.join(", ")}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Questions:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {selection.subjects.reduce((sum, subject) => {
                return sum + (selection.questionCounts[subject] || 0);
              }, 0)}
            </ThemedText>
          </View>
          {selectedYear && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Year:</ThemedText>
              <ThemedText style={styles.summaryValue}>{selectedYear}</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={selectedYear ? `Continue with ${selectedYear}` : "Select Year to Continue"}
          onPress={handleContinue}
          disabled={!selectedYear}
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
    justifyContent: "center",
    alignItems: "center",
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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 16,
  },
  yearsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  yearCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  yearContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  yearText: {
    fontSize: 20,
    fontWeight: "600",
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
    borderBottomColor: "#E5E7EB",
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
