import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SettingsProvider } from '../context/SettingsContext';
import { GoalsProvider } from '../context/GoalsContext';
import LiveAlertToast from '../components/LiveAlertToast';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SettingsProvider>
        <GoalsProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="transactions" options={{ presentation: 'modal' }} />
          </Stack>
          <LiveAlertToast />
        </GoalsProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
