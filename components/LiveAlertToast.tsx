import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { fontFamily, colors, radius, shadow, spacing } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

export default function LiveAlertToast() {
  const { liveAlerts } = useSettings();
  const insets = useSafeAreaInsets();
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const latest = liveAlerts[0];

  useEffect(() => {
    if (!latest) return;
    setVisibleId(latest.id);
    const t = setTimeout(() => setVisibleId((id) => (id === latest.id ? null : id)), 4500);
    return () => clearTimeout(t);
  }, [latest]);

  if (!latest || visibleId !== latest.id) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(16)}
      exiting={SlideOutUp.duration(250)}
      style={[styles.wrap, { top: insets.top + spacing.sm }, shadow.floating]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="warning" size={18} color={colors.bg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Unusual transaction detected</Text>
        <Text style={styles.detail} numberOfLines={2}>
          {latest.merchant} · ₹{Math.abs(latest.amount).toLocaleString('en-IN')} · {latest.reasons[0]}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + '55',
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  detail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
