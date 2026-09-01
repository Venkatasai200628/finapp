export const colors = {
  bg: '#07090D',
  bgElevated: '#0D1117',
  surface: '#131924',
  surfaceAlt: '#1A2230',
  surfaceHi: '#212B3B',
  border: '#232C3A',
  borderSoft: '#1A2230',
  textPrimary: '#F5F7FA',
  textSecondary: '#93A1B5',
  textMuted: '#5B6B82',
  accent: '#5B8CFF',
  accent2: '#8B6BFF',
  income: '#33D6A6',
  expense: '#FF6B6B',
  savings: '#FFC15E',
  good: '#33D6A6',
  warn: '#FFB454',
  danger: '#FF5A6E',
  live: '#33D6A6',
};

export const gradients = {
  hero: ['#6A5BFF', '#3D6BFF', '#2E9BFF'] as const,
  income: ['#1FBF8F', '#33D6A6'] as const,
  expense: ['#FF5A6E', '#FF8A6B'] as const,
  savings: ['#FFB454', '#FFDD7A'] as const,
  card: ['#161D2B', '#10151F'] as const,
  danger: ['#FF5A6E', '#C23A57'] as const,
  live: ['#33D6A6', '#1FA97F'] as const,
  trading: ['#2E9BFF', '#8B6BFF'] as const,
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

export const typography = {
  title: { fontSize: 30, fontWeight: '800' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted },
  statNumber: { fontSize: 32, fontWeight: '800' as const, color: colors.textPrimary, letterSpacing: -0.5 },
};

export function statusColor(status: 'good' | 'warn' | 'danger') {
  return colors[status];
}

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
};
