import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../../components/Card';
import DetailHeader from '../../components/DetailHeader';
import Screen from '../../components/Screen';
import { submitVerdict } from '../../lib/backendClient';
import { useAuth } from '../../context/AuthContext';
import { useImportedTransactions } from '../../context/ImportedTransactionsContext';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: 'fast-food',
  Groceries: 'basket',
  Transport: 'car',
  Subscription: 'play-circle',
  Income: 'trending-up',
  Transfer: 'swap-horizontal',
  Trading: 'trending-up',
  Shopping: 'bag',
  Bills: 'receipt',
  Unknown: 'help-circle-outline',
  Uncategorized: 'help-circle-outline',
};

const COMMON_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills',
  'Subscription',
  'Transfer',
  'Income',
  'Trading',
  'Unknown',
];

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    merchant: string;
    category: string;
    amount: string;
    time: string;
    flagged: string;
    rawDescription?: string;
    reasons?: string;
  }>();

  const { imported, updateCategory, customCategories } = useImportedTransactions();
  const existingItem = imported.find((r) => r.id === params.id);
  const [currentCategory, setCurrentCategory] = useState(existingItem?.category || params.category || 'Unknown');
  const [showPicker, setShowPicker] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isTypingCustom, setIsTypingCustom] = useState(false);

  const displayCategories = Array.from(new Set([...COMMON_CATEGORIES, ...customCategories]));

  const selectCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    updateCategory(params.id, trimmed);
    setCurrentCategory(trimmed);
    setShowPicker(false);
    setIsTypingCustom(false);
    setCustomText('');
  };

  const amount = Number(params.amount ?? 0);
  const isIncome = amount >= 0;
  const isFlagged = params.flagged === '1';
  const reasons = params.reasons ? params.reasons.split('|').filter(Boolean) : [];
  const icon = CATEGORY_ICON[currentCategory] ?? 'help-circle-outline';

  const { token } = useAuth();
  const [resolution, setResolution] = useState<'none' | 'safe' | 'reported'>('none');
  const [syncedToEngine, setSyncedToEngine] = useState(false);

  const review = async (verdict: 'safe' | 'fraud') => {
    setResolution(verdict === 'safe' ? 'safe' : 'reported');
    setSyncedToEngine(token ? await submitVerdict(token, params.id, verdict) : false);
  };

  return (
    <Screen>
      <DetailHeader title="Transaction" />
        <View style={styles.heroWrap}>
          <View style={[styles.iconCircle, isFlagged && styles.iconCircleFlagged]}>
            <Ionicons name={icon} size={28} color={isFlagged ? colors.danger : colors.accent} />
          </View>
          <Text style={[styles.amount, isIncome && styles.amountIncome]}>
            {isIncome ? '+' : '−'}₹{Math.abs(amount).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.merchant}>{params.merchant}</Text>
          <Text style={styles.time}>{params.time}</Text>
        </View>

        {isFlagged && resolution === 'none' && (
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
                <Pressable style={[styles.actionBtn, styles.safeBtn]} onPress={() => review('safe')}>
                  <Ionicons name="checkmark" size={15} color={colors.onAccent} />
                  <Text style={styles.safeBtnText}>Mark as safe</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.reportBtn]} onPress={() => review('fraud')}>
                  <Ionicons name="flag" size={14} color={colors.danger} />
                  <Text style={styles.reportBtnText}>Report</Text>
                </Pressable>
              </View>
            </Card>
        )}

        {resolution !== 'none' && (
          <Card style={[styles.card, styles.resolvedCard]}>
              <Ionicons
                name={resolution === 'safe' ? 'checkmark-circle' : 'flag'}
                size={18}
                color={resolution === 'safe' ? colors.good : colors.danger}
              />
              <Text style={styles.resolvedText}>
                {resolution === 'safe'
                  ? syncedToEngine
                    ? `${params.merchant} now counts toward your normal ${(params.category ?? '').toLowerCase()} range.`
                    : 'Marked safe on this device. Connect the engine to have it learn from this.'
                  : syncedToEngine
                    ? "Reported. This is excluded from your baseline, so it won't make future fraud look normal."
                    : 'Reported on this device. Connect the engine to have it excluded from your baseline.'}
              </Text>
            </Card>
        )}

        <Card style={styles.card}>
            <Text style={typography.h3}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.catBadge, currentCategory === 'Unknown' && styles.catBadgeUnknown]}>
                  <Text style={[styles.catBadgeText, currentCategory === 'Unknown' && { color: colors.warn }]}>
                    {currentCategory}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowPicker((v) => !v)}
                  style={styles.changeBtn}
                >
                  <Ionicons name={showPicker ? 'chevron-up' : 'pencil'} size={12} color={colors.accent} />
                  <Text style={styles.changeBtnText}>{showPicker ? 'Done' : 'Change'}</Text>
                </Pressable>
              </View>
            </View>

            {showPicker && (
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>Select or Change Category</Text>
                <View style={styles.chipWrap}>
                  {displayCategories.map((cat) => {
                    const active = cat.toLowerCase() === currentCategory.toLowerCase();
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => selectCategory(cat)}
                        style={[styles.catChip, active && styles.catChipActive]}
                      >
                        <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.ruleNotice}>
                  <Ionicons name="sparkles" size={13} color={colors.accent} />
                  <Text style={styles.ruleNoticeText}>
                    Categorizing will automatically remember this rule for all past & future transactions from{' '}
                    <Text style={{ fontFamily: fontFamily.bold, color: colors.textPrimary }}>
                      {params.merchant || 'this merchant'}
                    </Text>
                    .
                  </Text>
                </View>

                {isTypingCustom ? (
                  <View style={styles.customInputRow}>
                    <TextInput
                      value={customText}
                      onChangeText={setCustomText}
                      placeholder="Type custom category..."
                      placeholderTextColor={colors.textMuted}
                      style={styles.customInput}
                      autoFocus
                      onSubmitEditing={() => selectCategory(customText)}
                    />
                    <Pressable
                      onPress={() => selectCategory(customText)}
                      style={styles.customSaveBtn}
                    >
                      <Text style={styles.customSaveText}>Set</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setIsTypingCustom(true)}
                    style={styles.addCustomBtn}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={colors.accent} />
                    <Text style={styles.addCustomText}>Custom category</Text>
                  </Pressable>
                )}
              </View>
            )}
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
            {params.rawDescription ? (
              <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                <Text style={styles.detailLabel}>Bank narration</Text>
                <Text style={[styles.detailValue, { fontSize: 12, color: colors.textSecondary }]}>{params.rawDescription}</Text>
              </View>
            ) : null}
          </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  amountIncome: {
    color: colors.income,
  },
  merchant: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
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
    fontFamily: fontFamily.extraBold,
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
    fontFamily: fontFamily.extraBold,
    color: colors.onAccent,
  },
  reportBtn: {
    backgroundColor: colors.danger + '1A',
    borderWidth: 1,
    borderColor: colors.danger + '55',
  },
  reportBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.extraBold,
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
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accent + '20',
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  catBadgeUnknown: {
    backgroundColor: colors.warn + '20',
    borderColor: colors.warn + '44',
  },
  catBadgeText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.accent,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
  },
  pickerBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerTitle: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.onAccent,
    fontFamily: fontFamily.bold,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 38,
    fontSize: 13,
    color: colors.textPrimary,
  },
  customSaveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSaveText: {
    color: colors.onAccent,
    fontFamily: fontFamily.bold,
    fontSize: 12,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginTop: 2,
  },
  addCustomText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.accent,
  },
  ruleNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.accent + '12',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  ruleNoticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
