// File: app/(tabs)/settings.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { SettingsRow } from '../../components/SettingsRow';
import { LetterAvatar } from '../../components/LetterAvatar';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  // --- MODIFIED ---
  // Destructure the new `isProfileLoading` state from the context
  const { user, profile, fetchProfile, signOut, isLoading: isAuthLoading, isProfileLoading } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Re-fetch the profile every time the settings tab is viewed.
  // This is now safe and won't cause a flicker.
  useEffect(() => {
    if (isFocused && user) {
      fetchProfile(user);
    }
  }, [isFocused, user]); // Note: `fetchProfile` is stable due to useCallback in context

  const handleSignOut = () => {
    signOut(() => router.replace('/(auth)/signIn'));
  };

  // --- MODIFIED LOADING LOGIC ---

  // Show a loader during the initial app session load
  if (isAuthLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show a loader ONLY if the profile is being fetched for the very first time
  if (isProfileLoading && !profile) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show an error/empty state if the profile failed to load and isn't loading anymore
  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Could not load user profile.</Text>
        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.contentContainer}
    >
      {/* --- NEW: Subtle loading indicator for refreshes --- */}
      {isProfileLoading && (
        <View style={styles.refreshingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <View style={styles.profileHeader}>
        <LetterAvatar 
          avatarUrl={profile.avatar_url} 
          name={profile.full_name}
          size={120}
          textStyle={{ fontSize: 48 }}
        />
        <Text style={[styles.name, { color: colors.text }]}>{profile.full_name || "Fuel Finder User"}</Text>
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
  contentContainer: { 
    flexGrow: 1,
    padding: 16,
    paddingBottom: 80,
  },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 16 },
  refreshingIndicator: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 10,
  },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  section: { marginBottom: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 20 },
  switchTextContainer: { flex: 1 },
  icon: { marginRight: 15 },
  label: { fontSize: 16 },
  labelDescription: { fontSize: 12 },
  logoutButton: { backgroundColor: '#dc3545', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  logoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});