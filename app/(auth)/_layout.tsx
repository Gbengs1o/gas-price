// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      {/* This screen is the entry point of the auth stack */}
      <Stack.Screen name="signIn" options={{ headerShown: false }} />
      
      {/* This screen is also part of the auth stack */}
      <Stack.Screen name="signUp" options={{ headerShown: false }} />

      {/* 
        ADD THIS LINE:
        This tells the navigator that 'resetPassword' is a valid screen.
        The name must match the filename: "resetPassword.tsx".
      */}
      <Stack.Screen name="resetPassword" options={{ headerShown: false }} />
    </Stack>
  );
}