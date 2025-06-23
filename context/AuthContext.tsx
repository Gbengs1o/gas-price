// File: context/AuthContext.tsx

import React, { useState, useEffect, createContext, useContext, PropsWithChildren } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: (callback?: () => void) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This function handles getting permission and the push token
async function registerForPushNotificationsAsync(userId: string): Promise<string | undefined> {
  let token;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      // User did not grant permissions, so we can't get a token.
      return;
    }

    // This is the crucial part with your specific Project ID.
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '974cfc38-9485-4dad-ac04-aa5c46b42a76', 
    })).data;

    // Save the new token to the user's profile in your Supabase database.
    if (token) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    }

  } catch (error: any) {
    // This will alert the user if something goes wrong, like no internet connection.
    console.error("Push notification registration failed:", error);
    Alert.alert("Push Notification Error", "Could not register for push notifications. Please check your internet connection and try again.");
  }
  
  // This is required for Android notifications to show up while the app is in the foreground.
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

  useEffect(() => {
    // This effect runs once when the app starts.
    const fetchSessionAndRegister = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // If a user is already logged in, register their device for notifications.
      if (session?.user.id) {
        await registerForPushNotificationsAsync(session.user.id);
      }
      setIsLoading(false);
    };
    
    fetchSessionAndRegister();

    // This listens for authentication changes (login/logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      
      // If a user just signed in, register their device.
      if (_event === 'SIGNED_IN' && newSession?.user.id) {
        await registerForPushNotificationsAsync(newSession.user.id);
      }
    });

    // Cleanup the subscription when the component unmounts.
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async (callback?: () => void) => {
    // When signing out, remove the push token from their profile to stop notifications.
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

  const value = {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut,
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