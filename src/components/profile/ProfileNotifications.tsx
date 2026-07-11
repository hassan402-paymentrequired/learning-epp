import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getDeviceTimezone,
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '@/services/notifications';

const REMINDER_PRESETS = ['06:00', '07:00', '08:00', '09:00', '10:00'];

export function ProfileNotifications() {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [reminderTime, setReminderTime] = useState('07:00');
  const [subscriptionReminders, setSubscriptionReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationSettings();
      setSettings(data);
      setReminderTime(data.morning_reminder_time || '07:00');
      setSubscriptionReminders(data.subscription_reminder_emails_enabled);
      setMarketingEmails(data.marketing_emails_enabled);
    } catch {
      setSettings({
        push_notifications_enabled: true,
        morning_reminder_time: '07:00',
        timezone: getDeviceTimezone(),
        has_push_subscription: false,
        subscription_reminder_emails_enabled: true,
        marketing_emails_enabled: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const notificationsEnabled = settings?.push_notifications_enabled ?? true;

  const handleToggleReminders = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const data = await updateNotificationSettings({
        push_notifications_enabled: enabled,
        timezone: getDeviceTimezone(),
      });
      setSettings(data);
      Alert.alert(
        'Updated',
        enabled ? 'Morning reminders enabled.' : 'Morning reminders turned off.'
      );
    } catch {
      Alert.alert('Error', 'Could not update reminder settings.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveReminderTime = async () => {
    if (!/^\d{2}:\d{2}$/.test(reminderTime)) {
      Alert.alert('Invalid time', 'Use HH:MM format, e.g. 07:00');
      return;
    }

    setUpdating(true);
    try {
      const data = await updateNotificationSettings({
        morning_reminder_time: reminderTime,
        timezone: getDeviceTimezone(),
      });
      setSettings(data);
      setReminderTime(data.morning_reminder_time);
      Alert.alert('Saved', 'Reminder time updated.');
    } catch {
      Alert.alert('Error', 'Could not save reminder time.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEmailPreferences = async () => {
    setUpdating(true);
    try {
      const data = await updateNotificationSettings({
        subscription_reminder_emails_enabled: subscriptionReminders,
        marketing_emails_enabled: marketingEmails,
      });
      setSettings(data);
      Alert.alert('Saved', 'Email preferences updated.');
    } catch {
      Alert.alert('Error', 'Could not save email preferences.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Notifications
        </ThemedText>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={tintColor} />
          <ThemedText style={styles.muted}>Loading notification settings...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Notifications
      </ThemedText>

      <View style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="notifications" size={22} color={tintColor} />
          <ThemedText style={styles.cardTitle}>Morning reminders</ThemedText>
        </View>
        <ThemedText style={styles.muted}>
          Get a streak reminder at your preferred time. Turn them off if you prefer not to be notified.
        </ThemedText>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <ThemedText style={styles.toggleLabel}>
              {notificationsEnabled ? 'Reminders on' : 'Reminders off'}
            </ThemedText>
            <ThemedText style={styles.mutedSmall}>
              {settings?.has_push_subscription
                ? 'Push subscription active on your account'
                : 'Preference synced to your account'}
            </ThemedText>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => void handleToggleReminders(value)}
            disabled={updating}
            trackColor={{ false: '#d4d4d8', true: tintColor + '80' }}
            thumbColor={notificationsEnabled ? tintColor : '#f4f4f5'}
          />
        </View>

        {notificationsEnabled && (
          <View style={styles.reminderBlock}>
            <ThemedText style={styles.fieldLabel}>Reminder time</ThemedText>
            <View style={styles.presetRow}>
              {REMINDER_PRESETS.map((time) => {
                const selected = reminderTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.presetChip,
                      {
                        borderColor: selected ? tintColor : borderColor,
                        backgroundColor: selected ? tintColor + '15' : 'transparent',
                      },
                    ]}
                    onPress={() => setReminderTime(time)}
                    disabled={updating}
                  >
                    <ThemedText
                      style={[styles.presetText, selected && { color: tintColor }]}
                    >
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="07:00"
              placeholderTextColor="#a1a1aa"
              editable={!updating}
              style={[
                styles.timeInput,
                { borderColor, color: textColor, backgroundColor: cardBackground },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={5}
            />

            <ThemedText style={styles.mutedSmall}>
              Timezone: {settings?.timezone || getDeviceTimezone()}
            </ThemedText>

            <Button
              title={updating ? 'Saving...' : 'Save reminder time'}
              onPress={() => void handleSaveReminderTime()}
              disabled={updating}
              variant="outline"
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
            />
          </View>
        )}
      </View>

      <View style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="mail-outline" size={22} color={tintColor} />
          <ThemedText style={styles.cardTitle}>Email preferences</ThemedText>
        </View>
        <ThemedText style={styles.muted}>
          Account and security emails are always sent. Choose what else you receive.
        </ThemedText>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setSubscriptionReminders((prev) => !prev)}
          disabled={updating}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: subscriptionReminders ? tintColor : borderColor,
                backgroundColor: subscriptionReminders ? tintColor : 'transparent',
              },
            ]}
          >
            {subscriptionReminders && (
              <MaterialIcons name="check" size={14} color="#fff" />
            )}
          </View>
          <View style={styles.checkCopy}>
            <ThemedText style={styles.toggleLabel}>Subscription reminders</ThemedText>
            <ThemedText style={styles.mutedSmall}>
              Heads-up 7 days and 1 day before your subscription expires.
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setMarketingEmails((prev) => !prev)}
          disabled={updating}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: marketingEmails ? tintColor : borderColor,
                backgroundColor: marketingEmails ? tintColor : 'transparent',
              },
            ]}
          >
            {marketingEmails && (
              <MaterialIcons name="check" size={14} color="#fff" />
            )}
          </View>
          <View style={styles.checkCopy}>
            <ThemedText style={styles.toggleLabel}>Product updates and tips</ThemedText>
            <ThemedText style={styles.mutedSmall}>
              Occasional study tips and gentle reminders when you've been away.
            </ThemedText>
          </View>
        </TouchableOpacity>

        <Button
          title={updating ? 'Saving...' : 'Save email preferences'}
          onPress={() => void handleSaveEmailPreferences()}
          disabled={updating}
          variant="outline"
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  muted: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  mutedSmall: {
    fontSize: 12,
    opacity: 0.65,
    lineHeight: 16,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  reminderBlock: {
    gap: 10,
    paddingTop: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    height: 40,
    minHeight: 40,
    paddingVertical: 0,
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 14,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkCopy: {
    flex: 1,
  },
});
