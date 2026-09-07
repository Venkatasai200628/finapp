import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, spacing, typography } from '../constants/theme';

export default function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  onAction,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      {kicker ? <Text style={typography.kicker}>{kicker}</Text> : null}
      <View style={styles.row}>
        <Text style={kicker ? styles.title : typography.title}>{title}</Text>
        {action && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.action}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: { ...typography.body, marginTop: 6, fontSize: 13 },
  action: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.accent },
});
