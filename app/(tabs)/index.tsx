import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../../components/Card';
import CategoryDonut from '../../components/CategoryDonut';
import ChartCard from '../../components/ChartCard';
import EmptyState from '../../components/EmptyState';
import ForecastChart from '../../components/ForecastChart';
import MonthlyTrendChart from '../../components/MonthlyTrendChart';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import StatCard from '../../components/StatCard';
import TransactionRow from '../../components/TransactionRow';
import {
  computeCategorySpend,
  computeMonthlySnapshot,
  computeMonthlyTrend,
  predictCashFlow,
} from '../../lib/financeAnalytics';
import { useImportedTransactions } from '../../context/ImportedTransactionsContext';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, fontFamily, radius, rupee, spacing } from '../../constants/theme';

export default function HomeScreen() {
  const { imported } = useImportedTransactions();
  const { name, username, initials } = useAuth();
  const { twoCol, contentWidth } = useResponsive();
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [moneyWentModalVisible, setMoneyWentModalVisible] = useState(false);

  const inner = Math.max(220, contentWidth - 32);
  const chartWidth = inner;
  const halfWidth = Math.max(200, twoCol ? (contentWidth - 16) / 2 - 32 : inner);

  const points = useMemo(
    () => imported.map((tx) => ({ amount: tx.amount, timestamp: tx.timestamp, category: tx.category })),
    [imported]
  );

  const monthly = computeMonthlySnapshot(points);
  const forecast = predictCashFlow(points);
  const categories = useMemo(() => computeCategorySpend(points), [points]);
  const trend = useMemo(() => computeMonthlyTrend(points), [points]);
  const hasData = imported.length > 0;
  const rate = Math.max(0, Math.min(100, monthly?.savingsRate ?? 0));

  const cockpitStats = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of imported) {
      const amt = Number(tx.amount) || 0;
      if (amt > 0) {
        income += amt;
      } else {
        expense += Math.abs(amt);
      }
    }

    const net = income - expense;

    // Check if any transaction has an explicit closing balance from statement or SMS
    const sorted = [...imported].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const latestWithBal = sorted.find((t) => typeof t.balance === 'number' && Number.isFinite(t.balance));

    const balance = latestWithBal ? latestWithBal.balance! : net;
    const margin = income > 0 ? Math.round((net / income) * 100) : 0;

    const mIncome = monthly?.income ?? 0;
    const mExpense = monthly?.expense ?? 0;
    const mProfit = mIncome - mExpense;
    const mMargin = mIncome > 0 ? Math.round((mProfit / mIncome) * 100) : 0;

    return {
      presentBalance: balance,
      isBankBalance: !!latestWithBal,
      totalIncome: income,
      totalExpense: expense,
      netProfit: net,
      profitMargin: margin,
      monthlyProfit: mProfit,
      monthlyMargin: mMargin,
    };
  }, [imported, monthly]);

  const rows = imported.slice(0, 6).map((tx) => ({
    id: tx.id,
    merchant: tx.merchant,
    category: tx.category,
    amount: tx.amount,
    time: tx.dateLabel,
    flagged: false,
    rawDescription: tx.rawDescription,
  }));

  // Top large spends
  const largeDebits = useMemo(() => {
    return imported
      .filter((t) => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 6);
  }, [imported]);

  // Spends grouped by user / merchant
  const topMerchants = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of imported) {
      if (t.amount < 0) {
        const m = t.merchant || 'Other';
        const cur = map.get(m) ?? { total: 0, count: 0 };
        map.set(m, { total: cur.total + Math.abs(t.amount), count: cur.count + 1 });
      }
    }
    return [...map.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [imported]);

  return (
    <Screen>
      <SectionHeader
        kicker="Dashboard"
        title="Home"
        subtitle="Financial cockpit, cash-flow analytics and spending patterns."
      />

      {!hasData ? (
        <Card elevated>
          <EmptyState
            icon="analytics-outline"
            title="Charts appear after a statement"
            body="Upload a bank CSV from Books. Income, spend, the donut, bars and 30-day outlook all come from that file."
            actionLabel="Upload statement"
            onAction={() => router.push('/import-statement')}
          />
        </Card>
      ) : (
        <>
          {/* Financial Cockpit: Present Balance & Profit */}
          <View style={[styles.heroRow, twoCol && styles.heroRowWide]}>
            {/* 1. Present Balance Card */}
            <Card elevated style={[styles.heroCard, twoCol && styles.heroCardHalf]}>
              <View style={styles.heroHeader}>
                <View style={styles.kickerRow}>
                  <Ionicons name="wallet-outline" size={15} color={colors.accent} />
                  <Text style={styles.heroKicker}>Present Balance</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.accent + '22' }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.accent }]}>
                    {cockpitStats.isBankBalance ? 'Bank closing' : 'Net funds'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroAmount}>{rupee(Math.round(cockpitStats.presentBalance))}</Text>

              <View style={styles.balanceMetaRow}>
                <View style={styles.inOutPill}>
                  <Ionicons name="arrow-down-circle" size={13} color={colors.income} />
                  <Text style={[styles.inOutText, { color: colors.income }]}>
                    +{rupee(Math.round(cockpitStats.totalIncome))}
                  </Text>
                </View>
                <View style={styles.inOutPill}>
                  <Ionicons name="arrow-up-circle" size={13} color={colors.expense} />
                  <Text style={[styles.inOutText, { color: colors.expense }]}>
                    -{rupee(Math.round(cockpitStats.totalExpense))}
                  </Text>
                </View>
              </View>

              {forecast.isReal ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>
                    30d outlook {rupee(forecast.projectedBalance, { signed: true })}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* 2. Profit / Net Surplus Card */}
            <Pressable
              style={[styles.heroCardPressable, twoCol && styles.heroCardHalf]}
              onPress={() => setSavingsModalVisible(true)}
            >
              <Card elevated style={[styles.heroCard, { flex: 1, marginBottom: 0 }]}>
                <View style={styles.heroHeader}>
                  <View style={styles.kickerRow}>
                    <Ionicons
                      name={cockpitStats.netProfit >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                      size={16}
                      color={cockpitStats.netProfit >= 0 ? colors.income : colors.expense}
                    />
                    <Text
                      style={[
                        styles.heroKicker,
                        { color: cockpitStats.netProfit >= 0 ? colors.income : colors.expense },
                      ]}
                    >
                      {cockpitStats.netProfit >= 0 ? 'Total Profit' : 'Net Deficit'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          (cockpitStats.netProfit >= 0 ? colors.income : colors.expense) + '22',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: cockpitStats.netProfit >= 0 ? colors.income : colors.expense },
                      ]}
                    >
                      {cockpitStats.netProfit >= 0
                        ? `+${cockpitStats.profitMargin}%`
                        : `${cockpitStats.profitMargin}%`}{' '}
                      margin
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.heroAmount,
                    { color: cockpitStats.netProfit >= 0 ? colors.income : colors.expense },
                  ]}
                >
                  {rupee(Math.round(cockpitStats.netProfit), { signed: true })}
                </Text>

                <Text style={styles.heroMeta}>
                  This month:{' '}
                  <Text
                    style={{
                      fontFamily: fontFamily.semiBold,
                      color: cockpitStats.monthlyProfit >= 0 ? colors.income : colors.expense,
                    }}
                  >
                    {rupee(Math.round(cockpitStats.monthlyProfit), { signed: true })}
                  </Text>{' '}
                  ({cockpitStats.monthlyMargin >= 0 ? '+' : ''}
                  {cockpitStats.monthlyMargin}%)
                </Text>

                <View style={styles.rateTrack}>
                  <View
                    style={[
                      styles.rateFill,
                      {
                        width: `${Math.max(0, Math.min(100, Math.abs(cockpitStats.profitMargin)))}%`,
                        backgroundColor:
                          cockpitStats.netProfit >= 0 ? colors.income : colors.expense,
                      },
                    ]}
                  />
                </View>
              </Card>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Income"
              amount={monthly?.income ?? 0}
              color={colors.income}
              icon="arrow-down-circle"
              showChange={!!monthly}
              changePct={monthly?.incomeChangePct ?? 0}
              onPress={() => router.push({ pathname: '/transactions', params: { type: 'income' } })}
            />
            <StatCard
              label="Expense"
              amount={monthly?.expense ?? 0}
              color={colors.expense}
              icon="arrow-up-circle"
              showChange={!!monthly}
              changePct={monthly?.expenseChangePct ?? 0}
              onPress={() => router.push({ pathname: '/transactions', params: { type: 'expense' } })}
            />
            <StatCard
              label="Savings"
              amount={monthly?.savings ?? 0}
              color={colors.savings}
              icon="wallet"
              showChange={!!monthly}
              changePct={monthly?.savingsChangePct ?? 0}
              onPress={() => setSavingsModalVisible(true)}
            />
          </View>

          <ChartCard
            title="Cash flow"
            hint="Solid orange is history. Dashed gold is the projected path."
            style={styles.card}
          >
            {forecast.isReal && forecast.history.length > 1 ? (
              <>
                <ForecastChart history={forecast.history} forecast={forecast.forecast} width={chartWidth} />
                {forecast.daysToLow !== null && forecast.daysToLow <= 30 ? (
                  <Text style={styles.warn}>May drop below ₹2,000 in {forecast.daysToLow} days.</Text>
                ) : (
                  <Text style={styles.ok}>Spending rate looks stable against recent history.</Text>
                )}
              </>
            ) : (
              <Text style={styles.muted}>Need a few dated rows before a forecast plot can be drawn.</Text>
            )}
          </ChartCard>

          <View style={[styles.plotRow, twoCol && styles.plotRowWide]}>
            <ChartCard
              title="Income vs spend"
              hint="Month-by-month from statement dates."
              style={[styles.plotCard, twoCol && styles.plotCardWide]}
            >
              <MonthlyTrendChart data={trend} width={halfWidth} />
            </ChartCard>

            <Pressable
              style={[styles.plotCard, twoCol && styles.plotCardWide]}
              onPress={() => setMoneyWentModalVisible(true)}
            >
              <ChartCard
                title="Where money went"
                hint="Tap for large spends & top recipient breakdown."
                style={{ marginBottom: 0 }}
              >
                <CategoryDonut data={categories} size={twoCol ? 148 : 138} />
                <View style={styles.tapPrompt}>
                  <Text style={styles.tapPromptText}>Tap to see large expenses & merchants</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                </View>
              </ChartCard>
            </Pressable>
          </View>

          {/* Savings Calculation Modal */}
          <Modal
            visible={savingsModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSavingsModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Savings Calculation</Text>
                  <Pressable onPress={() => setSavingsModalVisible(false)} hitSlop={10}>
                    <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Text style={styles.modalSubtitle}>How your monthly net savings is derived from your statement:</Text>

                <View style={styles.calcBox}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Total Income (Credits)</Text>
                    <Text style={[styles.calcValue, { color: colors.income }]}>
                      +{rupee(Math.round(monthly?.income ?? 0))}
                    </Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Total Expense (Debits)</Text>
                    <Text style={[styles.calcValue, { color: colors.expense }]}>
                      −{rupee(Math.round(monthly?.expense ?? 0))}
                    </Text>
                  </View>
                  <View style={[styles.calcRow, styles.calcDivider]}>
                    <Text style={styles.calcTotalLabel}>Net Savings</Text>
                    <Text style={styles.calcTotalValue}>
                      {rupee(Math.round(monthly?.savings ?? 0), { signed: true })}
                    </Text>
                  </View>
                </View>

                <View style={styles.rateCard}>
                  <Text style={styles.rateCardLabel}>Savings Rate Formula</Text>
                  <Text style={styles.rateCardFormula}>
                    (₹{Math.round(monthly?.savings ?? 0).toLocaleString()} ÷ ₹{Math.round(monthly?.income ?? 1).toLocaleString()}) × 100
                  </Text>
                  <Text style={styles.rateCardResult}>
                    = {monthly?.savingsRate ?? 0}% retained
                  </Text>
                  <Text style={styles.rateAdvice}>
                    {(monthly?.savingsRate ?? 0) >= 20
                      ? '🌟 Healthy savings rate! You exceed the standard 20% savings rule.'
                      : '💡 Aim to retain at least 20% of your income for emergencies and investments.'}
                  </Text>
                </View>

                <Pressable
                  style={styles.modalBtn}
                  onPress={() => {
                    setSavingsModalVisible(false);
                    router.push('/transactions');
                  }}
                >
                  <Text style={styles.modalBtnText}>View all statement records</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {/* Where Money Went Breakdown Modal */}
          <Modal
            visible={moneyWentModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMoneyWentModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { maxHeight: '85%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Where Money Went</Text>
                  <Pressable onPress={() => setMoneyWentModalVisible(false)} hitSlop={10}>
                    <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalSubtitle}>
                    Overview of who received your money and your largest purchases:
                  </Text>

                  <Text style={styles.sectionHeading}>Top Spenders / Merchants</Text>
                  {topMerchants.map((m, idx) => (
                    <Pressable
                      key={m.name}
                      style={styles.breakdownRow}
                      onPress={() => {
                        setMoneyWentModalVisible(false);
                        router.push({ pathname: '/transactions', params: { search: m.name } });
                      }}
                    >
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownName}>{m.name}</Text>
                        <Text style={styles.breakdownMeta}>{m.count} transaction{m.count === 1 ? '' : 's'}</Text>
                      </View>
                      <Text style={styles.breakdownAmt}>−{rupee(Math.round(m.total))}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 6 }} />
                    </Pressable>
                  ))}

                  <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>Largest Outgoing Payments</Text>
                  {largeDebits.map((tx) => (
                    <Pressable
                      key={tx.id}
                      style={styles.breakdownRow}
                      onPress={() => {
                        setMoneyWentModalVisible(false);
                        router.push({
                          pathname: '/transaction/[id]',
                          params: {
                            id: tx.id,
                            merchant: tx.merchant,
                            category: tx.category,
                            amount: String(tx.amount),
                            time: tx.dateLabel,
                            rawDescription: tx.rawDescription,
                            flagged: '0',
                          },
                        });
                      }}
                    >
                      <View style={[styles.rankBadge, { backgroundColor: colors.expense + '22' }]}>
                        <Ionicons name="arrow-up" size={12} color={colors.expense} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownName}>{tx.merchant}</Text>
                        <Text style={styles.breakdownMeta}>{tx.dateLabel} · {tx.category}</Text>
                      </View>
                      <Text style={[styles.breakdownAmt, { color: colors.expense }]}>
                        {rupee(tx.amount, { signed: true })}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 6 }} />
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  style={[styles.modalBtn, { marginTop: spacing.md }]}
                  onPress={() => {
                    setMoneyWentModalVisible(false);
                    router.push({ pathname: '/transactions', params: { type: 'expense' } });
                  }}
                >
                  <Text style={styles.modalBtnText}>View all expense transactions</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <SectionHeader title="Recent" action="See all" onAction={() => router.push('/transactions')} />
          <Card style={styles.txCard}>
            {rows.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onPress={() =>
                  router.push({
                    pathname: '/transaction/[id]',
                    params: {
                      id: tx.id,
                      merchant: tx.merchant,
                      category: tx.category,
                      amount: String(tx.amount),
                      time: tx.time,
                      flagged: '0',
                    },
                  })
                }
              />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  heroCardHalf: {
    flex: 1,
    marginBottom: 0,
  },
  heroCardPressable: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  balanceMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  inOutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  inOutText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroKicker: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -1.2,
    marginTop: 6,
  },
  heroMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  rateTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  rateFill: {
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  heroChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.accent + '28',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  heroChipText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.accent,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  plotRow: { gap: spacing.lg, marginBottom: spacing.lg },
  plotRowWide: { flexDirection: 'row', alignItems: 'stretch' },
  plotCard: { marginBottom: 0 },
  plotCardWide: { flex: 1 },
  warn: { fontSize: 13, color: colors.warn, marginTop: 10 },
  ok: { fontSize: 13, color: colors.income, marginTop: 10 },
  muted: { fontSize: 13, color: colors.textMuted },
  txCard: { paddingVertical: 4, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  tapPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  tapPromptText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.accent,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  calcBox: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  calcDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 6,
    paddingTop: 8,
  },
  calcTotalLabel: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  calcTotalValue: {
    fontSize: 16,
    fontFamily: fontFamily.extraBold,
    color: colors.savings,
  },
  rateCard: {
    backgroundColor: colors.savings + '18',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.savings + '44',
  },
  rateCardLabel: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.savings,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rateCardFormula: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rateCardResult: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  rateAdvice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  modalBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: colors.onAccent,
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
  },
  breakdownName: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  breakdownMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  breakdownAmt: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.onAccent,
  },
  userName: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  userHandle: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 1,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
});
