// File: app/(tabs)/profile.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { LetterAvatar } from '../../components/LetterAvatar';

interface Profile {
  full_name: string; street: string | null; city: string | null; phone_number: string | null; avatar_url: string | null;
}

export default function ProfileScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user, signOut, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const isFocused = useIsFocused();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [priceReportCount, setPriceReportCount] = useState<number | null>(null);
    const [stationAddCount, setStationAddCount] = useState<number | null>(null);

    const fetchProfileAndStats = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [profileRes, statsRes] = await Promise.all([
                supabase.from('profiles').select('full_name, street, city, phone_number, avatar_url').eq('id', user.id).single(),
                supabase.rpc('get_user_stats')
            ]);
            if (profileRes.error) throw profileRes.error;
            if (statsRes.error) throw statsRes.error;
            if (profileRes.data) setProfile(profileRes.data as Profile);
            if (statsRes.data?.[0]) {
                setPriceReportCount(statsRes.data[0].price_report_count);
                setStationAddCount(statsRes.data[0].station_add_count);
            }
        } catch (error: any) { Alert.alert("Error", "Could not fetch profile data."); } 
        finally { setIsLoading(false); }
    }, [user]);

    useEffect(() => { if (isFocused && user) fetchProfileAndStats(); }, [isFocused, user, fetchProfileAndStats]);

    const handleUpdateProfile = async () => {
        if (!user || !profile) return;
        setIsLoading(true);
        const { error } = await supabase.from('profiles').update({
            full_name: profile.full_name, street: profile.street, city: profile.city, phone_number: profile.phone_number
        }).eq('id', user.id);
        if (error) Alert.alert('Error', 'Failed to update profile.');
        else Alert.alert('Success', 'Profile updated successfully!');
        setIsLoading(false);
    };

    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your photos to upload an avatar.');
            return;
        }
        
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                await uploadAvatar(result.assets[0]);
            }
        } catch (e) {
            console.error("Image Picker Error:", e);
            Alert.alert("Error", "Could not open the image library.");
        }
    };

    const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { uri, mimeType } = asset;
            const fileExt = mimeType?.split('/')[1] || 'jpg';
            const path = `${user.id}/${Date.now()}.${fileExt}`;
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();
            const { error: uploadError } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
                contentType: mimeType, upsert: true,
            });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;
            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
            Alert.alert('Success', 'Avatar updated!');
        } catch (error: any) {
            console.error("Avatar Upload Failed:", error);
            Alert.alert('Upload Error', error.message || 'Failed to upload avatar.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignOut = () => { signOut(() => router.replace('/(auth)/signIn')); };

    if (isAuthLoading || isLoading) {
        return <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    if (!user || !profile) {
        return <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>Could not load profile.</Text></View>;
    }
    
    // --- THIS IS THE MODIFIED LAYOUT ---
    return (
        <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
            <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
                <LetterAvatar avatarUrl={profile.avatar_url} name={profile.full_name} />
                <View style={[styles.cameraIconContainer, { backgroundColor: colors.primary }]}>
                    <Ionicons name="camera" size={20} color={colors.primaryText} />
                </View>
            </Pressable>
            
            {/* Display user's name first */}
            <Text style={[styles.name, { color: colors.text }]}>{profile.full_name}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
            
            {/* Stats Section moved here */}
            <View style={[styles.statsContainer, { borderBottomColor: colors.cardBorder, borderTopColor: colors.cardBorder }]}>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{priceReportCount ?? 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Price Reports</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stationAddCount ?? 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stations Added</Text>
                </View>
            </View>

            {/* User Info Form */}
            <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
                    <TextInput style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }]} value={profile.phone_number || ''} placeholder="e.g. 08012345678" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" onChangeText={(text) => setProfile(p => p ? { ...p, phone_number: text } : null)} />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
                    <TextInput style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }]} value={profile.street || ''} placeholder="e.g. 123 Main Street" placeholderTextColor={colors.textSecondary} onChangeText={(text) => setProfile(p => p ? { ...p, street: text } : null)} />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
                    <TextInput style={[styles.input, { color: colors.text, borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }]} value={profile.city || ''} placeholder="e.g. Ibadan" placeholderTextColor={colors.textSecondary} onChangeText={(text) => setProfile(p => p ? { ...p, city: text } : null)} />
                </View>
            </View>
            
            <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleUpdateProfile} disabled={isLoading}>
                <Text style={[styles.buttonText, { color: colors.primaryText }]}>Update Profile</Text>
            </Pressable>
            
            <Pressable style={[styles.button, { backgroundColor: colors.error, marginTop: 12 }]} onPress={handleSignOut}>
                <Text style={[styles.buttonText, { color: colors.primaryText }]}>Sign Out</Text>
            </Pressable>
        </ScrollView>
    );
}

// --- NEW Themed Styles with layout changes ---
const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    container: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    centerContent: { 
        flex: 1,
        justifyContent: 'center' 
    },
    avatarContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    email: { 
        fontSize: 16, 
        marginBottom: 20,
    },
    statsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        width: '100%', 
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginBottom: 24,
    },
    statBox: { 
        alignItems: 'center',
        flex: 1,
    },
    statValue: { 
        fontSize: 24, 
        fontWeight: 'bold', 
    },
    statLabel: { 
        fontSize: 14, 
        marginTop: 4 
    },
    inputGroup: {
        width: '100%',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    button: { 
        width: '100%', 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    buttonText: { 
        fontSize: 16, 
        fontWeight: 'bold', 
    },
});