// File: app/(tabs)/settings.tsx

import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { SettingsRow } from '../../components/SettingsRow';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = () => {
    signOut(() => router.replace('/(auth)/signIn'));
  };

  if (isAuthLoading || !user) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.profileHeader}>
        <Image
          source={user.user_metadata?.avatar_url ? { uri: user.user_metadata.avatar_url } : require('../../assets/images/icon.png')}
          style={[styles.avatar, { borderColor: colors.primary }]}
        />
        <Text style={[styles.name, { color: colors.text }]}>{user.user_metadata?.full_name || "Fuel Finder User"}</Text>
      </View>

      <View style={styles.section}>
        <SettingsRow label="View Profile" iconName="person-circle-outline" onPress={() => router.push('/profile')} />
        <SettingsRow label="Change Password" iconName="lock-closed-outline" onPress={() => router.push('/change-password')} />
        <SettingsRow label="Privacy Policy" iconName="shield-checkmark-outline" onPress={() => router.push('/privacy-policy')} />
        <SettingsRow label="Contact Us" iconName="mail-outline" onPress={() => router.push('/contact-us')} />
      </View>

      <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} style={styles.icon} />
          <View style={styles.switchTextContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Push Notifications</Text>
            <Text style={[styles.labelDescription, { color: colors.textSecondary }]}>Automatically send me notifications</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
            onValueChange={() => setNotificationsEnabled(previousState => !previousState)}
            value={notificationsEnabled}
          />
      </View>
      
      <View style={styles.section}>
        <SettingsRow label="Delete Account" iconName="trash-outline" onPress={() => router.push('/delete-account')} isDestructive />
      </View>

      <Pressable style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  section: { marginBottom: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 20 },
  switchTextContainer: { flex: 1 },
  icon: { marginRight: 15 },
  label: { fontSize: 16 },
  labelDescription: { fontSize: 12 },
  logoutButton: { backgroundColor: '#dc3545', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  logoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});