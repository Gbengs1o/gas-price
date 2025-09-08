import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext'; // Assuming you have a theme context
import { Colors } from '../../constants/Colors'; // Assuming you have a Colors constant

// A simple fallback if you don't use a theme context in this file
const FallbackTheme = {
    background: '#ffffff',
    text: '#111111',
    textSecondary: '#555555',
};

export default function PrivacyPolicyScreen() {
    // Optional: Use your app's theme for consistent styling
    const { theme } = useTheme ? useTheme() : { theme: 'light' };
    const colors = theme ? Colors[theme] : FallbackTheme;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last updated: October 26, 2023</Text>

            <Text style={[styles.paragraph, { color: colors.text }]}>
                Welcome to [App Name] ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "App").
            </Text>

            <Text style={[styles.heading, { color: colors.text }]}>1. Information We Collect</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                We may collect information about you in a variety of ways. The information we may collect via the App depends on the content and materials you use, and includes:
            </Text>

            <Text style={[styles.subheading, { color: colors.text }]}>a) Personal and Account Data</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                If you choose to create an account to use features like saving 'Favourite Stations', we collect personal information, such as your user ID and email address, provided through our authentication provider (Supabase Auth).
            </Text>
            
            <Text style={[styles.subheading, { color: colors.text }]}>b) Location Data</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                This is the core of our service. We request and collect precise, real-time location information from your mobile device to provide location-based services, such as:
            </Text>
            <View style={styles.listItem}>
               <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
               <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>Finding and displaying nearby gas stations on the map.</Text>
            </View>
             <View style={styles.listItem}>
               <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
               <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>Calculating the distance to each station.</Text>
            </View>
            <View style={styles.listItem}>
               <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
               <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>Powering the "Sync" feature to find stations in your current area.</Text>
            </View>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                You can change location access at any time in your device's settings. However, disabling location services will render the core features of the App unusable.
            </Text>

            <Text style={[styles.subheading, { color: colors.text }]}>c) Usage Data</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                We collect information about your activity in the App, specifically which gas stations you mark as 'Favourite'. This helps personalize your experience.
            </Text>

            <Text style={[styles.heading, { color: colors.text }]}>2. How We Use Your Information</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we use information collected about you via the App to:
            </Text>
            <View style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>Provide the core service of finding nearby gas stations and their details.</Text>
            </View>
            <View style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>Create and manage your account and your list of 'Favourite Stations'.</Text>
            </View>
            <View style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>Improve our database of gas stations. When you use the "Sync" feature, your location is sent to our backend service (a Supabase Edge Function) to query external sources (like Google Places API) for new or updated station information. This helps keep our data accurate for all users.</Text>
            </View>

            <Text style={[styles.heading, { color: colors.text }]}>3. Disclosure of Your Information</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                We do not sell your personal information. We may share information we have collected about you in certain situations:
            </Text>
            <View style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>
                    <Text style={{fontWeight: 'bold'}}>With Service Providers.</Text> We share data with our backend service provider, Supabase, which hosts our database, authentication, and serverless functions.
                </Text>
            </View>
             <View style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.paragraph, { color: colors.text, flex: 1 }]}>
                    <Text style={{fontWeight: 'bold'}}>For Data Enrichment.</Text> As mentioned, the "Sync" feature uses your location coordinates to query third-party APIs like Google's to find station data. Your personal user information is not sent in this request.
                </Text>
            </View>

            <Text style={[styles.heading, { color: colors.text }]}>4. Security of Your Information</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
            </Text>

            <Text style={[styles.heading, { color: colors.text }]}>5. Contact Us</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                If you have questions or comments about this Privacy Policy, please contact us at: <Text style={{fontWeight: 'bold'}}>privacy@[your-app-domain].com</Text>
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    heading: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 10,
    },
    subheading: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'justify',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 5,
        marginLeft: 10,
    },
    bullet: {
        fontSize: 16,
        marginRight: 10,
        lineHeight: 24,
    }
});