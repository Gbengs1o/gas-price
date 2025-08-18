// File: app/_layout.tsx
// MODIFIED: This is the fully functional root layout with the authentication guard.

// File: app/_layout.tsx
// This is the fully functional root layout with the CORRECTED authentication guard.

import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Keep the splash screen visible until we are ready to render the right screen.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoadingTheme } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait until both the theme and auth state are loaded.
    if (isLoadingTheme || isAuthLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // --- THIS IS THE CORRECTED AUTHENTICATION GUARD LOGIC ---

    // 1. If the user is NOT signed in and is trying to access a protected route...
    if (!session && inTabsGroup) {
      // Redirect them to the sign-in page.
      router.replace('/(auth)/signIn'); // More specific path
    } 
    // 2. If the user IS signed in but is on an auth screen (e.g., signIn)...
    else if (session && inAuthGroup) { // <-- THE CRITICAL CHANGE IS HERE
      // Redirect them to the main part of the app.
      router.replace('/(tabs)/home');
    }
    
    // Once everything is ready and navigation is handled, hide the splash screen.
    SplashScreen.hideAsync();

  }, [isLoadingTheme, isAuthLoading, session, segments]);

  // If theme or auth is still loading, return null to keep the splash screen visible.
  // Returning a blank view with a spinner is a good practice if splash screen hiding is tricky.
  if (isLoadingTheme || isAuthLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator />
        </View>
    );
  }

  return (
    <Stack>
      {/* These screens are available to all users, signed in or not */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      
      {/* Auth screens (signIn, resetPassword, etc.) are in this group */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* The main app screens are in this group, now protected by the logic above */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Your other full-screen and modal pages. The guard will now correctly ignore them. */}
      <Stack.Screen name="station/[id]" options={{ headerShown: true, title: "Station Details" }} />
      <Stack.Screen name="addStation" options={{ presentation: 'modal', title: "Add New Station" }} />
      <Stack.Screen name="report/submit" options={{ presentation: 'modal', title: "Submit Fuel Report" }} />
      <Stack.Screen name="locationSearch" options={{ presentation: 'modal', title: "Select Location" }} />
      
      {/* Profile and Settings Modals */}
      <Stack.Screen name="profile" options={{ presentation: 'modal', title: "View Profile" }} />
      <Stack.Screen name="change-password" options={{ presentation: 'modal', title: "Change Password" }} />
      <Stack.Screen name="privacy-policy" options={{ presentation: 'modal', title: "Privacy Policy" }} />
      <Stack.Screen name="contact-us" options={{ presentation: 'modal', title: "Contact Us" }} />
      <Stack.Screen name="delete-account" options={{ presentation: 'modal', title: "Delete Account" }} />
    </Stack>
  );
}

// This part remains the same, wrapping the app in your providers.
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

// npx expo run:android
