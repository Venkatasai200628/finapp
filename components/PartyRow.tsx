import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PartySummary } from '../lib/ledgerAnalytics';
import { colors, fontFamily, radius, rupee, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  party: PartySummary;
  mode: 'payee' | 'payer' | 'all';
  onPress?: () => void;
};

export default function PartyRow({ party, mode, onPress }: Props) {
  const { colors: themeColors } = useTheme();

  const primary =
    mode === 'payee' ? party.paidOut : mode === 'payer' ? party.received : party.totalVolume;
  const primaryLabel = mode === 'payee' ? 'Paid out' : mode === 'payer' ? 'Received' : 'Volume';
  const primaryColor = mode === 'payer' ? themeColors.income : themeColors.expense;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/transactions',
        params: {
          search: party.party,
          type: mode === 'payee' ? 'expense' : mode === 'payer' ? 'income' : undefined,
        },
      });
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: themeColors.borderSoft },
        pressed && { opacity: 0.7, backgroundColor: themeColors.surfaceAlt },
      ]}
      onPress={handlePress}
    >
      <View style={styles.left}>
        <View style={[styles.avatar, { backgroundColor: primaryColor + '22' }]}>
          <Text style={[styles.avatarText, { color: primaryColor }]}>{(party.party || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: themeColors.textPrimary }]} numberOfLines={1}>
              {party.party || 'Unknown'}
            </Text>
            {party.isHighVolume && (
              <View style={styles.badge}>
                <Ionicons name="star" size={10} color={themeColors.warn} />
                <Text style={[styles.badgeText, { color: themeColors.warn }]}>Top</Text>
              </View>
            )}
          </View>
          <Text style={[styles.meta, { color: themeColors.textMuted }]}>
            {party.transactionCount} txn · Net {rupee(Math.round(party.net))}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: primaryColor }]}>{rupee(Math.round(primary))}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
          <Text style={[styles.amountLabel, { color: themeColors.textMuted }]}>{primaryLabel}</Text>
          <Ionicons name="chevron-forward" size={12} color={themeColors.textMuted} />
        </View>
      </View>
    </Pressable>
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
