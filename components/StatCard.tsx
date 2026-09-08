import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, colors, radius, rupee, spacing } from '../constants/theme';

type Props = {
  label: string;
  amount: number;
  changePct?: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  delay?: number;
  showChange?: boolean;
  onPress?: () => void;
};

export default function StatCard({
  label,
  amount,
  changePct = 0,
  color,
  icon,
  showChange = false,
  onPress,
}: Props) {
  const isUp = changePct >= 0;
  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: color + '24' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        {showChange ? (
          <View style={[styles.chip, { backgroundColor: (isUp ? colors.income : colors.expense) + '22' }]}>
            <Text style={[styles.chipText, { color: isUp ? colors.income : colors.expense }]}>
              {isUp ? '+' : '−'}
              {Math.abs(changePct)}%
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount} numberOfLines={1}>
        {rupee(Math.round(amount))}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    paddingTop: spacing.md + 3,
    minWidth: 0,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  amount: {
    fontSize: 16,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: 4,
  },
});
