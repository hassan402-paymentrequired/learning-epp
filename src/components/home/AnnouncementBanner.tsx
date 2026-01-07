import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
  link_text?: string;
}

interface AnnouncementBannerProps {
  announcement: Announcement;
  onDismiss?: () => void;
  onPress?: () => void;
}

export function AnnouncementBanner({
  announcement,
  onDismiss,
  onPress,
}: AnnouncementBannerProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  const getTypeColor = () => {
    switch (announcement.type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return tintColor;
    }
  };

  const getIcon = () => {
    switch (announcement.type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: getTypeColor() + '15',
          borderLeftColor: getTypeColor(),
          borderColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name={getIcon()} size={24} color={getTypeColor()} style={styles.icon} />
        <View style={styles.textContainer}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {announcement.title}
          </ThemedText>
          <ThemedText style={styles.message} numberOfLines={2}>
            {announcement.message}
          </ThemedText>
          {announcement.link && announcement.link_text && (
            <ThemedText style={[styles.link, { color: getTypeColor() }]}>
              {announcement.link_text} →
            </ThemedText>
          )}
        </View>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <MaterialIcons name="close" size={20} color={textColor} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: Fonts.primary.semiBold,
      android: Fonts.primary.semiBold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '600',
      default: 'normal',
    }),
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  link: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: Fonts.primary.semiBold,
      android: Fonts.primary.semiBold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '600',
      default: 'normal',
    }),
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
