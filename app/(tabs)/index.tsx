import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Card from '../../components/Card';
import ScreenGlow from '../../components/ScreenGlow';
import ScoreRing from '../../components/ScoreRing';
import FactorBar from '../../components/FactorBar';
import AlertCard from '../../components/AlertCard';
import StatCard from '../../components/StatCard';
import LiveIndicator from '../../components/LiveIndicator';
import LiveFeedItem from '../../components/LiveFeedItem';
import AnimatedNumber from '../../components/AnimatedNumber';
import { alerts, healthFactors, healthScore, monthlySummary } from '../../data/mockData';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../../hooks/useResponsive';

export default function HomeScreen() {
  const { realtimeDetectionEnabled, liveFeed } = useSettings();
  const { isDesktop } = useResponsive();
  const topAlerts = alerts.slice(0, 2);
  const totalBalance = monthlySummary.income - monthlySummary.expense + 84200;

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { marginLeft: SIDEBAR_WIDTH }]} edges={['top']}>
      <ScreenGlow />
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Good to see you</Text>
            <Text style={typography.title}>Overview</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={colors.textSecondary} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <Card elevated style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Total balance</Text>
              <LiveIndicator active={realtimeDetectionEnabled} />
            </View>
            <AnimatedNumber value={totalBalance} prefix="₹" style={styles.heroAmount} />
            <View style={styles.heroFooter}>
              <Ionicons name="shield-checkmark" size={13} color={colors.textSecondary} />
              <Text style={styles.heroFooterText}>
                {realtimeDetectionEnabled ? 'Actively scanning every transaction' : 'Real-time scanning is paused'}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatCard label="Income" amount={monthlySummary.income} changePct={monthlySummary.incomeChangePct} color={colors.income} icon="arrow-down-circle" delay={80} />
          <StatCard label="Expense" amount={monthlySummary.expense} changePct={-monthlySummary.expenseChangePct} color={colors.expense} icon="arrow-up-circle" delay={140} />
          <StatCard label="Savings" amount={monthlySummary.savings} changePct={monthlySummary.savingsChangePct} color={colors.savings} icon="wallet" delay={200} />
        </View>

        <Animated.View entering={FadeInDown.delay(220).duration(500)}>
          <Card style={styles.liveCard}>
            <View style={styles.liveHeader}>
              <View style={styles.liveHeaderLeft}>
                <View style={[styles.liveIconWrap, { backgroundColor: (realtimeDetectionEnabled ? colors.live : colors.textMuted) + '22' }]}>
                  <Ionicons name="pulse" size={16} color={realtimeDetectionEnabled ? colors.live : colors.textMuted} />
                </View>
                <View>
                  <Text style={typography.h3}>Real-time detection</Text>
                  <Text style={styles.liveSub}>
                    {realtimeDetectionEnabled ? 'Scanning transactions against your baseline' : 'Turn on in Settings to resume scanning'}
                  </Text>
                </View>
              </View>
              <LiveIndicator active={realtimeDetectionEnabled} />
            </View>

            {liveFeed.length === 0 ? (
              <Text style={styles.liveEmpty}>Waiting for the first transaction to scan…</Text>
            ) : (
              <View style={styles.liveFeed}>
                {liveFeed.slice(0, 4).map((e) => (
                  <LiveFeedItem
                    key={e.id}
                    event={e}
                    onPress={() =>
                      router.push({
                        pathname: '/transaction/[id]',
                        params: {
                          id: e.id,
                          merchant: e.merchant,
                          category: e.category,
                          amount: String(e.amount),
                          time: new Date(e.timestamp).toLocaleString(),
                          flagged: e.severity === 'danger' ? '1' : '0',
                          reasons: e.reasons.join('|'),
                        },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(500)}>
          <Card style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <ScoreRing score={healthScore} size={140} />
              <View style={styles.factors}>
                {healthFactors.map((f) => (
                  <FactorBar key={f.label} {...f} />
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={typography.h2}>Recent alerts</Text>
        </View>
        {topAlerts.map((a, i) => (
          <AlertCard key={a.id} alert={a} delay={i * 60} onPress={() => router.push(`/alert/${a.id}`)} />
        ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: {
    marginBottom: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  heroAmount: {
    fontSize: 40,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  liveCard: {
    marginBottom: spacing.lg,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  liveIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  liveEmpty: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  liveFeed: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 2,
  },
  scoreCard: {
    marginBottom: spacing.xl,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  factors: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
});
