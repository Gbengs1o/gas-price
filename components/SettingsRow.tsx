import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

type SettingsRowProps = {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  isDestructive?: boolean;
};

export const SettingsRow = ({ label, iconName, onPress, isDestructive = false }: SettingsRowProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const labelColor = isDestructive ? '#dc3545' : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        pressed && { backgroundColor: theme === 'light' ? '#f0f0f0' : '#2c2c2c' },
      ]}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={22} color={labelColor} style={styles.icon} />
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  icon: {
    marginRight: 15,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
});