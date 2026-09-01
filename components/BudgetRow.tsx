import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fontFamily, colors, radius, spacing } from '../constants/theme';
import { Budget } from '../data/mockData';

export default function BudgetRow({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const pct = budget.spent / budget.budgeted;
  const isOver = pct > 1;
  const barColor = isOver ? colors.danger : pct > 0.85 ? colors.warn : budget.color;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.category}>{budget.category}</Text>
        <Text style={[styles.amounts, isOver && styles.over]}>
          ₹{budget.spent.toLocaleString('en-IN')}{' '}
          <Text style={styles.of}>/ ₹{budget.budgeted.toLocaleString('en-IN')}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct * 100)}%`, backgroundColor: barColor }]} />
      </View>
      {isOver && <Text style={styles.overNote}>₹{(budget.spent - budget.budgeted).toLocaleString('en-IN')} over budget</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  amounts: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  over: {
    color: colors.danger,
  },
  of: {
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  track: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  overNote: {
    fontSize: 10.5,
    color: colors.danger,
    fontFamily: fontFamily.semiBold,
    marginTop: 4,
  },
});
