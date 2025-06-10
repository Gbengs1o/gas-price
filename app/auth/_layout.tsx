// File: app/auth/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="signIn" options={{ headerShown: false }} />
      <Stack.Screen name="signUp" options={{ headerShown: false }} />
    </Stack>
  );
}