import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Props = ViewProps & {
  elevated?: boolean;
  children?: ReactNode;
};

export default function Card({ style, children, elevated, ...props }: Props) {
  const { colors: themeColors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: elevated ? themeColors.surfaceStrong : themeColors.surface,
          borderColor: elevated ? themeColors.borderStrong : themeColors.border,
        },
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  elevated: {
    ...shadow.card,
  },
});
