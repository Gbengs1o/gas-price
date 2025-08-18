// File: app/report/submit.tsx
// FINAL VERSION 5.0: Implements the new, separated, and icon-based design for Amenities and Payment Methods.

import React, { useState, useMemo } from 'react';
import {
    StyleSheet, View, Text, Pressable, Alert, TextInput,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

// --- TYPE DEFINITION & CONSTANTS (UPDATED FOR NEW DESIGN) ---
type ThemeColors = typeof Colors.light | typeof Colors.dark;
// Updated list to match the new design image
const AMENITIES = [
    "Supermarket", "Restaurant", "Membership required",
    "Car wash", "ATM", "Cash discount",
    "POS Machine", "Air Pump", "Restrooms",
    "Oil", "Full service", "Car Repairs",
    "Open 24/7", "Power"
];
const PAYMENT_METHODS = ["Cash", "Transfer", "POS"];
const ALL_PRODUCTS = ["Petrol", "Diesel", "Kerosine", "Gas"];

// Icon mapping for the new amenity grid
const amenityIcons: { [key: string]: React.ComponentProps<typeof FontAwesome>['name'] | React.ComponentProps<typeof MaterialCommunityIcons>['name'] } = {
    "Supermarket": 'shopping-cart',
    "Restaurant": 'cutlery',
    "Membership required": 'id-card-o',
    "Car wash": 'car',
    "ATM": 'money',
    "Cash discount": 'tag',
    "POS Machine": 'credit-card',
    "Air Pump": 'cog',
    "Restrooms": 'female',
    "Oil": 'tint',
    "Full service": 'user-plus',
    "Car Repairs": 'wrench',
    "Open 24/7": 'clock-o',
    "Power": 'bolt',
};


// --- HELPER FUNCTION (remains the same) ---
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number { const R = 6371e3; const p1 = lat1 * Math.PI/180; const p2 = lat2 * Math.PI/180; const dp = (lat2-lat1) * Math.PI/180; const dl = (lon2-lon1) * Math.PI/180; const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c; }

export default function SubmitReportScreen() {
    const { stationId, stationName, lat, lon } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const styles = useMemo(() => getThemedStyles(colors), [colors]);

    // --- STATE MANAGEMENT ---
    const [prices, setPrices] = useState<{ [key: string]: string }>({});
    const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    // --- HANDLERS ---
    const handleSelect = (item: string, isAmenity: boolean) => {
        const set = isAmenity ? selectedAmenities : selectedPaymentMethods;
        const setter = isAmenity ? setSelectedAmenities : setSelectedPaymentMethods;
        const newSet = new Set(set);
        newSet.has(item) ? newSet.delete(item) : newSet.add(item);
        setter(newSet);
    };

    const handlePriceChange = (product: string, price: string) => {
        setPrices(prev => ({ ...prev, [product]: price.replace(/[^0-9.]/g, '') }));
    };

    const handleSubmit = async () => {
        // ... (handleSubmit logic remains exactly the same)
        if (!user || !stationId) { Alert.alert("Error", "User or Station ID is missing."); return; }
        const hasPrice = Object.values(prices).some(price => price && parseFloat(price) > 0);
        const hasAmenity = selectedAmenities.size > 0;
        const hasPayment = selectedPaymentMethods.size > 0;

        if (!hasPrice && !hasAmenity && !hasPayment) {
            Alert.alert("Missing Info", "Please provide at least one price, amenity, or payment method to submit a report.");
            return;
        }

        setLoading(true);

        try {
            const userLocation = await Location.getCurrentPositionAsync({});
            const distance = haversineDistance(
                userLocation.coords.latitude, userLocation.coords.longitude,
                parseFloat(lat as string), parseFloat(lon as string)
            );

            if (distance > 200) { 
                Alert.alert("Too Far Away", `You must be within 200 meters to submit a report. You are currently ~${Math.round(distance)}m away.`);
                setLoading(false); return;
            }
            
            const pmsPrice = prices['Petrol'] ? parseFloat(prices['Petrol']) : null;
            const otherFuelPricesData: { [key: string]: number } = {};
            for (const [fuel, priceStr] of Object.entries(prices)) {
                if (fuel !== 'Petrol' && priceStr && !isNaN(parseFloat(priceStr))) {
                    otherFuelPricesData[fuel] = parseFloat(priceStr);
                }
            }

            const { error } = await supabase.from('price_reports').insert({
                station_id: Number(stationId),
                user_id: user.id,
                fuel_type: 'PMS',
                price: pmsPrice,
                other_fuel_prices: Object.keys(otherFuelPricesData).length > 0 ? otherFuelPricesData : null,
                amenities_update: { add: Array.from(selectedAmenities) },
                payment_methods_update: { add: Array.from(selectedPaymentMethods) }
            });

            if (error) throw error;
            Alert.alert("Report Submitted!", "Thank you for helping keep our data accurate!", [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            Alert.alert("Submission Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Stack.Screen options={{
                title: 'Submit an Update',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.cardBackground },
                headerTitleStyle: { color: colors.text }
            }}/>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Updating prices for</Text>
                    <Text style={styles.stationName}>{stationName}</Text>
                </View>

                {/* --- FUEL PRICE CARD (Unchanged) --- */}
                <View style={styles.priceCardContainer}>
                    <View style={styles.priceCardHeader}><Text style={styles.priceCardTitle}>Update Station Price</Text></View>
                    {ALL_PRODUCTS.map((product, index) => {
                        const unit = product === 'Gas' ? 'KG' : 'L';
                        const isFocused = focusedInput === product;
                        return (
                            <View key={product} style={[styles.priceRow, index === ALL_PRODUCTS.length - 1 && styles.lastPriceRow]}>
                                <Text style={styles.fuelLabel}>{product}</Text>
                                <View style={[styles.priceInputWrapper, isFocused && styles.priceInputWrapperFocused]}>
                                    <Text style={styles.currencySymbol}>₦</Text>
                                    <TextInput style={styles.priceInput} placeholder="0" placeholderTextColor={colors.disabled} keyboardType="numeric" value={prices[product] || ''} onChangeText={(text) => handlePriceChange(product, text)} onFocus={() => setFocusedInput(product)} onBlur={() => setFocusedInput(null)}/>
                                    <Text style={styles.unitLabel}>/{unit}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* --- NEW AMENITIES & PAYMENTS CARD --- */}
                <View style={styles.cardContainer}>
                    {/* Payment Method Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.paymentMethodContainer}>
                            {PAYMENT_METHODS.map((item) => {
                                const isSelected = selectedPaymentMethods.has(item);
                                return (
                                    <Pressable key={item} style={[styles.paymentChip, isSelected && styles.paymentChipSelected]} onPress={() => handleSelect(item, false)}>
                                        <Text style={[styles.paymentChipText, isSelected && styles.paymentChipTextSelected]}>{item}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    {/* Amenities Section */}
                    <View style={styles.section}>
                         <Text style={styles.sectionTitle}>Amenities</Text>
                         <View style={styles.amenityGridContainer}>
                            {AMENITIES.map((item) => {
                                const isSelected = selectedAmenities.has(item);
                                const iconName = amenityIcons[item] || 'question-circle';
                                const IconComponent = typeof iconName === 'string' && iconName.includes(' ') ? MaterialCommunityIcons : FontAwesome;

                                return(
                                    <Pressable key={item} style={styles.amenityItem} onPress={() => handleSelect(item, true)}>
                                        <View style={[styles.amenityIconContainer, isSelected && styles.amenityIconContainerSelected]}>
                                            <FontAwesome name={iconName as any} size={24} color={isSelected ? '#FFFFFF' : colors.text} />
                                        </View>
                                        <Text style={styles.amenityText}>{item}</Text>
                                    </Pressable>
                                );
                            })}
                         </View>
                    </View>
                </View>

                <Pressable style={[styles.submitButton, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Submit Report</Text>}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
    // ... (container, header, price card styles remain the same)
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { padding: 20, paddingBottom: 50 },
    header: { alignItems: 'center', marginBottom: 20, },
    title: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', },
    stationName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: colors.text, marginTop: 4, },
    priceCardContainer: { backgroundColor: colors.cardBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
    priceCardHeader: { padding: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, },
    priceCardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, },
    lastPriceRow: { borderBottomWidth: 0, },
    fuelLabel: { fontSize: 14, fontWeight: '500', color: colors.text, flex: 1, },
    priceInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, minWidth: 120, },
    priceInputWrapperFocused: { borderColor: '#edae11' },
    currencySymbol: { fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 4, },
    priceInput: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, paddingVertical: 5, },
    unitLabel: { fontSize: 14, color: colors.textSecondary, marginLeft: 2, },
    
    // --- New/Updated Amenity Card Styles ---
    cardContainer: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: colors.cardBorder,
        marginVertical: 15,
    },
    paymentMethodContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    paymentChip: {
        backgroundColor: 'transparent',
        borderColor: '#FADDAA', // Light gold outline
        borderWidth: 1.5,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    paymentChipSelected: {
        backgroundColor: '#edae11',
        borderColor: '#edae11',
    },
    paymentChipText: {
        color: colors.text,
        fontWeight: '500'
    },
    paymentChipTextSelected: {
        color: '#FFFFFF',
    },
    amenityGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    amenityItem: {
        width: '33.33%',
        alignItems: 'center',
        marginBottom: 20,
    },
    amenityIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    amenityIconContainerSelected: {
        backgroundColor: '#edae11',
        borderColor: '#edae11',
    },
    amenityText: {
        fontSize: 12,
        color: colors.text,
        textAlign: 'center',
    },

    // --- Submit Button Styles ---
    submitButton: { backgroundColor: '#edae11', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, minHeight: 53, },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
    buttonDisabled: { opacity: 0.7 },
});