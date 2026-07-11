import api from '@/services/api';

export interface NotificationSettings {
  push_notifications_enabled: boolean;
  morning_reminder_time: string;
  timezone: string;
  has_push_subscription: boolean;
  subscription_reminder_emails_enabled: boolean;
  marketing_emails_enabled: boolean;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const response = await api.get('/notification-settings');
  return response.data.data;
}

export async function updateNotificationSettings(
  payload: Partial<
    Pick<
      NotificationSettings,
      | 'push_notifications_enabled'
      | 'morning_reminder_time'
      | 'timezone'
      | 'subscription_reminder_emails_enabled'
      | 'marketing_emails_enabled'
    >
  >
): Promise<NotificationSettings> {
  const response = await api.put('/notification-settings', payload);
  return response.data.data;
}

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  } catch {
    return 'Africa/Lagos';
  }
}
