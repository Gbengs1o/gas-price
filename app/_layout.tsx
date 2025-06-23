// File: app/_layout.tsx

import { Stack, SplashScreen } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { isLoadingTheme } = useTheme();

  useEffect(() => {
    if (!isLoadingTheme) SplashScreen.hideAsync();
  }, [isLoadingTheme]);

  if (isLoadingTheme) return null;

  return (
    <Stack>
      {/* Main app screens */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* Existing Full-screen pages */}
      <Stack.Screen name="station/[id]" options={{ headerShown: true, title: "Station Details" }} />

      {/* --- NEW: Full-screen profile page --- */}
      <Stack.Screen name="profile" options={{ headerShown: true, title: "My Profile" }} />

      {/* Modal screens */}
      <Stack.Screen name="addStation" options={{ presentation: 'modal', title: "Add New Station" }} />
      <Stack.Screen name="report/submit" options={{ presentation: 'modal', title: "Submit Fuel Report" }} />
      <Stack.Screen name="locationSearch" options={{ presentation: 'modal', title: "Select Location" }} />

      {/* --- NEW: Modal settings pages --- */}
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
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}