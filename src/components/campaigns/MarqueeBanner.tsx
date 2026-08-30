import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { Campaign } from '@/services/campaigns';

interface MarqueeBannerProps {
  campaign: Campaign;
}

// Roughly how fast the text scrolls, in pixels per second.
const SCROLL_SPEED_PX_PER_SEC = 60;
const GAP = 48;

export function MarqueeBanner({ campaign }: MarqueeBannerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useSharedValue(0);

  const text = campaign.message ? `${campaign.title} — ${campaign.message}` : campaign.title;

  useEffect(() => {
    if (textWidth === 0) return;

    const distance = textWidth + GAP;
    const duration = (distance / SCROLL_SPEED_PX_PER_SEC) * 1000;

    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-distance, { duration, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = () => {
    if (campaign.link) {
      Linking.openURL(campaign.link).catch(() => {});
    }
  };

  const handleTextLayout = (event: LayoutChangeEvent) => {
    setTextWidth(event.nativeEvent.layout.width);
  };

  return (
    <TouchableOpacity
      activeOpacity={campaign.link ? 0.8 : 1}
      onPress={handlePress}
      disabled={!campaign.link}
      style={[styles.container, { backgroundColor: tintColor + '15' }]}
    >
      <View style={styles.clip}>
        <Animated.View style={[styles.row, animatedStyle]}>
          <ThemedText
            onLayout={handleTextLayout}
            numberOfLines={1}
            style={[styles.text, { color: textColor, marginRight: GAP }]}
          >
            {text}
          </ThemedText>
          {textWidth > 0 && (
            <ThemedText numberOfLines={1} style={[styles.text, { color: textColor, marginRight: GAP }]}>
              {text}
            </ThemedText>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  clip: {
    overflow: 'hidden',
    paddingLeft: 16,
  },
  row: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
