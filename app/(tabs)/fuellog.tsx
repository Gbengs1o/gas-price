// File: app/(tabs)/fuellog.tsx



// File: app/(tabs)/fuellog.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Define the colors from your Figma design
const designColors = {
  primaryGold: 'rgba(237, 174, 16, 1)', // Extracted from {r: 0.929, g: 0.682, b: 0.062}
  inputBorder: 'rgba(184, 184, 184, 1)', // Extracted from {r: 0.721...}
  placeholderText: 'rgba(208, 208, 208, 1)', // Extracted from {r: 0.815...}
  notePlaceholder: 'rgba(158, 158, 168, 1)', // Extracted from {r: 0.619...}
  darkText: '#333',
};

// A reusable input component based on the design
const FormInput = ({ label, value, setValue, placeholder, keyboardType = 'default', editable = true }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: designColors.inputBorder 
          },
          !editable && styles.disabledInput,
        ]}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={designColors.placeholderText}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  );
};

// A reusable dropdown-style input
const DropdownInput = ({ label, value, onPress, placeholder }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
            <TouchableOpacity onPress={onPress} style={[styles.input, { backgroundColor: colors.card, borderColor: designColors.inputBorder }]}>
                <Text style={[styles.inputText, { color: value ? colors.text : designColors.placeholderText }]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color={designColors.placeholderText} />
            </TouchableOpacity>
        </View>
    );
};

export default function FuelLogScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // State for all form fields
  const [stationName, setStationName] = useState('');
  const [date, setDate] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [liters, setLiters] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effect to calculate liters/kg whenever total price or price/unit changes
  useEffect(() => {
    const ppu = parseFloat(pricePerUnit);
    const tp = parseFloat(totalPrice);

    if (ppu > 0 && tp > 0) {
      const calculatedLiters = (tp / ppu).toFixed(2);
      setLiters(calculatedLiters);
    } else {
      setLiters('');
    }
  }, [pricePerUnit, totalPrice]);

  const handleSave = async () => {
    if (!stationName || !date || !fuelType || !pricePerUnit || !totalPrice) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }
    if (!user) {
      Alert.alert('Not Logged In', 'You must be logged in to save a fuel log.');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('fuel_logs').insert({
      user_id: user.id,
      station_name: stationName,
      log_date: date, // For a real app, ensure this is in ISO 8601 format 'YYYY-MM-DD'
      fuel_type: fuelType,
      price_per_unit: parseFloat(pricePerUnit),
      total_price: parseFloat(totalPrice),
      quantity: parseFloat(liters),
      notes: notes,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Error', 'Could not save the fuel log. ' + error.message);
    } else {
      Alert.alert('Success', 'Fuel log saved successfully!', [
          { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}>

        <Text style={[styles.header, { color: colors.text }]}>Add Fuel Log</Text>

        <View style={styles.form}>
          <FormInput
            label="Station Name"
            value={stationName}
            setValue={setStationName}
            placeholder="Enter station name"
          />
          
          {/* TODO: Integrate a real Date Picker library here */}
          <DropdownInput
            label="Date"
            value={date}
            onPress={() => Alert.alert('Date Picker', 'This would open a calendar.')}
            placeholder="dd/mm/yyyy"
          />

          {/* TODO: Integrate a real Picker/Modal for fuel types */}
          <DropdownInput
            label="Fuel Type"
            value={fuelType}
            onPress={() => Alert.alert('Fuel Type Picker', 'This would show options like Petrol, Diesel, etc.')}
            placeholder="Select fuel type"
          />

          <FormInput
            label="Price / Litre / KG"
            value={pricePerUnit}
            setValue={setPricePerUnit}
            placeholder="e.g., 150.50"
            keyboardType="numeric"
          />

          <FormInput
            label="Total Price"
            value={totalPrice}
            setValue={setTotalPrice}
            placeholder="e.g., 5000"
            keyboardType="numeric"
          />

          <FormInput
            label="Calculated Litres / KG"
            value={liters}
            placeholder="0.00"
            editable={false}
          />

          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
            <TextInput
                style={[styles.notesInput, { backgroundColor: colors.card, color: colors.text, borderColor: designColors.inputBorder }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a note..."
                placeholderTextColor={designColors.notePlaceholder}
                multiline={true}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 15 }]}>
        <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.disabledButton]} 
            onPress={handleSave}
            disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  form: {
    gap: 20,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
      fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  notesInput: {
      height: 127,
      borderWidth: 1.5,
      borderRadius: 7,
      padding: 16,
      fontSize: 16,
      textAlignVertical: 'top',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent'
  },
  saveButton: {
    backgroundColor: designColors.primaryGold,
    height: 53,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});