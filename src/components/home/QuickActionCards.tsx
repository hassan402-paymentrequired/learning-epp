import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';

interface QuickActionCardsProps {
  onJambPress: () => void;
  onDliPress: () => void;
}

export function QuickActionCards({ onJambPress, onDliPress }: QuickActionCardsProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Start Practice
      </ThemedText>
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onJambPress}
          style={[
            styles.card,
            {
              backgroundColor: tintColor,
              borderColor: borderColor,
            },
          ]}
        >
          <MaterialIcons name="school" size={32} color="#fff" />
          <ThemedText type="subtitle" style={styles.cardTitle}>
            JAMB Practice
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            Practice with past questions and mock exams
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDliPress}
          style={[
            styles.card,
            {
              backgroundColor: cardBackground,
              borderColor: borderColor,
            },
          ]}
        >
          <MaterialIcons name="menu-book" size={32} color={tintColor} />
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: textColor }]}>
            DLI Practice
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: textColor, opacity: 0.7 }]}>
            Practice with DLI-specific questions
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '700',
      default: 'normal',
    }),
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    marginTop: 12,
    marginBottom: 8,
    color: '#fff',
    fontFamily: Platform.select({
      ios: Fonts.primary.bold,
      android: Fonts.primary.bold,
      default: undefined,
    }),
    fontWeight: Platform.select({
      web: '700',
      default: 'normal',
    }),
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#fff',
    opacity: 0.9,
  },
});
