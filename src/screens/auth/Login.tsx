import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, "background");
  const gradientStart = useThemeColor({}, "gradientStart");
  const gradientEnd = useThemeColor({}, "gradientEnd");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      if (rememberMe) {
        // Store credentials if remember me is checked
        // Implementation can be added later
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    Alert.alert("Forgot Password", "This feature will be available soon.");
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    // TODO: Implement social login
    Alert.alert("Social Login", `${provider} login will be available soon.`);
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              name="arrow-back"
              onPress={() => navigation.goBack()}
              size={24}
            />
            <ThemedText
              type="link"
              onPress={() =>
                Alert.alert("Help", "Contact support for assistance")
              }
              style={styles.helpLink}
            >
              Need Help?
            </ThemedText>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.title}>
              Welcome back!
            </ThemedText>
            <ThemedText style={styles.description}>
              Hello, you must login first to be able to use the application and
              enjoy all the features in Exam Prep
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon="mail-outline"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              error={errors.password}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberMeContainer}>
                <Checkbox
                  checked={rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                />
                <ThemedText style={styles.rememberMeText}>
                  Remember me
                </ThemedText>
              </View>
              <TouchableOpacity onPress={handleForgotPassword}>
                <ThemedText type="link" style={styles.forgotPassword}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <Button
              title="Sign in"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.signInButton}
            />

            {/* Social Login Separator */}
            <View style={styles.separator}>
              <View
                style={[styles.separatorLine, { backgroundColor: borderColor }]}
              />
              <ThemedText style={styles.separatorText}>
                Or sign in with
              </ThemedText>
              <View
                style={[styles.separatorLine, { backgroundColor: borderColor }]}
              />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor }]}
                onPress={() => handleSocialLogin("google")}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[styles.socialButtonText, { color: "#4285F4" }]}
                >
                  G
                </ThemedText>
                <ThemedText
                  style={[styles.socialButtonLabel, { color: textColor }]}
                >
                  Continue With Google
                </ThemedText>
              </TouchableOpacity>

            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                Don&apos;t have an account?{" "}
                <ThemedText
                  type="link"
                  onPress={() => navigation.navigate("Signup" as never)}
                  style={{ color: tintColor }}
                >
                  Sign up
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  helpLink: {
    fontSize: 14,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  form: {
    width: "100%",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: -8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 14,
  },
  signInButton: {
    marginBottom: 24,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  socialButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    width: 32,
    textAlign: "center",
  },
  socialButtonLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
  },
});
