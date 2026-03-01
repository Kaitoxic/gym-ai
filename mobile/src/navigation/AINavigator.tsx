import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationListScreen from '../screens/ConversationListScreen';
import AIChatScreen from '../screens/AIChatScreen';

export type AIStackParamList = {
  ConversationList: undefined;
  AIChatScreen: { conversationId: string; title: string };
};

const Stack = createNativeStackNavigator<AIStackParamList>();

export default function AINavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0f0f0f' },
      }}
    >
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIChatScreen"
        component={AIChatScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
