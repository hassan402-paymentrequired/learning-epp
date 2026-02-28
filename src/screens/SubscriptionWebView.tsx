import React, { useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useThemeColor } from "@/hooks/useThemeColor";

interface SubscriptionWebViewProps {
  authorizationUrl: string;
  callbackUrl: string;
  cancelUrl: string;
  onPaymentComplete: (reference?: string) => void;
  onCancel: () => void;
}

export function SubscriptionWebView({
  authorizationUrl,
  callbackUrl,
  cancelUrl,
  onPaymentComplete,
  onCancel,
}: SubscriptionWebViewProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  const handleNavigationStateChange = (state: WebViewNavigation) => {
    const { url } = state;

    if (!url) return;

    console.log("WebView navigation:", url);

    // Extract the base path from the callback URL for matching
    // Paystack redirects to: {callbackUrl}?reference=xxx&trxref=xxx
    const callbackBase = callbackUrl.split("?")[0];
    const cancelBase = cancelUrl.split("?")[0];

    // Extract reference from URL query params regardless of how URL is matched
    const extractReference = (fullUrl: string): string | undefined => {
      const queryPart = fullUrl.split("?")[1];
      if (!queryPart) return undefined;
      const params = new URLSearchParams(queryPart);
      return params.get("reference") || params.get("trxref") || undefined;
    };

    // Handle callback URL — payment successful
    // Use includes() so slight domain/protocol variations still match
    if (url.includes("/subscriptions/callback") || url.startsWith(callbackBase)) {
      console.log("Callback URL reached - payment successful");
      const reference = extractReference(url);
      onPaymentComplete(reference);
      return;
    }

    // Handle cancel URL — user cancelled payment
    if (url.includes("/subscriptions/cancel") || url.startsWith(cancelBase)) {
      console.log("Cancel URL reached - payment cancelled");
      onCancel();
    }
  };

  return (
    <AppLayout showBackButton={true} headerTitle="Complete Payment">
      <View style={[styles.container, { backgroundColor }]}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              Loading payment page...
            </ThemedText>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: authorizationUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
            Alert.alert(
              "Error",
              "Failed to load payment page. Please try again.",
              [{ text: "OK", onPress: onCancel }]
            );
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={tintColor} />
            </View>
          )}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
