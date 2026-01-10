import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import  api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";

export function EditProfile() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    currentPassword?: string;
    password?: string;
  }>({});

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (newPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }

      if (newPassword.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (newPassword !== confirmPassword) {
        newErrors.password = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.password = newPassword;
        payload.password_confirmation = confirmPassword;
      }

      const response = await api.put("/profile", payload);

      if (response.data.success) {
        await refreshUser();
        Alert.alert("Success", "Profile updated successfully!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Failed to update profile";
      Alert.alert("Update Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Edit Profile">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Personal Information
          </ThemedText>

          <Input
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors({ ...errors, name: undefined });
            }}
            error={errors.name}
            leftIcon="person-outline"
            style={styles.input}
          />

          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon="mail-outline"
            style={styles.input}
          />

          <ThemedText type="subtitle" style={[styles.sectionTitle, styles.marginTop]}>
            Change Password (Optional)
          </ThemedText>

          <ThemedText style={styles.hint}>
            Leave blank if you don't want to change your password
          </ThemedText>

          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setErrors({ ...errors, currentPassword: undefined });
            }}
            secureTextEntry
            error={errors.currentPassword}
            leftIcon="lock-closed-outline"
            style={styles.input}
          />

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors({ ...errors, password: undefined });
            }}
            secureTextEntry
            error={errors.password}
            leftIcon="lock-closed-outline"
            style={styles.input}
          />

          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors({ ...errors, password: undefined });
            }}
            secureTextEntry
            error={errors.password}
            leftIcon="lock-closed-outline"
            style={styles.input}
          />

          <Button
            title="Update Profile"
            onPress={handleUpdate}
            loading={loading}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    marginTop: 8,
  },
  marginTop: {
    marginTop: 32,
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
});
