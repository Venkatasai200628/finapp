import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../constants/theme';

export default function MobileWebBlocker({ children }: { children: React.ReactNode }) {
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      
      if (isMobile) {
        setIsMobileWeb(true);
      }
    }
  }, []);

  if (isMobileWeb) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.accent} />
        </View>
        <Text style={styles.title}>App Required</Text>
        <Text style={styles.description}>
          Fin's real-time SMS detection requires native device features. Please install the Android app to continue on mobile.
        </Text>
        <Pressable 
          style={styles.button}
          // The EAS Build artifact link or a landing page can go here
          onPress={() => alert('Download link will be available soon!')}
        >
          <Text style={styles.buttonText}>Download App</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    color: colors.onAccent,
    fontSize: 16,
  },
});
