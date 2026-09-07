import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { colors, fontFamily, rupee } from '../constants/theme';

type Props = {
  history: number[];
  forecast: number[];
  width?: number;
  height?: number;
};

export default function ForecastChart({ history, forecast, width = 300, height = 168 }: Props) {
  const uid = useId().replace(/:/g, '');
  if (history.length < 2) return null;

  const all = [...history, ...forecast.slice(1)];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 10;
  const usableW = width - padL - padR;
  const usableH = height - padT - padB;

  const toPoint = (value: number, index: number, total: number) => {
    const x = padL + (index / Math.max(total - 1, 1)) * usableW;
    const y = padT + usableH - ((value - min) / (max - min || 1)) * usableH;
    return { x, y };
  };

  const totalPoints = history.length + Math.max(forecast.length - 1, 0);
  const historyPoints = history.map((v, i) => toPoint(v, i, totalPoints));
  const forecastPoints = forecast.map((v, i) => toPoint(v, i + history.length - 1, totalPoints));
  const toStr = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');
  const lastH = historyPoints[historyPoints.length - 1];
  const lastF = forecastPoints[forecastPoints.length - 1];

  const area = [
    `M ${historyPoints[0].x} ${height - padB}`,
    ...historyPoints.map((p) => `L ${p.x} ${p.y}`),
    `L ${historyPoints[historyPoints.length - 1].x} ${height - padB}`,
    'Z',
  ].join(' ');

  const grids = [0, 0.33, 0.66, 1];

  return (
    <View>
      <View style={styles.axisRow}>
        <Text style={styles.axis}>{rupee(Math.round(max))}</Text>
        <Text style={styles.axis}>{rupee(Math.round(min))}</Text>
      </View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={`cashFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.32" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {grids.map((g) => {
          const y = padT + usableH * g;
          return (
            <Line
              key={g}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke={colors.chartGrid}
              strokeWidth={1}
            />
          );
        })}
        <Path d={area} fill={`url(#cashFill-${uid})`} />
        <Polyline
          points={toStr(historyPoints)}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {forecastPoints.length > 1 ? (
          <Polyline
            points={toStr(forecastPoints)}
            fill="none"
            stroke={colors.forecast}
            strokeWidth={2.4}
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        <Circle cx={lastH.x} cy={lastH.y} r={5} fill={colors.bg} stroke={colors.accent} strokeWidth={2.4} />
        {lastF ? (
          <Circle cx={lastF.x} cy={lastF.y} r={4} fill={colors.forecast} />
        ) : null}
      </Svg>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>History</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dash, { borderColor: colors.forecast }]} />
          <Text style={styles.legendText}>30-day forecast</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  axis: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 3,
    borderRadius: 2,
  },
  dash: {
    width: 12,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
});
