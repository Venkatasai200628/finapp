// "Arctic mono" — near-black canvas with an icy cyan/blue glow, frosted
// glass surfaces, Lexend throughout. See components/Card.tsx and
// components/ScreenGlow.tsx for how these tokens become the glass effect.

import { Appearance } from 'react-native';

const isLight = Appearance.getColorScheme() === 'light';

export const lightColors = {
  bg: '#ffffff',
  bgAlt: '#f8fafc',
  panelSolid: '#ffffff',
  glow1: '#e0f2fe',
  glow2: '#dcfce3',
  surface: 'rgba(0,0,0,0.03)',
  surfaceSoft: 'rgba(0,0,0,0.02)',
  surfaceStrong: 'rgba(0,0,0,0.06)',
  surfaceAlt: 'rgba(0,0,0,0.04)',
  surfaceHi: 'rgba(0,0,0,0.08)',
  border: 'rgba(0,0,0,0.1)',
  borderStrong: 'rgba(0,0,0,0.15)',
  borderSoft: 'rgba(0,0,0,0.05)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#0ea5e9',
  accent2: '#38bdf8',
  income: '#10b981',
  expense: '#ef4444',
  savings: '#0ea5e9',
  good: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
  live: '#0ea5e9',
  ringCore: '#f1f5f9',
};

export const darkColors = {
  bg: '#121212',
  bgAlt: '#000000',
  panelSolid: '#1e1e1e',
  glow1: '#121212',
  glow2: '#121212',
  surface: 'rgba(255,255,255,0.06)',
  surfaceSoft: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.1)',
  surfaceAlt: 'rgba(255,255,255,0.08)',
  surfaceHi: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.15)',
  borderStrong: 'rgba(255,255,255,0.25)',
  borderSoft: 'rgba(255,255,255,0.1)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#38bdf8',
  accent2: '#7dd3fc',
  income: '#34d399',
  expense: '#f87171',
  savings: '#38bdf8',
  good: '#34d399',
  warn: '#fbbf24',
  danger: '#f87171',
  live: '#38bdf8',
  ringCore: '#1e293b',
};

export const colors = isLight ? lightColors : darkColors;

export const gradients = {
  hero: ['#0f4c4f', '#0a2540'] as const,
  income: ['#1a4f4a', '#5eead4'] as const,
  expense: ['#7a2e1f', '#ff9270'] as const,
  savings: ['#0a3a52', '#7dd3fc'] as const,
  card: ['#0c1618', '#05090c'] as const,
  danger: ['#7a1f2e', '#ff6b6b'] as const,
  live: ['#5eead4', '#22c3a6'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

// Lexend has no variable-weight build in @expo-google-fonts, so bold text
// must point at the matching static family — fontWeight alone won't fake
// bold for a custom font on Android. Reach for these instead of raw
// fontWeight when you need something bold to render correctly natively.
export const fontFamily = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semiBold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  extraBold: 'Lexend_800ExtraBold',
};

export const typography = {
  title: { fontSize: 28, fontFamily: fontFamily.bold, color: colors.textPrimary, letterSpacing: -0.4 },
  h2: { fontSize: 18, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  h3: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  body: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  caption: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textMuted },
  statNumber: { fontSize: 32, fontFamily: fontFamily.bold, color: colors.textPrimary, letterSpacing: -0.4 },
};

export function statusColor(status: 'good' | 'warn' | 'danger') {
  return colors[status];
}

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
};
