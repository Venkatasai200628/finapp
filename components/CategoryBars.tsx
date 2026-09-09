import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fontFamily, radius, rupee, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Item = { label: string; amount: number; color?: string };

export default function CategoryBars({
  items,
  color = colors.accent,
  onPressCategory,
}: {
  items: Item[];
  color?: string;
  onPressCategory?: (category: string) => void;
}) {
  const { colors: themeColors } = useTheme();
  const max = Math.max(...items.map((i) => i.amount), 1);
  const sum = items.reduce((s, i) => s + i.amount, 0) || 1;
  if (items.length === 0) {
    return <Text style={[styles.empty, { color: themeColors.textMuted }]}>Nothing to chart yet.</Text>;
  }

  const handlePress = (label: string) => {
    if (onPressCategory) {
      onPressCategory(label);
    } else {
      router.push({
        pathname: '/transactions',
        params: { cat: label },
      });
    }
  };

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const pct = Math.max((item.amount / max) * 100, 6);
        const share = Math.round((item.amount / sum) * 100);
        const barColor = item.color ?? color;
        return (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => handlePress(item.label)}
          >
            <View style={styles.meta}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.amount, { color: themeColors.textPrimary }]}>
                {rupee(Math.round(item.amount))}
                <Text style={[styles.share, { color: themeColors.textMuted }]}>  {share}%</Text>
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: themeColors.surfaceAlt }]}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginTop: spacing.sm },
  row: { gap: 7 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  label: { flex: 1, fontSize: 13, fontFamily: fontFamily.medium },
  amount: { fontSize: 13, fontFamily: fontFamily.bold },
  share: { fontSize: 11, fontFamily: fontFamily.medium },
  track: {
    height: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: 9, borderRadius: radius.pill },
  empty: { fontSize: 13, marginTop: spacing.sm },
});
