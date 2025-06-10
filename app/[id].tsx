// app/[id].tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// This is the React component for the screen
const DetailPage = () => {
  const { id } = useLocalSearchParams(); // Example of getting the dynamic param

  return (
    <View>
      <Text>Details for ID: {id}</Text>
      {/* Your screen content goes here */}
    </View>
  );
};

// This is the required default export
export default DetailPage;