import { Ionicons } from '@expo/vector-icons';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import ScreenGlow from '../../components/ScreenGlow';
import LiveIndicator from '../../components/LiveIndicator';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../../hooks/useResponsive';

const SENSITIVITY_OPTIONS: Array<{ key: 'low' | 'medium' | 'high'; label: string; note: string }> = [
  { key: 'low', label: 'Low', note: 'Fewer, high-confidence alerts' },
  { key: 'medium', label: 'Medium', note: 'Balanced — recommended' },
  { key: 'high', label: 'High', note: 'Catches more, may over-alert' },
];

function SensitivitySelector() {
  const { sensitivity, setSensitivity } = useSettings();
  const activeIndex = SENSITIVITY_OPTIONS.findIndex((o) => o.key === sensitivity);
  const [wrapWidth, setWrapWidth] = useState(0);
  const itemWidth = wrapWidth / SENSITIVITY_OPTIONS.length;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(activeIndex * itemWidth, {
      damping: 26,
      stiffness: 260,
      mass: 0.6,
      overshootClamping: true,
    });
  }, [activeIndex, itemWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setWrapWidth(e.nativeEvent.layout.width);

  return (
    <View>
      <View style={styles.segmentWrap} onLayout={onLayout}>
        {wrapWidth > 0 && (
          <Animated.View style={[styles.segmentIndicator, { width: itemWidth - 8 }, indicatorStyle]} />
        )}
        {SENSITIVITY_OPTIONS.map((opt) => (
          <Pressable key={opt.key} style={styles.segmentItem} onPress={() => setSensitivity(opt.key)}>
            <Text style={[styles.segmentLabel, sensitivity === opt.key && styles.segmentLabelActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sensitivityNote}>{SENSITIVITY_OPTIONS[activeIndex]?.note}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const DATA_SOURCE_LABEL: Record<string, string> = {
  live: 'Live — connected to backend',
  local: 'Local simulation (no backend)',
  connecting: 'Connecting to backend…',
};

export default function SettingsScreen() {
  const {
    realtimeDetectionEnabled,
    setRealtimeDetectionEnabled,
    liveFeed,
    liveAlerts,
    triggerSimulatedTransaction,
    dataSource,
  } = useSettings();
  const { isDesktop } = useResponsive();

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { marginLeft: SIDEBAR_WIDTH }]} edges={['top']}>
      <ScreenGlow />
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={typography.title}>Settings</Text>
        <Text style={styles.subtitle}>Control detection, alerts, and simulation behavior.</Text>

        <Animated.View entering={FadeInDown.duration(450)}>
          <Card elevated style={styles.card}>
            <View style={styles.heroTop}>
              <Text style={styles.heroTitle}>Real-time detection</Text>
              <Switch
                value={realtimeDetectionEnabled}
                onValueChange={setRealtimeDetectionEnabled}
                trackColor={{ false: colors.surfaceAlt, true: colors.good }}
                thumbColor={colors.textPrimary}
              />
            </View>
            <Text style={styles.heroBody}>
              Instantly evaluate each transaction against your normal spending behavior — amount, time, merchant —
              and warn you the moment something looks unusual.
            </Text>
            <View style={styles.sourceBadge}>
              <View
                style={[
                  styles.sourceDot,
                  { backgroundColor: dataSource === 'live' ? colors.good : dataSource === 'local' ? colors.warn : colors.textMuted },
                ]}
              />
              <Text style={styles.sourceText}>{DATA_SOURCE_LABEL[dataSource]}</Text>
            </View>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <LiveIndicator active={realtimeDetectionEnabled} />
                <Text style={styles.heroStatLabel}>Engine status</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNumber}>{liveFeed.length}</Text>
                <Text style={styles.heroStatLabel}>Scanned this session</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatNumber, { color: colors.danger }]}>{liveAlerts.length}</Text>
                <Text style={styles.heroStatLabel}>Flagged</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Detection sensitivity</Text>
            <View style={{ marginTop: spacing.md }}>
              <SensitivitySelector />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(450)}>
          <Card style={styles.card}>
            <SettingsRow
              icon="flash"
              iconColor={colors.accent}
              title="Simulate a transaction now"
              subtitle="Manually trigger the detection engine for a demo"
              right={
                <Pressable style={styles.simulateBtn} onPress={triggerSimulatedTransaction}>
                  <Ionicons name="play" size={13} color={colors.ringCore} />
                  <Text style={styles.simulateBtnText}>Run</Text>
                </Pressable>
              }
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <Card style={styles.card}>
            <Text style={styles.groupLabel}>Notifications</Text>
            <SettingsRow
              icon="notifications"
              iconColor={colors.savings}
              title="Push alerts"
              subtitle="Get notified even when the app is closed"
              right={<Switch value trackColor={{ false: colors.surfaceAlt, true: colors.good }} thumbColor={colors.textPrimary} />}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="moon"
              iconColor={colors.accent2}
              title="Quiet hours"
              subtitle="Mute non-critical alerts, 11 PM – 7 AM"
              right={<Switch value={false} trackColor={{ false: colors.surfaceAlt, true: colors.good }} thumbColor={colors.textPrimary} />}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(450)}>
          <Card style={styles.card}>
            <Text style={styles.groupLabel}>About this engine</Text>
            <Text style={styles.aboutBody}>
              Each simulated transaction is scored against your baseline profile — average amount per category,
              usual active hours, and known merchants. A significant deviation raises a real-time alert here and
              on the Home tab.
            </Text>
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
  card: {
    marginBottom: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  heroBody: {
    ...typography.body,
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroStat: {
    alignItems: 'flex-start',
    gap: 4,
  },
  heroStatNumber: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  heroStatLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontFamily: fontFamily.semiBold,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.ringCore,
  },
  sensitivityNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  simulateBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.extraBold,
    color: colors.ringCore,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: fontFamily.extraBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  aboutBody: {
    ...typography.body,
    lineHeight: 19,
  },
});
