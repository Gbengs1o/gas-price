// File: context/AuthContext.tsx

import React, { useState, useEffect, createContext, useContext, PropsWithChildren, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// --- ADDED: Define a type for the user profile ---
type ProfileType = {
  full_name: string;
  avatar_url: string;
};

// --- MODIFIED: Update the context type to include profile data and functions ---
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: ProfileType | null; // Added profile state
  isLoading: boolean; // For initial session loading
  isProfileLoading: boolean; // For profile-specific loading
  signOut: (callback?: () => void) => void;
  fetchProfile: (user: User) => Promise<void>; // Added fetchProfile function
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This function handles getting permission and the push token (no changes here)
async function registerForPushNotificationsAsync(userId: string): Promise<string | undefined> {
  // ... (this function remains exactly the same)
  let token;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '974cfc38-9485-4dad-ac04-aa5c46b42a76', 
    })).data;
    if (token) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    }
  } catch (error: any) {
    console.error("Push notification registration failed:", error);
    Alert.alert("Push Notification Error", "Could not register for push notifications. Please check your internet connection and try again.");
  }
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return token;
}


export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- ADDED: State for profile data and loading status ---
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // --- ADDED: The missing fetchProfile function ---
  // Wrapped in useCallback for performance, as recommended by React hooks rules.
  const fetchProfile = useCallback(async (user: User) => {
    if (!user) return; // Don't run if there's no user
    
    setIsProfileLoading(true);
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, avatar_url`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data as ProfileType);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set profile to null on error to allow the UI to show an error state
      setProfile(null); 
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession?.user) {
        await fetchProfile(currentSession.user); // Fetch profile on initial load
        await registerForPushNotificationsAsync(currentSession.user.id);
      }
      setIsLoading(false);
    };
    
    fetchSessionAndData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      // If a user just logged in, fetch their profile and register for push notifications
      if (_event === 'SIGNED_IN' && newSession?.user) {
        await fetchProfile(newSession.user);
        await registerForPushNotificationsAsync(newSession.user.id);
      }
      
      // If user signed out, clear the profile data
      if (_event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]); // Added fetchProfile to dependency array

  const signOut = async (callback?: () => void) => {
    if (session?.user.id) {
      await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', session.user.id);
    }
    await supabase.auth.signOut();
    if (callback) {
      callback();
    }
  };

  // --- MODIFIED: Add the new state and functions to the provided value ---
  const value = {
    session,
    user: session?.user ?? null,
    profile, // Added
    isLoading,
    isProfileLoading, // Added
    signOut,
    fetchProfile, // Added
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}