import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

type Props = ViewProps & {
  /** Stronger tint + border + accent glow, for the single most important
   * surface on a screen (a hero balance card, a primary stat). Use sparingly. */
  elevated?: boolean;
};

export default function Card({ style, children, elevated, ...props }: Props) {
  return (
    <View style={[styles.wrap, elevated && styles.wrapElevated, elevated && shadow.glow, style]} {...props}>
      <BlurView intensity={elevated ? 55 : 40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.tint, elevated && styles.tintElevated]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  wrapElevated: {
    borderColor: colors.borderStrong,
  },
  tint: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tintElevated: {
    backgroundColor: colors.surfaceStrong,
  },
});
