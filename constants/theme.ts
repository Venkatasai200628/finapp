export const colors = {
  bg: '#05070B',
  bgAlt: '#090D13',
  panelSolid: '#0A0F16',
  glow1: 'rgba(45, 212, 168, 0.20)',
  glow2: 'rgba(125, 211, 252, 0.14)',
  surface: '#10161F',
  surfaceSoft: '#141B26',
  surfaceStrong: '#171F2C',
  surfaceAlt: '#1C2533',
  surfaceHi: '#232D3D',
  border: 'rgba(255, 255, 255, 0.075)',
  borderStrong: 'rgba(255, 255, 255, 0.13)',
  borderSoft: 'rgba(255, 255, 255, 0.045)',
  textPrimary: '#F6F8FB',
  textSecondary: '#9AA6B8',
  textMuted: '#6A7689',
  accent: '#2DD4A8',
  accent2: '#5EEAD4',
  income: '#2DD4A8',
  expense: '#FB7185',
  savings: '#7DD3FC',
  good: '#2DD4A8',
  warn: '#FBBF24',
  danger: '#FB7185',
  live: '#2DD4A8',
  ringCore: '#042018',
  onAccent: '#042018',
  chartGrid: 'rgba(255, 255, 255, 0.055)',
  forecast: '#FBBF24',
};

export const gradients = {
  hero: ['#12362C', '#0C1A24', '#0A121C'] as const,
  income: ['#16463A', '#102820'] as const,
  expense: ['#4A1E28', '#241218'] as const,
  savings: ['#16324A', '#101C2A'] as const,
  card: ['#171F2C', '#10161F'] as const,
  danger: ['#4A1E28', '#241218'] as const,
  live: ['#12362C', '#0C1A24'] as const,
  screen: ['#05070B', '#0A1412', '#05070B'] as const,
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
  sm: 12,
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
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  title: { fontSize: 32, fontFamily: fontFamily.extraBold, color: colors.textPrimary, letterSpacing: -1 },
  h2: { fontSize: 18, fontFamily: fontFamily.semiBold, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  body: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, lineHeight: 21 },
  caption: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textMuted },
  statNumber: { fontSize: 28, fontFamily: fontFamily.extraBold, color: colors.textPrimary, letterSpacing: -0.7 },
};

export function statusColor(status: 'good' | 'warn' | 'danger') {
  return colors[status];
}

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
