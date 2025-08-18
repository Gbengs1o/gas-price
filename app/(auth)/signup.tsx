// app/(auth)/signup.tsx

import React, { useState, useRef } from 'react';
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

// --- Third-party libraries for better UI ---
import PhoneInput from 'react-native-phone-number-input';
import OTPTextInput from 'react-native-otp-textinput';

// --- Firebase Integration ---
import auth from '@react-native-firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig } from '../../lib/firebase';

// --- RENAMED THIS INTERFACE TO AVOID CONFLICT ---
interface PhoneInputComponentProps {
  phone: string;
  setPhone: (text: string) => void;
}

// Using a dedicated component for the complex phone input
const PhoneInputComponent = ({ phone, setPhone }: PhoneInputComponentProps) => {
  const phoneInputRef = useRef<PhoneInput>(null); // Added type to useRef for better type safety
  return (
    <PhoneInput
      ref={phoneInputRef}
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
  const [step, setStep] = useState<'details' | 'verify' | 'password'>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const recaptchaVerifier = useRef(null);
  const [confirmation, setConfirmation] = useState<any>(null);

  async function handleSendOtp() {
    if (loading) return;
    if (!fullName || !email || !phone) {
      return Alert.alert('Missing Information', 'Please fill out Name, Email, and Phone.');
    }
    setLoading(true);
    try {
      const confirmationResult = await auth().signInWithPhoneNumber(phone.trim(), recaptchaVerifier.current);
      setConfirmation(confirmationResult);
      Alert.alert('Check Your Phone', 'An OTP has been sent to your mobile number.');
      setStep('verify');
    } catch (error) {
      Alert.alert('OTP Send Failed', (error as Error).message);
      console.error('Firebase OTP Error:', error);
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (loading) return;
    if (otp.length < 6 || !confirmation) {
      return Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
    }
    setLoading(true);
    try {
      await confirmation.confirm(otp.trim());
      Alert.alert('Phone Verified!', 'Please set your password to complete registration.');
      setStep('password');
    } catch (error) {
      Alert.alert('Verification Failed', 'The code you entered is invalid. Please try again.');
      console.error('Firebase Verification Error:', error);
    }
    setLoading(false);
  }

  async function handleCreateUserInSupabase() {
    if (loading) return;
    if (!password || password.length < 6) {
      return Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Passwords do not match.');
    }
    setLoading(true);
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
      Alert.alert('Success!', 'Your account has been created. Please check your email to verify your account before signing in.');
      router.replace('/signIn');
    }
    setLoading(false);
  }

  if (step === 'details') {
    return (
      <SafeAreaView style={styles.container}>
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Sign up</Text>
          <TextInput style={styles.input} placeholder="Name" value={fullName} onChangeText={setFullName} placeholderTextColor="#BDBDBD" />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#BDBDBD" />
          <PhoneInputComponent phone={phone} setPhone={setPhone} />
          <TextInput style={styles.input} placeholder="Gender" onChangeText={() => {}} placeholderTextColor="#BDBDBD" />
          
          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={loading}>
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

  if (step === 'verify') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.title}>Phone verification</Text>
          <Text style={styles.subtitle}>Enter your OTP code sent to {phone}</Text>
          <OTPTextInput
            handleTextChange={setOtp}
            inputCount={6}
            tintColor="#EDAE10"
            offTintColor="#BDBDBD"
            containerStyle={styles.otpInputContainer}
            textInputStyle={styles.otpBox}
          />
          <Pressable onPress={handleSendOtp} disabled={loading} style={{ marginVertical: 20 }}>
            <Text style={styles.footerText}>
              Didn’t receive code? <Text style={styles.linkTextBold}>Resend again</Text>
            </Text>
          </Pressable>
          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'password') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.title}>Set password</Text>
          <Text style={styles.subtitle}>Set your password to complete registration.</Text>
          <TextInput style={styles.input} placeholder="Enter Your Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#BDBDBD" />
          <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#BDBDBD" />
          <Text style={styles.termsText}>Atleast 1 number or a special character</Text>
          <Pressable style={[styles.button, { marginTop: 40 }, loading && styles.buttonDisabled]} onPress={handleCreateUserInSupabase} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
  centeredContainer: { flex: 1, paddingHorizontal: 16, alignItems: 'center', paddingTop: 50 },
  title: { fontSize: 24, fontWeight: '500', color: '#2A2A2A', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#A0A0A0', textAlign: 'center', marginBottom: 40 },
  input: { width: '100%', height: 60, borderColor: '#B8B8B8', borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, fontSize: 16, marginBottom: 20 },
  phoneInputContainer: { width: '100%', height: 60, borderColor: '#B8B8B8', borderWidth: 1, borderRadius: 8, marginBottom: 20, backgroundColor: '#fff' },
  phoneInputTextContainer: { borderRadius: 8, paddingVertical: 0, backgroundColor: '#fff' },
  termsText: { fontSize: 12, color: '#828282', textAlign: 'center', lineHeight: 18 },
  button: { width: '100%', height: 54, backgroundColor: '#EDAE10', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#828282' },
  linkTextBold: { color: '#EDAE10', fontWeight: 'bold' },
  otpInputContainer: { marginBottom: 20 },
  otpBox: { borderWidth: 1, borderRadius: 8, width: 48, height: 48, textAlign: 'center', fontSize: 20 },
});