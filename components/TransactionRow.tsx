import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { fontFamily, colors, radius, spacing } from '../constants/theme';
import { Transaction } from '../data/mockData';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: 'fast-food',
  Groceries: 'basket',
  Transport: 'car',
  Subscription: 'play-circle',
  Income: 'trending-up',
  Uncategorized: 'help-circle',
  Shopping: 'bag',
};

const CATEGORY_COLOR: Record<string, string> = {
  Food: colors.expense,
  Groceries: colors.savings,
  Transport: colors.accent,
  Subscription: colors.accent2,
  Income: colors.income,
  Uncategorized: colors.danger,
  Shopping: colors.good,
};

function formatAmount(amount: number) {
  const sign = amount >= 0 ? '+' : '−';
  const abs = Math.abs(amount).toLocaleString('en-IN');
  return `${sign}₹${abs}`;
}

export default function TransactionRow({
  tx,
  delay = 0,
  onPress,
}: {
  tx: Transaction;
  delay?: number;
  onPress?: () => void;
}) {
  const isIncome = tx.amount >= 0;
  const color = CATEGORY_COLOR[tx.category] ?? colors.textMuted;
  const icon = CATEGORY_ICON[tx.category] ?? 'ellipse';

  return (
    <Animated.View entering={FadeInRight.delay(delay).duration(400).springify().damping(20)}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: color + '1F' }, tx.flagged && styles.iconFlagged]}>
            <Ionicons name={icon} size={16} color={tx.flagged ? colors.danger : color} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.merchant} numberOfLines={1}>
              {tx.merchant}
            </Text>
            <Text style={styles.meta}>
              {tx.category} · {tx.time}
            </Text>
          </View>
        </View>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>{formatAmount(tx.amount)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFlagged: {
    backgroundColor: colors.danger + '22',
  },
  rowPressed: {
    opacity: 0.6,
  },
  merchant: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  income: {
    color: colors.good,
  },
  expense: {
    color: colors.textPrimary,
  },
});
