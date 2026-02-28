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
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface RouteParams {
    email: string;
}

export function VerifyResetOtp() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams;
    const email = params?.email || "";

    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [errors, setErrors] = useState<{ otp?: string }>({});

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
        setLoading(true);
        setErrors({});
        try {
            const response = await api.post("/password-reset/send-otp", {
                email: email,
            });

            if (response.data.success) {
                Alert.alert("Success", "Reset code resent to your email");
            }
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to resend reset code"
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
                email: email,
                otp: otpCode,
            });

            if (response.data.success) {
                // @ts-ignore
                navigation.navigate("ResetPassword", { email, otp: otpCode });
            }
        } catch (error: any) {
            setErrors({ otp: error.response?.data?.message || "Invalid code" });
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
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
                            Enter Reset Code
                        </ThemedText>

                        <ThemedText style={styles.description}>
                            Enter the 6-digit code sent to {email}
                        </ThemedText>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    style={[
                                        styles.otpInput,
                                        {
                                            backgroundColor: "transparent",
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

                        <ThemedText
                            type="link"
                            onPress={() => navigation.goBack()}
                            style={styles.backLink}
                        >
                            Back
                        </ThemedText>
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
    otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 12 },
    otpInput: { width: 50, height: 60, borderRadius: 12, borderWidth: 2, textAlign: "center", fontSize: 24, fontWeight: "bold" },
    error: { fontSize: 12, marginBottom: 16, textAlign: "center" },
    button: { marginTop: 8, marginBottom: 24 },
    resendLink: { textAlign: "center", marginTop: 16 },
    backLink: { textAlign: "center", marginTop: 16 },
});
