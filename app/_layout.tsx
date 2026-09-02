import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
} from '@expo-google-fonts/lexend';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { GoalsProvider } from '../context/GoalsContext';
import { BudgetsProvider } from '../context/BudgetsContext';
import LiveAlertToast from '../components/LiveAlertToast';
import { colors, fontFamily } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Give every <Text>/<TextInput> in the app the Arctic Mono default face,
// so components don't each need an explicit fontFamily for body text.
// Bold weights still need to reference fontFamily.bold/semiBold directly —
// see the note in constants/theme.ts.
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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsApplied, setFontsApplied] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      applyDefaultFont();
      setFontsApplied(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsApplied) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AuthProvider>
        <SettingsProvider>
          <GoalsProvider>
            <BudgetsProvider>
              <StatusBar style="light" />
              <AuthGate />
              <LiveAlertToast />
            </BudgetsProvider>
          </GoalsProvider>
        </SettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
