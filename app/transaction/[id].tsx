import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from '../../components/Card';
import DetailHeader from '../../components/DetailHeader';
import { colors, radius, spacing, typography } from '../../constants/theme';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: 'fast-food',
  Groceries: 'basket',
  Transport: 'car',
  Subscription: 'play-circle',
  Income: 'trending-up',
  Uncategorized: 'help-circle',
  Shopping: 'bag',
};

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    merchant: string;
    category: string;
    amount: string;
    time: string;
    flagged: string;
    reasons?: string;
  }>();

  const amount = Number(params.amount ?? 0);
  const isIncome = amount >= 0;
  const isFlagged = params.flagged === '1';
  const reasons = params.reasons ? params.reasons.split('|').filter(Boolean) : [];
  const icon = CATEGORY_ICON[params.category ?? ''] ?? 'help-circle';

  const [resolution, setResolution] = useState<'none' | 'safe' | 'reported'>('none');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DetailHeader title="Transaction" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroWrap}>
          <View style={[styles.iconCircle, isFlagged && styles.iconCircleFlagged]}>
            <Ionicons name={icon} size={28} color={isFlagged ? colors.danger : colors.accent} />
          </View>
          <Text style={[styles.amount, isIncome && styles.amountIncome]}>
            {isIncome ? '+' : '−'}₹{Math.abs(amount).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.merchant}>{params.merchant}</Text>
          <Text style={styles.time}>{params.time}</Text>
        </Animated.View>

        {isFlagged && resolution === 'none' && (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <Card style={[styles.card, styles.flagCard]}>
              <View style={styles.flagHeader}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={styles.flagTitle}>Flagged as unusual</Text>
              </View>
              {reasons.length > 0 ? (
                reasons.map((r) => (
                  <Text key={r} style={styles.flagReason}>
                    • {r}
                  </Text>
                ))
              ) : (
                <Text style={styles.flagReason}>• Deviates significantly from your normal spending behavior</Text>
              )}
              <View style={styles.actionRow}>
                <Pressable style={[styles.actionBtn, styles.safeBtn]} onPress={() => setResolution('safe')}>
                  <Ionicons name="checkmark" size={15} color={colors.bg} />
                  <Text style={styles.safeBtnText}>Mark as safe</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.reportBtn]} onPress={() => setResolution('reported')}>
                  <Ionicons name="flag" size={14} color={colors.danger} />
                  <Text style={styles.reportBtnText}>Report</Text>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        )}

        {resolution !== 'none' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={[styles.card, styles.resolvedCard]}>
              <Ionicons
                name={resolution === 'safe' ? 'checkmark-circle' : 'flag'}
                size={18}
                color={resolution === 'safe' ? colors.good : colors.danger}
              />
              <Text style={styles.resolvedText}>
                {resolution === 'safe'
                  ? "Thanks — we'll remember this pattern is normal for you."
                  : 'Reported. Our team (in a real system) would review this transaction.'}
              </Text>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{params.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Merchant</Text>
              <Text style={styles.detailValue}>{params.merchant}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & time</Text>
              <Text style={styles.detailValue}>{params.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>{params.id}</Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleFlagged: {
    backgroundColor: colors.danger + '22',
  },
  amount: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  amountIncome: {
    color: colors.income,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  flagCard: {
    borderColor: colors.danger + '55',
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  flagTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  flagReason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    flex: 1,
  },
  safeBtn: {
    backgroundColor: colors.good,
  },
  safeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.bg,
  },
  reportBtn: {
    backgroundColor: colors.danger + '1A',
    borderWidth: 1,
    borderColor: colors.danger + '55',
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resolvedText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
