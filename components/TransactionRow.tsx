import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontFamily, colors, rupee, spacing } from '../constants/theme';
import { Transaction } from '../data/mockData';

export default function TransactionRow({
  tx,
  onPress,
}: {
  tx: Transaction;
  delay?: number;
  onPress?: () => void;
}) {
  const isIncome = tx.amount >= 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.avatar, isIncome ? styles.avatarIn : styles.avatarOut]}>
        <Text style={[styles.avatarText, { color: isIncome ? colors.income : colors.expense }]}>
          {tx.merchant.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text style={styles.merchant} numberOfLines={1}>
          {tx.merchant}
        </Text>
        <Text style={styles.meta}>
          {tx.category} · {tx.time}
        </Text>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>{rupee(tx.amount, { signed: true })}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarIn: { backgroundColor: colors.income + '22' },
  avatarOut: { backgroundColor: colors.expense + '18' },
  avatarText: { fontFamily: fontFamily.bold, fontSize: 14 },
  merchant: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  amount: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  income: {
    color: colors.income,
  },
  expense: {
    color: colors.expense,
  },
});
