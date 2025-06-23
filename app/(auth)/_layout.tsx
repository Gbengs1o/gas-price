// Corrected: app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      {/* CHANGE: The name now matches the camelCase filename "signIn.tsx" */}
      <Stack.Screen name="signIn" options={{ headerShown: false }} />
      
      {/* CHANGE: The name now matches the camelCase filename "signUp.tsx" */}
      <Stack.Screen name="signUp" options={{ headerShown: false }} />
    </Stack>
  );
}