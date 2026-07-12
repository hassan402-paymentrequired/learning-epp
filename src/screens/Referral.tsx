import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  Pressable,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";

type ReferralWithdrawal = {
  uuid: string;
  amount: number;
  phone_number: string;
  network: string;
  status: string;
  created_at: string;
};

type ReferralData = {
  referral_code: string;
  referral_url: string;
  credit_balance: number;
  total_earnings: number;
  min_withdrawal_amount: number;
  reward_amount: number;
  statistics: {
    total_referrals: number;
    active_referrals: number;
    pending_referrals: number;
    total_rewards: number;
  };
  recent_referrals: Array<{
    uuid: string;
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
  recent_withdrawals: ReferralWithdrawal[];
};

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
];

export function Referral() {
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("mtn");
  const [amount, setAmount] = useState("");

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
    }
  };

  const handleCopyCode = async () => {
    if (!referralData) return;
    try {
      await Clipboard.setStringAsync(referralData.referral_code);
      Alert.alert("Copied", "Referral code copied to clipboard.");
    } catch {
      Alert.alert("Error", "Failed to copy referral code.");
    }
  };

  const handleShare = async () => {
    if (!referralData) return;

    try {
      await Share.share({
        message: `Join Stepra and practice for your exams! Use my referral code: ${referralData.referral_code}\n\n${referralData.referral_url}`,
        title: "Refer & Earn",
      });
    } catch {
      Alert.alert("Error", "Failed to share referral code");
    }
  };

  const handleWithdraw = async () => {
    if (!referralData) return;

    const parsedAmount = parseFloat(amount);
    const minAmount = referralData.min_withdrawal_amount || 1000;

    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid phone", "Please enter a valid phone number.");
      return;
    }

    if (!parsedAmount || parsedAmount < minAmount) {
      Alert.alert("Invalid amount", `Minimum withdrawal is ₦${minAmount.toLocaleString()}.`);
      return;
    }

    if (parsedAmount > referralData.credit_balance) {
      Alert.alert("Insufficient balance", "You do not have enough credit for this withdrawal.");
      return;
    }

    try {
      setWithdrawing(true);
      const response = await api.post("/referrals/withdraw", {
        phone_number: phoneNumber,
        network,
        amount: parsedAmount,
      });

      if (response.data.success) {
        Alert.alert("Success", "Withdrawal request submitted. You will be notified when it is processed.");
        setShowWithdrawModal(false);
        setPhoneNumber("");
        setAmount("");
        setNetwork("mtn");
        await fetchReferralData();
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit withdrawal.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to submit withdrawal.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Refer & Earn">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  if (!referralData) {
    return (
      <AppLayout showBackButton={true} headerTitle="Refer & Earn">
        <View style={styles.emptyContainer}>
          <ThemedText>Failed to load referral data</ThemedText>
        </View>
      </AppLayout>
    );
  }

  const minWithdrawal = referralData.min_withdrawal_amount || 1000;
  const canWithdraw = referralData.credit_balance >= minWithdrawal;

  return (
    <AppLayout showBackButton={true} headerTitle="Refer & Earn">
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.balanceCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
          <ThemedText style={[styles.balanceValue, { color: tintColor }]}>
            ₦{referralData.credit_balance.toLocaleString()}
          </ThemedText>
          <ThemedText style={styles.balanceHint}>
            Total earned: ₦{referralData.total_earnings.toLocaleString()}
          </ThemedText>
          {canWithdraw ? (
            <Button title="Withdraw" onPress={() => setShowWithdrawModal(true)} style={styles.withdrawButton} />
          ) : (
            <ThemedText style={styles.balanceHint}>
              Minimum withdrawal is ₦{minWithdrawal.toLocaleString()}
            </ThemedText>
          )}
        </View>

        <View style={[styles.codeCard, { backgroundColor: tintColor }]}>
          <ThemedText style={styles.codeLabel}>Your Referral Code</ThemedText>
          <View style={styles.codeContainer}>
            <ThemedText style={styles.codeText}>{referralData.referral_code}</ThemedText>
          </View>
          <View style={styles.codeActions}>
            <Button
              title="Copy Code"
              onPress={handleCopyCode}
              variant="outline"
              style={styles.copyButton}
              textStyle={styles.copyButtonText}
            />
            <Button
              title="Share"
              onPress={handleShare}
              style={styles.shareButton}
              textStyle={styles.shareButtonText}
            />
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Your Referral Statistics</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>{referralData.statistics.total_referrals}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Referrals</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>{referralData.statistics.active_referrals}</ThemedText>
              <ThemedText style={styles.statLabel}>Active</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>{referralData.statistics.pending_referrals}</ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>₦{referralData.statistics.total_rewards.toLocaleString()}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Rewards</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>How It Works</ThemedText>
          <View style={styles.infoList}>
            <ThemedText style={styles.infoText}>1. Share your referral code with friends</ThemedText>
            <ThemedText style={styles.infoText}>2. They sign up using your code</ThemedText>
            <ThemedText style={styles.infoText}>3. When they subscribe, you earn ₦{referralData.reward_amount.toLocaleString()}</ThemedText>
            <ThemedText style={styles.infoText}>4. Withdraw to your phone once you reach ₦{minWithdrawal.toLocaleString()}</ThemedText>
          </View>
        </View>

        {referralData.recent_withdrawals?.length > 0 && (
          <View style={[styles.referralsCard, { backgroundColor: cardBackground, borderColor, marginBottom: 16 }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Withdrawals</ThemedText>
            {referralData.recent_withdrawals.map((withdrawal) => (
              <View key={withdrawal.uuid} style={[styles.referralItem, { borderBottomColor: borderColor }]}>
                <View>
                  <ThemedText style={styles.referralName}>₦{withdrawal.amount.toLocaleString()}</ThemedText>
                  <ThemedText style={styles.referralEmail}>{withdrawal.phone_number} · {withdrawal.network.toUpperCase()}</ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.statusText,
                    {
                      color:
                        withdrawal.status === "paid"
                          ? "#16a34a"
                          : withdrawal.status === "rejected"
                            ? "#dc2626"
                            : "#ca8a04",
                    },
                  ]}
                >
                  {withdrawal.status}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {referralData.recent_referrals.length > 0 && (
          <View style={[styles.referralsCard, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Referrals</ThemedText>
            {referralData.recent_referrals.map((referral) => (
              <View key={referral.uuid} style={[styles.referralItem, { borderBottomColor: borderColor }]}>
                <View style={styles.referralItemLeft}>
                  <View style={[styles.referralAvatar, { backgroundColor: tintColor }]}>
                    <ThemedText style={styles.referralAvatarText}>
                      {referral.referred_user.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.referralInfo}>
                    <ThemedText type="subtitle" style={styles.referralName}>{referral.referred_user.name}</ThemedText>
                    <ThemedText style={styles.referralEmail}>{referral.referred_user.email}</ThemedText>
                    {!!referral.referred_user.signed_up_at && (
                      <ThemedText style={styles.referralEmail}>
                        Joined {new Date(referral.referred_user.signed_up_at).toLocaleDateString()}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.referralItemRight}>
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: referral.status === "rewarded" ? "#16a34a" : "#ca8a04" },
                    ]}
                  >
                    {referral.status === "rewarded" ? "Rewarded" : "Pending"}
                  </ThemedText>
                  {referral.reward_amount > 0 && (
                    <ThemedText style={[styles.rewardAmount, { color: tintColor }]}>
                      ₦{referral.reward_amount.toLocaleString()}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showWithdrawModal} transparent animationType="slide" onRequestClose={() => setShowWithdrawModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowWithdrawModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Withdraw Credits</ThemedText>
            <ThemedText style={styles.balanceHint}>Available: ₦{referralData.credit_balance.toLocaleString()}</ThemedText>

            <Input
              label="Phone Number"
              placeholder="08012345678"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <ThemedText style={styles.inputLabel}>Network</ThemedText>
            <View style={styles.networkRow}>
              {NETWORKS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.networkChip, network === item.value && { backgroundColor: tintColor }]}
                  onPress={() => setNetwork(item.value)}
                >
                  <ThemedText style={{ color: network === item.value ? "#fff" : textColor }}>{item.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Amount (₦)"
              placeholder={String(minWithdrawal)}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Button title={withdrawing ? "Submitting..." : "Submit Withdrawal"} onPress={handleWithdraw} disabled={withdrawing} />
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  balanceCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  balanceLabel: { fontSize: 14, opacity: 0.7 },
  balanceValue: { fontSize: 32, fontWeight: "bold", marginVertical: 8 },
  balanceHint: { fontSize: 13, opacity: 0.7, marginBottom: 12 },
  withdrawButton: { marginTop: 4 },
  codeCard: { padding: 24, borderRadius: 12, marginBottom: 16, alignItems: "center" },
  codeLabel: { fontSize: 14, color: "#FFFFFF", opacity: 0.9, marginBottom: 12 },
  codeContainer: { backgroundColor: "rgba(255, 255, 255, 0.2)", padding: 16, borderRadius: 8, marginBottom: 16, width: "100%", alignItems: "center" },
  codeText: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", letterSpacing: 2 },
  codeActions: { width: "100%", gap: 10 },
  copyButton: {
    width: "100%",
    backgroundColor: "transparent",
    borderColor: "#FFFFFF",
    height: 44,
    minHeight: 44,
    paddingVertical: 0,
  },
  copyButtonText: { color: "#FFFFFF" },
  shareButton: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 44,
    minHeight: 44,
    paddingVertical: 0,
  },
  shareButtonText: { color: "#000000" },
  statsCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 18, marginBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statItem: { width: "48%", alignItems: "center", padding: 12, marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  statLabel: { fontSize: 12, opacity: 0.7, textAlign: "center" },
  infoCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  infoList: { gap: 10 },
  infoText: { fontSize: 14, lineHeight: 20 },
  referralsCard: { padding: 20, borderRadius: 12, borderWidth: 1 },
  referralItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1 },
  referralItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  referralAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 },
  referralAvatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 16, marginBottom: 4 },
  referralEmail: { fontSize: 12, opacity: 0.6 },
  referralItemRight: { alignItems: "flex-end" },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  rewardAmount: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  inputLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  networkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  networkChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#eee" },
});
