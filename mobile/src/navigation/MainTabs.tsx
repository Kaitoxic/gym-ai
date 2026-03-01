import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeNavigator from './HomeNavigator';
import ExercisesNavigator from './ExercisesNavigator';
import ProfileNavigator from './ProfileNavigator';
import StatsScreen from '../screens/StatsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import CardioScreen from '../screens/CardioScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HomeTab: '🏠',
    ExercisesTab: '💪',
    StatsTab: '📊',
    CardioTab: '🏃',
    NutritionTab: '🥗',
    ProfileTab: '👤',
  };
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconText, focused && styles.iconFocused]}>
        {icons[name] ?? '●'}
      </Text>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
      <Tab.Screen
        name="ExercisesTab"
        component={ExercisesNavigator}
        options={{ title: 'Exercices', unmountOnBlur: false }}
      />
      <Tab.Screen name="StatsTab" component={StatsScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="CardioTab" component={CardioScreen} options={{ title: 'Cardio' }} />
      <Tab.Screen name="NutritionTab" component={NutritionScreen} options={{ title: 'Nutrition' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f0f0f',
    borderTopColor: '#1e1e1e',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, opacity: 0.5 },
  iconFocused: { opacity: 1 },
});
