// File: components/ContentContainer.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ContentContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  // Add padding if needed
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
}

export function ContentContainer({ 
  children, 
  style,
  padding = 16,
  paddingHorizontal,
  paddingVertical,
}: ContentContainerProps) {
  return (
    <View style={[
      styles.container,
      {
        padding: paddingHorizontal !== undefined || paddingVertical !== undefined ? 0 : padding,
        paddingHorizontal: paddingHorizontal,
        paddingVertical: paddingVertical,
      },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});