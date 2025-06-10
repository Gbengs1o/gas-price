// File: app/_layout.tsx

import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext'; // 1. Import our new provider

export default function RootLayout() {
  
  // The font loading logic can be added back here later.

  return (
    // 2. The AuthProvider now wraps the entire application.
    // This makes the user's session and status available on every screen.
    <AuthProvider>
      <Stack>
        {/* This screen will show our tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* This is the new, correct route for adding a station.
            The name "addStation" must match the filename "addStation.tsx". */}
        <Stack.Screen 
          name="addStation" 
          options={{ presentation: 'modal', title: "Pin New Station Location" }} 
        />
        
        {/* The old 'submit-report' route is no longer needed since 'addStation' replaced it. 
            It has been removed to keep the code clean. */}

      </Stack>
    </AuthProvider>
  );
}