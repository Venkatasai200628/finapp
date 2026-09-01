import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from '../../components/Card';
import ScreenGlow from '../../components/ScreenGlow';
import ForecastChart from '../../components/ForecastChart';
import CategoryDonut from '../../components/CategoryDonut';
import TransactionRow from '../../components/TransactionRow';
import SeverityBadge from '../../components/SeverityBadge';
import StatCard from '../../components/StatCard';
import BudgetRow from '../../components/BudgetRow';
import GoalCard from '../../components/GoalCard';
import { budgets, cashFlowForecast, categorySpend, monthlySummary, stressTrend, transactions } from '../../data/mockData';
import { colors, fontFamily, spacing, typography } from '../../constants/theme';
import { useGoals } from '../../context/GoalsContext';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../../hooks/useResponsive';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function txParams(tx: (typeof transactions)[number]) {
  return {
    id: tx.id,
    merchant: tx.merchant,
    category: tx.category,
    amount: String(tx.amount),
    time: tx.time,
    flagged: tx.flagged ? '1' : '0',
  };
}

export default function FinanceScreen() {
  const { goals } = useGoals();
  const { isDesktop } = useResponsive();

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { marginLeft: SIDEBAR_WIDTH }]} edges={['top']}>
      <ScreenGlow />
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={typography.title}>Finance</Text>
        <Text style={styles.subtitle}>Income, spending, forecast and risk — all in one place.</Text>

        <View style={styles.statsRow}>
          <StatCard label="Income" amount={monthlySummary.income} changePct={monthlySummary.incomeChangePct} color={colors.income} icon="arrow-down-circle" />
          <StatCard label="Expense" amount={monthlySummary.expense} changePct={-monthlySummary.expenseChangePct} color={colors.expense} icon="arrow-up-circle" delay={60} />
          <StatCard label="Savings" amount={monthlySummary.savings} changePct={monthlySummary.savingsChangePct} color={colors.savings} icon="wallet" delay={120} />
        </View>

        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Card elevated style={styles.rateCard}>
            <Text style={styles.rateLabel}>Savings rate</Text>
            <Text style={styles.rateValue}>{monthlySummary.savingsRate}%</Text>
            <Text style={styles.rateNote}>of income saved this month — aim to keep this above 20%.</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h2}>Savings Goals</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalsRow}>
            {goals.map((g, i) => (
              <GoalCard key={g.id} goal={g} delay={i * 60} onPress={() => router.push(`/goal/${g.id}`)} />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Spending by Category</Text>
            <View style={{ marginTop: spacing.md }}>
              <CategoryDonut data={categorySpend} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(500)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Budget vs Actual</Text>
            <View style={{ marginTop: spacing.md }}>
              {budgets.map((b, i) => (
                <BudgetRow key={b.category} budget={b} delay={i * 40} />
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Cash Flow Forecast</Text>
            <Text style={styles.forecastLine}>
              Projected balance in 30 days:{' '}
              <Text style={styles.forecastValue}>{formatCurrency(cashFlowForecast.projectedBalance)}</Text>
            </Text>
            <ForecastChart history={cashFlowForecast.history} forecast={cashFlowForecast.forecast} width={280} />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>Actual</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warn }]} />
                <Text style={styles.legendText}>Forecast</Text>
              </View>
            </View>
            <Text style={styles.forecastNote}>
              At the current rate, your balance may fall below ₹2,000 within {cashFlowForecast.daysToLow} days.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(500)}>
          <Card style={styles.card}>
            <View style={styles.riskHeader}>
              <Text style={typography.h3}>Early Financial Stress</Text>
              <SeverityBadge severity={stressTrend.riskLevel} />
            </View>
            <Text style={styles.riskLine}>Savings rate: {stressTrend.savingsRateHistory.join('% → ')}%</Text>
            <Text style={styles.riskLine}>Expenses increasing for {stressTrend.expenseTrendMonths} months</Text>
            <Text style={styles.riskLine}>Credit usage: {stressTrend.creditUsage}</Text>
          </Card>
        </Animated.View>

        <View style={styles.transactionsHeader}>
          <Text style={typography.h2}>Transactions</Text>
          <Pressable style={styles.seeAll} onPress={() => router.push('/transactions')} hitSlop={8}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </Pressable>
        </View>
        <Card style={styles.txCard}>
          {transactions.map((tx, i) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              delay={i * 40}
              onPress={() => router.push({ pathname: '/transaction/[id]', params: txParams(tx) })}
            />
          ))}
        </Card>
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
    paddingBottom: 120,
  },
  contentDesktop: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rateCard: {
    marginBottom: spacing.lg,
  },
  rateLabel: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  rateValue: {
    fontSize: 36,
    fontFamily: fontFamily.extraBold,
    color: colors.accent,
    marginTop: 2,
  },
  rateNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  card: {
    marginBottom: spacing.lg,
  },
  forecastLine: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  forecastValue: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  forecastNote: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.warn,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  riskLine: {
    ...typography.body,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  goalsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.accent,
  },
  txCard: {
    paddingVertical: 0,
    paddingHorizontal: spacing.lg,
  },
});
