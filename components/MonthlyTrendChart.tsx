import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import { colors, fontFamily, spacing } from '../constants/theme';
import { MonthlyPoint } from '../data/mockData';

type Props = {
  data: MonthlyPoint[];
  width?: number;
  height?: number;
};

export default function MonthlyTrendChart({ data, width = 300, height = 148 }: Props) {
  if (data.length === 0) {
    return <Text style={styles.empty}>Need more dated rows for a trend.</Text>;
  }

  const pad = 6;
  const labelH = 18;
  const usableH = height - pad * 2 - labelH;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense])) || 1;
  const groupW = width / data.length;
  const barW = Math.min(14, groupW * 0.28);
  const gap = 4;

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Spend</Text>
        </View>
      </View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const cx = groupW * i + groupW / 2;
          const incomeH = Math.max((d.income / max) * usableH, 2);
          const expenseH = Math.max((d.expense / max) * usableH, 2);
          return (
            <G key={d.month}>
              <Rect
                x={cx - gap / 2 - barW}
                y={pad + usableH - incomeH}
                width={barW}
                height={incomeH}
                rx={4}
                fill={colors.income}
              />
              <Rect
                x={cx + gap / 2}
                y={pad + usableH - expenseH}
                width={barW}
                height={expenseH}
                rx={4}
                fill={colors.expense}
              />
            </G>
          );
        })}
      </Svg>
      <View style={styles.labelRow}>
        {data.map((d) => (
          <Text key={d.month} style={[styles.label, { width: groupW }]}>
            {d.month}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 14, marginBottom: 8 },
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
