export const IOS_STORE_URL =
  'https://apps.apple.com/us/app/stepra-prep/id6789680121';

export const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.oluwafemiomoope.stepra';

export function getStoreUrlForPlatform(platform: 'ios' | 'android'): string {
  return platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
}
