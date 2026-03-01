import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GoalScreen from '../screens/onboarding/GoalScreen';
import FitnessScreen from '../screens/onboarding/FitnessScreen';
import MetricsScreen from '../screens/onboarding/MetricsScreen';
import ScheduleScreen from '../screens/onboarding/ScheduleScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';

export type OnboardingStackParamList = {
  Goal: undefined;
  Fitness: undefined;
  Metrics: undefined;
  Schedule: undefined;
  OnboardingComplete: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0f0f0f' },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="Goal" component={GoalScreen} options={{ title: 'Your Goal' }} />
      <Stack.Screen name="Fitness" component={FitnessScreen} options={{ title: 'Fitness Level' }} />
      <Stack.Screen name="Metrics" component={MetricsScreen} options={{ title: 'Body Info' }} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Your Schedule' }} />
      <Stack.Screen
        name="OnboardingComplete"
        component={OnboardingCompleteScreen}
        options={{ title: 'All Set!', headerLeft: () => null }}
      />
    </Stack.Navigator>
  );
}
