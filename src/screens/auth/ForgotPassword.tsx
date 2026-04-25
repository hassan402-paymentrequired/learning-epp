import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; }>({});

  const gradientStart = useThemeColor({}, "gradientStart");
  const gradientEnd = useThemeColor({}, "gradientEnd");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");



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
        Alert.alert("Success", "Reset code sent to your email");
        // @ts-ignore
        navigation.navigate("VerifyResetOtp", { email: email.trim() });
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

  return (
    <AppLayout showHeader={false}>
  

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
              Forgot Password?
            </ThemedText>

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
            />

            <Button
              title="Send Reset Code"
              onPress={handleSendOtp}
              loading={loading}
              style={styles.button}
            />

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
     display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
 
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  backLink: {
    textAlign: "center",
    marginTop: 16,
  },
});
