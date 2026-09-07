import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenGlow from './ScreenGlow';
import { colors, spacing } from '../constants/theme';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, useResponsive } from '../hooks/useResponsive';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export default function Screen({ children, scroll = true, contentStyle }: Props) {
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: insets.top + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: isDesktop ? 48 : 112,
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
  };

  return (
    <View style={[styles.root, isDesktop && { paddingLeft: SIDEBAR_WIDTH }]}>
      <ScreenGlow />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
