import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
import ErrorBoundary from '../components/ErrorBoundary';
import MobileWebBlocker from '../components/MobileWebBlocker';
import { colors, fontFamily, radius, shadow } from '../constants/theme';

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

import { ThemeProvider, useTheme } from '../context/ThemeContext';

/** Keeps the visible route in step with whether anyone is signed in. */
function AuthGate() {
  const { token, restoring } = useAuth();
  const { colors: themeColors } = useTheme();
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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: themeColors.bg } }}>
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

function RootLayoutContent() {
  const { theme, phoneView, togglePhoneView, colors: themeColors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && windowWidth >= 900;

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: isWebDesktop && phoneView ? (theme === 'dark' ? '#0A0A0A' : '#ECEEF2') : themeColors.bg,
      }}
    >
      <MobileWebBlocker>
        <AuthProvider>
          <SettingsProvider>
            <GoalsProvider>
              <BudgetsProvider>
                <ImportedTransactionsProvider>
                  <ErrorBoundary>
                    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
                    {isWebDesktop && phoneView ? (
                      <View style={layoutStyles.phoneWrapper}>
                        {/* Top Switcher Bar */}
                        <View
                          style={[
                            layoutStyles.topSwitcher,
                            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                          ]}
                        >
                          <View dataSet={{ orange: 'true' }} style={layoutStyles.phoneBadge}>
                            <Ionicons name="phone-portrait" size={13} color="#FFFFFF" />
                            <Text style={layoutStyles.phoneBadgeText}>Phone View</Text>
                          </View>
                          <Text style={[layoutStyles.topHint, { color: themeColors.textMuted }]}>
                            Previewing exact mobile layout
                          </Text>
                          <Pressable
                            onPress={togglePhoneView}
                            dataSet={{ orange: 'true' }}
                            style={[layoutStyles.switchBtn, { backgroundColor: colors.accent }]}
                          >
                            <Ionicons name="laptop-outline" size={14} color="#FFFFFF" />
                            <Text style={layoutStyles.switchBtnText}>Switch to Laptop Mode</Text>
                          </Pressable>
                        </View>

                        {/* Phone Chassis Mockup Frame */}
                        <View
                          style={[
                            layoutStyles.phoneChassis,
                            {
                              borderColor: theme === 'dark' ? '#262626' : '#CBD2D9',
                              backgroundColor: themeColors.bg,
                            },
                          ]}
                        >
                          <View
                            style={[
                              layoutStyles.phoneNotch,
                              { backgroundColor: theme === 'dark' ? '#141414' : '#E2E6EA' },
                            ]}
                          >
                            <View style={layoutStyles.phoneSpeaker} />
                            <View style={layoutStyles.phoneCamera} />
                          </View>
                          <View style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: themeColors.bg }}>
                            <AuthGate />
                          </View>
                          <View style={[layoutStyles.phoneHomeBar, { backgroundColor: themeColors.bg }]}>
                            <View
                              style={[
                                layoutStyles.phoneHomeIndicator,
                                { backgroundColor: theme === 'dark' ? '#444' : '#BBB' },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <AuthGate />
                    )}
                  </ErrorBoundary>
                </ImportedTransactionsProvider>
              </BudgetsProvider>
            </GoalsProvider>
          </SettingsProvider>
        </AuthProvider>
      </MobileWebBlocker>
    </GestureHandlerRootView>
  );
}

const layoutStyles = StyleSheet.create({
  phoneWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  topSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    ...shadow.sm,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  phoneBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  topHint: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  switchBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  phoneChassis: {
    width: 420,
    height: 840,
    maxHeight: '94%',
    borderRadius: 48,
    borderWidth: 10,
    overflow: 'hidden',
    ...shadow.floating,
  },
  phoneNotch: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  phoneSpeaker: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
  },
  phoneCamera: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  phoneHomeBar: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneHomeIndicator: {
    width: 130,
    height: 4,
    borderRadius: 2,
  },
});

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
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
