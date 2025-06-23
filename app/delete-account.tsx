import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext'; // To handle sign out after deletion

// A simple fallback if you don't use a theme context in this file
const FallbackTheme = {
    background: '#FFFFFF',
    text: '#2A2A2A',
    textSecondary: '#717171', // (r: 0.443...)
    danger: '#F44336', // (r: 0.956...)
    primaryText: '#FFFFFF',
};

export default function DeleteAccountScreen() {
    const { theme } = useTheme ? useTheme() : { theme: 'light' };
    const { signOut } = useAuth(); // We need this to log the user out after deletion
    const colors = theme ? { ...Colors[theme], danger: '#F44336' } : FallbackTheme;

    const [isLoading, setIsLoading] = useState(false);

    const performDeletion = async () => {
        setIsLoading(true);
        try {
            // IMPORTANT: User deletion must be handled by a secure, server-side
            // function. You cannot delete users directly from the client.
            // You would create an Edge Function named 'delete-user' in Supabase.
            const { error } = await supabase.functions.invoke('delete-user');

            if (error) {
                throw error;
            }
            
            Alert.alert('Account Deleted', 'Your account and all associated data have been successfully removed.');

            // After successful deletion, sign the user out on the client.
            // The AuthContext will then redirect the user to the login screen.
            await signOut();

        } catch (error: any) {
            Alert.alert('Deletion Failed', error.message || 'Could not delete your account. Please try again or contact support.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePress = () => {
        // Show a confirmation dialog before proceeding. This is crucial for destructive actions.
        Alert.alert(
            'Are you absolutely sure?',
            'This action cannot be undone. All your data, including favourite stations and profile information, will be permanently deleted.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Account',
                    style: 'destructive', // This styles the button red on iOS
                    onPress: () => performDeletion(),
                },
            ],
            { cancelable: true } // Allows dismissing by tapping outside on Android
        );
    };

    // The header ("Delete Account" and back button) is typically managed by your navigator.
    // This component renders the content below the header.
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                    Are you sure you want to delete your account? Please read how account deletion will affect you.
                </Text>
                <Text style={[styles.warningText, { color: colors.textSecondary, marginTop: 16 }]}>
                    Deleting your account removes all personal information from our database. Your email becomes permanently reserved, and the same email cannot be used to register a new account.
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        { backgroundColor: colors.danger, opacity: pressed || isLoading ? 0.8 : 1 },
                    ]}
                    onPress={handleDeletePress}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.primaryText} />
                    ) : (
                        <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                            Delete
                        </Text>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    warningText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        fontWeight: '400', // Poppins Regular
    },
    buttonContainer: {
        padding: 15,
        paddingBottom: 20, // Extra padding at the very bottom
    },
    button: {
        height: 54,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600', // Poppins Medium
    },
});