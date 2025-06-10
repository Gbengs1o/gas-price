// File: app/(tabs)/profile.tsx

import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

export default function ProfileScreen() {
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsButtonLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        console.error('Sign-in error:', error);
        Alert.alert("Sign-in Error", error.message);
        return;
      }
      
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url, 
          'gaspricenigeria://'
        );

        if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log("User cancelled the login process.");
        } else if (result.type === 'success') {
          console.log("Login successful:", result.url);
          // The auth state should update automatically via your AuthContext
        }
      } else {
        Alert.alert("Sign-in Error", "Could not get a sign-in URL from the server.");
      }

    } catch (e: any) {
      console.error('Unexpected error during sign-in:', e);
      Alert.alert("An Unexpected Error Occurred", e?.message || "Unknown error");
    } finally {
      setIsButtonLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  if (isAuthLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // --- Logged-in view ---
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Profile</Text>
        {user.user_metadata?.avatar_url && (
          <Image 
            source={{ uri: user.user_metadata.avatar_url }} 
            style={styles.avatar}
            onError={(error) => console.log('Avatar load error:', error)}
          />
        )}
        <Text style={styles.name}>
          {user.user_metadata?.full_name || user.user_metadata?.name || "Welcome!"}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>
        
        <Pressable style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  // --- Guest (logged-out) view ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join the Community</Text>
      <Text style={styles.subtitle}>
        Sign in to submit prices, track your contributions, and earn badges.
      </Text>
      
      <Pressable 
        style={[
          styles.button, 
          styles.googleButton,
          isButtonLoading && styles.buttonDisabled
        ]} 
        onPress={handleGoogleSignIn} 
        disabled={isButtonLoading}
      >
        {isButtonLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Sign In with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  centerContent: {
    justifyContent: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    color: '#333' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 30,
    lineHeight: 22
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 16, 
    borderWidth: 3, 
    borderColor: '#4285F4' 
  },
  name: { 
    fontSize: 22, 
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  email: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 24 
  },
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '80%', 
    marginBottom: 30 
  },
  statBox: { 
    alignItems: 'center' 
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  statLabel: { 
    fontSize: 14, 
    color: '#666' 
  },
  button: { 
    width: '100%', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
    minHeight: 58, 
    justifyContent: 'center' 
  },
  googleButton: { 
    backgroundColor: '#4285F4' 
  },
  signOutButton: {
    backgroundColor: '#dc3545'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  }
});