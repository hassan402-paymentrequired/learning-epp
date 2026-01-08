import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation , useFocusEffect} from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

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
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [referralCode, setReferralCode] = useState("");

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const cardBackground = useThemeColor({}, "cardBackground");

  useFocusEffect(
    React.useCallback(() => {
      fetchPlan();
      fetchStatus();
    }, [])
  );

  // Handle deep link when returning from payment (backend redirects here after verification)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === "subscription/callback") {
        const status = queryParams?.status as string;
        const reference = queryParams?.reference as string;

        if (status === "success" && reference) {
          // Backend already verified payment, just refresh status
          await refreshUser();
          await fetchStatus();
          Alert.alert("Success", "Your subscription has been activated!", [
            {
              text: "OK",
            },
          ]);
        } else if (status === "error") {
          const message = (queryParams?.message as string) || "Payment failed";
          Alert.alert("Payment Error", message);
        }
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

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
        const { authorization_url } = response.data.data;

        // Open Paystack payment page in browser
        // Paystack will redirect to backend callback (/api/subscriptions/callback)
        // Backend verifies payment and redirects to app via deep link
        await WebBrowser.openBrowserAsync(authorization_url, {
          showTitle: true,
          enableBarCollapsing: false,
        });
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

  const verifyPayment = async (reference: string) => {
    // Prevent duplicate verification
    if (isVerifying) {
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.post("/subscriptions/verify-payment", {
        reference,
      });

      if (response.data.success) {
        // Clear pending reference
        setPendingReference(null);

        Alert.alert("Success", "Your subscription has been activated!", [
          {
            text: "OK",
            onPress: async () => {
              await refreshUser();
              await fetchStatus();
            },
          },
        ]);
      } else {
        Alert.alert("Payment Failed", "Your payment could not be verified.");
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      // Only show error if payment wasn't already verified
      if (
        error.response?.status !== 400 ||
        !error.response?.data?.message?.includes("already")
      ) {
        Alert.alert(
          "Verification Error",
          error.response?.data?.message ||
            "Failed to verify payment. Please contact support."
        );
      }
    } finally {
      setIsVerifying(false);
    }
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
                <Input
                  label="Referral Code (Optional)"
                  placeholder="Enter referral code for 5% discount"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                  leftIcon="gift-outline"
                  style={styles.referralInput}
                />

                <Button
                  title={`Subscribe for ₦${plan.price.toLocaleString()}/year`}
                  onPress={handleSubscribe}
                  loading={processing}
                  disabled={processing}
                  style={styles.subscribeButton}
                />
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
});
