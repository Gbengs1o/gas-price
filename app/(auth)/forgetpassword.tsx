// app/(auth)/forgotPassword.tsx

import React, { useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  View, 
  TextInput, 
  Pressable, 
  Text, 
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Link, useRouter } from 'expo-router'; // <-- Import useRouter
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter(); // <-- Get the router for navigation

  // We add a 'stage' to control what the user sees
  const [stage, setStage] = useState('enterEmail'); 
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(''); // <-- State for the OTP
  const [loading, setLoading] = useState(false);

  // Step 1: Send the recovery OTP to the user's email
  async function sendRecoveryCode() {
    Keyboard.dismiss();
    if (loading || !email) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);

    // We call resetPasswordForEmail WITHOUT the redirectTo option to get an OTP
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check Your Email', 'A 6-digit recovery code has been sent.');
      setStage('enterCode'); // <-- On success, we change the stage
    }
    setLoading(false);
  }

  // Step 2: Verify the OTP and navigate to the next screen
  async function verifyRecoveryCode() {
    Keyboard.dismiss();
    if (loading || !token) {
      Alert.alert('Code Required', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);

    // We verify the token. If it's correct, Supabase creates a temporary session.
    const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'recovery',
    });

    if (error) {
        Alert.alert('Error', error.message || 'The code is invalid or has expired.');
    } else {
        // On success, navigate the user to the final password reset page.
        router.push('/(auth)/resetPassword');
    }
    setLoading(false);
  }

  // --- UI for Stage 1: Entering the Email ---
  if (stage === 'enterEmail') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a 6-digit recovery code.</Text>
        <TextInput 
          style={styles.input} 
          placeholder="your.email@example.com" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
          placeholderTextColor="#888" 
        />
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={sendRecoveryCode} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Code</Text>}
        </Pressable>
        <Link href="/(auth)/signIn" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Back to <Text style={{fontWeight: 'bold'}}>Sign In</Text></Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  // --- UI for Stage 2: Entering the OTP Code ---
  return (
    <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>A 6-digit code was sent to {email}. Enter it below to continue.</Text>
        <TextInput 
            style={styles.input} 
            placeholder="123456" 
            value={token} 
            onChangeText={setToken} 
            keyboardType="number-pad" 
            placeholderTextColor="#888"
        />
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={verifyRecoveryCode} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify Code</Text>}
        </Pressable>
        <Pressable style={styles.linkButton} onPress={() => setStage('enterEmail')}>
            <Text style={styles.linkText}>Use a different email</Text>
        </Pressable>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center', paddingHorizontal: 10 },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 15, color: '#333' },
  button: { width: '100%', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, flexDirection: 'row', backgroundColor: '#007BFF' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 20, padding: 10 },
  linkText: { color: '#007BFF', fontSize: 16 },
});