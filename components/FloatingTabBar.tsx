import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, radius, shadow, spacing } from '../constants/theme';
import { SIDEBAR_WIDTH, useResponsive } from '../hooks/useResponsive';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  finance: 'wallet',
  settings: 'settings-sharp',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  finance: 'Finance',
  settings: 'Settings',
};

type TabBarRoute = { key: string; name: string };
type TabBarState = { index: number; routes: TabBarRoute[] };
type TabBarNavigation = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (e: any) => { defaultPrevented?: boolean };
  navigate: (name: string) => void;
};

type Props = {
  state: TabBarState;
  navigation: TabBarNavigation;
};

const SPRING = { damping: 26, stiffness: 260, mass: 0.6, overshootClamping: true };
const ON_ACCENT = colors.ringCore; // dark text/icon reads correctly against the light cyan accent

export default function FloatingTabBar({ state, navigation }: Props) {
  const { isDesktop } = useResponsive();
  return isDesktop ? (
    <Sidebar state={state} navigation={navigation} />
  ) : (
    <FloatingPillBar state={state} navigation={navigation} />
  );
}

function press(navigation: TabBarNavigation, route: TabBarRoute, focused: boolean) {
  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
  if (!focused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
}

function Sidebar({ state, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const itemHeight = 48;
  const indicatorY = useSharedValue(state.index * itemHeight);

  useEffect(() => {
    indicatorY.value = withSpring(state.index * itemHeight, SPRING);
  }, [state.index, indicatorY]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: indicatorY.value }],
  }));

  return (
    // Solid, not blurred: this rail sits in the screen's own left margin, so
    // there's nothing behind it for a blur to pick up — it would just show
    // whatever's under the page (see FloatingPillBar below for the version
    // that actually overlaps scrolling content and benefits from real blur).
    <View style={[sidebarStyles.wrap, { paddingTop: insets.top + spacing.xl }]}>
      <View style={sidebarStyles.brandRow}>
        <View style={sidebarStyles.brandMark}>
          <Ionicons name="pulse" size={16} color={ON_ACCENT} />
        </View>
        <Text style={sidebarStyles.brandText}>Fin</Text>
      </View>

      <View style={sidebarStyles.navList}>
        <Animated.View style={[sidebarStyles.indicator, { height: itemHeight - 6 }, indicatorStyle]} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
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
        <Text style={sidebarStyles.footerText}>Personal Financial{'\n'}Intelligence System</Text>
      </View>
    </View>
  );
}

function FloatingPillBar({ state, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const barWidth = 340;
  const tabWidth = barWidth / state.routes.length;
  const indicatorX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, SPRING);
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[pillStyles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={[pillStyles.bar, { width: barWidth }, shadow.floating]}>
        <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, overflow: 'hidden' }]}>
          <View style={pillStyles.tint} />
        </View>
        <Animated.View style={[pillStyles.indicator, { width: tabWidth - 8 }, indicatorStyle]} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => press(navigation, route, focused)}
              style={[pillStyles.tab, { width: tabWidth }]}
            >
              <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={19} color={focused ? ON_ACCENT : colors.textMuted} />
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
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 17,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
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
    fontSize: 10.5,
    color: colors.textMuted,
    lineHeight: 14,
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
    borderColor: colors.border,
    padding: 4,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tint: {
    flex: 1,
    backgroundColor: colors.surfaceHi,
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
