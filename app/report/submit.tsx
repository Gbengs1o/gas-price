// File: app/report/submit.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

// Haversine formula to calculate distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

const FUEL_TYPES = ['PMS', 'AGO', 'DPK'];

export default function SubmitReportScreen() {
    const { stationId, stationName, lat, lon } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();

    const [selectedFuel, setSelectedFuel] = useState<string | null>(null);
    const [price, setPrice] = useState('');
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert("Error", "You must be logged in.");
            return;
        }
        if (!selectedFuel || !price) {
            Alert.alert("Error", "Please select a fuel type and enter a price.");
            return;
        }

        setLoading(true);

        try {
            // Proximity Check
            const userLocation = await Location.getCurrentPositionAsync({});
            const distance = haversineDistance(
                userLocation.coords.latitude, userLocation.coords.longitude,
                parseFloat(lat as string), parseFloat(lon as string)
            );

            if (distance > 200) {
                Alert.alert("Too Far Away", `You must be within 200 meters to submit a report. You are currently ~${Math.round(distance)}m away.`);
                setLoading(false);
                return;
            }

            // Insert data into Supabase
            const { error } = await supabase.from('price_reports').insert({
                station_id: parseInt(stationId as string),
                user_id: user.id,
                fuel_type: selectedFuel,
                price: parseFloat(price),
                rating: rating > 0 ? rating : null,
                notes: notes || null,
            });

            if (error) throw error;
            Alert.alert("Success!", "Your report has been submitted. Thank you!", [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Report for:</Text>
            <Text style={styles.stationName}>{stationName}</Text>

            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.fuelTypeContainer}>
                {FUEL_TYPES.map(fuel => (
                    <Pressable key={fuel} style={[styles.fuelButton, selectedFuel === fuel && styles.fuelButtonSelected]} onPress={() => setSelectedFuel(fuel)}>
                        <Text style={[styles.fuelButtonText, selectedFuel === fuel && {color: 'white'}]}>{fuel}</Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Price per Litre (₦)</Text>
            <TextInput style={styles.input} placeholder="e.g., 650" value={price} onChangeText={setPrice} keyboardType="numeric" />
            
            <Text style={styles.label}>Rating (Optional)</Text>
            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Pressable key={star} onPress={() => setRating(star)}>
                        <FontAwesome name={star <= rating ? "star" : "star-o"} size={32} color="gold" style={{marginHorizontal: 10}} />
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput style={[styles.input, styles.notesInput]} placeholder="e.g., Long queues, fast pump..." value={notes} onChangeText={setNotes} multiline />

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Report</Text>}
            </Pressable>
        </View>
    );
}

// ... Add extensive styles for this page ...
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 18, color: 'gray', textAlign: 'center' },
    stationName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8, marginTop: 10 },
    input: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, fontSize: 16 },
    notesInput: { height: 100, textAlignVertical: 'top' },
    fuelTypeContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
    fuelButton: { flex: 1, padding: 12, marginHorizontal: 5, borderWidth: 1, borderColor: 'green', borderRadius: 8, alignItems: 'center' },
    fuelButtonSelected: { backgroundColor: 'green' },
    fuelButtonText: { color: 'green', fontWeight: '600' },
    ratingContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15 },
    submitButton: { backgroundColor: 'green', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});