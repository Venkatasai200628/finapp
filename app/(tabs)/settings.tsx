import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import { colors, fontFamily, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const MAP = [
  {
    icon: 'home-outline' as const,
    color: colors.accent,
    title: 'Home',
    body: 'Net, cash-flow plot, income vs spend, category mix, recent activity',
    href: '/',
  },
  {
    icon: 'book-outline' as const,
    color: colors.savings,
    title: 'Books',
    body: 'CSV upload, ledger totals, category bars, payees and payers',
    href: '/(tabs)/books',
  },
  {
    icon: 'calculator-outline' as const,
    color: colors.warn,
    title: 'GST',
    body: 'Line calculator on the left, running bill on the right',
    href: '/(tabs)/gst',
  },
];

export default function SettingsScreen() {
  const { email, signOut } = useAuth();
  const initial = (email ?? 'F').charAt(0).toUpperCase();

  return (
    <Screen>
      <SectionHeader kicker="Account" title="Settings" subtitle="This workspace stays on your signed-in account." />

      <Card elevated style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{email ?? 'Signed in'}</Text>
          <Text style={styles.rowSub}>Books stay private to this account</Text>
        </View>
        <Pressable style={styles.out} onPress={signOut}>
          <Text style={styles.outText}>Sign out</Text>
        </Pressable>
      </Card>

      <Text style={styles.mapLabel}>Where things live</Text>
      {MAP.map((item) => (
        <Pressable key={item.title} onPress={() => router.push(item.href as never)}>
          <Card style={styles.mapCard}>
            <View style={[styles.icon, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapTitle}>{item.title}</Text>
              <Text style={styles.mapBody}>{item.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fontFamily.extraBold,
    color: colors.onAccent,
  },
  rowTitle: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  out: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.bgAlt,
  },
  outText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  mapLabel: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTitle: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.textPrimary },
  mapBody: { fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },
});
