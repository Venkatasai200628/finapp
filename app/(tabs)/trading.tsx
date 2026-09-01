import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import GradientCard from '../../components/GradientCard';
import ScreenGlow from '../../components/ScreenGlow';
import { colors, fontFamily, gradients, radius, spacing, typography } from '../../constants/theme';
import { SIDEBAR_WIDTH, useResponsive } from '../../hooks/useResponsive';

export default function TradingScreen() {
  const { isDesktop } = useResponsive();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0, { duration: 1800 })),
      -1,
      true
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -10 }],
  }));

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { marginLeft: SIDEBAR_WIDTH }]} edges={['top']}>
      <ScreenGlow />
      <View style={styles.content}>
        <Animated.View style={floatStyle}>
          <GradientCard colors={gradients.trading} floating style={styles.iconCard}>
            <Ionicons name="trending-up" size={34} color="#FFFFFF" />
          </GradientCard>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(150).duration(500)}>
          <Text style={styles.title}>Trading & Investments</Text>
          <Text style={styles.body}>
            Portfolio risk, concentration, and trading behavior analysis will live here — its own space inside
            the app, arriving once the core finance experience is locked in.
          </Text>
          <View style={styles.pillRow}>
            {['Risk behavior', 'Concentration', 'Drawdown'].map((label) => (
              <View key={label} style={styles.pill}>
                <Text style={styles.pillText}>{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconCard: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillText: {
    fontSize: 11.5,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
});
