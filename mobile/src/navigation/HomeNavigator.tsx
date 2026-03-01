import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';

export type HomeStackParamList = {
  Home: undefined;
  ProgramDetail: { programId: string; programName: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0f0f0f' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'GymCoach AI' }} />
      <Stack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={({ route }) => ({ title: route.params.programName })}
      />
    </Stack.Navigator>
  );
}
