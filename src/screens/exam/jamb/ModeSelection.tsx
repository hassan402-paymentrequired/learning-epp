import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/useThemeColor";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function JAMBModeSelection() {
  const { setQuestionMode } = useExamSelection();
  const navigation = useNavigation();
  const tintColor = useThemeColor({}, "tint");

  const handleSelectMode = (mode: "past_question" | "practice") => {
    setQuestionMode(mode);
    if (mode === "past_question") {
      // @ts-ignore
      navigation.navigate("JAMBPastQuestionsSelection");
    } else {
      // @ts-ignore
      navigation.navigate("JAMBPracticeQuestionsSelection");
    }
  };

  return (
    <AppLayout showBackButton={true} headerTitle="JAMB Practice">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Question Mode
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose how you want to practice JAMB questions
          </ThemedText>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectMode("past_question")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[tintColor, tintColor + "DD"]}
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
                Practice with previous JAMB exam questions
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectMode("practice")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[tintColor, tintColor + "DD"]}
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
                Practice with random questions (max 4 sessions per subject)
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
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradient: {
    padding: 32,
    alignItems: "center",
    minHeight: 180,
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
