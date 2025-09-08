// File: app/(auth)/signup.tsx
// MODIFIED: OTP verification has been completely removed for a direct email/password signup.

import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

import PhoneInput from 'react-native-phone-number-input';

// This component remains the same
const PhoneInputComponent = ({ phone, setPhone }: { phone: string; setPhone: (text: string) => void; }) => {
  return (
    <PhoneInput
      defaultValue={phone}
      defaultCode="NG"
      layout="first"
      onChangeFormattedText={(text) => setPhone(text)}
      containerStyle={styles.phoneInputContainer}
      textContainerStyle={styles.phoneInputTextContainer}
      codeTextStyle={{ fontSize: 16 }}
      textInputStyle={{ fontSize: 16 }}
      placeholder="Your mobile number"
    />
  );
};

export default function SignUpScreen() {
  // State for the single-step form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // A single function to handle the entire registration process
  async function handleSignUp() {
    if (loading) return;

    // --- Validation Checks ---
    if (!fullName || !email || !phone || !password) {
      return Alert.alert('Missing Information', 'Please fill out all fields.');
    }
    if (password.length < 6) {
      return Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Passwords do not match.');
    }

    setLoading(true);
    
    // --- Use supabase.auth.signUp instead of the OTP flow ---
    // This creates a new user with email and password, and adds other details as metadata.
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      // NOTE: Supabase, by default, will send a confirmation email.
      // The user will need to click the link in the email before they can sign in.
      Alert.alert(
        'Success!',
        'Your account has been created. Please check your email to verify your account before signing in.'
      );
      router.replace('/signIn');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sign up</Text>
        
        {/* --- All inputs are now on one screen --- */}
        <TextInput style={styles.input} placeholder="Name" value={fullName} onChangeText={setFullName} placeholderTextColor="#BDBDBD" />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#BDBDBD" />
        <PhoneInputComponent phone={phone} setPhone={setPhone} />
        
        {/* Added Password Fields */}
        <TextInput style={styles.input} placeholder="Enter Your Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#BDBDBD" />
        <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#BDBDBD" />
        <Text style={styles.termsText}>Password must be at least 6 characters long.</Text>
        
        {/* The main button now calls the single handleSignUp function */}
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </Pressable>

        <Link href="/signIn" asChild>
          <Pressable>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles are unchanged ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
  title: { fontSize: 24, fontWeight: '500', color: '#2A2A2A', marginBottom: 30 },
  input: { width: '100%', height: 60, borderColor: '#B8B8B8', borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, fontSize: 16, marginBottom: 20 },
  phoneInputContainer: { width: '100%', height: 60, borderColor: '#B8B8B8', borderWidth: 1, borderRadius: 8, marginBottom: 20, backgroundColor: '#fff' },
  phoneInputTextContainer: { borderRadius: 8, paddingVertical: 0, backgroundColor: '#fff' },
  termsText: { fontSize: 12, color: '#828282', textAlign: 'left', width: '100%', marginBottom: 20, marginTop: -10 },
  button: { width: '100%', height: 54, backgroundColor: '#EDAE10', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#828282' },
  linkTextBold: { color: '#EDAE10', fontWeight: 'bold' },
});