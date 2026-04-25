import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/Fonts';
import { ExamCategory } from '@/screens/Home';

interface QuickActionCardsProps {
  categories: ExamCategory[];
  onCategoryPress: (category: ExamCategory) => void;
}

export function QuickActionCards({ categories, onCategoryPress }: QuickActionCardsProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');

  if (!categories || categories.length === 0) {
    return null;
  }

  // Determine colors based on index for variety
  const getCardStyle = (index: number) => {
    // Alternate between tintColor and cardBackground
    const isTint = index % 2 === 0;
    return {
      backgroundColor: isTint ? tintColor : cardBackground,
      textColor: isTint ? '#fff' : textColor,
      iconColor: isTint ? '#fff' : tintColor,
    };
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Start Practice
      </ThemedText>
      <View style={styles.cardsContainer}>
        {categories.map((category, index) => {
          const style = getCardStyle(index);
          return (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.7}
              onPress={() => onCategoryPress(category)}
              style={[
                styles.card,
                {
                  backgroundColor: style.backgroundColor,
                  borderColor: borderColor,
                },
              ]}
            >
              <MaterialIcons name={category.icon_name as any} size={32} color={style.iconColor} />
              <ThemedText type="subtitle" style={[styles.cardTitle, { color: style.textColor }]}>
                {category.name}
              </ThemedText>
              <ThemedText style={[styles.cardDescription, { color: style.textColor, opacity: style.textColor === '#fff' ? 0.9 : 0.7 }]}>
                {category.description}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
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
