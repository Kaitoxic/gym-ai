import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseListScreen from '../screens/exercises/ExerciseListScreen';
import ExerciseDetailScreen from '../screens/exercises/ExerciseDetailScreen';
import type { Exercise } from '../store/exerciseStore';

export type ExercisesStackParamList = {
  ExerciseList: undefined;
  ExerciseDetail: { exercise: Exercise };
};

const Stack = createNativeStackNavigator<ExercisesStackParamList>();

export default function ExercisesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0f0f0f' },
      }}
    >
      <Stack.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ title: 'Exercises' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={({ route }) => ({ title: route.params.exercise.name })}
      />
    </Stack.Navigator>
  );
}
