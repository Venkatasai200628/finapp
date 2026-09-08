import { useEffect, useState } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { GoalsProvider } from '../context/GoalsContext';
import { BudgetsProvider } from '../context/BudgetsContext';
import { ImportedTransactionsProvider } from '../context/ImportedTransactionsContext';
import MobileWebBlocker from '../components/MobileWebBlocker';
import { colors, fontFamily } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type TextWithDefaults = typeof Text & { defaultProps?: { style?: unknown } };
type TextInputWithDefaults = typeof TextInput & { defaultProps?: { style?: unknown } };

function applyDefaultFont() {
  const T = Text as TextWithDefaults;
  T.defaultProps = T.defaultProps || {};
  T.defaultProps.style = [{ fontFamily: fontFamily.regular, color: colors.textPrimary }, T.defaultProps.style];

  const TI = TextInput as TextInputWithDefaults;
  TI.defaultProps = TI.defaultProps || {};
  TI.defaultProps.style = [{ fontFamily: fontFamily.regular, color: colors.textPrimary }, TI.defaultProps.style];
}

/** Keeps the visible route in step with whether anyone is signed in. */
function AuthGate() {
  const { token, restoring } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;
    const onSignIn = segments[0] === 'sign-in';

    if (!token && !onSignIn) {
      router.replace('/sign-in');
    } else if (token && onSignIn) {
      router.replace('/');
    }
  }, [token, restoring, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transactions" options={{ presentation: 'modal' }} />
      <Stack.Screen name="import-statement" options={{ presentation: 'modal' }} />
      <Stack.Screen name="books" />
      <Stack.Screen name="gst-calculator" />
      <Stack.Screen name="connect-payments" />
    </Stack>
  );
}

import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  const [fontsApplied, setFontsApplied] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      applyDefaultFont();
      
      if (Platform.OS === 'web') {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: 'Ionicons';
            src: url('https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/fonts/ionicons.ttf') format('truetype');
          }
          html, body, #root {
            font-family: 'Outfit_400Regular', sans-serif;
          }
          /* Apply Outfit to text inputs and standard containers */
          input, textarea, button {
            font-family: 'Outfit_400Regular', sans-serif;
          }
          /* Crucial: preserve Ionicons font family for vector icons */
          [style*="font-family: Ionicons"],
          [style*="font-family: 'Ionicons'"],
          [style*='font-family: "Ionicons"'] {
            font-family: Ionicons !important;
          }
        `;
        document.head.appendChild(style);
      }

      setFontsApplied(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsApplied) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider>
        <MobileWebBlocker>
          <AuthProvider>
            <SettingsProvider>
              <GoalsProvider>
                <BudgetsProvider>
                  <ImportedTransactionsProvider>
                    <StatusBar style="light" />
                    <AuthGate />
                  </ImportedTransactionsProvider>
                </BudgetsProvider>
              </GoalsProvider>
            </SettingsProvider>
          </AuthProvider>
        </MobileWebBlocker>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
