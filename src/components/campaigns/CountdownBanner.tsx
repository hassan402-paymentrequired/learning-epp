import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CampaignPopupModal } from '@/components/campaigns/CampaignPopupModal';
import type { Campaign } from '@/services/campaigns';

interface CountdownBannerProps {
  campaign: Campaign;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
}

function getTimeLeft(targetAt: string): TimeLeft {
  const diff = new Date(targetAt).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isOver: false,
  };
}

export function CountdownBanner({ campaign }: CountdownBannerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    campaign.countdown_target_at ? getTimeLeft(campaign.countdown_target_at) : null
  );
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    if (!campaign.countdown_target_at) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(campaign.countdown_target_at!));
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign.countdown_target_at]);

  if (!timeLeft) return null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setDetailsVisible(true)}
        style={[styles.container, { borderColor, borderLeftColor: tintColor }]}
      >
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {campaign.title}
        </ThemedText>
        {campaign.message && (
          <ThemedText style={styles.message} numberOfLines={1}>
            {campaign.message}
          </ThemedText>
        )}

        {timeLeft.isOver ? (
          <ThemedText type="defaultSemiBold" style={[styles.liveText, { color: tintColor }]}>
            Live now
          </ThemedText>
        ) : (
          <View style={styles.timeRow}>
            {[
              { label: 'd', value: timeLeft.days },
              { label: 'h', value: timeLeft.hours },
              { label: 'm', value: timeLeft.minutes },
              { label: 's', value: timeLeft.seconds },
            ].map((unit) => (
              <View key={unit.label} style={styles.timeUnit}>
                <ThemedText type="defaultSemiBold" style={[styles.timeValue, { color: tintColor }]}>
                  {String(unit.value).padStart(2, '0')}
                  {unit.label}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <CampaignPopupModal
        campaign={campaign}
        visible={detailsVisible}
        onDismiss={() => setDetailsVisible(false)}
        closeLabel="Close"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeUnit: {
    flex: 1,
  },
  timeValue: {
    fontSize: 18,
    textAlign: 'center',
  },
  liveText: {
    fontSize: 16,
  },
});
