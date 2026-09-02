import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from '../../components/Card';
import ScreenGlow from '../../components/ScreenGlow';
import MonthlyTrendChart from '../../components/MonthlyTrendChart';
import CategoryTrendRow from '../../components/CategoryTrendRow';
import BudgetRow from '../../components/BudgetRow';
import GoalCard from '../../components/GoalCard';
import NewGoalCard from '../../components/NewGoalCard';
import { categorySpend, categorySpendLastMonth, monthlyTrend } from '../../data/mockData';
import { useBudgets } from '../../context/BudgetsContext';
import { useGoals } from '../../context/GoalsContext';
import { colors, fontFamily, spacing, typography } from '../../constants/theme';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../../hooks/useResponsive';

export default function InsightsScreen() {
  const { isDesktop } = useResponsive();
  const { budgets, setLimit } = useBudgets();
  const { goals, addGoal } = useGoals();

  const latest = monthlyTrend[monthlyTrend.length - 1];
  const previous = monthlyTrend[monthlyTrend.length - 2];
  const savingsRateChange = previous ? Math.round(((latest.savings - previous.savings) / previous.savings) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { marginLeft: SIDEBAR_WIDTH }]} edges={['top']}>
      <ScreenGlow />
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={typography.title}>Insights</Text>
        <Text style={styles.subtitle}>Reports on where your money's been, and budgets and goals to steer where it's going.</Text>

        <Animated.View entering={FadeInDown.duration(450)}>
          <Card style={styles.card}>
            <View style={styles.reportHeader}>
              <Text style={typography.h3}>Income vs expense</Text>
              <Text style={styles.reportPeriod}>Last 6 months</Text>
            </View>
            <MonthlyTrendChart data={monthlyTrend} width={280} />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Text style={[styles.savingsDelta, { color: savingsRateChange >= 0 ? colors.good : colors.danger }]}>
                {savingsRateChange >= 0 ? '↑' : '↓'} {Math.abs(savingsRateChange)}% savings vs last month
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(450)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Spending by category</Text>
            <Text style={styles.reportPeriod}>This month vs last month</Text>
            <View style={{ marginTop: spacing.sm }}>
              {categorySpend.map((c, i) => (
                <CategoryTrendRow
                  key={c.category}
                  category={c.category}
                  color={c.color}
                  amount={c.amount}
                  lastMonth={categorySpendLastMonth[c.category] ?? c.amount}
                  delay={i * 30}
                />
              ))}
            </View>
          </Card>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={typography.h2}>Savings goals</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalsRow}>
          {goals.map((g, i) => (
            <GoalCard key={g.id} goal={g} delay={i * 60} onPress={() => router.push(`/goal/${g.id}`)} />
          ))}
          <NewGoalCard onCreate={addGoal} />
        </ScrollView>

        <Animated.View entering={FadeInDown.delay(100).duration(450)}>
          <Card style={[styles.card, { marginTop: spacing.lg }]}>
            <Text style={typography.h3}>Budget vs actual</Text>
            <Text style={styles.reportPeriod}>Tap a limit to change it</Text>
            <View style={{ marginTop: spacing.md }}>
              {budgets.map((b, i) => (
                <BudgetRow key={b.category} budget={b} delay={i * 40} onChangeLimit={setLimit} />
              ))}
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 120 },
  contentDesktop: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  subtitle: { ...typography.body, marginTop: 4, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportPeriod: { fontSize: 11, color: colors.textMuted, fontFamily: fontFamily.medium, marginTop: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textMuted },
  savingsDelta: { fontSize: 11, fontFamily: fontFamily.bold },
  sectionHeader: { marginBottom: spacing.md },
  goalsRow: { gap: spacing.sm, paddingBottom: spacing.lg },
});
