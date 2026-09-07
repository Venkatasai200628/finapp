import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PartySummary } from '../lib/ledgerAnalytics';
import { colors, fontFamily, radius, rupee, spacing } from '../constants/theme';

type Props = {
  party: PartySummary;
  mode: 'payee' | 'payer' | 'all';
};

export default function PartyRow({ party, mode }: Props) {
  const primary =
    mode === 'payee' ? party.paidOut : mode === 'payer' ? party.received : party.totalVolume;
  const primaryLabel = mode === 'payee' ? 'Paid out' : mode === 'payer' ? 'Received' : 'Volume';
  const primaryColor = mode === 'payer' ? colors.income : colors.expense;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.avatar, { backgroundColor: primaryColor + '22' }]}>
          <Text style={[styles.avatarText, { color: primaryColor }]}>{party.party.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {party.party}
            </Text>
            {party.isHighVolume && (
              <View style={styles.badge}>
                <Ionicons name="star" size={10} color={colors.warn} />
                <Text style={styles.badgeText}>Top</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta}>
            {party.transactionCount} txn · Net {rupee(Math.round(party.net))}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: primaryColor }]}>{rupee(Math.round(primary))}</Text>
        <Text style={styles.amountLabel}>{primaryLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.warn + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: colors.warn,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
