// File: app/submit-report.tsx

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type AppColors = ReturnType<typeof useTheme>['colors'];

export default function SubmitReportModal() {
    const { colors } = useTheme();
    const styles = useMemo(() => getThemedStyles(colors), [colors]);
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !latitude || !longitude) {
            Alert.alert("Validation Error", "Station Name, Latitude, and Longitude are required.");
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.from('stations').insert({ name, brand: brand || null, latitude: parseFloat(latitude), longitude: parseFloat(longitude) });
        setIsLoading(false);
        if (error) {
            Alert.alert("Database Error", error.message);
        } else {
            Alert.alert("Success", "New station has been added!", [{ text: "OK", onPress: () => router.back() }]);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Text style={styles.title}>Add a New Station</Text>
            <TextInput style={styles.input} placeholder="Station Name (e.g., Conoil - Garki)" placeholderTextColor={colors.placeholder} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Brand (e.g., Conoil) (Optional)" placeholderTextColor={colors.placeholder} value={brand} onChangeText={setBrand} />
            <View style={styles.coordsContainer}>
                <TextInput style={[styles.input, styles.coordInput]} placeholder="Latitude" placeholderTextColor={colors.placeholder} value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
                <TextInput style={[styles.input, styles.coordInput]} placeholder="Longitude" placeholderTextColor={colors.placeholder} value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
            </View>
            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Add Station</Text>}
            </Pressable>
        </KeyboardAvoidingView>
    );
}

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.background },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: colors.text },
    input: { backgroundColor: colors.card, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border, color: colors.text },
    coordsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    coordInput: { flex: 1, marginHorizontal: 5 },
    submitButton: { backgroundColor: colors.success, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});