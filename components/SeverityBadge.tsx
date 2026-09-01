import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, statusColor } from '../constants/theme';
import { Severity } from '../data/mockData';

const LABEL: Record<Severity, string> = {
  good: 'Normal',
  warn: 'Watch',
  danger: 'Alert',
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const color = statusColor(severity);
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{LABEL[severity]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
