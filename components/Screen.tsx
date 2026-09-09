import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, radius, shadow, spacing } from '../constants/theme';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export default function Screen({ children, scroll = true, contentStyle }: Props) {
  const { isDesktop } = useResponsive();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  const pad: ViewStyle = {
    paddingTop: insets.top + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: isDesktop ? 48 : 110,
    maxWidth: isDesktop ? CONTENT_MAX_WIDTH : 440,
    width: '100%',
    alignSelf: 'center',
  };

  const innerContent = scroll ? (
    <ScrollView
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg }, isDesktop && { paddingLeft: SIDEBAR_WIDTH }]}>
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
