import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from '../../components/Card';
import DetailHeader from '../../components/DetailHeader';
import SeverityBadge from '../../components/SeverityBadge';
import { alerts } from '../../data/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

const SOURCE_STEPS: Record<string, string[]> = {
  transaction: [
    'Transaction received',
    'Compared amount, time, and merchant to your baseline',
    'Deviation exceeded your sensitivity threshold',
    'Alert raised',
  ],
  forecast: [
    'Income and expense history analyzed',
    'Cash flow projected forward 30 days',
    'Projected balance crossed a low-balance threshold',
    'Alert raised',
  ],
  risk: [
    'Savings rate tracked over recent months',
    'Trend detected as consistently declining',
    'Compared against healthy-range thresholds',
    'Alert raised',
  ],
  trading: [
    'Portfolio activity monitored',
    'Compared to historical investment behavior',
    'Significant deviation detected',
    'Alert raised',
  ],
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = alerts.find((a) => a.id === id);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!alert) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DetailHeader title="Alert" />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>This alert is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps = SOURCE_STEPS[alert.source] ?? SOURCE_STEPS.transaction;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DetailHeader title="Alert Details" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={styles.card}>
            <View style={styles.topRow}>
              <SeverityBadge severity={alert.severity} />
              <Text style={styles.time}>{alert.time}</Text>
            </View>
            <Text style={styles.title}>{alert.title}</Text>
            <Text style={styles.detail}>{alert.detail}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>How this was detected</Text>
            <View style={{ marginTop: spacing.md }}>
              {steps.map((step, i) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepDotWrap}>
                    <View style={styles.stepDot} />
                    {i < steps.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)}>
          {acknowledged ? (
            <Card style={[styles.card, styles.resolvedCard]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.good} />
              <Text style={styles.resolvedText}>Acknowledged. This alert won't be highlighted again.</Text>
            </Card>
          ) : (
            <Pressable style={styles.ackBtn} onPress={() => setAcknowledged(true)}>
              <Text style={styles.ackBtnText}>Acknowledge alert</Text>
            </Pressable>
          )}
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
  card: {
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  time: {
    fontSize: 12,
    color: colors.textMuted,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepDotWrap: {
    alignItems: 'center',
    width: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    minHeight: 22,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  stepText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingBottom: spacing.md,
    flex: 1,
  },
  ackBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ackBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: colors.textMuted,
  },
});
