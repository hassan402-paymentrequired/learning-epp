import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useThemeColor } from "@/hooks/useThemeColor";
import * as Linking from "expo-linking";

interface SubscriptionWebViewProps {
  authorizationUrl: string;
  onPaymentComplete: (success: boolean, reference?: string, message?: string) => void;
  onClose: () => void;
}

export function SubscriptionWebView({
  authorizationUrl,
  onPaymentComplete,
  onClose,
}: SubscriptionWebViewProps) {
  const [loading, setLoading] = useState(true);
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const { url } = request;
    
    console.log('WebView navigation request:', url);
    
    // Intercept Paystack's close redirect (per Paystack WebView guide)
    // After 3DS authentication, Paystack redirects to https://standard.paystack.co/close
    // This indicates payment process is complete, and Paystack will redirect to callback_url
    if (url.includes('standard.paystack.co/close')) {
      console.log('Paystack close redirect detected - waiting for callback_url redirect...');
      // Allow navigation - Paystack will then redirect to our callback_url
      return true;
    }
    
    // Allow Paystack checkout pages
    if (url.includes('checkout.paystack.com') || url.includes('paystack.com')) {
      return true;
    }
    
    // Allow backend callback - backend will verify payment and redirect to deep link
    // This is where Paystack redirects after payment (per Paystack docs)
    if (url.includes('/api/subscriptions/callback')) {
      console.log('Backend callback reached - backend will verify and redirect...');
      // Backend will verify payment with Paystack and redirect to learningapp:// deep link
      return true;
    }
    
    // Intercept deep link redirects from backend (per Paystack WebView guide)
    // Backend redirects here after verifying payment
    if (url.startsWith('learningapp://')) {
      try {
        const parsed = Linking.parse(url);
        if (parsed.path === 'subscription/callback') {
          const status = parsed.queryParams?.status as string;
          const reference = parsed.queryParams?.reference as string;
          const message = parsed.queryParams?.message as string;
          
          console.log('Deep link intercepted:', { status, reference, message });
          
          if (status === 'success') {
            onPaymentComplete(true, reference);
          } else {
            onPaymentComplete(false, undefined, message || 'Payment failed');
          }
          return false; // Prevent navigation to deep link, handle in app
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
        onPaymentComplete(false, undefined, 'Failed to process payment redirect');
      }
      return false; // Block deep link navigation
    }
    
    // Block navigation to other external URLs (security)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Only allow navigation to Paystack and our backend callback
      if (url.includes('paystack.com') || url.includes('/api/subscriptions/callback')) {
        return true;
      }
      console.log('Blocked navigation to:', url);
      return false;
    }
    
    return true;
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    
    // Log navigation for debugging
    console.log('WebView navigation state changed:', url);
    
    // Also handle deep link in onNavigationStateChange as fallback (especially for Android)
    // Primary handling is in onShouldStartLoadWithRequest, but this is a backup
    if (url.startsWith('learningapp://')) {
      try {
        const parsed = Linking.parse(url);
        if (parsed.path === 'subscription/callback') {
          const status = parsed.queryParams?.status as string;
          const reference = parsed.queryParams?.reference as string;
          const message = parsed.queryParams?.message as string;
          
          console.log('Deep link detected in navigation change:', { status, reference, message });
          
          if (status === 'success') {
            onPaymentComplete(true, reference);
          } else {
            onPaymentComplete(false, undefined, message || 'Payment failed');
          }
        }
      } catch (error) {
        console.error('Error parsing deep link in navigation change:', error);
      }
    }
    
    // Handle Paystack close redirect (per Paystack WebView documentation)
    // After 3DS, Paystack redirects to https://standard.paystack.co/close
    // Then Paystack redirects to our callback_url
    if (url.includes('standard.paystack.co/close')) {
      console.log('Paystack close redirect detected - Paystack will redirect to callback_url...');
    }
    
    // Monitor when we reach the backend callback
    // Backend will verify payment and redirect to deep link which will be intercepted
    if (url.includes('/api/subscriptions/callback')) {
      console.log('Backend callback reached - backend will verify payment and redirect to deep link...');
      // Backend processes payment and redirects to learningapp:// which is intercepted above
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
          source={{ uri: authorizationUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            Alert.alert(
              'Error',
              'Failed to load payment page. Please try again.',
              [
                { text: 'OK', onPress: onClose }
              ]
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
