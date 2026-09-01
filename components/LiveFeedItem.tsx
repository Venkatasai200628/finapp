import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { colors, radius, spacing } from '../constants/theme';
import { LiveTransaction } from '../lib/realtimeEngine';

function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export default function LiveFeedItem({ event, onPress }: { event: LiveTransaction; onPress?: () => void }) {
  const isDanger = event.severity === 'danger';
  const isIncome = event.amount > 0 && event.category === 'Income';

  return (
    <Animated.View entering={FadeInDown.duration(400).springify().damping(18)} layout={Layout}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View
          style={[
            styles.dot,
            { backgroundColor: isDanger ? colors.danger : isIncome ? colors.income : colors.textMuted },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.merchant} numberOfLines={1}>
            {event.merchant}
          </Text>
          {isDanger && (
            <View style={styles.reasonRow}>
              <Ionicons name="alert-circle" size={11} color={colors.danger} />
              <Text style={styles.reason} numberOfLines={1}>
                {event.reasons[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.amount, isDanger && styles.amountDanger, isIncome && styles.amountIncome]}>
          {event.amount >= 0 ? '+' : '−'}₹{Math.abs(event.amount).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.time}>{timeAgo(event.timestamp)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 9,
  },
  rowPressed: {
    opacity: 0.6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  merchant: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  reason: {
    fontSize: 10.5,
    color: colors.danger,
    flexShrink: 1,
  },
  amount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  amountDanger: {
    color: colors.danger,
  },
  amountIncome: {
    color: colors.income,
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    width: 42,
    textAlign: 'right',
  },
});
