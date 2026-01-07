import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface ContinuePracticeCardProps {
  examTitle: string;
  examType: string;
  onPress: () => void;
}

export function ContinuePracticeCard({
  examTitle,
  examType,
  onPress,
}: ContinuePracticeCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: cardBackground,
          borderColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
          <MaterialIcons name="play-circle-filled" size={32} color={tintColor} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Continue Practice
          </ThemedText>
          <ThemedText style={styles.examTitle} numberOfLines={1}>
            {examTitle}
          </ThemedText>
          <ThemedText style={styles.examType}>{examType}</ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={tintColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  examTitle: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 2,
  },
  examType: {
    fontSize: 12,
    opacity: 0.6,
  },
});
