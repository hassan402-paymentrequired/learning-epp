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
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface RouteParams {
    email: string;
    otp: string;
}

export function ResetPassword() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams;
    const email = params?.email || "";
    const otpCode = params?.otp || "";

    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ password?: string }>({});

    const gradientStart = useThemeColor({}, "gradientStart");
    const gradientEnd = useThemeColor({}, "gradientEnd");
    const tintColor = useThemeColor({}, "tint");

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setErrors({ password: "Password must be at least 8 characters" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrors({ password: "Passwords do not match" });
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            const response = await api.post("/password-reset/reset", {
                email: email,
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
                            Reset Password
                        </ThemedText>

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
                        />

                        <Button
                            title="Reset Password"
                            onPress={handleResetPassword}
                            loading={loading}
                            style={styles.button}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
    container: { flex: 1 },
    icon: { alignSelf: "center", marginBottom: 24 },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
    description: { fontSize: 14, textAlign: "center", marginBottom: 32, opacity: 0.8, lineHeight: 20 },
    input: { marginBottom: 16 },
    button: { marginTop: 8, marginBottom: 24 },
});
