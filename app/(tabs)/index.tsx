import { useMemo } from 'react';
import { useWindowDimensions, View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import CategoryDonut from '../../components/CategoryDonut';
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
import { colors, fontFamily, gradients, radius, rupee, spacing } from '../../constants/theme';

export default function HomeScreen() {
  const { imported } = useImportedTransactions();
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 64, 780);

  const points = useMemo(
    () => imported.map((tx) => ({ amount: tx.amount, timestamp: tx.timestamp, category: tx.category })),
    [imported]
  );

  const monthly = computeMonthlySnapshot(points);
  const forecast = predictCashFlow(points);
  const categories = useMemo(() => computeCategorySpend(points), [points]);
  const trend = useMemo(() => computeMonthlyTrend(points), [points]);
  const hasData = imported.length > 0;

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
        kicker="Overview"
        title="Home"
        subtitle="Cash position, charts and recent activity from your uploaded statement."
      />

      {!hasData ? (
        <Card elevated>
          <EmptyState
            icon="cloud-upload-outline"
            title="Your dashboard is waiting"
            body="Upload a bank CSV from Books. Income, spend, plots and the 30-day outlook all come from that file."
            actionLabel="Upload statement"
            onAction={() => router.push('/import-statement')}
          />
        </Card>
      ) : (
        <>
          <LinearGradient colors={[...gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroKicker}>This month · net</Text>
            <Text style={styles.heroAmount}>{rupee(Math.round(monthly?.savings ?? 0))}</Text>
            <Text style={styles.heroMeta}>
              {monthly ? `${monthly.savingsRate}% of income kept` : 'Add more dated rows for a rate'}
            </Text>
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

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Cash flow</Text>
            <Text style={styles.cardHint}>Solid line is history. Dashed gold is the projected path.</Text>
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
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Income vs spend</Text>
            <Text style={styles.cardHint}>Month-by-month from the statement dates.</Text>
            <MonthlyTrendChart data={trend} width={chartWidth} />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Where money went</Text>
            <Text style={styles.cardHint}>Category mix for this statement.</Text>
            <CategoryDonut data={categories} />
          </Card>

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
  heroKicker: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 40,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -1.2,
    marginTop: 8,
  },
  heroMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  heroChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: 'rgba(61,220,151,0.14)',
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
  cardTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  cardHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  warn: { fontSize: 13, color: colors.warn, marginTop: 8 },
  ok: { fontSize: 13, color: colors.income, marginTop: 8 },
  muted: { fontSize: 13, color: colors.textMuted },
  txCard: { paddingVertical: 4, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
});
