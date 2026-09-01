// "Arctic mono" — near-black canvas with an icy cyan/blue glow, frosted
// glass surfaces, Lexend throughout. See components/Card.tsx and
// components/ScreenGlow.tsx for how these tokens become the glass effect.

export const colors = {
  bg: '#05090c',
  bgAlt: '#020304',
  panelSolid: '#0b1518', // solid (non-blurred) dark panel, for surfaces with nothing behind them to blur
  glow1: '#0d3d3f', // teal glow, top-left
  glow2: '#0a2540', // blue glow, right side
  surface: 'rgba(200,250,255,0.05)',
  surfaceSoft: 'rgba(200,250,255,0.04)',
  surfaceStrong: 'rgba(200,250,255,0.07)',
  surfaceAlt: 'rgba(200,250,255,0.06)',
  surfaceHi: 'rgba(200,250,255,0.09)',
  border: 'rgba(180,245,255,0.14)',
  borderStrong: 'rgba(180,245,255,0.22)',
  borderSoft: 'rgba(180,245,255,0.1)',
  textPrimary: '#eafcff',
  textSecondary: '#8fc9d1',
  textMuted: '#537077',
  accent: '#5eead4',
  accent2: '#38bdf8',
  income: '#5eead4',
  expense: '#ff9270',
  savings: '#7dd3fc',
  good: '#5eead4',
  warn: '#fbbf6d',
  danger: '#ff6b6b',
  live: '#5eead4',
  ringCore: '#06181a',
};

export const gradients = {
  hero: ['#0f4c4f', '#0a2540'] as const,
  income: ['#1a4f4a', '#5eead4'] as const,
  expense: ['#7a2e1f', '#ff9270'] as const,
  savings: ['#0a3a52', '#7dd3fc'] as const,
  card: ['#0c1618', '#05090c'] as const,
  danger: ['#7a1f2e', '#ff6b6b'] as const,
  live: ['#5eead4', '#22c3a6'] as const,
  trading: ['#0a2540', '#38bdf8'] as const,
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
