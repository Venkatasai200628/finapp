import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import { colors, fontFamily, spacing } from '../constants/theme';
import { MonthlyPoint } from '../data/mockData';

type Props = {
  data: MonthlyPoint[];
  width?: number;
  height?: number;
};

export default function MonthlyTrendChart({ data, width = 300, height = 140 }: Props) {
  const pad = 8;
  const labelH = 18;
  const usableH = height - pad * 2 - labelH;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense])) || 1;

  const groupW = width / data.length;
  const barW = Math.min(16, groupW * 0.28);
  const gap = 4;

  return (
    <View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const cx = groupW * i + groupW / 2;
          const incomeH = (d.income / max) * usableH;
          const expenseH = (d.expense / max) * usableH;
          return (
            <G key={d.month} x={cx}>
              <Rect
                x={-gap / 2 - barW}
                y={pad + usableH - incomeH}
                width={barW}
                height={incomeH}
                rx={3}
                fill={colors.income}
              />
              <Rect
                x={gap / 2}
                y={pad + usableH - expenseH}
                width={barW}
                height={expenseH}
                rx={3}
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
});
