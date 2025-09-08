// app/(auth)/resetPassword.tsx

import React, { useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  View, 
  TextInput, 
  Pressable, 
  Text, 
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (loading) return;

    if (!password || !confirmPassword) {
      Alert.alert('Password Required', 'Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please ensure both passwords are the same.');
      return;
    }

    setLoading(true);

    // Because the OTP was verified on the previous screen, we have an active session
    // and can now update the user's password directly.
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Password Updated', 
        'Your password has been successfully updated. Please sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/signIn') }]
      );
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>You're almost done. Enter your new password below.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#888"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#888"
      />
      
      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleResetPassword} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </Pressable>
    </View>
  );
}

// Using the same styles for consistency
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center', paddingHorizontal: 10 },
    input: { width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 15, color: '#333' },
    button: { width: '100%', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, flexDirection: 'row', backgroundColor: '#007BFF' },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});