import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fontFamily, radius, spacing } from '../constants/theme';

type Props = {
  category: string;
  color: string;
  amount: number;
  lastMonth: number;
  delay?: number;
};

export default function CategoryTrendRow({ category, color, amount, lastMonth, delay = 0 }: Props) {
  const changePct = lastMonth > 0 ? Math.round(((amount - lastMonth) / lastMonth) * 100) : 0;
  const isUp = changePct > 0;
  const isFlat = changePct === 0;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)} style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.category} numberOfLines={1}>
        {category}
      </Text>
      <Text style={styles.amount}>₹{amount.toLocaleString('en-IN')}</Text>
      <View style={styles.changeWrap}>
        {!isFlat && (
          <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={11} color={isUp ? colors.expense : colors.income} />
        )}
        <Text style={[styles.change, { color: isFlat ? colors.textMuted : isUp ? colors.expense : colors.income }]}>
          {isFlat ? '—' : `${Math.abs(changePct)}%`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  category: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },
  amount: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  changeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 46,
    justifyContent: 'flex-end',
  },
  change: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
});
