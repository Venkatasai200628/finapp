import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { fontFamily, colors, radius, spacing } from '../constants/theme';
import { Goal } from '../data/mockData';

export default function GoalCard({ goal, delay = 0, onPress }: { goal: Goal; delay?: number; onPress?: () => void }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));

  return (
    <Animated.View entering={FadeInRight.delay(delay).duration(450).springify().damping(18)}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={[styles.iconWrap, { backgroundColor: goal.color + '22' }]}>
          <Ionicons name={goal.icon as keyof typeof Ionicons.glyphMap} size={18} color={goal.color} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>
        <Text style={styles.target}>by {goal.targetDate}</Text>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: goal.color }]} />
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.amount}>₹{(goal.current / 1000).toFixed(0)}k</Text>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  target: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
    marginBottom: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  amount: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: colors.textSecondary,
  },
  pct: {
    fontSize: 11.5,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
});
