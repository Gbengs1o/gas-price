// File: app/(tabs)/_layout.tsx
// NO CHANGES NEEDED - This file is correctly configured.

import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '../../components/CustomTabBar';
import { GlobalHeader } from '../../components/GlobalHeader';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <GlobalHeader />,
        headerShown: true,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="favourite" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="rewards" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}