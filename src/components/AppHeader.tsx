import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface AppHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function AppHeader({ showBackButton = false, title }: AppHeaderProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const handleProfilePress = () => {
    // @ts-ignore
    navigation.navigate('Profile');
  };

  return (
    <View style={[styles.header, { backgroundColor, borderBottomColor: borderColor }]}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.iconButton}
          >
            <View style={[styles.avatar, { backgroundColor: tintColor }]}>
              <ThemedText style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        {title && (
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
        )}
      </View>

      <View style={styles.rightSection}>
        <ThemedText type="subtitle" style={styles.appName}>
          Exam Prep
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  leftSection: {
    width: 80,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 80,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9,
  },
});
