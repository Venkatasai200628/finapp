import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing } from '../constants/theme';

type Props = ViewProps & {
  elevated?: boolean;
  children?: ReactNode;
};

export default function Card({ style, children, elevated, ...props }: Props) {
  return (
    <View style={[styles.wrap, elevated && styles.elevated, style]} {...props}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  elevated: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceStrong,
    ...shadow.card,
  },
});
