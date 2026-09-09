import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect } from 'react-native-svg';
import { colors, fontFamily, spacing } from '../constants/theme';
import { MonthlyPoint } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

type Props = {
  data: MonthlyPoint[];
  width?: number;
  height?: number;
};

export default function MonthlyTrendChart({ data, width = 300, height = 176 }: Props) {
  const { colors: themeColors } = useTheme();

  if (data.length === 0) {
    return <Text style={[styles.empty, { color: themeColors.textMuted }]}>Need more dated rows for a trend.</Text>;
  }

  const padT = 8;
  const padB = 4;
  const usableH = height - padT - padB;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense])) || 1;
  const groupW = width / data.length;
  const barW = Math.min(16, Math.max(8, groupW * 0.26));
  const gap = 5;
  const grids = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.income }]} />
          <Text style={[styles.legendText, { color: themeColors.textMuted }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.expense }]} />
          <Text style={[styles.legendText, { color: themeColors.textMuted }]}>Spend</Text>
        </View>
      </View>
      <Svg width={width} height={height}>
        {grids.map((g) => {
          const y = padT + usableH * (1 - g);
          return (
            <Line key={g} x1={0} y1={y} x2={width} y2={y} stroke={themeColors.border} strokeWidth={1} />
          );
        })}
        {data.map((d, i) => {
          const cx = groupW * i + groupW / 2;
          const incomeH = Math.max((d.income / max) * usableH, 3);
          const expenseH = Math.max((d.expense / max) * usableH, 3);
          return (
            <G key={d.month}>
              <Rect
                x={cx - gap / 2 - barW}
                y={padT + usableH - incomeH}
                width={barW}
                height={incomeH}
                rx={6}
                fill={colors.income}
              />
              <Rect
                x={cx + gap / 2}
                y={padT + usableH - expenseH}
                width={barW}
                height={expenseH}
                rx={6}
                fill={colors.expense}
              />
            </G>
          );
        })}
      </Svg>
      <View style={styles.labelRow}>
        {data.map((d) => (
          <Text key={d.month} style={[styles.label, { width: groupW, color: themeColors.textMuted }]}>
            {d.month}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted, fontFamily: fontFamily.medium },
  labelRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: spacing.md },
});
