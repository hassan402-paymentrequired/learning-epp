import { Platform } from 'react-native';
import * as Application from 'expo-application';
import api from '@/services/api';
import { getStoreUrlForPlatform } from '@/constants/store-urls';
import { isVersionLessThan } from '@/utils/version';
import type { AppVersionPolicy, ForceUpdatePayload } from '@/types/app-version';

export function getNativeAppVersion(): string {
  return Application.nativeApplicationVersion ?? '0.0.0';
}


export function getNativeAppPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export function evaluateVersionPolicy(
  policy: AppVersionPolicy,
  platform: 'ios' | 'android',
  currentVersion: string
): ForceUpdatePayload | null {
  if (!policy.force_update) {
    return null;
  }

  const minVersion =
    platform === 'ios' ? policy.ios_min_version : policy.android_min_version;
  const storeUrl =
    platform === 'ios' ? policy.ios_store_url : policy.android_store_url;

  if (!minVersion || !isVersionLessThan(currentVersion, minVersion)) {
    return null;
  }

  return {
    message: policy.message,
    minVersion,
    storeUrl: storeUrl || getStoreUrlForPlatform(platform),
  };
}

export async function fetchAppVersionPolicy(): Promise<AppVersionPolicy> {
  const response = await api.get<{ success: boolean; data: AppVersionPolicy }>(
    '/app-version'
  );
  return response.data.data;
}

export async function checkForceUpdateRequired(): Promise<ForceUpdatePayload | null> {
  const platform = getNativeAppPlatform();
  const currentVersion = getNativeAppVersion();
  const policy = await fetchAppVersionPolicy();
  return evaluateVersionPolicy(policy, platform, currentVersion);
}
