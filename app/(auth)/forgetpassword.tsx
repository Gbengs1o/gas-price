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
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendResetLink() {
    // Dismiss the keyboard for a cleaner UI
    Keyboard.dismiss();

    if (loading) return;

    // Basic client-side validation
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    setLoading(true);

    // This URL is built from the "scheme" in your app.json.
    // It tells Supabase where to redirect the user after they click the email link.
    const redirectUrl = 'gaspricenigeria://resetPassword';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Check Your Email', 
        'A password reset link has been sent to your email address.'
      );
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter the email address associated with your account to receive a reset link.</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="your.email@example.com" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
        placeholderTextColor="#888" 
        autoComplete="email"
      />
      
      <Pressable 
        style={[styles.button, styles.resetButton, loading && styles.buttonDisabled]} 
        onPress={sendResetLink} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </Pressable>

      <Link href="/signIn" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>Back to <Text style={{fontWeight: 'bold'}}>Sign In</Text></Text>
        </Pressable>
      </Link>
    </View>
  );
}

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
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 10,
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
    flexDirection: 'row', // To center ActivityIndicator
  },
  resetButton: {
    backgroundColor: '#007BFF',
  },
  buttonDisabled: {
    backgroundColor: '#0056b3', // Darken the color slightly when disabled
    opacity: 0.8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    padding: 10,
  },
  linkText: {
    color: '#007BFF',
    fontSize: 16,
  },
});