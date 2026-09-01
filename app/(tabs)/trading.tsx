import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import Card from '../../components/Card';
import ScreenGlow from '../../components/ScreenGlow';
import SeverityBadge from '../../components/SeverityBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchTradingStatus, TradingStatus } from '../../lib/backendClient';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../../hooks/useResponsive';

const REFRESH_MS = 20000;

function money(value: number) {
  const sign = value < 0 ? '−' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

/** Cumulative P&L sparkline. Zero line included so a losing run reads as below-zero. */
function EquityCurve({ points }: { points: number[] }) {
  const width = 280;
  const height = 70;
  if (points.length < 2) return null;

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (v: number) => height - ((v - min) / range) * height;
  const last = points[points.length - 1];

  return (
    <Svg width={width} height={height} style={{ marginTop: spacing.md }}>
      <Polyline points={`0,${y(0)} ${width},${y(0)}`} stroke={colors.border} strokeWidth={1} strokeDasharray="4 4" />
      <Polyline
        points={points.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        fill="none"
        stroke={last >= 0 ? colors.good : colors.danger}
        strokeWidth={2}
      />
    </Svg>
  );
}

export default function TradingScreen() {
  const { token } = useAuth();
  const { isDesktop } = useResponsive();
  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const next = await fetchTradingStatus(token);
    setStatus(next);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const connected = status?.connection.connected === true;
  const summary = status?.summary;

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { marginLeft: SIDEBAR_WIDTH }]} edges={['top']}>
      <ScreenGlow />
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={typography.title}>Trading</Text>
        <Text style={styles.subtitle}>Watching your bot for behaviour that doesn&apos;t look like itself.</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !connected ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card style={styles.card}>
              <View style={styles.emptyIcon}>
                <Ionicons name="link-outline" size={22} color={colors.textMuted} />
              </View>
              <Text style={typography.h3}>Bot not connected</Text>
              <Text style={styles.emptyBody}>
                {status?.connection.connected === false ? status.connection.reason : 'Could not reach the engine.'}
              </Text>
              <Text style={styles.emptyHint}>
                Set TRADING_BOT_DB_PATH in backend/.env to your bot&apos;s logs/trades.db, or run
                scripts/bot_bridge.py next to the bot if it lives on another machine.
              </Text>
            </Card>
          </Animated.View>
        ) : (
          <>
            {summary && (
              <Animated.View entering={FadeInDown.duration(450)}>
                <Card elevated style={styles.card}>
                  <View style={styles.heroTop}>
                    <Text style={styles.heroLabel}>Realised P&amp;L</Text>
                    <View style={styles.modeChip}>
                      <Text style={styles.modeChipText}>
                        {status?.connection.connected ? status.connection.mode : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.heroAmount, { color: summary.totalPnl >= 0 ? colors.good : colors.danger }]}>
                    {money(summary.totalPnl)}
                  </Text>
                  {status?.equity && <EquityCurve points={status.equity} />}
                  <View style={styles.statRow}>
                    <Stat label="Win rate" value={`${summary.winRate}%`} />
                    <Stat label="Trades" value={String(summary.totalTrades)} />
                    <Stat label="Max drawdown" value={money(summary.maxDrawdown)} tone={colors.warn} />
                  </View>
                </Card>
              </Animated.View>
            )}

            {status?.flags && status.flags.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={typography.h2}>Behaviour alerts</Text>
                </View>
                {status.flags.map((flag, i) => (
                  <Animated.View key={flag.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <Card style={styles.card}>
                      <SeverityBadge severity={flag.severity} />
                      <Text style={styles.flagTitle}>{flag.title}</Text>
                      <Text style={styles.flagDetail}>{flag.detail}</Text>
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}

            {status?.openPositions && status.openPositions.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={typography.h2}>Open positions</Text>
                </View>
                <Card style={styles.listCard}>
                  {status.openPositions.map((p) => (
                    <View key={p.id} style={styles.positionRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.positionTop}>
                          <Text style={styles.symbol}>{p.symbol}</Text>
                          <View style={[styles.dirChip, p.direction === 'BUY' ? styles.dirLong : styles.dirShort]}>
                            <Text style={styles.dirText}>{p.direction === 'BUY' ? 'LONG' : 'SHORT'}</Text>
                          </View>
                        </View>
                        {p.entry_reason && (
                          <Text style={styles.reason} numberOfLines={1}>
                            {p.entry_reason}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.size}>{money(p.size_usdt)}</Text>
                        <Text style={styles.entry}>@ {p.entry_price.toLocaleString('en-US')}</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {status?.exposure && status.exposure.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <Card style={styles.card}>
                  <Text style={typography.h3}>Exposure by symbol</Text>
                  <View style={{ marginTop: spacing.md }}>
                    {status.exposure.map((e) => (
                      <View key={e.symbol} style={styles.exposureRow}>
                        <View style={styles.exposureTop}>
                          <Text style={styles.exposureSymbol}>{e.symbol}</Text>
                          <Text style={styles.exposureValue}>
                            {money(e.exposure)} <Text style={styles.exposureShare}>· {e.share}%</Text>
                          </Text>
                        </View>
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.fill,
                              { width: `${e.share}%`, backgroundColor: e.share >= 60 ? colors.warn : colors.accent },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              </Animated.View>
            )}

            <Text style={styles.footnote}>
              Read-only. This screen observes your bot — it never places, changes or cancels orders.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  card: { marginBottom: spacing.lg },
  listCard: { marginBottom: spacing.lg, paddingVertical: 0, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyBody: { ...typography.body, marginTop: 6, lineHeight: 19 },
  emptyHint: { ...typography.body, fontSize: 12, color: colors.textMuted, marginTop: spacing.md, lineHeight: 17 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  modeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  modeChipText: { fontSize: 10, fontFamily: fontFamily.extraBold, color: colors.textSecondary, letterSpacing: 0.5 },
  heroAmount: { fontSize: 34, fontFamily: fontFamily.extraBold, letterSpacing: -0.6, marginTop: 4 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { gap: 3 },
  statValue: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.textPrimary },
  statLabel: { fontSize: 10.5, color: colors.textMuted, fontFamily: fontFamily.semiBold },
  sectionHeader: { marginBottom: spacing.md },
  flagTitle: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.textPrimary, marginTop: spacing.sm },
  flagDetail: { ...typography.body, fontSize: 13, marginTop: 4, lineHeight: 19 },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  positionTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  symbol: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.textPrimary },
  dirChip: { borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 7 },
  dirLong: { backgroundColor: colors.good + '22' },
  dirShort: { backgroundColor: colors.danger + '22' },
  dirText: { fontSize: 9.5, fontFamily: fontFamily.extraBold, color: colors.textSecondary, letterSpacing: 0.4 },
  reason: { fontSize: 11.5, color: colors.textMuted, marginTop: 3 },
  size: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.textPrimary },
  entry: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  exposureRow: { marginBottom: spacing.md },
  exposureTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  exposureSymbol: { fontSize: 13, color: colors.textSecondary, fontFamily: fontFamily.medium },
  exposureValue: { fontSize: 12.5, fontFamily: fontFamily.bold, color: colors.textPrimary },
  exposureShare: { fontFamily: fontFamily.regular, color: colors.textMuted },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  footnote: { ...typography.body, fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
