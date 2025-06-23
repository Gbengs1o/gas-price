import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
// --- FIX: Corrected import paths from ../../ to ../ ---
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// A simple fallback if you don't use a theme context in this file
const FallbackTheme = {
    background: '#FFFFFF',
    text: '#2A2A2A',
    primary: '#EDAE10',
    primaryText: '#FFFFFF',
    cardBorder: '#B8B8B8',
    placeholder: '#D0D0D0',
    error: '#D32F2F',
};

// Reusable Password Input Component
const PasswordInput = ({ label, value, onChangeText, colors }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    return (
        <View style={[styles.inputContainer, { borderColor: colors.cardBorder }]}>
            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={label}
                placeholderTextColor={colors.placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
            />
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Ionicons
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.placeholder}
                />
            </Pressable>
        </View>
    );
};

export default function ChangePasswordScreen({ navigation }) {
    const { theme } = useTheme ? useTheme() : { theme: 'light' };
    const colors = theme ? Colors[theme] : FallbackTheme;

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSavePassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please enter and confirm your new password.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                throw error;
            }

            Alert.alert(
                'Success',
                'Your password has been changed successfully.',
                [{ text: 'OK', onPress: () => navigation?.goBack() }]
            );
        } catch (error: any) {
            Alert.alert('Failed to Change Password', error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <PasswordInput
                        label="Old Password"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        colors={colors}
                    />
                    <PasswordInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        colors={colors}
                    />
                    <PasswordInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        colors={colors}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            { backgroundColor: colors.primary, opacity: pressed || isLoading ? 0.8 : 1 },
                        ]}
                        onPress={handleSavePassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.primaryText} />
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                                Save
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    formContainer: {},
    inputContainer: {
        height: 60,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        height: 54,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});