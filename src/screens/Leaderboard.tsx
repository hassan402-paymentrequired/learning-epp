import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Fonts } from "@/constants/Fonts";

type LeaderboardEntry = {
  rank: number;
  user: {
    uuid: string;
    name: string;
    email: string;
  };
  statistics: {
    total_score: number;
    total_attempts: number;
    average_score: number;
    highest_score: number;
    total_correct: number;
    total_questions: number;
    accuracy: number;
  };
};

type LeaderboardType = "all_time" | "monthly" | "weekly";
type ExamType = "JAMB" | "DLI" | "UNILAG" | "GENERAL" | null;

const periodOptions: { label: string; value: LeaderboardType }[] = [
  { label: "All Time", value: "all_time" },
  { label: "Month", value: "monthly" },
  { label: "Week", value: "weekly" },
];

const examTypeOptions: { label: string; value: ExamType }[] = [
  { label: "All", value: null },
  { label: "JAMB", value: "JAMB" },
  { label: "DLI", value: "DLI" },
  { label: "UNILAG", value: "UNILAG" },
  { label: "GENERAL", value: "GENERAL" },
];

const MEDAL_COLORS = {
  1: "#D4A017",
  2: "#8A8F98",
  3: "#B87333",
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function entryKey(entry: LeaderboardEntry): string {
  return entry.user.uuid || entry.user.email;
}

export function Leaderboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [type, setType] = useState<LeaderboardType>("all_time");
  const [examType, setExamType] = useState<ExamType>(null);

  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "cardBackground");

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (examType) params.append("exam_type", examType);

      const response = await api.get(`/leaderboard?${params.toString()}`);
      if (response.data.success) {
        setLeaderboard(response.data.data.leaderboard || []);
        setUserRank(response.data.data.current_user || null);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetch on open and when returning from practice so ranks stay current.
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [type, examType])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    if (userRank?.user?.uuid && entry.user.uuid) {
      return entry.user.uuid === userRank.user.uuid;
    }
    if (user?.email) {
      return entry.user.email === user.email;
    }
    return false;
  };

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  const podiumOrder = useMemo(() => {
    const byRank = (rank: number) => topThree.find((e) => e.rank === rank);
    return [byRank(2), byRank(1), byRank(3)] as const;
  }, [topThree]);

  const renderPodiumColumn = (
    entry: LeaderboardEntry | undefined,
    place: 1 | 2 | 3
  ) => {
    const isFirst = place === 1;
    const height = isFirst ? 88 : place === 2 ? 64 : 52;
    const medal = MEDAL_COLORS[place];

    return (
      <View style={[styles.podiumCol, isFirst && styles.podiumColFirst]}>
        {entry ? (
          <>
            <View
              style={[
                styles.avatar,
                isFirst && styles.avatarFirst,
                {
                  borderColor: medal,
                  backgroundColor: isFirst ? tintColor + "18" : cardBackground,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.avatarText,
                  isFirst && styles.avatarTextFirst,
                  { color: isFirst ? tintColor : textColor },
                ]}
              >
                {getInitials(entry.user.name)}
              </ThemedText>
            </View>
            <MaterialIcons
              name="emoji-events"
              size={isFirst ? 22 : 18}
              color={medal}
              style={styles.medalIcon}
            />
            <ThemedText
              style={[styles.podiumName, isFirst && styles.podiumNameFirst]}
              numberOfLines={1}
            >
              {entry.user.name}
            </ThemedText>
            <ThemedText style={[styles.podiumPoints, { color: tintColor }]}>
              {entry.statistics.total_score.toLocaleString()}
            </ThemedText>
          </>
        ) : (
          <View style={styles.podiumEmptySlot}>
            <ThemedText style={styles.podiumEmptyText}>—</ThemedText>
          </View>
        )}
        <View
          style={[
            styles.podiumStand,
            {
              height,
              backgroundColor: isFirst ? tintColor : tintColor + "22",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.podiumPlace,
              { color: isFirst ? "#FFFFFF" : tintColor },
            ]}
          >
            {place}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderRow = (entry: LeaderboardEntry) => {
    const mine = isCurrentUser(entry);
    return (
      <View
        key={entryKey(entry)}
        style={[
          styles.row,
          { borderBottomColor: borderColor },
          mine && { backgroundColor: tintColor + "0D" },
        ]}
      >
        <View
          style={[
            styles.rankCircle,
            {
              borderColor: mine ? tintColor : borderColor,
              backgroundColor: cardBackground,
            },
          ]}
        >
          <ThemedText
            style={[styles.rankCircleText, mine && { color: tintColor }]}
          >
            {entry.rank}
          </ThemedText>
        </View>
        <View style={styles.rowInfo}>
          <View style={styles.rowNameRow}>
            <ThemedText
              style={[styles.rowName, mine && { color: tintColor }]}
              numberOfLines={1}
            >
              {entry.user.name}
            </ThemedText>
            {mine && (
              <View style={[styles.youChip, { backgroundColor: tintColor + "18" }]}>
                <ThemedText style={[styles.youChipText, { color: tintColor }]}>
                  You
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.rowStats}>
          <ThemedText style={styles.rowPoints}>
            {entry.statistics.total_score.toLocaleString()}
          </ThemedText>
          {entry.statistics.accuracy > 0 && (
            <ThemedText style={styles.rowAccuracy}>
              {entry.statistics.accuracy.toFixed(0)}%
            </ThemedText>
          )}
        </View>
      </View>
    );
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Leaderboard">
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.filtersBlock, { borderBottomColor: borderColor }]}>
          <View style={[styles.segment, { backgroundColor: cardBackground, borderColor }]}>
            {periodOptions.map((option) => {
              const selected = type === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentItem,
                    selected && { backgroundColor: tintColor },
                  ]}
                  onPress={() => setType(option.value)}
                  activeOpacity={0.85}
                >
                  <ThemedText
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examChips}
          >
            {examTypeOptions.map((option) => {
              const selected = examType === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.examChip,
                    {
                      borderColor: selected ? tintColor : borderColor,
                      backgroundColor: selected ? tintColor : "transparent",
                    },
                  ]}
                  onPress={() => setExamType(option.value)}
                  activeOpacity={0.85}
                >
                  <ThemedText
                    style={[
                      styles.examChipText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>Loading performers...</ThemedText>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {leaderboard.length === 0 ? (
                <View style={[styles.emptyContainer, { borderColor }]}>
                  <MaterialIcons
                    name="emoji-events"
                    size={40}
                    color={textColor}
                    style={{ opacity: 0.3 }}
                  />
                  <ThemedText style={styles.emptyText}>
                    No rankings for this period yet
                  </ThemedText>
                  <ThemedText
                    style={[styles.emptySubtext, { color: textColor }]}
                  >
                    Start practicing to see your name here!
                  </ThemedText>
                </View>
              ) : (
                <>
                  {topThree.length > 0 && (
                    <View style={styles.podium}>
                      {renderPodiumColumn(podiumOrder[0], 2)}
                      {renderPodiumColumn(podiumOrder[1], 1)}
                      {renderPodiumColumn(podiumOrder[2], 3)}
                    </View>
                  )}

                  {rest.length > 0 && (
                    <View style={styles.listSection}>
                      <ThemedText style={styles.sectionLabel}>
                        Rankings
                      </ThemedText>
                      <View
                        style={[
                          styles.listCard,
                          { backgroundColor: cardBackground, borderColor },
                        ]}
                      >
                        {rest.map(renderRow)}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {userRank && (
              <View
                style={[
                  styles.stickyYou,
                  {
                    backgroundColor: cardBackground,
                    borderTopColor: borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stickyRank,
                    { backgroundColor: tintColor + "18" },
                  ]}
                >
                  <ThemedText style={[styles.stickyRankText, { color: tintColor }]}>
                    #{userRank.rank}
                  </ThemedText>
                </View>
                <View style={styles.stickyInfo}>
                  <ThemedText style={styles.stickyName} numberOfLines={1}>
                    You
                  </ThemedText>
                  <ThemedText style={styles.stickyMeta} numberOfLines={1}>
                    {userRank.statistics.total_score.toLocaleString()} pts
                    {userRank.statistics.accuracy > 0
                      ? ` · ${userRank.statistics.accuracy.toFixed(0)}%`
                      : ""}
                  </ThemedText>
                </View>
                <MaterialIcons name="person" size={20} color={tintColor} />
              </View>
            )}
          </>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontFamily: Fonts.primary.medium,
  },
  segmentTextSelected: {
    color: "#FFFFFF",
    fontFamily: Fonts.primary.semiBold,
  },
  examChips: {
    gap: 8,
    paddingRight: 8,
  },
  examChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  examChipText: {
    fontSize: 13,
    fontFamily: Fonts.primary.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.5,
    fontFamily: Fonts.primary.regular,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 48,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
    fontFamily: Fonts.primary.semiBold,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.55,
    fontFamily: Fonts.primary.regular,
  },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: "center",
    maxWidth: 120,
  },
  podiumColFirst: {
    marginBottom: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: Fonts.primary.bold,
  },
  avatarTextFirst: {
    fontSize: 18,
  },
  medalIcon: {
    marginTop: 6,
  },
  podiumName: {
    fontSize: 12,
    fontFamily: Fonts.primary.semiBold,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  podiumNameFirst: {
    fontSize: 13,
  },
  podiumPoints: {
    fontSize: 12,
    fontFamily: Fonts.primary.bold,
    marginTop: 2,
    marginBottom: 8,
  },
  podiumEmptySlot: {
    height: 80,
    justifyContent: "center",
  },
  podiumEmptyText: {
    opacity: 0.3,
    fontSize: 18,
  },
  podiumStand: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumPlace: {
    fontSize: 20,
    fontFamily: Fonts.primary.bold,
  },
  listSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: Fonts.primary.semiBold,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rankCircleText: {
    fontSize: 13,
    fontFamily: Fonts.primary.bold,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowName: {
    fontSize: 14,
    fontFamily: Fonts.primary.semiBold,
    flexShrink: 1,
  },
  youChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youChipText: {
    fontSize: 10,
    fontFamily: Fonts.primary.bold,
    textTransform: "uppercase",
  },
  rowStats: {
    alignItems: "flex-end",
  },
  rowPoints: {
    fontSize: 14,
    fontFamily: Fonts.primary.bold,
  },
  rowAccuracy: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
    fontFamily: Fonts.primary.medium,
  },
  stickyYou: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  stickyRank: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stickyRankText: {
    fontSize: 14,
    fontFamily: Fonts.primary.bold,
  },
  stickyInfo: {
    flex: 1,
    minWidth: 0,
  },
  stickyName: {
    fontSize: 14,
    fontFamily: Fonts.primary.semiBold,
  },
  stickyMeta: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: 2,
    fontFamily: Fonts.primary.regular,
  },
});
