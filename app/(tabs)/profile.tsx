// File: app/(tabs)/profile.tsx

import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LetterAvatar } from '../../components/LetterAvatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type AppColors = ReturnType<typeof useTheme>['colors'];
interface Profile {
  full_name: string; street: string | null; city: string | null; phone_number: string | null; avatar_url: string | null;
}

export default function ProfileScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
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
        if (status !== 'granted') { Alert.alert('Permission Denied', 'We need access to your photos to upload an avatar.'); return; }
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled) await uploadAvatar(result.assets[0]);
        } catch (e) { Alert.alert("Error", "Could not open the image library."); }
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
            const { error: uploadError } = await supabase.storage.from('avatars').upload(path, arrayBuffer, { contentType: mimeType, upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;
            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
            Alert.alert('Success', 'Avatar updated!');
        } catch (error: any) { Alert.alert('Upload Error', error.message || 'Failed to upload avatar.'); }
        finally { setIsLoading(false); }
    };

    const handleSignOut = () => { signOut(() => router.replace('/(auth)/signIn')); };

    if (isAuthLoading || isLoading) {
        return <View style={styles.centerContent}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    if (!user || !profile) {
        return <View style={styles.centerContent}><Text style={styles.name}>Could not load profile.</Text></View>;
    }

    return (
        <KeyboardAvoidingView style={styles.pageContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.pageContainer}>
                <Pressable onPress={handleSignOut} style={styles.logoutIcon}>
                    <Ionicons name="log-out-outline" size={28} color={colors.textSecondary} />
                </Pressable>
                <ScrollView contentContainerStyle={styles.container}>
                    <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
                        <LetterAvatar avatarUrl={profile.avatar_url} name={profile.full_name} />
                        <View style={styles.cameraIconContainer}>
                            <Ionicons name="camera" size={20} color={colors.primaryText} />
                        </View>
                    </Pressable>
                    <Text style={styles.name}>{profile.full_name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}><Text style={styles.statValue}>{priceReportCount ?? 0}</Text><Text style={styles.statLabel}>Price Reports</Text></View>
                        <View style={styles.statBox}><Text style={styles.statValue}>{stationAddCount ?? 0}</Text><Text style={styles.statLabel}>Stations Added</Text></View>
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputContainer}><Text style={styles.label}>Phone Number</Text><TextInput style={styles.input} value={profile.phone_number || ''} placeholder="e.g. 08012345678" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" onChangeText={(text) => setProfile(p => p ? { ...p, phone_number: text } : null)} /></View>
                        <View style={styles.inputContainer}><Text style={styles.label}>Street Address</Text><TextInput style={styles.input} value={profile.street || ''} placeholder="e.g. 123 Main Street" placeholderTextColor={colors.textSecondary} onChangeText={(text) => setProfile(p => p ? { ...p, street: text } : null)} /></View>
                        <View style={styles.inputContainer}><Text style={styles.label}>City</Text><TextInput style={styles.input} value={profile.city || ''} placeholder="e.g. Ibadan" placeholderTextColor={colors.textSecondary} onChangeText={(text) => setProfile(p => p ? { ...p, city: text } : null)} /></View>
                    </View>
                    <Pressable style={styles.button} onPress={handleUpdateProfile} disabled={isLoading}><Text style={styles.buttonText}>Update Profile</Text></Pressable>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    pageContainer: { flex: 1, backgroundColor: colors.background },
    logoutIcon: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
    container: { flexGrow: 1, alignItems: 'center', paddingTop: 70, paddingHorizontal: 20, paddingBottom: 100 },
    centerContent: { flex: 1, justifyContent: 'center', backgroundColor: colors.background, alignItems: 'center' },
    avatarContainer: { marginBottom: 12, position: 'relative' },
    cameraIconContainer: { position: 'absolute', bottom: 5, right: 5, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
    name: { fontSize: 22, fontWeight: 'bold', color: colors.text },
    email: { fontSize: 16, marginBottom: 20, color: colors.textSecondary },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 24, borderBottomColor: colors.border, borderTopColor: colors.border },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    statLabel: { fontSize: 14, marginTop: 4, color: colors.textSecondary },
    inputGroup: { width: '100%' },
    inputContainer: { width: '100%', marginBottom: 16 },
    label: { fontSize: 14, marginBottom: 6, color: colors.textSecondary },
    input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
    button: { width: '100%', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: colors.primary },
    buttonText: { fontSize: 16, fontWeight: 'bold', color: colors.primaryText },
});