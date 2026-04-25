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

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
    referralCode?: string;
    terms?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation();
  const tintColor = useThemeColor({}, "tint");
  const errorColor = useThemeColor({}, "error");

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirmation?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = "Please confirm your password";
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords do not match";
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const pendingSession = await register(
        name.trim(),
        email.trim(),
        password,
        passwordConfirmation,
        referralCode.trim() || undefined
      );

      // @ts-ignore
      navigation.navigate("EmailVerification", {
        email: email.trim(),
        pendingToken: pendingSession.token,
        pendingUser: pendingSession.user,
      });
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Please try again");
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
          showsVerticalScrollIndicator={false}
        >

          {/* Title Section */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.title}>
              Register your account!
            </ThemedText>
            <ThemedText style={styles.description}>
              provider your information to continue
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
              leftIcon="person-outline"
            />

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
              autoComplete="password-new"
              error={errors.password}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry={!showPasswordConfirmation}
              autoCapitalize="none"
              autoComplete="password-new"
              error={errors.passwordConfirmation}
              leftIcon="lock-closed-outline"
              rightIcon={
                showPasswordConfirmation ? "eye-off-outline" : "eye-outline"
              }
              onRightIconPress={() =>
                setShowPasswordConfirmation(!showPasswordConfirmation)
              }
            />

            <Input
              label="Referral Code (Optional)"
              placeholder="Enter referral code if you have one"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              error={errors.referralCode}
              leftIcon="gift-outline"
            />

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Checkbox
                checked={agreeToTerms}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              />
              <View style={styles.termsTextContainer}>
                <ThemedText style={styles.termsText}>
                  By Creating an account, you agree to our{" "}
                  <ThemedText
                    type="link"
                    onPress={() =>
                      Alert.alert(
                        "Terms",
                        "Terms and conditions will be available soon."
                      )
                    }
                    style={{ color: tintColor }}
                  >
                    Terms and Condition
                  </ThemedText>
                </ThemedText>
              </View>
            </View>
            {errors.terms && (
              <ThemedText style={[styles.error, { color: errorColor }]}>
                {errors.terms}
              </ThemedText>
            )}

            {/* Sign Up Button */}
            <Button
              title="Sign up"
              onPress={handleSignup}
              loading={loading}
              disabled={loading || !agreeToTerms}
              style={styles.signUpButton}
            />

            {/* Social Login Separator */}




            {/* Footer */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                Don&apos;t have an account?{" "}
                <ThemedText
                  type="link"
                  onPress={() => navigation.navigate("Login" as never)}
                  style={{ color: tintColor }}
                >
                  Sign in
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    marginTop: -4,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  signUpButton: {
    marginTop: 8,
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
