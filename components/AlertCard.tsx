import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from './Card';
import SeverityBadge from './SeverityBadge';
import { fontFamily, colors, spacing } from '../constants/theme';
import { Alert } from '../data/mockData';

export default function AlertCard({ alert, delay = 0, onPress }: { alert: Alert; delay?: number; onPress?: () => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450).springify().damping(18)}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <SeverityBadge severity={alert.severity} />
            <Text style={styles.time}>{alert.time}</Text>
          </View>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.detail}>{alert.detail}</Text>
          {onPress && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>View details</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.accent} />
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
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
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.accent,
  },
});
