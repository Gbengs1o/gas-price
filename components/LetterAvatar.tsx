// File: components/LetterAvatar.tsx

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

interface LetterAvatarProps {
  avatarUrl: string | null | undefined;
  name: string | null | undefined;
  size?: number;
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({ avatarUrl, name, size = 120 }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const firstLetter = name ? name.charAt(0).toUpperCase() : '?';

  // If a valid avatar URL is provided, display the image
  if (avatarUrl) {
    return (
      <Image 
        source={{ uri: avatarUrl }} 
        style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2, borderColor: colors.primary }]} 
      />
    );
  }

  // Otherwise, display the letter avatar
  return (
    <View style={[styles.letterAvatarContainer, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={[styles.letter, { fontSize: size / 2, color: colors.primaryText }]}>
        {firstLetter}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarImage: {
    borderWidth: 4,
  },
  letterAvatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  letter: {
    fontWeight: 'bold',
  },
});