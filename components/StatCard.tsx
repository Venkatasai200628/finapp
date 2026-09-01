import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AnimatedNumber from './AnimatedNumber';
import { fontFamily, colors, radius, spacing } from '../constants/theme';

type Props = {
  label: string;
  amount: number;
  changePct: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  delay?: number;
};

export default function StatCard({ label, amount, changePct, color, icon, delay = 0 }: Props) {
  const isUp = changePct >= 0;
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500).springify().damping(16)} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <AnimatedNumber value={amount} prefix="₹" style={styles.amount} />
      <View style={styles.trendRow}>
        <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={11} color={isUp ? colors.income : colors.expense} />
        <Text style={[styles.trendText, { color: isUp ? colors.income : colors.expense }]}>
          {Math.abs(changePct)}% vs last month
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
});
