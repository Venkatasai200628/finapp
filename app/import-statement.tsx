import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Card from '../components/Card';
import DetailHeader from '../components/DetailHeader';
import Screen from '../components/Screen';
import { parseBankStatementCsv } from '../lib/bankStatementParser';
import { useImportedTransactions } from '../context/ImportedTransactionsContext';
import { colors, fontFamily, radius, rupee, spacing } from '../constants/theme';

async function readPickedFile(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  const file = (asset as { file?: File }).file;
  if (file && typeof file.text === 'function') {
    return file.text();
  }
  const res = await fetch(asset.uri);
  return res.text();
}

export default function ImportStatementScreen() {
  const { addImported } = useImportedTransactions();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof parseBankStatementCsv> | null>(null);

  const pickFile = async () => {
    setError(null);
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) {
        setBusy(false);
        return;
      }
      const asset = picked.assets[0];
      setFileName(asset.name);
      const text = await readPickedFile(asset);
      const parsed = parseBankStatementCsv(text);
      setResult(parsed);
      if (parsed.rows.length === 0) {
        setError(parsed.errors[0] ?? 'Could not read any rows from that file.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the file.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = () => {
    if (!result || result.rows.length === 0) return;
    addImported(result.rows);
    router.replace('/(tabs)/books');
  };

  return (
    <Screen>
      <DetailHeader title="Upload statement" />

      <Pressable onPress={pickFile} disabled={busy}>
        <Card elevated style={styles.drop}>
          <View style={styles.dropIcon}>
            <Ionicons name="document-attach-outline" size={26} color={colors.accent} />
          </View>
          <Text style={styles.h3}>{busy ? 'Reading…' : 'Choose a CSV file'}</Text>
          <Text style={styles.note}>
            From net banking: Account statement → Download CSV. We read Date, Narration, Debit and Credit columns.
          </Text>
          <View style={styles.uploadBtn}>
            <Text style={styles.uploadBtnText}>Select file</Text>
          </View>
          {fileName ? <Text style={styles.fileName}>{fileName}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Card>
      </Pressable>

      {result && result.rows.length > 0 && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.h3}>Preview</Text>
          <Text style={styles.previewMeta}>
            {result.rows.length} rows · {result.skipped} skipped
          </Text>
          {result.rows.slice(0, 8).map((row) => (
            <View key={row.id} style={styles.previewRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewMerchant} numberOfLines={1}>
                  {row.merchant}
                </Text>
                <Text style={styles.previewDate}>
                  {row.dateLabel} · {row.category}
                </Text>
              </View>
              <Text style={{ color: row.amount >= 0 ? colors.income : colors.expense, fontFamily: fontFamily.bold }}>
                {rupee(row.amount, { signed: true })}
              </Text>
            </View>
          ))}
          <Pressable style={styles.importBtn} onPress={handleImport}>
            <Text style={styles.importBtnText}>Import into books</Text>
          </Pressable>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  drop: { alignItems: 'center', paddingVertical: spacing.xxl },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  h3: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.textPrimary, textAlign: 'center' },
  note: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19, textAlign: 'center' },
  uploadBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  uploadBtnText: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.onAccent },
  fileName: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
  error: { marginTop: spacing.sm, fontSize: 13, color: colors.danger, textAlign: 'center' },
  previewMeta: { fontSize: 12, color: colors.textMuted, marginTop: 6, marginBottom: spacing.sm },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  previewMerchant: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  previewDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  importBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  importBtnText: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.onAccent },
});
