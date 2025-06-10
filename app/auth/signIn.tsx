// File: app/auth/signIn.tsx

import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // Import the icon library

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mock function for Google Sign-In
  const onSignInWithGoogle = () => {
    // In a real app, this would trigger the Google Sign-In flow.
    // For our mock-up, we'll just log it and navigate to home.
    console.log("Mock: Attempting Sign In with Google...");
    Alert.alert(
      "Signing in with Google (Mock)",
      "You would now see the Google login popup.",
      [{ text: "OK", onPress: () => router.replace('/home') }]
    );
  };

  const onSignInWithEmail = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    console.log("Mock Sign In with Email Success:", { email, password });
    router.replace('/home');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>GasPrice Nigeria</Text>
      <Text style={styles.subtitle}>Welcome back! Sign in to continue.</Text>

      {/* Google Sign-In Button */}
      <Pressable style={styles.googleButton} onPress={onSignInWithGoogle}>
        <FontAwesome name="google" size={24} color="white" />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </Pressable>

      {/* Separator */}
      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OR</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Email and Password Fields */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Password"
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={onSignInWithEmail}>
        <Text style={styles.buttonText}>Sign in with Email</Text>
      </Pressable>

      <Link href="/auth/signUp" style={styles.link}>
        Don't have an account? <Text style={styles.linkText}>Sign up</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

// --- Updated Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'green', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: 'gray', textAlign: 'center', marginBottom: 30 },
  
  // Google Button Styles
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4', // Google's brand blue
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // Separator Styles
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  separatorText: {
    marginHorizontal: 10,
    color: 'gray',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Email/Password Styles
  input: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: 'green', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  linkText: { color: 'green', fontWeight: 'bold' },
});