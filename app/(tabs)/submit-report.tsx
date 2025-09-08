// File: app/submit-report.tsx

import { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, Pressable,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Make sure this path is correct

// For this mock-up, we are only adding a new station.
// In a real app, you'd add a price report linked to a station ID.

export default function SubmitReportModal() {
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

        const { error } = await supabase
            .from('stations')
            .insert({
                name: name,
                brand: brand || null, // Insert null if brand is empty
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            });

        setIsLoading(false);

        if (error) {
            Alert.alert("Database Error", error.message);
        } else {
            Alert.alert("Success", "New station has been added!", [
                { text: "OK", onPress: () => router.back() } // Go back to trigger the refresh
            ]);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Text style={styles.title}>Add a New Station</Text>

            <TextInput
                style={styles.input}
                placeholder="Station Name (e.g., Conoil - Garki)"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Brand (e.g., Conoil) (Optional)"
                value={brand}
                onChangeText={setBrand}
            />
            <View style={styles.coordsContainer}>
                <TextInput
                    style={[styles.input, styles.coordInput]}
                    placeholder="Latitude"
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, styles.coordInput]}
                    placeholder="Longitude"
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numeric"
                />
            </View>

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.submitButtonText}>Add Station</Text>
                )}
            </Pressable>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    coordsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    coordInput: {
        flex: 1,
        marginHorizontal: 5,
    },
    submitButton: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});