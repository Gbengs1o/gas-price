// Corrected: app/(auth)/signin.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    Pressable,
    View,
    SafeAreaView,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator, // --- FIX: Imported the missing component ---
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Make sure this path is correct

const themeColors = {
    background: '#FFFFFF',
    title: '#2A2A2A',
    inputBorder: '#B8B8B8',
    placeholder: '#D0D0D0',
    text: '#2A2A2A',
    primary: '#EDAE10',
    primaryText: '#FFFFFF',
    error: '#F44336',
    link: '#EDAE10',
};

export default function SignInScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            router.replace('/(tabs)/home');
            
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoiding}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>Sign in</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email or Phone Number"
                            placeholderTextColor={themeColors.placeholder}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Your Password"
                            placeholderTextColor={themeColors.placeholder}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                        />
                        <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Ionicons
                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                size={24}
                                color={themeColors.inputBorder}
                            />
                        </Pressable>
                    </View>

                    <Link href="/(auth)/forgetpassword" asChild>
                        <Pressable>
                            <Text style={styles.forgotPassword}>Forgot password?</Text>
                        </Pressable>
                    </Link>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            { opacity: pressed || isLoading ? 0.8 : 1 },
                        ]}
                        onPress={handleSignIn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={themeColors.primaryText} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </Pressable>

                    <View style={styles.separatorContainer}>
                        <View style={styles.separatorLine} />
                        <Text style={styles.separatorText}>or</Text>
                        <View style={styles.separatorLine} />
                    </View>

                    <Text style={styles.footerText}>
                        Don’t have an account?{' '}
                        <Link href="/(auth)/signup" asChild>
                            <Pressable>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </Pressable>
                        </Link>
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


// STYLES
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: themeColors.background },
    keyboardAvoiding: { flex: 1 },
    container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
    title: { fontSize: 24, fontFamily: 'Poppins-Medium', color: themeColors.title, marginBottom: 30 },
    inputContainer: { height: 60, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: themeColors.inputBorder, borderRadius: 8, paddingHorizontal: 20, marginBottom: 10 },
    input: { flex: 1, fontSize: 16, fontFamily: 'Poppins-Medium', color: themeColors.text },
    forgotPassword: { fontSize: 14, fontFamily: 'Poppins-Medium', color: themeColors.error, textAlign: 'right', marginBottom: 20, paddingVertical: 5 },
    button: { height: 54, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10 },
    buttonText: { fontSize: 16, fontFamily: 'Poppins-Medium', color: themeColors.primaryText },
    separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    separatorLine: { flex: 1, height: 1, backgroundColor: themeColors.inputBorder },
    separatorText: { marginHorizontal: 10, fontSize: 16, fontFamily: 'Poppins-Medium', color: themeColors.inputBorder },
    footerText: { fontSize: 16, fontFamily: 'Poppins-Medium', color: themeColors.text, textAlign: 'center' },
    linkText: { fontSize: 16, fontFamily: 'Poppins-Medium', color: themeColors.link, fontWeight: 'bold' },
});