// File: app/auth/signUp.tsx

import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignUpWithGoogle = () => {
    console.log("Mock: Attempting Sign Up with Google...");
    Alert.alert(
      "Signing up with Google (Mock)",
      "This would create an account and log you in.",
      [{ text: "OK", onPress: () => router.replace('/home') }]
    );
  };

  const onSignUpWithEmail = () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    console.log("Mock Sign Up with Email Success:", { name, email });
    Alert.alert(
      "Account Created (Mock)",
      "You can now sign in with your credentials.",
      [{ text: "OK", onPress: () => router.replace('/auth/signIn') }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the GasPrice community</Text>

      <Pressable style={styles.googleButton} onPress={onSignUpWithGoogle}>
        <FontAwesome name="google" size={24} color="white" />
        <Text style={styles.googleButtonText}>Sign up with Google</Text>
      </Pressable>

      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OR</Text>
        <View style={styles.separatorLine} />
      </View>

      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full Name" />
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />

      <Pressable style={styles.button} onPress={onSignUpWithEmail}>
        <Text style={styles.buttonText}>Sign up with Email</Text>
      </Pressable>

      <Link href="/auth/signIn" style={styles.link}>
        Already have an account? <Text style={styles.linkText}>Sign in</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

// Using the same updated styles from the sign-in screen
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'green', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: 'gray', textAlign: 'center', marginBottom: 30 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4285F4', padding: 15, borderRadius: 8, width: '100%' },
  googleButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#ccc' },
  separatorText: { marginHorizontal: 10, color: 'gray', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: 'green', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  linkText: { color: 'green', fontWeight: 'bold' },
});