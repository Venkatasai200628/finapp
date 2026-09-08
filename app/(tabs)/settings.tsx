import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import { colors, fontFamily, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useImportedTransactions } from '../../context/ImportedTransactionsContext';
import { useResponsive } from '../../hooks/useResponsive';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
} from '../../lib/supabaseClient';

export default function SettingsScreen() {
  const { email, name, username, initials, signOut } = useAuth();
  const { theme, toggleTheme, phoneView, togglePhoneView } = useTheme();
  const { imported, clearImported } = useImportedTransactions();
  const { isDesktop } = useResponsive();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [supabaseModalVisible, setSupabaseModalVisible] = useState(false);

  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbSavedMsg, setSbSavedMsg] = useState(false);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSbUrl(creds.url);
    setSbKey(creds.anonKey);
  }, [supabaseModalVisible]);

  const handleSaveSupabase = async () => {
    await saveSupabaseCredentials(sbUrl, sbKey);
    setSbSavedMsg(true);
    setTimeout(() => {
      setSbSavedMsg(false);
      setSupabaseModalVisible(false);
    }, 1200);
  };

  const isSbConnected = isSupabaseConfigured();

  const handleDeleteAccount = () => {
    clearImported();
    setDeleteModalVisible(false);
    signOut();
  };

  return (
    <Screen>
      <SectionHeader
        kicker="Account & Sync"
        title="Settings"
        subtitle="Manage your profile, database connections, and workspace appearance."
      />

      {/* User Profile Card */}
      <Card elevated style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'VS'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{name || 'Venkatasai'}</Text>
          <Text style={styles.rowSub}>@{username || 'venkatasai200628'}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.dataBadge}>
              <Text style={styles.dataBadgeText}>{imported.length} statement rows stored</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.out} onPress={signOut}>
          <Text style={styles.outText}>Sign out</Text>
        </Pressable>
      </Card>

      {/* Appearance & Interface */}
      <Text style={styles.sectionTitle}>Appearance & Interface</Text>
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accent + '22' }]}>
            <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>App Theme</Text>
            <Text style={styles.settingDesc}>
              {theme === 'dark' ? 'Deep Black + Neon Orange' : 'Crisp White + Contrast UI'}
            </Text>
          </View>
          <Pressable style={styles.togglePill} onPress={toggleTheme}>
            <Text style={styles.togglePillText}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</Text>
          </Pressable>
        </View>

        {isDesktop && (
          <View style={[styles.settingRow, styles.rowBorder]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.savings + '22' }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.savings} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Phone Mockup Mode</Text>
              <Text style={styles.settingDesc}>Preview mobile experience right in your browser</Text>
            </View>
            <Pressable style={[styles.togglePill, phoneView && styles.togglePillActive]} onPress={togglePhoneView}>
              <Text style={[styles.togglePillText, phoneView && styles.togglePillActiveText]}>
                {phoneView ? '📱 Active' : '💻 Off'}
              </Text>
            </Pressable>
          </View>
        )}
      </Card>

      {/* Database Connection */}
      <Text style={styles.sectionTitle}>Cloud Database & Sync</Text>
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={[styles.iconWrap, { backgroundColor: (isSbConnected ? colors.income : colors.warn) + '22' }]}>
            <Ionicons name="server" size={18} color={isSbConnected ? colors.income : colors.warn} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.settingLabel}>Supabase Postgres DB</Text>
              <View style={[styles.livePill, !isSbConnected && { backgroundColor: colors.warn + '22' }]}>
                <View style={[styles.liveDot, !isSbConnected && { backgroundColor: colors.warn }]} />
                <Text style={[styles.livePillText, !isSbConnected && { color: colors.warn }]}>
                  {isSbConnected ? 'Connected' : 'Configure'}
                </Text>
              </View>
            </View>
            <Text style={styles.settingDesc}>
              {isSbConnected ? 'Cloud sync active for auth & bank statements' : 'Connect your Supabase project for persistent cloud storage'}
            </Text>
          </View>
          <Pressable style={styles.infoBtn} onPress={() => setSupabaseModalVisible(true)}>
            <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </Card>

      {/* Navigation Quick Links */}
      <Text style={styles.sectionTitle}>Workspace Slices</Text>
      <Pressable onPress={() => router.push('/')}>
        <Card style={styles.mapCard}>
          <View style={[styles.icon, { backgroundColor: colors.accent + '22' }]}>
            <Ionicons name="home-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mapTitle}>Home</Text>
            <Text style={styles.mapBody}>Cash-flow forecast, donut category mix, net position</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/(tabs)/books')}>
        <Card style={styles.mapCard}>
          <View style={[styles.icon, { backgroundColor: colors.savings + '22' }]}>
            <Ionicons name="book-outline" size={18} color={colors.savings} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mapTitle}>Books</Text>
            <Text style={styles.mapBody}>Upload statements, ledger breakdown, payees and all rows</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/(tabs)/gst')}>
        <Card style={styles.mapCard}>
          <View style={[styles.icon, { backgroundColor: colors.warn + '22' }]}>
            <Ionicons name="calculator-outline" size={18} color={colors.warn} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mapTitle}>GST</Text>
            <Text style={styles.mapBody}>Pro billing calculator, target caps, item locking & split engine</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Card>
      </Pressable>

      {/* Danger Zone: Delete Account */}
      <Text style={[styles.sectionTitle, { color: colors.danger, marginTop: spacing.xl }]}>Danger Zone</Text>
      <Card style={[styles.settingCard, styles.dangerCard]}>
        <View style={styles.settingRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.danger + '22' }]}>
            <Ionicons name="trash" size={18} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.danger }]}>Delete My Account</Text>
            <Text style={styles.settingDesc}>Permanently remove all your data, statement history, and sign out</Text>
          </View>
          <Pressable style={styles.deleteBtn} onPress={() => setDeleteModalVisible(true)}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </Card>

      {/* Delete Account Modal Confirmation */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.iconWrap, { backgroundColor: colors.danger + '22', alignSelf: 'center', width: 52, height: 52, borderRadius: 26, marginBottom: spacing.md }]}>
              <Ionicons name="warning" size={26} color={colors.danger} />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalBody}>
              This action cannot be undone. All your uploaded bank statements ({imported.length} rows), saved transactions, and session credentials will be permanently erased from this device and your database.
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable
                style={[styles.modalBtn, { flex: 1, backgroundColor: colors.surfaceAlt }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { flex: 1, backgroundColor: colors.danger }]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalBtnText}>Confirm Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Supabase Connection Configuration Modal */}
      <Modal
        visible={supabaseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupabaseModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="server" size={20} color={colors.accent} />
                <Text style={styles.modalTitle}>Supabase Cloud Database</Text>
              </View>
              <Pressable onPress={() => setSupabaseModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.modalDesc}>
              Connect your Supabase project for instant user authentication and encrypted cloud statement storage across all devices.
            </Text>

            <Text style={styles.inputHeader}>Supabase Project URL</Text>
            <TextInput
              style={styles.sbInput}
              value={sbUrl}
              onChangeText={setSbUrl}
              placeholder="https://your-project.supabase.co"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.inputHeader, { marginTop: spacing.md }]}>Supabase Anon / Public Key</Text>
            <TextInput
              style={styles.sbInput}
              value={sbKey}
              onChangeText={setSbKey}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            {sbSavedMsg && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={colors.income} />
                <Text style={styles.successText}>Credentials saved! Cloud database connected.</Text>
              </View>
            )}

            <Pressable
              style={[styles.modalBtn, { marginTop: spacing.lg }]}
              onPress={handleSaveSupabase}
            >
              <Text style={styles.modalBtnText}>Save & Connect</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  badgeRow: { flexDirection: 'row', marginTop: 6 },
  dataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  dataBadgeText: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textMuted },
  out: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.bgAlt,
  },
  outText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  settingCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  togglePillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  togglePillText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  togglePillActiveText: {
    color: colors.onAccent,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.income + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.income,
  },
  livePillText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.income,
    textTransform: 'uppercase',
  },
  infoBtn: {
    padding: 8,
  },
  dangerCard: {
    borderColor: colors.danger + '44',
  },
  deleteBtn: {
    backgroundColor: colors.danger + '22',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.danger,
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  stepBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  stepTitle: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.accent,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  modalBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.onAccent,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  deleteModalBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputHeader: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  sbInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.income + '18',
    borderRadius: radius.md,
    padding: 10,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.income + '44',
  },
  successText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.income,
  },
});
