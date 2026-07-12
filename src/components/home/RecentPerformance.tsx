import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/ThemedText";
import { Fonts } from "@/constants/Fonts";

interface RecentAttempt {
  uuid?: string;
  id?: number;
  exam_title: string;
  score: number;
  percentage: number;
  completed_at: string;
}

interface RecentPerformanceProps {
  attempts: RecentAttempt[];
}

interface PerformanceCopy {
  label: string;
  title: string;
  message: string;
  tone: "excellent" | "good" | "fair" | "low" | "none";
}

function getPerformanceCopy(
  latest: RecentAttempt,
  previous?: RecentAttempt
): PerformanceCopy {
  const pct = latest.percentage;

  let copy: PerformanceCopy;

  if (pct >= 100) {
    copy = {
      label: "Perfect score",
      title: latest.exam_title,
      message: "You mastered every question in your last session.",
      tone: "excellent",
    };
  } else if (pct >= 70) {
    copy = {
      label: "Strong performance",
      title: latest.exam_title,
      message: `You scored ${pct.toFixed(0)}% — solid work. Keep the momentum going.`,
      tone: "good",
    };
  } else if (pct >= 40) {
    copy = {
      label: "Keep practicing",
      title: latest.exam_title,
      message: `You scored ${pct.toFixed(0)}%. Review your corrections and try another session.`,
      tone: "fair",
    };
  } else if (pct > 0) {
    copy = {
      label: "Room to improve",
      title: latest.exam_title,
      message: `You scored ${pct.toFixed(0)}%. Focus on weak topics and practice again.`,
      tone: "low",
    };
  } else {
    copy = {
      label: "Try again",
      title: latest.exam_title,
      message:
        "You scored 0% on your last session. Review the material and give it another shot.",
      tone: "none",
    };
  }

  const latestKey = latest.uuid ?? latest.id;
  const previousKey = previous?.uuid ?? previous?.id;

  if (previous && previousKey !== latestKey) {
    const diff = pct - previous.percentage;

    if (diff > 0) {
      copy.message += ` That's up ${diff.toFixed(0)}% from your previous ${previous.percentage.toFixed(0)}%.`;
    } else if (diff < 0) {
      copy.message += ` That's down ${Math.abs(diff).toFixed(0)}% from your previous ${previous.percentage.toFixed(0)}%.`;
    } else {
      copy.message += ` Same as your previous attempt (${previous.percentage.toFixed(0)}%).`;
    }
  }

  return copy;
}

const toneStyles = {
  excellent: {
    icon: "emoji-events" as const,
    iconColor: "#4800b2",
    ringBorder: "rgba(72, 0, 178, 0.2)",
    ringBg: "rgba(72, 0, 178, 0.1)",
    labelColor: "#4800b2",
  },
  good: {
    icon: "trending-up" as const,
    iconColor: "#4800b2",
    ringBorder: "rgba(72, 0, 178, 0.2)",
    ringBg: "rgba(72, 0, 178, 0.1)",
    labelColor: "#4800b2",
  },
  fair: {
    icon: "gps-fixed" as const,
    iconColor: "#d97706",
    ringBorder: "rgba(245, 158, 11, 0.2)",
    ringBg: "rgba(245, 158, 11, 0.1)",
    labelColor: "#d97706",
  },
  low: {
    icon: "trending-down" as const,
    iconColor: "#d97706",
    ringBorder: "rgba(245, 158, 11, 0.2)",
    ringBg: "rgba(245, 158, 11, 0.1)",
    labelColor: "#d97706",
  },
  none: {
    icon: "trending-down" as const,
    iconColor: "#615b6e",
    ringBorder: "#e2e2e4",
    ringBg: "rgba(243, 243, 245, 0.8)",
    labelColor: "#615b6e",
  },
};

export function RecentPerformance({ attempts }: RecentPerformanceProps) {
  if (!attempts.length) return null;

  const latest = attempts[0];
  const previous = attempts[1];
  const copy = getPerformanceCopy(latest, previous);
  const tone = toneStyles[copy.tone];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View
          style={[
            styles.iconRing,
            {
              borderColor: tone.ringBorder,
              backgroundColor: tone.ringBg,
            },
          ]}
        >
          <MaterialIcons name={tone.icon} size={28} color={tone.iconColor} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.label, { color: tone.labelColor }]}>
            {copy.label}
          </ThemedText>
          <ThemedText style={styles.title} numberOfLines={1}>
            {copy.title}
          </ThemedText>
          <ThemedText style={styles.caption} numberOfLines={3}>
            {copy.message}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f3f3f5",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#e2e2e4",
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.primary.medium,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  title: {
    fontSize: 14,
    color: "#1a1c1d",
    fontFamily: Fonts.primary.bold,
  },
  caption: {
    fontSize: 12,
    color: "#615b6e",
    fontFamily: Fonts.primary.regular,
    lineHeight: 16,
    marginTop: 4,
  },
});
