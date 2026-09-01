import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

/**
 * The ambient two-blob radial glow behind every screen in the Arctic Mono
 * direction. Render as the first child of the screen's outermost view,
 * with everything else stacked on top (position: absolute, so it never
 * affects layout).
 */
export default function ScreenGlow() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glowTeal" cx="12%" cy="0%" r="55%">
            <Stop offset="0%" stopColor={colors.glow1} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={colors.glow1} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowBlue" cx="100%" cy="28%" r="55%">
            <Stop offset="0%" stopColor={colors.glow2} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={colors.glow2} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={colors.bg} />
        <Rect x={0} y={0} width={width} height={height} fill="url(#glowTeal)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#glowBlue)" />
      </Svg>
    </View>
  );
}
