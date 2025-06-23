// Corrected: app/(auth)/signUp.tsx

import React, { useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  View, 
  TextInput, 
  Pressable, 
  Text, 
  ActivityIndicator 
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

// The component name is conventionally PascalCase, matching the filename.
export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ... (async signUpWithEmail function remains the same) ...
  async function signUpWithEmail() {
    if (loading) return;
    if (!fullName || !username || !email || !password) {
        Alert.alert('Missing Information', 'Please fill out all fields.');
        return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: username.trim(),
        },
      },
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (!data.session) {
      Alert.alert(
        'Check Your Email', 
        'A confirmation link has been sent to your email. Please verify it to complete registration.'
      );
    }
    setLoading(false);
  }


  return (
    <View style={styles.container}>
      {/* ... (UI elements remain the same) ... */}
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the community today!</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} placeholderTextColor="#888" />
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor="#888" />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#888" />
      <TextInput style={styles.input} placeholder="Password (min. 6 characters)" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#888" />
      <Pressable style={[styles.button, styles.signUpButton, loading && styles.buttonDisabled]} onPress={signUpWithEmail} disabled={loading}>
        {loading ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.buttonText}>Sign Up</Text>)}
      </Pressable>

      {/* CHANGE: The href is now camelCase to match the filename "signIn.tsx" */}
      <Link href="/signIn" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? <Text style={{fontWeight: 'bold'}}>Sign In</Text></Text>
        </Pressable>
      </Link>
    </View>
  );
}

// ... (Styles remain the same) ...
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
  signUpButton: {
    backgroundColor: '#28a745',
  },
  buttonDisabled: {
    opacity: 0.7,
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