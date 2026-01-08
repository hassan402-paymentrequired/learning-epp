import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type ReferralData = {
  referral_code: string;
  referral_url: string;
  statistics: {
    total_referrals: number;
    active_referrals: number;
    pending_referrals: number;
    total_rewards: number;
  };
  recent_referrals: Array<{
    id: number;
    referred_user: {
      name: string;
      email: string;
      signed_up_at: string;
    };
    status: string;
    reward_amount: number;
    rewarded_at: string | null;
    created_at: string;
  }>;
};

export function Referral() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const cardBackground = useThemeColor({}, "cardBackground");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/referrals");
      if (response.data.success) {
        setReferralData(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching referral data:", error);
      Alert.alert("Error", "Failed to load referral information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleShare = async () => {
    if (!referralData) return;

    try {
      const result = await Share.share({
        message: `Join Exam Prep and get 5% off your subscription! Use my referral code: ${referralData.referral_code}\n\n${referralData.referral_url}`,
        title: "Referral Code",
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to share referral code");
    }
  };

  const copyToClipboard = async (text: string) => {
    // For React Native, you might need to use @react-native-clipboard/clipboard
    // For now, we'll use Share as a fallback
    Alert.alert(
      "Referral Code",
      `Your referral code: ${text}\n\nShare it with friends to earn rewards!`
    );
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Referrals">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  if (!referralData) {
    return (
      <AppLayout showBackButton={true} headerTitle="Referrals">
        <View style={styles.emptyContainer}>
          <ThemedText>Failed to load referral data</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Referrals">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Referral Code Card */}
        <View style={[styles.codeCard, { backgroundColor: tintColor }]}>
          <ThemedText style={styles.codeLabel}>Your Referral Code</ThemedText>
          <View style={styles.codeContainer}>
            <ThemedText style={styles.codeText}>
              {referralData.referral_code}
            </ThemedText>
            <TouchableOpacity
              onPress={() => copyToClipboard(referralData.referral_code)}
              style={styles.copyButton}
            >
              <MaterialIcons name="content-copy" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Button
            title="Share Referral Code"
            onPress={handleShare}
            style={styles.shareButton}
            textStyle={styles.shareButtonText}
          />
        </View>

        {/* Statistics */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: cardBackground, borderColor },
          ]}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your Referral Statistics
          </ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>
                {referralData.statistics.total_referrals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Referrals</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>
                {referralData.statistics.active_referrals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Active</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>
                {referralData.statistics.pending_referrals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>
                ₦{referralData.statistics.total_rewards.toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Rewards</ThemedText>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: cardBackground, borderColor },
          ]}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            How It Works
          </ThemedText>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoNumber, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.infoNumberText}>1</ThemedText>
              </View>
              <ThemedText style={styles.infoText}>
                Share your referral code with friends
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoNumber, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.infoNumberText}>2</ThemedText>
              </View>
              <ThemedText style={styles.infoText}>
                They sign up using your code and get 5% off
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoNumber, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.infoNumberText}>3</ThemedText>
              </View>
              <ThemedText style={styles.infoText}>
                When they subscribe, you earn 10% of their subscription
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Referrals */}
        {referralData.recent_referrals.length > 0 && (
          <View
            style={[
              styles.referralsCard,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Referrals
            </ThemedText>
            {referralData.recent_referrals.map((referral) => (
              <View
                key={referral.id}
                style={[
                  styles.referralItem,
                  { borderBottomColor: borderColor },
                ]}
              >
                <View style={styles.referralItemLeft}>
                  <View
                    style={[
                      styles.referralAvatar,
                      { backgroundColor: tintColor },
                    ]}
                  >
                    <ThemedText style={styles.referralAvatarText}>
                      {referral.referred_user.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.referralInfo}>
                    <ThemedText type="subtitle" style={styles.referralName}>
                      {referral.referred_user.name}
                    </ThemedText>
                    <ThemedText style={styles.referralEmail}>
                      {referral.referred_user.email}
                    </ThemedText>
                    <ThemedText style={styles.referralDate}>
                      Signed up:{" "}
                      {new Date(
                        referral.referred_user.signed_up_at
                      ).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.referralItemRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          referral.status === "rewarded"
                            ? tintColor + "20"
                            : borderColor + "40",
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        {
                          color:
                            referral.status === "rewarded"
                              ? tintColor
                              : textColor,
                          opacity: referral.status === "rewarded" ? 1 : 0.6,
                        },
                      ]}
                    >
                      {referral.status === "rewarded" ? "Rewarded" : "Pending"}
                    </ThemedText>
                  </View>
                  {referral.reward_amount > 0 && (
                    <ThemedText
                      style={[styles.rewardAmount, { color: tintColor }]}
                    >
                      ₦{referral.reward_amount.toLocaleString()}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  codeCard: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
    justifyContent: "space-between",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
  shareButtonText: {
    color: "#000000",
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoNumberText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  referralsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  referralItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  referralItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  referralAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  referralAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    marginBottom: 4,
  },
  referralEmail: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 11,
    opacity: 0.5,
  },
  referralItemRight: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
