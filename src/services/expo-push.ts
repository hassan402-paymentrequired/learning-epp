import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { getDeviceTimezone } from '@/services/notifications';

const TOKEN_STORAGE_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

export async function getStoredExpoPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function registerForExpoPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('morning-reminders', {
      name: 'Morning reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4800b2',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Expo project ID is missing from app config.');
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResult.data;

  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  await syncExpoPushToken(token);

  return token;
}

export async function syncExpoPushToken(token?: string | null): Promise<void> {
  const pushToken = token ?? (await getStoredExpoPushToken());
  if (!pushToken) return;

  await api.post('/device-push-tokens', {
    token: pushToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    timezone: getDeviceTimezone(),
  });
}

export async function unregisterExpoPushNotifications(): Promise<void> {
  const token = await getStoredExpoPushToken();
  if (!token) return;

  try {
    await api.delete('/device-push-tokens', { data: { token } });
  } finally {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
