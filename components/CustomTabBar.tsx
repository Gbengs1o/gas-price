// File: components/CustomTabBar.tsx

import React from 'react';
import { View, Pressable, StyleSheet, Text, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;

const TabBarBackground = ({ color }: { color: string }) => (
  <Svg width={TAB_BAR_WIDTH} height={100} style={styles.backgroundSvg}>
    <Path
      fill={color}
      d={`M0 20 Q0 0 20 0 H${TAB_WIDTH * 2 - 30} 
           Q${TAB_WIDTH * 2 - 10} 0 ${TAB_WIDTH * 2} 20 
           L${TAB_WIDTH * 2 + 10} 50 
           Q${TAB_WIDTH * 2.5} 60 ${TAB_WIDTH * 3 - 10} 50 
           L${TAB_WIDTH * 3} 20 
           Q${TAB_WIDTH * 3 + 10} 0 ${TAB_WIDTH * 3 + 30} 0 
           H${TAB_BAR_WIDTH - 20} Q${TAB_BAR_WIDTH} 0 ${TAB_BAR_WIDTH} 20
           V100 H0 V20 Z`}
    />
  </Svg>
);

export const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getIconAndLabel = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? colors.primary : colors.tabIconDefault;
    switch (routeName) {
      case 'home':
        return { icon: <Ionicons name={isFocused ? 'home' : 'home-outline'} size={24} color={color} />, label: 'Home' };
      case 'favourite':
        return { icon: <Ionicons name={isFocused ? 'heart' : 'heart-outline'} size={24} color={color} />, label: 'Favourite' };
      case 'leaderboard':
        return { icon: <Ionicons name={isFocused ? 'trophy' : 'trophy-outline'} size={24} color={color} />, label: 'Rewards' };
      // --- CHANGE 1: 'profile' is now 'settings' ---
      case 'settings':
        return { icon: <Ionicons name={isFocused ? 'settings' : 'settings-outline'} size={24} color={color} />, label: 'Settings' };
      default:
        return { icon: null, label: '' };
    }
  };

  return (
    <View style={styles.container}>
      <TabBarBackground color={colors.headerBackground} />

      {/* --- CHANGE 2: The central button is now wrapped in a View to include the label --- */}
      <Pressable
        style={styles.centralButtonContainer}
        onPress={() => navigation.navigate('search')}
      >
        <View style={styles.centralButton}>
          <MaterialCommunityIcons name="gas-station" size={32} color={colors.primaryText} />
        </View>
        <Text style={[styles.centralLabel, { color: colors.tabIconDefault }]}>Find Gas</Text>
      </Pressable>

      <View style={styles.tabButtonsContainer}>
        {state.routes.map((route, index) => {
          if (route.name === 'search') return <View key={route.key} style={styles.tabButton} />;
          
          const isFocused = state.index === index;
          const { icon, label } = getIconAndLabel(route.name, isFocused);
          if (!icon) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
              {icon}
              <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.tabIconDefault }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      width: TAB_BAR_WIDTH,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backgroundSvg: {
      position: 'absolute',
      bottom: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 20,
    },
    // --- CHANGE 3: New styles for the central button container and label ---
    centralButtonContainer: {
        position: 'absolute',
        bottom: 5, // Adjusted to make room for the label
        alignItems: 'center',
        justifyContent: 'center',
    },
    centralButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: Colors.light.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.light.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 10,
    },
    centralLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    tabButtonsContainer: {
      flexDirection: 'row',
      width: '100%',
      height: 70,
      position: 'absolute',
      bottom: 0,
    },
    tabButton: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 10,
    },
    tabLabel: {
      fontSize: 12,
      marginTop: 4,
    },
});