// app/_layout.tsx

// FIX #1: This import must be the very first line to solve the crypto crash.
import 'react-native-get-random-values';

// FIX #2: The main React object must be imported to use JSX.
import React, { useEffect } from 'react';

import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ActivityIndicator, View } from 'react-native';

// Keep the splash screen visible until we are ready to render the right screen.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoadingTheme } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoadingTheme || isAuthLoading) {
      return;
    }

    const inTabsGroup = segments[0] === '(tabs)';
    
    // =======================================================================
    // START OF FIX
    // We add a new variable to check if the user is on the reset password page.
    const isResetPasswordPage = segments[0] === '(auth)' && segments[1] === 'resetPassword';
    // END OF FIX
    // =======================================================================
    
    // This part is the same:
    // If the user is NOT signed in and is trying to access a protected route...
    if (!session && inTabsGroup) {
      // Redirect them to the sign-in page.
      router.replace('/(auth)/signIn');
    } 
    // If the user IS signed in...
    else if (session) {
      // =======================================================================
      // START OF FIX
      // We add a check here to make sure the user is NOT on the reset password page
      // before we redirect them. This is the special exception for our "bouncer".
      if (!inTabsGroup && !isResetPasswordPage) {
        // Redirect them to the main part of the app.
        router.replace('/(tabs)/home');
      }
      // END OF FIX
      // =======================================================================
    }
    
    // Once everything is ready and navigation is handled, hide the splash screen.
    SplashScreen.hideAsync();

  }, [isLoadingTheme, isAuthLoading, session, segments]);

  if (isLoadingTheme || isAuthLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large"/>
        </View>
    );
  }

  return (
    <Stack>
      {/* These are layout groups. The router will look for a _layout.tsx file inside them. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* These are individual screens. The router will look for a matching file in the `app` directory. */}
      {/* For example, `app/station/[id].tsx` is required for the route below. */}
      <Stack.Screen name="station/[id]" options={{ headerShown: true, title: "Station Details" }} />
      <Stack.Screen name="addStation" options={{ presentation: 'modal', title: "Add New Station" }} />
      <Stack.Screen name="report/submit" options={{ presentation: 'modal', title: "Submit Fuel Report" }} />
      <Stack.Screen name="locationSearch" options={{ presentation: 'modal', title: "Select Location" }} />
      
      {/* Profile and Settings Modals */}
      {/* For these to work, you must have files like `app/profile.tsx`, `app/change-password.tsx`, etc. */}
      <Stack.Screen name="profile" options={{ presentation: 'modal', title: "View Profile" }} />
      <Stack.Screen name="change-password" options={{ presentation: 'modal', title: "Change Password" }} />
      <Stack.Screen name="privacy-policy" options={{ presentation: 'modal', title: "Privacy Policy" }} />
      <Stack.Screen name="contact-us" options={{ presentation: 'modal', title: "Contact Us" }} />
      <Stack.Screen name="delete-account" options={{ presentation: 'modal', title: "Delete Account" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}