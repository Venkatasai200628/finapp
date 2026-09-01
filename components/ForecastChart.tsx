import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors } from '../constants/theme';

type Props = {
  history: number[];
  forecast: number[];
  width?: number;
  height?: number;
};

export default function ForecastChart({ history, forecast, width = 300, height = 120 }: Props) {
  const all = [...history, ...forecast.slice(1)];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = 12;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  const toPoint = (value: number, index: number, total: number) => {
    const x = pad + (index / (total - 1)) * usableW;
    const y = pad + usableH - ((value - min) / (max - min || 1)) * usableH;
    return { x, y };
  };

  const totalPoints = history.length + forecast.length - 1;
  const historyPoints = history.map((v, i) => toPoint(v, i, totalPoints));
  const forecastPoints = forecast.map((v, i) => toPoint(v, i + history.length - 1, totalPoints));

  const toStr = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');
  const splitX = historyPoints[historyPoints.length - 1].x;

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={splitX} y1={pad} x2={splitX} y2={height - pad} stroke={colors.border} strokeDasharray="4 4" />
        <Polyline points={toStr(historyPoints)} fill="none" stroke={colors.accent} strokeWidth={2.5} />
        <Polyline points={toStr(forecastPoints)} fill="none" stroke={colors.warn} strokeWidth={2.5} strokeDasharray="6 4" />
        {historyPoints.map((p, i) => (
          <Circle key={`h${i}`} cx={p.x} cy={p.y} r={3} fill={colors.accent} />
        ))}
        {forecastPoints.map((p, i) => (
          <Circle key={`f${i}`} cx={p.x} cy={p.y} r={3} fill={colors.warn} />
        ))}
      </Svg>
    </View>
  );
}
