// app/(auth)/resetPassword.tsx

import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  StyleSheet, 
  View, 
  TextInput, 
  Pressable, 
  Text, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  // Get the router to navigate away after success
  const router = useRouter();
  
  // Get the tokens from the URL params. Expo Router makes this easy!
  const { error, access_token, refresh_token } = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // This effect runs when the component mounts.
  // It handles any error from the redirect and sets up the Supabase session.
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error as string);
    }
    // If we have tokens, Supabase needs to be told about them
    // to authorize the password update.
    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      });
    }
  }, [error, access_token, refresh_token]);

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

    // Use the updateUser method to set the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      Alert.alert('Error', updateError.message);
    } else {
      Alert.alert(
        'Password Updated', 
        'Your password has been successfully updated. Please sign in.'
      );
      // Navigate the user to the sign-in page on success
      router.replace('/signIn');
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      
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
        style={[styles.button, styles.resetButton, loading && styles.buttonDisabled]} 
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

// You can re-use the same styles from your other auth screens
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#007BFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});