import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fontFamily, radius, shadow, spacing } from '../constants/theme';
import { SIDEBAR_WIDTH, useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';

const HIDDEN = new Set(['finance', 'insights']);

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'home', off: 'home-outline' },
  books: { on: 'book', off: 'book-outline' },
  gst: { on: 'calculator', off: 'calculator-outline' },
  settings: { on: 'settings', off: 'settings-outline' },
};

const LABELS: Record<string, string> = {
  index: 'Home',
  books: 'Books',
  gst: 'GST',
  settings: 'Settings',
};

const SPRING = { damping: 26, stiffness: 260, mass: 0.6, overshootClamping: true };
const ON_ACCENT = colors.onAccent;

function visibleRoutes(state: BottomTabBarProps['state']) {
  return state.routes.filter((route) => !HIDDEN.has(route.name));
}

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDesktop } = useResponsive();
  return isDesktop ? (
    <Sidebar state={state} navigation={navigation} />
  ) : (
    <FloatingPillBar state={state} navigation={navigation} />
  );
}

function press(navigation: BottomTabBarProps['navigation'], route: { key: string; name: string }, focused: boolean) {
  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
  if (!focused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
}

import { useTheme } from '../context/ThemeContext';

function Sidebar({ state, navigation }: Pick<BottomTabBarProps, 'state' | 'navigation'>) {
  const { theme, toggleTheme, phoneView, togglePhoneView, colors: themeColors } = useTheme();
  const { name, username, initials } = useAuth();
  const insets = useSafeAreaInsets();
  const routes = visibleRoutes(state);
  const itemHeight = 50;
  const focusedIndex = Math.max(
    0,
    routes.findIndex((route) => route.key === state.routes[state.index]?.key)
  );
  const indicatorY = useSharedValue(focusedIndex * itemHeight);

  useEffect(() => {
    indicatorY.value = withSpring(focusedIndex * itemHeight, SPRING);
  }, [focusedIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: indicatorY.value }],
  }));

  return (
    <View
      style={[
        sidebarStyles.wrap,
        {
          backgroundColor: themeColors.panelSolid,
          borderRightColor: themeColors.border,
          paddingTop: insets.top + spacing.xl,
        },
      ]}
    >
      <View style={sidebarStyles.brandRow}>
        <View dataSet={{ orange: 'true' }} style={[sidebarStyles.brandMark, { backgroundColor: colors.accent }]}>
          <Ionicons name="flash" size={16} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[sidebarStyles.brandText, { color: themeColors.textPrimary }]}>Fin</Text>
          <Text style={[sidebarStyles.brandSub, { color: themeColors.textMuted }]}>Cash · Books · GST</Text>
        </View>
      </View>

      <Text style={[sidebarStyles.section, { color: themeColors.textMuted }]}>Workspace</Text>
      <View style={sidebarStyles.navList}>
        <Animated.View
          dataSet={{ orange: 'true' }}
          style={[
            sidebarStyles.indicator,
            { height: itemHeight - 8, backgroundColor: colors.accent },
            indicatorStyle,
          ]}
        />
        {routes.map((route) => {
          const focused = route.key === state.routes[state.index]?.key;
          const icons = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              dataSet={focused ? { orange: 'true' } : undefined}
              style={[
                sidebarStyles.item,
                { height: itemHeight },
                focused && { backgroundColor: colors.accent, borderRadius: radius.sm },
              ]}
            >
              <Ionicons
                name={focused ? icons.on : icons.off}
                size={18}
                color={focused ? '#FFFFFF' : themeColors.textMuted}
              />
              <Text
                style={[
                  sidebarStyles.itemLabel,
                  { color: focused ? '#FFFFFF' : themeColors.textMuted },
                  focused && { color: '#FFFFFF', fontFamily: fontFamily.bold },
                ]}
              >
                {LABELS[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[sidebarStyles.footer, { borderTopColor: themeColors.borderSoft }]}>
        <View style={sidebarStyles.controlsRow}>
          <Pressable
            onPress={togglePhoneView}
            dataSet={phoneView ? { orange: 'true' } : undefined}
            style={[
              sidebarStyles.toolBtn,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
              phoneView && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Ionicons
              name={phoneView ? 'phone-portrait' : 'phone-portrait-outline'}
              size={15}
              color={phoneView ? '#FFFFFF' : colors.accent}
            />
            <Text
              style={[
                sidebarStyles.toolBtnText,
                { color: phoneView ? '#FFFFFF' : themeColors.textPrimary },
                phoneView && { fontFamily: fontFamily.bold },
              ]}
            >
              Phone View
            </Text>
          </Pressable>

          <Pressable
            onPress={toggleTheme}
            style={[
              sidebarStyles.themeBtn,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
            ]}
          >
            <Ionicons
              name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={16}
              color={themeColors.textPrimary}
            />
          </Pressable>
        </View>

        <Pressable
          style={[
            sidebarStyles.userCard,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
          onPress={() => {
            const settingsRoute = state.routes.find((r) => r.name === 'settings');
            if (settingsRoute) press(navigation, settingsRoute, false);
          }}
        >
          <View dataSet={{ orange: 'true' }} style={[sidebarStyles.userAvatar, { backgroundColor: colors.accent }]}>
            <Text style={[sidebarStyles.userAvatarText, { color: '#FFFFFF' }]}>{initials || 'VS'}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[sidebarStyles.userName, { color: themeColors.textPrimary }]} numberOfLines={1}>
              {name || 'Venkatasai'}
            </Text>
            <Text style={[sidebarStyles.userHandle, { color: themeColors.textMuted }]} numberOfLines={1}>
              @{username || 'venkatasai200628'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={themeColors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function FloatingPillBar({ state, navigation }: Pick<BottomTabBarProps, 'state' | 'navigation'>) {
  const insets = useSafeAreaInsets();
  const { theme, colors: themeColors } = useTheme();
  const routes = visibleRoutes(state);
  const barWidth = 352;
  const tabWidth = barWidth / Math.max(routes.length, 1);
  const focusedIndex = Math.max(
    0,
    routes.findIndex((route) => route.key === state.routes[state.index]?.key)
  );
  const indicatorX = useSharedValue(focusedIndex * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(focusedIndex * tabWidth, SPRING);
  }, [focusedIndex, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[pillStyles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={[pillStyles.bar, { width: barWidth, borderColor: themeColors.borderStrong }, shadow.floating]}>
        <BlurView intensity={48} tint={theme === 'dark' ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, overflow: 'hidden' }]}>
          <View style={[pillStyles.tint, { backgroundColor: theme === 'dark' ? 'rgba(8, 8, 8, 0.92)' : 'rgba(255, 255, 255, 0.94)' }]} />
        </View>
        <Animated.View
          dataSet={{ orange: 'true' }}
          style={[
            pillStyles.indicator,
            { width: tabWidth - 8, backgroundColor: colors.accent },
            indicatorStyle,
          ]}
        />
        {routes.map((route) => {
          const focused = route.key === state.routes[state.index]?.key;
          const icons = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              dataSet={focused ? { orange: 'true' } : undefined}
              style={[
                pillStyles.tab,
                { width: tabWidth },
                focused && { backgroundColor: colors.accent, borderRadius: radius.lg },
              ]}
            >
              <Ionicons
                name={focused ? icons.on : icons.off}
                size={18}
                color={focused ? '#FFFFFF' : themeColors.textMuted}
              />
              {focused && <Text style={[pillStyles.label, { color: '#FFFFFF' }]}>{LABELS[route.name] ?? route.name}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const sidebarStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.panelSolid,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
    zIndex: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 1,
  },
  section: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    marginBottom: 8,
  },
  navList: {
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textMuted,
  },
  itemLabelActive: {
    color: ON_ACCENT,
    fontFamily: fontFamily.bold,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toolBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  toolBtnActiveText: {
    color: colors.onAccent,
    fontFamily: fontFamily.bold,
  },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 12,
    fontFamily: fontFamily.extraBold,
    color: colors.onAccent,
  },
  userName: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  userHandle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});

const pillStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 4,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tint: {
    flex: 1,
    backgroundColor: 'rgba(8, 8, 8, 0.92)',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: ON_ACCENT,
  },
});
