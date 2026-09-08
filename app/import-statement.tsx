import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Card from '../components/Card';
import DetailHeader from '../components/DetailHeader';
import Screen from '../components/Screen';
import { parseBankStatementCsv } from '../lib/bankStatementParser';
import { parseExcelStatement } from '../lib/excelStatementParser';
import { useImportedTransactions } from '../context/ImportedTransactionsContext';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../lib/backendClient';
import { colors, fontFamily, radius, rupee, spacing } from '../constants/theme';
import type { ParseResult } from '../lib/bankStatementParser';

// ─── file reading helpers ────────────────────────────────────────────────────

async function readAsText(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  const file = (asset as { file?: File }).file;
  if (file && typeof file.text === 'function') return file.text();
  const res = await fetch(asset.uri);
  return res.text();
}

async function readAsBytes(asset: DocumentPicker.DocumentPickerAsset): Promise<Uint8Array> {
  const file = (asset as { file?: File }).file;
  if (file && typeof file.arrayBuffer === 'function') {
    return new Uint8Array(await file.arrayBuffer());
  }
  const res = await fetch(asset.uri);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function isExcel(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith('.xlsx') || lower.endsWith('.xls');
}

// ─── component ───────────────────────────────────────────────────────────────

type Step = 'idle' | 'password' | 'parsed' | 'error';

export default function ImportStatementScreen() {
  const { addImported } = useImportedTransactions();

  const [step, setStep] = useState<Step>('idle');
  const [busy, setBusy] = useState(false);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileAsset, setFileAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [isExcelFile, setIsExcelFile] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [result, setResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // ── pick file ──────────────────────────────────────────────────────────────
  const pickFile = async () => {
    setParseError(null);
    setPasswordError(null);
    setResult(null);
    setStep('idle');
    setBusy(true);

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*'],
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets?.[0]) { setBusy(false); return; }

      const asset = picked.assets[0];
      setFileName(asset.name);
      setFileAsset(asset);

      if (isExcel(asset.name)) {
        // Excel — store bytes, then ask for password
        const bytes = await readAsBytes(asset);
        setFileBytes(bytes);
        setIsExcelFile(true);
        setPassword('');
        setStep('password');
        setBusy(false);
      } else {
        // CSV — parse immediately
        setIsExcelFile(false);
        setFileAsset(null);
        setFileBytes(null);
        const text = await readAsText(asset);
        const parsed = parseBankStatementCsv(text);
        if (parsed.rows.length === 0) {
          setParseError(parsed.errors[0] ?? 'No rows could be read from this file.');
          setStep('error');
        } else {
          setResult(parsed);
          setStep('parsed');
        }
        setBusy(false);
      }
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Could not open the file.');
      setStep('error');
      setBusy(false);
    }
  };

  const { token } = useAuth();

  // ── try opening Excel (with password) ─────────────────────────────────────
  const tryParseExcel = async (pwd: string) => {
    if (!fileBytes) return;
    setPasswordError(null);
    setBusy(true);

    try {
      let parsed: ParseResult;

      // If backend is configured, send the file there to decrypt + parse
      // (because React Native lacks the crypto keys to crack modern Excel files).
      if (BACKEND_URL && token && fileAsset) {
        if (Platform.OS === 'web') {
          const fd = new FormData();
          const file = (fileAsset as any).file;
          if (file) {
            fd.append('file', file);
          } else {
            const blob = new Blob([fileBytes as any], { type: 'application/octet-stream' });
            fd.append('file', blob, fileName || 'statement.xlsx');
          }
          if (pwd) fd.append('password', pwd);

          const res = await fetch(`${BACKEND_URL}/api/parse-statement`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Server error: ${res.status}`);
          }
          parsed = await res.json();
        } else {
          // Native platforms (iOS/Android): use legacy expo-file-system uploadAsync
          try {
            const LegacyFS = require('expo-file-system/legacy');
            const uploadResult = await LegacyFS.uploadAsync(`${BACKEND_URL}/api/parse-statement`, fileAsset.uri, {
               httpMethod: 'POST',
               uploadType: 1 /* MULTIPART */,
               fieldName: 'file',
               headers: { Authorization: `Bearer ${token}` },
               parameters: pwd ? { password: pwd } : {},
            });

            if (uploadResult.status !== 200) {
              const data = JSON.parse(uploadResult.body);
              throw new Error(data.error || `Server error: ${uploadResult.status}`);
            }
            parsed = JSON.parse(uploadResult.body);
          } catch (nativeErr: any) {
            // If native upload fails or module not found, fallback to local parser
            parsed = parseExcelStatement(fileBytes, pwd || undefined);
          }
        }
      } else {
        // Fallback: try parsing locally (only works for non-encrypted files)
        parsed = parseExcelStatement(fileBytes, pwd || undefined);
      }

      if (parsed.errors && parsed.errors[0] === 'WRONG_PASSWORD') {
        setPasswordError('Wrong password. Please enter the correct password and try again.');
        setBusy(false);
        return;
      }
      if (!parsed.rows || parsed.rows.length === 0) {
        setPasswordError(parsed?.errors?.[0] ?? 'No transaction rows found in this file.');
        setBusy(false);
        return;
      }
      setResult(parsed);
      setStep('parsed');
    } catch (e: any) {
      if (e.message === 'WRONG_PASSWORD') {
         setPasswordError('Wrong password. Please enter the correct password and try again.');
      } else {
         setPasswordError(e instanceof Error ? e.message : 'Failed to parse file.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── import into books ──────────────────────────────────────────────────────
  const handleImport = () => {
    if (!result || result.rows.length === 0) return;
    addImported(result.rows);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/books');
    }
  };

  // ── reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('idle');
    setFileName(null);
    setFileAsset(null);
    setFileBytes(null);
    setResult(null);
    setParseError(null);
    setPasswordError(null);
    setPassword('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Screen>
      <DetailHeader title="Upload statement" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── file picker ── */}
          {step === 'idle' || step === 'error' ? (
            <Pressable onPress={pickFile} disabled={busy}>
              <Card elevated style={styles.drop}>
                <View style={styles.dropIcon}>
                  {busy
                    ? <ActivityIndicator color={colors.accent} size="large" />
                    : <Ionicons name="document-attach-outline" size={30} color={colors.accent} />}
                </View>
                <Text style={styles.h3}>{busy ? 'Reading file…' : 'Choose a statement file'}</Text>
                <Text style={styles.note}>
                  Supports Excel (.xlsx, .xls) and CSV. Password-protected files are supported — you'll be asked to enter the password.
                </Text>

                <View style={styles.formatRow}>
                  <FormatBadge label="CSV" color={colors.income} />
                  <FormatBadge label="XLSX" color={colors.accent} />
                  <FormatBadge label="XLS" color={colors.accent} />
                </View>

                <View style={styles.uploadBtn}>
                  <Text style={styles.uploadBtnText}>Select file</Text>
                </View>

                {step === 'error' && parseError ? (
                  <View style={styles.errBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errText}>{parseError}</Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          ) : null}

          {/* ── password prompt (Excel only) ── */}
          {step === 'password' ? (
            <Card elevated style={styles.pwdCard}>
              <View style={styles.pwdIconRow}>
                <Ionicons name="lock-closed" size={22} color={colors.accent} />
              </View>
              <Text style={styles.h3}>This file is password protected</Text>
              <Text style={styles.note}>
                Enter the password your bank set for this file.
              </Text>

              <Text style={styles.fileNameLabel}>
                <Ionicons name="document" size={12} color={colors.textMuted} /> {fileName}
              </Text>

              <View style={styles.pwdRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.pwdInput}
                  onSubmitEditing={() => tryParseExcel(password)}
                />
                <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              {passwordError ? (
                <View style={styles.errBox}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={styles.errText}>{passwordError}</Text>
                </View>
              ) : null}

              <View style={styles.pwdActions}>
                <Pressable style={styles.ghostBtn} onPress={reset}>
                  <Text style={styles.ghostBtnText}>Change file</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, busy && { opacity: 0.5 }]}
                  onPress={() => tryParseExcel(password)}
                  disabled={busy}
                >
                  {busy
                    ? <ActivityIndicator color={colors.onAccent} size="small" />
                    : <Text style={styles.primaryBtnText}>Open file</Text>}
                </Pressable>
              </View>

              <Pressable onPress={() => tryParseExcel('')} style={styles.noPassLink}>
                <Text style={styles.noPassText}>File has no password? Try without one</Text>
              </Pressable>
            </Card>
          ) : null}

          {/* ── parsed preview ── */}
          {step === 'parsed' && result ? (
            <Card elevated style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.income} />
                <Text style={styles.previewTitle}>{result.rows.length} transactions found</Text>
              </View>
              {result.skipped > 0 ? (
                <Text style={styles.skipped}>{result.skipped} rows skipped (blank or summary lines)</Text>
              ) : null}

              {result.rows.slice(0, 8).map((row) => (
                <View key={row.id} style={styles.previewRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewMerchant} numberOfLines={1}>{row.merchant}</Text>
                    <Text style={styles.previewDate}>{row.dateLabel} · {row.category}</Text>
                  </View>
                  <Text style={[styles.previewAmt, { color: row.amount >= 0 ? colors.income : colors.expense }]}>
                    {rupee(row.amount, { signed: true })}
                  </Text>
                </View>
              ))}

              {result.rows.length > 8 ? (
                <Text style={styles.more}>+ {result.rows.length - 8} more rows</Text>
              ) : null}

              <View style={styles.importActions}>
                <Pressable style={styles.ghostBtn} onPress={reset}>
                  <Text style={styles.ghostBtnText}>Choose different file</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={handleImport}>
                  <Text style={styles.primaryBtnText}>Import into books</Text>
                </Pressable>
              </View>
            </Card>
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FormatBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color + '55', backgroundColor: color + '15' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  drop: { alignItems: 'center', paddingVertical: spacing.xl },
  dropIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.accent + '18',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  h3: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: 8 },
  note: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  formatRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md, marginBottom: spacing.md },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  badgeText: { fontSize: 11, fontFamily: fontFamily.bold },
  uploadBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: spacing.xl, marginTop: spacing.sm,
  },
  uploadBtnText: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.onAccent },
  errBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: spacing.md, maxWidth: 300 },
  errText: { flex: 1, fontSize: 12.5, color: colors.danger, lineHeight: 18 },

  // password card
  pwdCard: { gap: 0 },
  pwdIconRow: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: colors.accent + '18',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  highlight: { fontFamily: fontFamily.bold, color: colors.textPrimary },
  fileNameLabel: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.md },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  pwdInput: {
    flex: 1,
    backgroundColor: colors.bgAlt, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 50,
    color: colors.textPrimary, fontSize: 14, fontFamily: fontFamily.medium,
  },
  eyeBtn: {
    width: 50, height: 50, borderRadius: radius.md,
    backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  hintBox: {
    marginTop: spacing.lg, backgroundColor: colors.bgAlt,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  hintTitle: { fontSize: 11, fontFamily: fontFamily.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  hintRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  hintBank: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.accent, width: 46 },
  hintText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  pwdActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  noPassLink: { marginTop: spacing.md, alignItems: 'center' },
  noPassText: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' },

  // preview
  previewCard: {},
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  previewTitle: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.textPrimary },
  skipped: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  previewRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  previewMerchant: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  previewDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  previewAmt: { fontSize: 13, fontFamily: fontFamily.bold },
  more: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  importActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },

  // shared buttons
  ghostBtn: {
    flex: 1, height: 48, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnText: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  primaryBtn: {
    flex: 1, height: 48, borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 13, fontFamily: fontFamily.extraBold, color: colors.onAccent },
});
