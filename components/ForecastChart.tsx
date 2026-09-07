import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

type Props = {
  history: number[];
  forecast: number[];
  width?: number;
  height?: number;
};

export default function ForecastChart({ history, forecast, width = 300, height = 128 }: Props) {
  if (history.length < 2) return null;

  const all = [...history, ...forecast.slice(1)];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = 10;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  const toPoint = (value: number, index: number, total: number) => {
    const x = pad + (index / Math.max(total - 1, 1)) * usableW;
    const y = pad + usableH - ((value - min) / (max - min || 1)) * usableH;
    return { x, y };
  };

  const totalPoints = history.length + Math.max(forecast.length - 1, 0);
  const historyPoints = history.map((v, i) => toPoint(v, i, totalPoints));
  const forecastPoints = forecast.map((v, i) => toPoint(v, i + history.length - 1, totalPoints));
  const toStr = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

  const area = [
    `M ${historyPoints[0].x} ${height - pad}`,
    ...historyPoints.map((p) => `L ${p.x} ${p.y}`),
    `L ${historyPoints[historyPoints.length - 1].x} ${height - pad}`,
    'Z',
  ].join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.28" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#cashFill)" />
        <Polyline points={toStr(historyPoints)} fill="none" stroke={colors.accent} strokeWidth={2.6} />
        {forecastPoints.length > 1 ? (
          <Polyline
            points={toStr(forecastPoints)}
            fill="none"
            stroke={colors.warn}
            strokeWidth={2.4}
            strokeDasharray="6 5"
          />
        ) : null}
      </Svg>
    </View>
  );
}
