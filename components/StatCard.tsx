import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, colors, radius, rupee, spacing } from '../constants/theme';

type Props = {
  label: string;
  amount: number;
  changePct?: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  delay?: number;
  showChange?: boolean;
};

export default function StatCard({
  label,
  amount,
  changePct = 0,
  color,
  icon,
  showChange = false,
}: Props) {
  const isUp = changePct >= 0;
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount} numberOfLines={1}>
        {rupee(Math.round(amount))}
      </Text>
      {showChange ? (
        <Text style={[styles.trendText, { color: isUp ? colors.income : colors.expense }]}>
          {isUp ? '+' : '−'}
          {Math.abs(changePct)}% vs last
        </Text>
      ) : (
        <Text style={styles.hint}>From your books</Text>
      )}
    </View>
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
    minWidth: 0,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amount: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  trendText: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    marginTop: 6,
  },
  hint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
});
