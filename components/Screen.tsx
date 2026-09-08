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
  const { phoneView, togglePhoneView } = useTheme();
  const insets = useSafeAreaInsets();

  const isPhoneMockup = isDesktop && phoneView;

  const pad: ViewStyle = {
    paddingTop: insets.top + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: isDesktop && !phoneView ? 48 : 112,
    maxWidth: isPhoneMockup ? 420 : CONTENT_MAX_WIDTH,
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

  if (isPhoneMockup) {
    return (
      <View style={[styles.root, { paddingLeft: SIDEBAR_WIDTH, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }]}>
        <View style={styles.phoneBanner}>
          <Text style={styles.phoneBannerText}>📱 Phone View Preview Mode</Text>
          <Pressable onPress={togglePhoneView} style={styles.phoneExitBtn}>
            <Ionicons name="desktop-outline" size={13} color={colors.onAccent} />
            <Text style={styles.phoneExitBtnText}>Exit to Desktop</Text>
          </Pressable>
        </View>

        <View style={styles.phoneChassis}>
          {/* Phone Speaker Notch */}
          <View style={styles.phoneNotch}>
            <View style={styles.phoneSpeaker} />
            <View style={styles.phoneCamera} />
          </View>
          <View style={styles.phoneScreen}>
            {innerContent}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, isDesktop && { paddingLeft: SIDEBAR_WIDTH }]}>
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  phoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneBannerText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  phoneExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  phoneExitBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.onAccent,
  },
  phoneChassis: {
    width: 420,
    height: 820,
    maxHeight: '92%',
    borderRadius: 44,
    borderWidth: 8,
    borderColor: '#2A2A2A',
    backgroundColor: colors.bg,
    overflow: 'hidden',
    ...shadow.floating,
  },
  phoneNotch: {
    height: 28,
    backgroundColor: '#181818',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  phoneSpeaker: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  phoneCamera: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
