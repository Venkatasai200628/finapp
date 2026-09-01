import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Card from '../../components/Card';
import DetailHeader from '../../components/DetailHeader';
import AnimatedNumber from '../../components/AnimatedNumber';
import ScreenGlow from '../../components/ScreenGlow';
import { useGoals } from '../../context/GoalsContext';
import { fontFamily, colors, radius, spacing, typography } from '../../constants/theme';

const QUICK_AMOUNTS = [500, 1000, 5000];

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGoal, addFunds } = useGoals();
  const goal = getGoal(id ?? '');
  const [input, setInput] = useState('');

  if (!goal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenGlow />
        <DetailHeader title="Goal" />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>This goal is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const remaining = Math.max(0, goal.target - goal.current);

  const handleAdd = (amount: number) => {
    if (amount > 0) {
      addFunds(goal.id, amount);
      setInput('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenGlow />
      <DetailHeader title={goal.name} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroWrap}>
          <View style={[styles.iconCircle, { backgroundColor: goal.color + '22' }]}>
            <Ionicons name={goal.icon as keyof typeof Ionicons.glyphMap} size={26} color={goal.color} />
          </View>
          <AnimatedNumber value={goal.current} prefix="₹" style={styles.amount} />
          <Text style={styles.target}>of ₹{goal.target.toLocaleString('en-IN')} target · by {goal.targetDate}</Text>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: goal.color }]} />
          </View>
          <View style={styles.pctRow}>
            <Text style={styles.pctText}>{pct}% complete</Text>
            <Text style={styles.remainingText}>₹{remaining.toLocaleString('en-IN')} to go</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Add funds</Text>
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((amt) => (
                <Pressable key={amt} style={styles.quickChip} onPress={() => handleAdd(amt)}>
                  <Text style={styles.quickChipText}>+₹{amt.toLocaleString('en-IN')}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Custom amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.input}
              />
              <Pressable style={styles.addBtn} onPress={() => handleAdd(Number(input))}>
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Contribution history</Text>
            <View style={{ marginTop: spacing.sm }}>
              {goal.contributions.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInUp.delay(i * 40).duration(300)} style={styles.contribRow}>
                  <View style={styles.contribDot} />
                  <Text style={styles.contribDate}>{c.date}</Text>
                  <Text style={styles.contribAmount}>+₹{c.amount.toLocaleString('en-IN')}</Text>
                </Animated.View>
              ))}
            </View>
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
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  amount: {
    fontSize: 32,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  target: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  pctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.sm,
  },
  pctText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  remainingText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  card: {
    marginBottom: spacing.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  quickChipText: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
    color: colors.textPrimary,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 13.5,
    fontFamily: fontFamily.extraBold,
    color: colors.ringCore,
  },
  contribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contribDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.good,
  },
  contribDate: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  contribAmount: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.good,
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
