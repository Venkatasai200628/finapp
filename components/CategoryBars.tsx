import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fontFamily, radius, rupee, spacing } from '../constants/theme';

type Item = { label: string; amount: number; color?: string };

export default function CategoryBars({
  items,
  color = colors.expense,
  onPressCategory,
}: {
  items: Item[];
  color?: string;
  onPressCategory?: (category: string) => void;
}) {
  const max = Math.max(...items.map((i) => i.amount), 1);
  const sum = items.reduce((s, i) => s + i.amount, 0) || 1;
  if (items.length === 0) {
    return <Text style={styles.empty}>Nothing to chart yet.</Text>;
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
        return (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => handlePress(item.label)}
          >
            <View style={styles.meta}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.amount}>
                {rupee(Math.round(item.amount))}
                <Text style={styles.share}>  {share}%</Text>
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: item.color ?? color }]} />
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
  label: { flex: 1, fontSize: 13, color: colors.textSecondary, fontFamily: fontFamily.medium },
  amount: { fontSize: 13, fontFamily: fontFamily.bold, color: colors.textPrimary },
  share: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textMuted },
  track: {
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: 9, borderRadius: radius.pill },
  empty: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
});
