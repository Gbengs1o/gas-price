import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Alert,
    Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Assuming you have a theme context
import { Colors } from '../constants/Colors'; // Assuming you have a Colors constant
import { Ionicons } from '@expo/vector-icons';

// A simple fallback if you don't use a theme context in this file
const FallbackTheme = {
    background: '#FFFFFF',
    text: '#2A2A2A', //  (r: 0.164...)
    textSecondary: '#898989', // (r: 0.537...)
    primary: '#EDAE10', // (r: 0.929...)
    primaryText: '#FFFFFF',
    cardBorder: '#B8B8B8', // (r: 0.721...)
    placeholder: '#D0D0D0', // (r: 0.815...)
};

export default function ContactUsScreen() {
    // Optional: Use your app's theme for consistent styling
    const { theme } = useTheme ? useTheme() : { theme: 'light' };
    const colors = theme ? Colors[theme] : FallbackTheme;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (!name || !email || !message) {
            Alert.alert('Missing Information', 'Please fill in your name, email, and message.');
            return;
        }
        // In a real app, you would send this data to a server or email service.
        console.log({ name, email, phone, message });
        Alert.alert(
            'Message Sent!',
            "Thank you for your feedback. We'll get back to you as soon as possible.",
        );
        // Clear the form
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
    };
    
    // NOTE: The header (with "Contact Us" title and back button) is usually managed 
    // by your navigation library (e.g., React Navigation's stack navigator).
    // The content below assumes it's rendered within such a navigator.

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
        >
            {/* Address & Direct Contact Info Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Get in Touch</Text>
                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    Have a question, a suggestion for a new feature, or a data correction for a station? We'd love to hear from you.
                </Text>
                <Pressable style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@gasfinderapp.com')}>
                    <Ionicons name="mail" size={20} color={colors.textSecondary} />
                    <Text style={[styles.contactLink, { color: colors.text }]}>support@gasfinderapp.com</Text>
                </Pressable>
                 <Pressable style={styles.contactRow} onPress={() => Linking.openURL('tel:+15551234567')}>
                    <Ionicons name="call" size={20} color={colors.textSecondary} />
                    <Text style={[styles.contactLink, { color: colors.text }]}>+1 (555) 123-4567 (Support Line)</Text>
                </Pressable>
            </View>

            {/* Send Message Form Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Send a Message</Text>
                
                <TextInput
                    style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                    placeholder="Your Name"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={setName}
                />
                
                <TextInput
                    style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                    placeholder="Your Email"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                    placeholder="Your Phone Number (Optional)"
                    placeholderTextColor={colors.placeholder}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <TextInput
                    style={[styles.input, styles.textArea, { borderColor: colors.cardBorder, color: colors.text }]}
                    placeholder="Found an incorrect price? Missing a station? Let us know!"
                    placeholderTextColor={colors.placeholder}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleSendMessage}
            >
                <Text style={[styles.buttonText, { color: colors.primaryText }]}>Send Message</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600', // Poppins Medium
        marginBottom: 16,
    },
    addressText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 16,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactLink: {
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
    input: {
        height: 60,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 20,
        fontSize: 16,
        fontWeight: '500', // Poppins Medium
        marginBottom: 16,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
    },
    button: {
        height: 54,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600', // Poppins Medium
    },
});