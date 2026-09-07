import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import { colors, fontFamily, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { email, signOut } = useAuth();

  return (
    <Screen>
      <SectionHeader kicker="Account" title="Settings" subtitle="This workspace stays on your signed-in account." />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name="person-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{email ?? 'Signed in'}</Text>
            <Text style={styles.rowSub}>Books stay private to this account</Text>
          </View>
          <Pressable style={styles.out} onPress={signOut}>
            <Text style={styles.outText}>Sign out</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.guideTitle}>Where things live</Text>
        <View style={styles.guideRow}>
          <Ionicons name="home-outline" size={16} color={colors.accent} />
          <Text style={styles.guide}>Home — net, charts, forecast, recent activity</Text>
        </View>
        <View style={styles.guideRow}>
          <Ionicons name="book-outline" size={16} color={colors.savings} />
          <Text style={styles.guide}>Books — CSV upload, parties, category bars</Text>
        </View>
        <View style={styles.guideRow}>
          <Ionicons name="calculator-outline" size={16} color={colors.warn} />
          <Text style={styles.guide}>GST — line calculator and bill</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  out: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.bgAlt,
  },
  outText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  guideTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary, marginBottom: spacing.sm },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: spacing.sm },
  guide: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});
