export const colors = {
  bg: '#050505',
  bgAlt: '#0A0A0A',
  panelSolid: '#0C0C0C',
  surface: '#111111',
  surfaceSoft: '#141414',
  surfaceStrong: '#181818',
  surfaceAlt: '#1C1C1C',
  surfaceHi: '#222222',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  borderSoft: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#5C5C5C',
  accent: '#FF6A00',
  accent2: '#FF8C00',
  income: '#00E676',
  expense: '#FF5252',
  savings: '#448AFF',
  good: '#00E676',
  warn: '#FFB300',
  danger: '#FF5252',
  live: '#FF6A00',
  ringCore: '#1A0E00',
  onAccent: '#FFFFFF',
  chartGrid: 'rgba(255, 255, 255, 0.06)',
  forecast: '#FFB300',
};

export const gradients = {
  hero: ['#111111', '#0C0C0C', '#050505'] as const,
  income: ['#0A1A0F', '#050505'] as const,
  expense: ['#1A0A0A', '#050505'] as const,
  savings: ['#0A0F1A', '#050505'] as const,
  card: ['#141414', '#111111'] as const,
  danger: ['#1A0A0A', '#050505'] as const,
  live: ['#1A1000', '#050505'] as const,
  screen: ['#050505', '#080808', '#050505'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const fontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extraBold: 'Outfit_800ExtraBold',
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
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

/** Format as ₹ currency */
export function rupee(n: number, opts?: { signed?: boolean; digits?: number }) {
  const abs = Math.abs(n);
  const formatted =
    abs >= 1e7
      ? `₹${(abs / 1e7).toFixed(opts?.digits ?? 1)}Cr`
      : abs >= 1e5
        ? `₹${(abs / 1e5).toFixed(opts?.digits ?? 1)}L`
        : `₹${abs.toLocaleString('en-IN', { maximumFractionDigits: opts?.digits ?? 0 })}`;
  if (opts?.signed) return n >= 0 ? `+${formatted}` : `−${formatted}`;
  return n < 0 ? `−${formatted}` : formatted;
}
