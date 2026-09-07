export const colors = {
  bg: '#07090E',
  bgAlt: '#0C1018',
  panelSolid: '#0E131C',
  glow1: 'rgba(61, 220, 151, 0.22)',
  glow2: 'rgba(110, 168, 255, 0.16)',
  surface: '#121821',
  surfaceSoft: '#161E2A',
  surfaceStrong: '#1A2330',
  surfaceAlt: '#1C2533',
  surfaceHi: '#1E2838',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  borderSoft: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#F3F6FA',
  textSecondary: '#A7B2C3',
  textMuted: '#6E7A8C',
  accent: '#3DDC97',
  accent2: '#2EC4B6',
  income: '#3DDC97',
  expense: '#FF7A86',
  savings: '#7EB6FF',
  good: '#3DDC97',
  warn: '#F5B942',
  danger: '#FF7A86',
  live: '#3DDC97',
  ringCore: '#06140E',
  onAccent: '#06140E',
};

export const gradients = {
  hero: ['#12352C', '#0B1C28', '#0A1220'] as const,
  income: ['#1A4A38', '#12352C'] as const,
  expense: ['#4A1E28', '#2A1218'] as const,
  savings: ['#1A334E', '#122033'] as const,
  card: ['#161E2A', '#121821'] as const,
  danger: ['#4A1E28', '#2A1218'] as const,
  live: ['#12352C', '#0B1C28'] as const,
  screen: ['#07090E', '#0C1412', '#07090E'] as const,
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
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const fontFamily = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semiBold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  extraBold: 'Lexend_800ExtraBold',
};

export const typography = {
  kicker: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  title: { fontSize: 30, fontFamily: fontFamily.extraBold, color: colors.textPrimary, letterSpacing: -0.8 },
  h2: { fontSize: 18, fontFamily: fontFamily.semiBold, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  body: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textMuted },
  statNumber: { fontSize: 28, fontFamily: fontFamily.extraBold, color: colors.textPrimary, letterSpacing: -0.6 },
};

export function statusColor(status: 'good' | 'warn' | 'danger') {
  return colors[status];
}

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export function rupee(n: number, opts?: { signed?: boolean; digits?: number }) {
  const digits = opts?.digits ?? 0;
  const abs = Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (opts?.signed) {
    const sign = n >= 0 ? '+' : '−';
    return `${sign}₹${abs}`;
  }
  return `₹${abs}`;
}
