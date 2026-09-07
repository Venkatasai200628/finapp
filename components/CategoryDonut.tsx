import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { fontFamily, colors, rupee, spacing } from '../constants/theme';
import { CategorySpend } from '../data/mockData';

export default function CategoryDonut({ data, size = 148 }: { data: CategorySpend[]; size?: number }) {
  const slices = data.filter((d) => d.amount > 0).slice(0, 6);
  const total = slices.reduce((sum, d) => sum + d.amount, 0);
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const inner = radius - strokeWidth / 2 - 4;

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
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {slices.map((d) => {
              const fraction = d.amount / total;
              const dash = Math.max(fraction * circumference, 1);
              const gap = circumference - dash;
              const strokeDashoffset = -offsetAcc;
              offsetAcc += dash;
              return (
                <Circle
                  key={d.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
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
            y={size / 2 - 6}
            fill={colors.textMuted}
            fontSize="10"
            fontFamily={fontFamily.semiBold}
            textAnchor="middle"
          >
            Spend
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 12}
            fill={colors.textPrimary}
            fontSize="12"
            fontFamily={fontFamily.bold}
            textAnchor="middle"
          >
            {rupee(Math.round(total))}
          </SvgText>
        </Svg>
      </View>
      <View style={styles.legend}>
        {slices.map((d) => (
          <View key={d.category} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {d.category}
            </Text>
            <Text style={styles.legendAmount}>{rupee(Math.round(d.amount))}</Text>
          </View>
        ))}
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
    gap: 10,
    minWidth: 0,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
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
