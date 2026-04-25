import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Fonts } from "@/constants/Fonts";

const { width } = Dimensions.get("window");

export function StandardModeSelection() {
  const { setQuestionMode, selection } = useExamSelection();
  const navigation = useNavigation();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  const handleSelectMode = (mode: "past_question" | "practice") => {
    setQuestionMode(mode);
    if (mode === "past_question") {
      // @ts-ignore
      navigation.navigate("StandardPastQuestionsSelection");
    } else {
      // @ts-ignore
      navigation.navigate("StandardPracticeQuestionsSelection");
    }
  };

  const examTypeLabel = selection.examTypeName || "Exam";

  return (
    <AppLayout showBackButton={true} headerTitle="Practice mode">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Choose Your Mode
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Select how you'd like to prepare for your upcoming {examTypeLabel} examination.
          </ThemedText>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.modeCard, { backgroundColor: cardBg, borderColor: borderColor }]}
            onPress={() => handleSelectMode("past_question")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: tintColor + "15" }]}>
              <MaterialIcons name="history-edu" size={32} color={tintColor} />
            </View>
            <View style={styles.modeContent}>
              <ThemedText style={styles.modeTitle}>Past Questions</ThemedText>
              <ThemedText style={styles.modeDesc}>
                Take a complete {examTypeLabel} paper from a specific year. Best for simulation.
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, { backgroundColor: cardBg, borderColor: borderColor }]}
            onPress={() => handleSelectMode("practice")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#8B5CF6" + "15" }]}>
              <MaterialIcons name="auto-awesome" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.modeContent}>
              <ThemedText style={styles.modeTitle}>Study Mode</ThemedText>
              <ThemedText style={styles.modeDesc}>
                Practice with a random mix of questions. Limit of 4 sessions per subject.
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoSection, { backgroundColor: tintColor + "08" }]}>
            <MaterialIcons name="info-outline" size={20} color={tintColor} />
            <ThemedText style={styles.infoText}>
                Study mode helps you master specific topics through randomized repetition.
            </ThemedText>
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
    marginBottom: 40,
  },
  badge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B5CF6",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
     fontSize: 24,
        fontFamily: Fonts.primary.bold,
        color: '#4800b2',
        marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.6,
  },
  optionsContainer: {
    gap: 16,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 8,
    borderWidth: 1,
  },
  iconBox: {
    width: 70,
    height:70,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modeContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  modeTitle: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: Fonts.primary.bold,
  },
  modeDesc: {
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 20,
    fontFamily: Fonts.primary.regular,
  },
  infoSection: {
      marginTop: 40,
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
  },
  infoText: {
      flex: 1,
      fontSize: 13,
      opacity: 0.7,
      lineHeight: 18
  }
});
