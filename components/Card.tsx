import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

type Props = ViewProps & {
  elevated?: boolean;
  children?: ReactNode;
};

export default function Card({ style, children, elevated, ...props }: Props) {
  return (
    <View style={[styles.wrap, elevated && styles.elevated, style]} {...props}>
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
