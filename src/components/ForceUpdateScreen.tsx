import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { SPLASH_BACKGROUND } from '@/components/CustomSplashScreen';

interface ForceUpdateScreenProps {
  message: string;
  minVersion: string | null;
  currentVersion: string;
  storeUrl: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ForceUpdateScreen({
  message,
  minVersion,
  currentVersion,
  storeUrl,
  onRetry,
  retrying = false,
}: ForceUpdateScreenProps) {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.42, 220);

  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
      />
      <ThemedText type="title" style={styles.title}>
        Update required
      </ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>
      <ThemedText style={styles.versionText}>
        Your version: {currentVersion}
        {minVersion ? ` · Required: ${minVersion}` : ''}
      </ThemedText>
      <View style={styles.actions}>
        <Button title="Update now" onPress={handleUpdate} />
        {onRetry ? (
          <Button
            title="Check again"
            variant="outline"
            onPress={onRetry}
            loading={retrying}
            style={styles.secondaryButton}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 24,
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  versionText: {
    marginTop: 16,
    fontSize: 13,
    opacity: 0.65,
    textAlign: 'center',
  },
  actions: {
    marginTop: 32,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  secondaryButton: {
    marginTop: 4,
  },
});
