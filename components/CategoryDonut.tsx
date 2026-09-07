import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { fontFamily, colors, rupee, spacing } from '../constants/theme';
import { CategorySpend } from '../data/mockData';

export default function CategoryDonut({ data, size = 168 }: { data: CategorySpend[]; size?: number }) {
  const slices = data.filter((d) => d.amount > 0).slice(0, 6);
  const total = slices.reduce((sum, d) => sum + d.amount, 0);
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const inner = radius - strokeWidth / 2 - 6;
  const gap = 3;

  if (total <= 0) {
    return <Text style={styles.empty}>No spend to chart yet.</Text>;
  }

  let offsetAcc = 0;

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {slices.map((d) => {
              const fraction = d.amount / total;
              const dash = Math.max(fraction * circumference - gap, 2);
              const rest = circumference - dash;
              const strokeDashoffset = -offsetAcc;
              offsetAcc += dash + gap;
              return (
                <Circle
                  key={d.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${rest}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            })}
          </G>
          <Circle cx={size / 2} cy={size / 2} r={inner} fill={colors.surface} />
          <SvgText
            x={size / 2}
            y={size / 2 - 8}
            fill={colors.textMuted}
            fontSize="11"
            fontFamily={fontFamily.semiBold}
            textAnchor="middle"
          >
            Spend
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 12}
            fill={colors.textPrimary}
            fontSize="13"
            fontFamily={fontFamily.bold}
            textAnchor="middle"
          >
            {rupee(Math.round(total))}
          </SvgText>
        </Svg>
      </View>
      <View style={styles.legend}>
        {slices.map((d) => {
          const pct = Math.round((d.amount / total) * 100);
          return (
            <View key={d.category} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: d.color }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {d.category}
                </Text>
                <Text style={styles.legendPct}>{pct}%</Text>
              </View>
              <Text style={styles.legendAmount}>{rupee(Math.round(d.amount))}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legend: {
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },
  legendPct: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  legendAmount: {
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
});
