// File: app/index.tsx
import { Redirect } from 'expo-router';

// This is the entry point of the app.
// For now, we will assume the user is ALWAYS logged out.
// So, we immediately redirect them to the sign-in screen.
// Later, we will add logic here to check for a stored user session.

export default function Index() {
  const userIsLoggedIn = false; // MOCK: Hard-coded for now

  if (userIsLoggedIn) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/auth/signIn" />;
  }
}