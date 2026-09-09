import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../constants/theme';

export default function MobileWebBlocker({ children }: { children: React.ReactNode }) {
  // Mobile web access is enabled so users can test and use the app on mobile devices via Vercel
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
