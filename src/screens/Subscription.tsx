import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SubscriptionWebView } from "./SubscriptionWebView";

type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
};

type SubscriptionStatus = {
  has_active_subscription: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  subscription: {
    id: number;
    plan: {
      name: string;
      price: number;
    };
    expires_at: string;
  } | null;
};

export function Subscription() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [cancelUrl, setCancelUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinProcessing, setPinProcessing] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const cardBackground = useThemeColor({}, "cardBackground");

  useFocusEffect(
    React.useCallback(() => {
      fetchPlan();
      fetchStatus();
    }, [])
  );

  const fetchPlan = async () => {
    try {
      const response = await api.get("/subscriptions/plans");
      if (response.data.success) {
        setPlan(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching plan:", error);
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subscriptions/status");
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!plan) {
      Alert.alert("Error", "Subscription plan not available");
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post("/subscriptions/initialize-payment", {
        plan_id: plan.id,
        referral_code: referralCode.trim() || undefined,
      });

      if (response.data.success) {
        const { authorization_url, callback_url, cancel_url, reference } =
          response.data.data;

        // Track the reference so we can verify after payment
        setPaymentReference(reference || null);
        // Show WebView for payment (per Paystack mobile webview recommendation)
        setPaymentUrl(authorization_url);
        setCallbackUrl(callback_url || null);
        setCancelUrl(cancel_url || null);
        setShowWebView(true);
      }
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      Alert.alert(
        "Payment Error",
        error.response?.data?.message ||
        "Failed to initialize payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePinRedeem = async () => {
    if (pin.length !== 6) {
      Alert.alert("Error", "PIN must be exactly 6 digits.");
      return;
    }

    setPinProcessing(true);
    try {
      const response = await api.post("/subscriptions/redeem-pin", { pin });

      if (response.data.success) {
        // Register device after successful pin
        try {
          await api.post("/subscriptions/register-device");
        } catch (deviceError) {
          // ignore already bound device
        }

        await refreshUser();
        await fetchStatus();

        Alert.alert("Success", "Your subscription has been activated via PIN!");
        setPin(""); // clear out the pin
      }
    } catch (error: any) {
      console.error("Error redeeming PIN:", error);
      Alert.alert(
        "PIN Error",
        error.response?.data?.message || "Failed to redeem PIN. Please try again."
      );
    } finally {
      setPinProcessing(false);
    }
  };

  const handlePaymentComplete = async (reference?: string) => {
    setShowWebView(false);
    setPaymentUrl(null);
    setCallbackUrl(null);
    setCancelUrl(null);

    // Use reference from WebView URL param, or fall back to the one from initialize-payment
    const txReference = reference || paymentReference;
    setPaymentReference(null);

    try {
      // Step 1: Verify the payment with our backend (matches web flow)
      if (txReference) {
        try {
          await api.post("/subscriptions/verify-payment", {
            reference: txReference,
          });
        } catch (verifyError: any) {
          // If verify fails, the callback may have already activated it server-side
          // (Paystack calls /api/subscriptions/callback which activates it)
          // Log but don't block — we'll check status below
          console.warn("Verify payment error (may already be activated):", verifyError.message);
        }
      }

      // Step 2: Register this device to bind the subscription (matches web flow)
      try {
        await api.post("/subscriptions/register-device");
      } catch (deviceError: any) {
        // If already bound to this device, or no active subscription yet, ignore
        console.warn("Register device note:", deviceError.response?.data?.message || deviceError.message);
      }

      // Step 3: Refresh user data and subscription status
      await refreshUser();
      await fetchStatus();

      Alert.alert("Success", "Your subscription has been activated!");
    } catch (error: any) {
      console.error("Error completing payment:", error);
      // Still refresh to reflect any server-side activation from the callback
      await refreshUser();
      await fetchStatus();
      Alert.alert(
        "Payment Processed",
        "Payment received. Your subscription status has been refreshed."
      );
    }
  };

  const handlePaymentCancel = () => {
    setShowWebView(false);
    setPaymentUrl(null);
    setCallbackUrl(null);
    setCancelUrl(null);
    setPaymentReference(null);
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Subscription">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </AppLayout>
    );
  }

  const hasActiveSubscription = status?.has_active_subscription || false;

  return (
    <AppLayout showBackButton={true} headerTitle="Subscription">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Current Status */}
        {hasActiveSubscription && status?.subscription && (
          <View
            style={[
              styles.statusCard,
              { backgroundColor: tintColor + "15", borderColor: tintColor },
            ]}
          >
            <View style={styles.statusHeader}>
              <MaterialIcons name="check-circle" size={24} color={tintColor} />
              <ThemedText type="subtitle" style={styles.statusTitle}>
                Active Subscription
              </ThemedText>
            </View>
            <ThemedText style={styles.statusText}>
              Plan: {status.subscription.plan.name}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              Expires:{" "}
              {new Date(status.subscription.expires_at).toLocaleDateString()}
            </ThemedText>
          </View>
        )}

        {/* Subscription Plan */}
        {plan && (
          <View
            style={[
              styles.planCard,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
            <View style={styles.planHeader}>
              <ThemedText type="title" style={styles.planName}>
                {plan.name}
              </ThemedText>
              <View style={styles.priceContainer}>
                <ThemedText
                  type="title"
                  style={[styles.price, { color: tintColor }]}
                >
                  ₦{plan.price.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.pricePeriod}>
                  /{plan.interval}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.planDescription}>
              {plan.description}
            </ThemedText>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={tintColor}
                />
                <ThemedText style={styles.featureText}>
                  Unlimited access to all exam questions
                </ThemedText>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={tintColor}
                />
                <ThemedText style={styles.featureText}>
                  Practice questions for all subjects
                </ThemedText>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={tintColor}
                />
                <ThemedText style={styles.featureText}>
                  Past questions from previous years
                </ThemedText>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={tintColor}
                />
                <ThemedText style={styles.featureText}>
                  Detailed explanations and corrections
                </ThemedText>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={tintColor}
                />
                <ThemedText style={styles.featureText}>
                  Performance tracking and analytics
                </ThemedText>
              </View>
            </View>

            {!hasActiveSubscription && (
              <>
                <View style={styles.optionContainer}>
                  <ThemedText type="subtitle" style={styles.optionTitle}>Pay Online</ThemedText>
                  <Input
                    label="Referral Code (Optional)"
                    placeholder="Enter referral code for discount"
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                    leftIcon="gift-outline"
                  />
                  <Button
                    title={`Subscribe for ₦${plan.price.toLocaleString()}/year`}
                    onPress={handleSubscribe}
                    loading={processing}
                    disabled={processing || pinProcessing}
                    style={styles.subscribeButton}
                  />
                  <ThemedText style={styles.secureText}>Secure payment powered by Paystack</ThemedText>
                </View>

                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                  <ThemedText style={styles.dividerText}>OR</ThemedText>
                  <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                </View>

                <View style={styles.optionContainer}>
                  <ThemedText type="subtitle" style={styles.optionTitle}>Activate via PIN</ThemedText>
                  <ThemedText style={styles.optionDescription}>
                    Enter a 6-digit PIN received from an administrator.
                  </ThemedText>
                  <Input
                    label="6-Digit PIN"
                    placeholder="e.g. 123456"
                    value={pin}
                    onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={6}
                    leftIcon="key-outline"
                    autoCapitalize="none"
                  />
                  <Button
                    title="Activate Subscription"
                    onPress={handlePinRedeem}
                    loading={pinProcessing}
                    disabled={pinProcessing || processing || pin.length !== 6}
                    style={styles.subscribeButton}
                  />
                </View>
              </>
            )}

            {hasActiveSubscription && (
              <View
                style={[styles.activeBadge, { backgroundColor: tintColor }]}
              >
                <ThemedText style={styles.activeBadgeText}>
                  You have an active subscription
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <ThemedText type="subtitle" style={styles.infoTitle}>
            Payment Information
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Payments are processed securely through Paystack{"\n"}• Your
            subscription will be activated immediately after successful payment
            {"\n"}• All subscriptions are valid for 1 year from the date of
            purchase{"\n"}• Use a referral code to get 5% off your subscription
          </ThemedText>
        </View>
      </ScrollView>

      {/* WebView Modal for Paystack Payment */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePaymentCancel}
      >
        {paymentUrl && callbackUrl && cancelUrl && (
          <SubscriptionWebView
            authorizationUrl={paymentUrl}
            callbackUrl={callbackUrl}
            cancelUrl={cancelUrl}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        )}
      </Modal>
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
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    marginLeft: 8,
    fontSize: 18,
  },
  statusText: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  planCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
    opacity: 0.7,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.8,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  referralInput: {
    marginBottom: 16,
  },
  subscribeButton: {
    marginTop: 8,
  },
  activeBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  optionContainer: {
    marginTop: 16,
    paddingTop: 8,
  },
  optionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.5,
    fontWeight: "600",
  },
  secureText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
  },
});
