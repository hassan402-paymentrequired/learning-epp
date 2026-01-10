import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import api  from "@/services/api";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
  }>({});

  const gradientStart = useThemeColor({}, "gradientStart");
  const gradientEnd = useThemeColor({}, "gradientEnd");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const inputRefs = React.useRef<(any)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      if (index + pastedOtp.length < 6) {
        inputRefs.current[index + pastedOtp.length]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Email is invalid" });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await api.post("/password-reset/send-otp", {
        email: email.trim(),
      });

      if (response.data.success) {
        setOtpSent(true);
        Alert.alert("Success", "Reset code sent to your email");
      }
    } catch (error: any) {
      console.log(error)
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to send reset code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit code" });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await api.post("/password-reset/verify-otp", {
        email: email.trim(),
        otp: otpCode,
      });

      if (response.data.success) {
        setOtpVerified(true);
      }
    } catch (error: any) {
      setErrors({ otp: error.response?.data?.message || "Invalid code" });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ password: "Passwords do not match" });
      return;
    }

    const otpCode = otp.join("");
    setLoading(true);
    setErrors({});
    try {
      const response = await api.post("/password-reset/reset", {
        email: email.trim(),
        otp: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.data.success) {
        Alert.alert("Success", "Password reset successfully!", [
          {
            text: "OK",
            onPress: () => {
              // @ts-ignore
              navigation.navigate("Login");
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to reset password"
      );
    } finally {
      setLoading(false);
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
            <MaterialIcons
              name="lock-reset"
              size={64}
              color={tintColor}
              style={styles.icon}
            />

            <ThemedText type="title" style={styles.title}>
              {!otpSent
                ? "Forgot Password?"
                : !otpVerified
                ? "Enter Reset Code"
                : "Reset Password"}
            </ThemedText>

            {!otpSent ? (
              <>
                <ThemedText style={styles.description}>
                  Enter your email address and we&rsquo;ll send you a code to reset
                  your password.
                </ThemedText>

                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({});
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  leftIcon="mail-outline"
                  style={styles.input}
                />

                <Button
                  title="Send Reset Code"
                  onPress={handleSendOtp}
                  loading={loading}
                  style={styles.button}
                />
              </>
            ) : !otpVerified ? (
              <>
                <ThemedText style={styles.description}>
                  Enter the 6-digit code sent to {email}
                </ThemedText>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: "red",
                          borderColor: digit ? tintColor : textColor + "40",
                          color: textColor,
                        },
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => {
                        if (e.nativeEvent.key === "Backspace" && !digit && index > 0) {
                          inputRefs.current[index - 1]?.focus();
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {errors.otp && (
                  <ThemedText style={[styles.error, { color: "red" }]}>
                    {errors.otp}
                  </ThemedText>
                )}

                <Button
                  title="Verify Code"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  disabled={otp.join("").length !== 6}
                  style={styles.button}
                />

                <ThemedText
                  type="link"
                  onPress={handleSendOtp}
                  style={styles.resendLink}
                >
                  Resend Code
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={styles.description}>
                  Enter your new password
                </ThemedText>

                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setErrors({});
                  }}
                  secureTextEntry
                  error={errors.password}
                  leftIcon="lock-closed-outline"
                  style={styles.input}
                />

                <Input
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors({});
                  }}
                  secureTextEntry
                  error={errors.password}
                  leftIcon="lock-closed-outline"
                  style={styles.input}
                />

                <Button
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.button}
                />
              </>
            )}

            <ThemedText
              type="link"
              onPress={() => navigation.goBack()}
              style={styles.backLink}
            >
              Back to Login
            </ThemedText>
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
  },
  icon: {
    alignSelf: "center",
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
  input: {
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
  error: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  resendLink: {
    textAlign: "center",
    marginTop: 16,
  },
  backLink: {
    textAlign: "center",
    marginTop: 16,
  },
});
