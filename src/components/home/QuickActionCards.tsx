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
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  if (!categories || categories.length === 0) {
    return null;
  }

  // Pre-defined pastel colors for icons
  const iconThemes = [
    { bg: '#f5f3ff', color: '#6d28d9' }, // Violet
    { bg: '#fff7ed', color: '#ea580c' }, // Orange
    { bg: '#eff6ff', color: '#2563eb' }, // Blue
    { bg: '#f0fdf4', color: '#16a34a' }, // Green
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Practice Subjects
        </ThemedText>
        <TouchableOpacity>
          <ThemedText style={styles.viewAllBtn}>View all</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.listContainer, { borderColor }]}>
        {categories.map((category, index) => {
          const theme = iconThemes[index % iconThemes.length];
          const isLast = index === categories.length - 1;

          return (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.6}
              onPress={() => onCategoryPress(category)}
              style={[
                styles.listItem,
                !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor } // Divider instead of separate cards
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                <MaterialIcons name={(category.icon_name as any) || 'menu-book'} size={24} color={theme.color} />
              </View>
              
              <View style={styles.textContainer}>
                <ThemedText style={[styles.itemTitle, { color: textColor }]}>
                  {category.name}
                </ThemedText>
                <ThemedText style={styles.itemDescription} numberOfLines={1}>
                  {category.description}
                </ThemedText>
              </View>

              <MaterialIcons name="chevron-right" size={24} color="#a1a1aa" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.primary.bold,
  },
  viewAllBtn: {
    fontSize: 14,
    color: '#4800b2',
    fontFamily: Fonts.primary.medium,
  },
  listContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8, // Smaller radius
    overflow: 'hidden',
    backgroundColor: '#ffffff', // Clean flat background
    // Deliberately no shadows applied
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8, // Subtle corner
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: Fonts.primary.semiBold,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#71717a', 
    fontFamily: Fonts.primary.regular,
  },
});
