// File: app/index.tsx

import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  // We can safely call useAuth() here because this component is rendered *inside*
  // the AuthProvider defined in our root _layout.tsx.
  const { user, isLoading } = useAuth();

  // 1. While the AuthContext is checking for a user session, show a loading spinner.
  if (isLoading) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007BFF" />
        </View>
    );
  }

  // 2. If loading is done and there is NO user, redirect to the sign-in screen.
  if (!user) {
    // The user is not signed in, send them to the (auth) group's sign-in page.
    return <Redirect href="/(auth)/signIn" />;
  }
  
  // 3. If loading is done and there IS a user, redirect to the main app's home screen.
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});