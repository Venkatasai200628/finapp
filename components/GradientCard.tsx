import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, ViewStyle } from 'react-native';
import { radius, shadow } from '../constants/theme';

type Props = {
  colors: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  floating?: boolean;
};

export default function GradientCard({ colors, style, children, start, end, floating }: Props) {
  return (
    <LinearGradient
      colors={colors}
      start={start ?? { x: 0, y: 0 }}
      end={end ?? { x: 1, y: 1 }}
      style={[
        { borderRadius: radius.lg, padding: 20, overflow: 'hidden' },
        floating ? shadow.floating : shadow.card,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}
