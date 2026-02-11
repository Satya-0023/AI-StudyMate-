import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import React from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="explanation" />
        <Stack.Screen name="quiz" />
      </Stack>
    </AuthProvider>
  );
}
