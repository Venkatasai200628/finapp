import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { HealthFactor } from '../data/mockData';

function barColor(score: number) {
  if (score >= 70) return colors.good;
  if (score >= 45) return colors.warn;
  return colors.danger;
}

export default function FactorBar({ label, score }: HealthFactor) {
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${score}%`, backgroundColor: barColor(score) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  score: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
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
});
