// File: app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomTabBar } from '../../components/CustomTabBar';
import { GlobalHeader } from '../../components/GlobalHeader';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

// Enhanced TabBarIcon component
const TabBarIcon = ({ 
  name, 
  color, 
  focused 
}: { 
  name: React.ComponentProps<typeof Ionicons>['name']; 
  color: string;
  focused?: boolean;
}) => {
  return (
    <Ionicons 
      size={focused ? 26 : 24} 
      name={name} 
      color={color}
      style={{ 
        opacity: focused ? 1 : 0.7,
        transform: [{ scale: focused ? 1.05 : 1 }]
      }}
    />
  );
};

// Layout wrapper that positions header as a true navbar
const TabScreenLayout = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1 }}>
      {/* Header at the top - takes up space */}
      <View style={{ paddingTop: insets.top }}>
        <GlobalHeader />
      </View>
      
      {/* Content area - starts where header ends */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        header: ({ children }) => <TabScreenLayout>{children}</TabScreenLayout>,
        headerTransparent: false,
        headerShown: true,
        // Enhanced tab bar styles
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="favourite" 
        options={{ 
          title: 'Favourites',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="heart" color={color} focused={focused} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen 
        name="leaderboard" 
        options={{ 
          title: 'Leaderboard',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="trophy" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
        }} 
      />
    </Tabs>
  );
}