import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import PreEnrolementScreen from './screens/PreEnrolementScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import SuiviScreen from './screens/SuiviScreen';
import SettingsScreen from './screens/SettingsScreen';
import { synchroniserFileAttente } from './api/client';
import { colors } from './theme';

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function App() {
  useEffect(() => {
    // Tentative de synchronisation de la file d'attente hors-ligne au démarrage
    synchroniserFileAttente();
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Accueil" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Pré-enrôlement" component={PreEnrolementScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} options={{ headerBackVisible: false }} />
        <Stack.Screen name="Suivi" component={SuiviScreen} />
        <Stack.Screen name="Paramètres" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
