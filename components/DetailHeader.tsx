import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

export default function DetailHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={typography.h2} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
