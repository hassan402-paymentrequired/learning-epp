import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function EmailVerification() {
  const navigation = useNavigation();
  const route = useRoute();
  const { refreshUser } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const gradientStart = useThemeColor({}, "gradientStart");
  const gradientEnd = useThemeColor({}, "gradientEnd");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    // Get email from route params or auth context
    const routeEmail = (route.params as any)?.email;
    if (routeEmail) {
      setEmail(routeEmail);
    }
  }, [route]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus last input
      if (index + pastedOtp.length < 6) {
        inputRefs.current[index + pastedOtp.length]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/email-verification/verify-otp", {
        email,
        otp: otpCode,
      });

      if (response.data.success) {
        Alert.alert("Success", "Email verified successfully!", [
          {
            text: "OK",
            onPress: async () => {
              await refreshUser();
              // @ts-ignore
              navigation.navigate("Home");
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Verification Failed",
        error.response?.data?.message || "Invalid verification code. Please try again."
      );
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    if (countdown > 0) {
      return;
    }

    setResending(true);
    try {
      const response = await api.post("/email-verification/resend-otp", {
        email,
      });

      if (response.data.success) {
        setCountdown(60); // 60 second countdown
        Alert.alert("Success", "Verification code resent to your email");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to resend code. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AppLayout showHeader={false}>
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="email" size={64} color={tintColor} />
            </View>

            <ThemedText type="title" style={styles.title}>
              Verify Your Email
            </ThemedText>

            <ThemedText style={styles.description}>
              We've sent a 6-digit verification code to{'\n'}
              <ThemedText type="defaultSemiBold">{email}</ThemedText>
            </ThemedText>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor,
                      borderColor: digit ? tintColor : textColor + "40",
                      color: textColor,
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Button
              title="Verify Email"
              onPress={handleVerify}
              loading={loading}
              disabled={loading || otp.join("").length !== 6}
              style={styles.verifyButton}
            />

            <View style={styles.resendContainer}>
              <ThemedText style={styles.resendText}>
                Didn't receive the code?{" "}
              </ThemedText>
              {countdown > 0 ? (
                <ThemedText style={[styles.resendText, { color: tintColor }]}>
                  Resend in {countdown}s
                </ThemedText>
              ) : (
                <ThemedText
                  type="link"
                  onPress={handleResend}
                  style={{ color: tintColor }}
                >
                  Resend Code
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
    gap: 12,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  verifyButton: {
    width: "100%",
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
  },
});
