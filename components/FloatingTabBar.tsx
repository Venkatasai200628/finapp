import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fontFamily, radius, shadow, spacing } from '../constants/theme';
import { SIDEBAR_WIDTH, useResponsive } from '../hooks/useResponsive';

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

function Sidebar({ state, navigation }: Pick<BottomTabBarProps, 'state' | 'navigation'>) {
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
  }, [focusedIndex, indicatorY]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: indicatorY.value }],
  }));

  return (
    <View style={[sidebarStyles.wrap, { paddingTop: insets.top + spacing.xl }]}>
      <View style={sidebarStyles.brandRow}>
        <View style={sidebarStyles.brandMark}>
          <Ionicons name="flash" size={16} color={ON_ACCENT} />
        </View>
        <View>
          <Text style={sidebarStyles.brandText}>Fin</Text>
          <Text style={sidebarStyles.brandSub}>Cash · Books · GST</Text>
        </View>
      </View>

      <Text style={sidebarStyles.section}>Workspace</Text>
      <View style={sidebarStyles.navList}>
        <Animated.View style={[sidebarStyles.indicator, { height: itemHeight - 8 }, indicatorStyle]} />
        {routes.map((route) => {
          const focused = route.key === state.routes[state.index]?.key;
          const icons = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              style={[sidebarStyles.item, { height: itemHeight }]}
            >
              <Ionicons
                name={focused ? icons.on : icons.off}
                size={18}
                color={focused ? ON_ACCENT : colors.textMuted}
              />
              <Text style={[sidebarStyles.itemLabel, focused && sidebarStyles.itemLabelActive]}>
                {LABELS[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={sidebarStyles.footer}>
        <Text style={sidebarStyles.footerText}>Statement-backed numbers.{'\n'}Nothing is invented for you.</Text>
      </View>
    </View>
  );
}

function FloatingPillBar({ state, navigation }: Pick<BottomTabBarProps, 'state' | 'navigation'>) {
  const insets = useSafeAreaInsets();
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
      <View style={[pillStyles.bar, { width: barWidth }, shadow.floating]}>
        <BlurView intensity={48} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, overflow: 'hidden' }]}>
          <View style={pillStyles.tint} />
        </View>
        <Animated.View style={[pillStyles.indicator, { width: tabWidth - 8 }, indicatorStyle]} />
        {routes.map((route) => {
          const focused = route.key === state.routes[state.index]?.key;
          const icons = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              style={[pillStyles.tab, { width: tabWidth }]}
            >
              <Ionicons
                name={focused ? icons.on : icons.off}
                size={18}
                color={focused ? ON_ACCENT : colors.textMuted}
              />
              {focused && <Text style={pillStyles.label}>{LABELS[route.name] ?? route.name}</Text>}
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
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
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
    backgroundColor: 'rgba(10, 15, 22, 0.88)',
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
