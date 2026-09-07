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

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  books: 'book',
  gst: 'calculator',
  settings: 'settings-sharp',
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
  const itemHeight = 48;
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
          <Ionicons name="sparkles" size={15} color={ON_ACCENT} />
        </View>
        <Text style={sidebarStyles.brandText}>Fin</Text>
      </View>

      <View style={sidebarStyles.navList}>
        <Animated.View style={[sidebarStyles.indicator, { height: itemHeight - 6 }, indicatorStyle]} />
        {routes.map((route) => {
          const focused = route.key === state.routes[state.index]?.key;
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              style={[sidebarStyles.item, { height: itemHeight }]}
            >
              <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={18} color={focused ? ON_ACCENT : colors.textMuted} />
              <Text style={[sidebarStyles.itemLabel, focused && sidebarStyles.itemLabelActive]}>
                {LABELS[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={sidebarStyles.footer}>
        <Text style={sidebarStyles.footerText}>Books · GST · cash flow{'\n'}from your statement only</Text>
      </View>
    </View>
  );
}

function FloatingPillBar({ state, navigation }: Pick<BottomTabBarProps, 'state' | 'navigation'>) {
  const insets = useSafeAreaInsets();
  const routes = visibleRoutes(state);
  const barWidth = 348;
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
        <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, overflow: 'hidden' }]}>
          <View style={pillStyles.tint} />
        </View>
        <Animated.View style={[pillStyles.indicator, { width: tabWidth - 8 }, indicatorStyle]} />
        {routes.map((route) => {
          const focused = route.key === state.routes[state.index]?.key;
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              style={[pillStyles.tab, { width: tabWidth }]}
            >
              <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={18} color={focused ? ON_ACCENT : colors.textMuted} />
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
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  navList: {
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
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
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
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
    backgroundColor: 'rgba(14, 19, 28, 0.82)',
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
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: ON_ACCENT,
  },
});
