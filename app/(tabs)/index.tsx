import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useResponsive } from '../../hooks/useResponsive';
import { colors, fontFamily, gradients, radius, rupee, spacing } from '../../constants/theme';

export default function HomeScreen() {
  const { imported } = useImportedTransactions();
  const { twoCol, contentWidth } = useResponsive();
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

  const rows = imported.slice(0, 6).map((tx) => ({
    id: tx.id,
    merchant: tx.merchant,
    category: tx.category,
    amount: tx.amount,
    time: tx.dateLabel,
    flagged: false,
  }));

  return (
    <Screen>
      <SectionHeader
        kicker="Dashboard"
        title="Home"
        subtitle="Net position, cash-flow plots and recent activity — all from your statement."
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
          <LinearGradient colors={[...gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroKicker}>This month · net</Text>
                <Text style={styles.heroAmount}>{rupee(Math.round(monthly?.savings ?? 0))}</Text>
                <Text style={styles.heroMeta}>
                  {monthly ? `${monthly.savingsRate}% of income kept as savings` : 'Add dated rows for a savings rate'}
                </Text>
              </View>
            </View>
            <View style={styles.rateTrack}>
              <View style={[styles.rateFill, { width: `${rate}%` }]} />
            </View>
            {forecast.isReal ? (
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>
                  30-day outlook {rupee(forecast.projectedBalance, { signed: true })}
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          <View style={styles.statsRow}>
            <StatCard
              label="Income"
              amount={monthly?.income ?? 0}
              color={colors.income}
              icon="arrow-down-circle"
              showChange={!!monthly}
              changePct={monthly?.incomeChangePct ?? 0}
            />
            <StatCard
              label="Expense"
              amount={monthly?.expense ?? 0}
              color={colors.expense}
              icon="arrow-up-circle"
              showChange={!!monthly}
              changePct={monthly?.expenseChangePct ?? 0}
            />
            <StatCard
              label="Savings"
              amount={monthly?.savings ?? 0}
              color={colors.savings}
              icon="wallet"
              showChange={!!monthly}
              changePct={monthly?.savingsChangePct ?? 0}
            />
          </View>

          <ChartCard
            title="Cash flow"
            hint="Solid mint is history. Dashed gold is the projected path."
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
            <ChartCard
              title="Where money went"
              hint="Category mix for this statement."
              style={[styles.plotCard, twoCol && styles.plotCardWide]}
            >
              <CategoryDonut data={categories} size={twoCol ? 148 : 160} />
            </ChartCard>
          </View>

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
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 42,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -1.4,
    marginTop: 8,
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
    backgroundColor: 'rgba(45,212,168,0.16)',
    borderRadius: radius.pill,
    paddingVertical: 7,
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
});
