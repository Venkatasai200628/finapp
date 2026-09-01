import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../constants/theme';

export default function LiveIndicator({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      pulse.value = 0;
    }
  }, [active, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value,
    transform: [{ scale: 1 + pulse.value * 1.8 }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.dotWrap}>
        {active && <Animated.View style={[styles.ring, ringStyle, { borderColor: colors.live }]} />}
        <View style={[styles.dot, { backgroundColor: active ? colors.live : colors.textMuted }]} />
      </View>
      <Text style={[styles.label, { color: active ? colors.live : colors.textMuted }]}>
        {active ? 'LIVE' : 'PAUSED'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dotWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  ring: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
