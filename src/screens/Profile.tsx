import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <ThemedText type="title" style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.name || 'User'}
          </ThemedText>
          <ThemedText style={styles.email}>{user?.email || ''}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account Information
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <ThemedText style={styles.value}>{user?.name || 'N/A'}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <ThemedText style={styles.value}>{user?.email || 'N/A'}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>User ID</ThemedText>
            <ThemedText style={styles.value}>#{user?.id || 'N/A'}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Settings
          </ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            <ThemedText style={styles.settingValue}>Enabled</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Language</ThemedText>
            <ThemedText style={styles.settingValue}>English</ThemedText>
          </TouchableOpacity>
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
  },
  name: {
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  label: {
    fontWeight: '600',
  },
  value: {
    opacity: 0.7,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    opacity: 0.7,
  },
  logoutButton: {
    marginTop: 24,
  },
});
