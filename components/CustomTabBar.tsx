import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

type AppColors = ReturnType<typeof useTheme>['colors'];

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;

const TabBarBackground = ({ color }: { color: string }) => (
  <Svg width={TAB_BAR_WIDTH} height={100} style={getThemedStyles({} as any).backgroundSvg}>
    <Path
      fill={color}
      d={`M0 20 Q0 0 20 0 H${TAB_WIDTH * 2 - 30} Q${TAB_WIDTH * 2 - 10} 0 ${TAB_WIDTH * 2} 20 L${TAB_WIDTH * 2 + 10} 50 Q${TAB_WIDTH * 2.5} 60 ${TAB_WIDTH * 3 - 10} 50 L${TAB_WIDTH * 3} 20 Q${TAB_WIDTH * 3 + 10} 0 ${TAB_WIDTH * 3 + 30} 0 H${TAB_BAR_WIDTH - 20} Q${TAB_BAR_WIDTH} 0 ${TAB_BAR_WIDTH} 20 V100 H0 V20 Z`}
    />
  </Svg>
);

export const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const getIconAndLabel = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? colors.primary : colors.tabIconDefault;
    switch (routeName) {
      case 'home':
        return { icon: <Ionicons name={isFocused ? 'home' : 'home-outline'} size={24} color={color} />, label: 'Home' };
      case 'favourite':
        return { icon: <Ionicons name={isFocused ? 'heart' : 'heart-outline'} size={24} color={color} />, label: 'Favourite' };
      case 'leaderboard':
        return { icon: <Ionicons name={isFocused ? 'trophy' : 'trophy-outline'} size={24} color={color} />, label: 'Rewards' };
      case 'settings':
        return { icon: <Ionicons name={isFocused ? 'settings' : 'settings-outline'} size={24} color={color} />, label: 'Settings' };
      default:
        return { icon: null, label: '' };
    }
  };

  return (
    <View style={styles.container}>
      <TabBarBackground color={colors.headerBackground} />

      <Pressable style={styles.centralButtonContainer} onPress={() => navigation.navigate('search')}>
        <View style={styles.centralButton}>
          <MaterialCommunityIcons name="gas-station" size={32} color={colors.primaryText} />
        </View>
        <Text style={styles.centralLabel}>Find Gas</Text>
      </Pressable>

      <View style={styles.tabButtonsContainer}>
        {state.routes.map((route, index) => {
          if (route.name === 'search') return <View key={route.key} style={styles.tabButton} />;
          
          const isFocused = state.index === index;
          const { icon, label } = getIconAndLabel(route.name, isFocused);
          if (!icon) return null;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
              {icon}
              <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.tabIconDefault }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const getThemedStyles = (colors: AppColors) => StyleSheet.create({
    container: { position: 'absolute', bottom: 0, width: TAB_BAR_WIDTH, height: 100, alignItems: 'center', justifyContent: 'center' },
    backgroundSvg: { position: 'absolute', bottom: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
    centralButtonContainer: { position: 'absolute', bottom: 5, alignItems: 'center', justifyContent: 'center' },
    centralButton: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.primary, // THEME-AWARE
      justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary, // THEME-AWARE
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 10,
    },
    centralLabel: { fontSize: 12, marginTop: 4, color: colors.tabIconDefault }, // THEME-AWARE
    tabButtonsContainer: { flexDirection: 'row', width: '100%', height: 70, position: 'absolute', bottom: 0 },
    tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 10 },
    tabLabel: { fontSize: 12, marginTop: 4 },
});