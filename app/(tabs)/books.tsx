import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../../components/Card';
import CategoryBars from '../../components/CategoryBars';
import EmptyState from '../../components/EmptyState';
import PartyRow from '../../components/PartyRow';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import StatCard from '../../components/StatCard';
import { buildLedgerOverview } from '../../lib/ledgerAnalytics';
import { useImportedTransactions } from '../../context/ImportedTransactionsContext';
import { colors, fontFamily, radius, shadow, spacing } from '../../constants/theme';

export default function BooksScreen() {
  const { imported, clearImported } = useImportedTransactions();
  const ledger = useMemo(() => buildLedgerOverview(imported), [imported]);
  const empty = imported.length === 0;

  return (
    <Screen>
      <SectionHeader
        kicker="Ledger"
        title="Books"
        subtitle="Parties, income and spend live here. GST stays on the GST tab."
      />

      <Pressable style={[styles.upload, shadow.glow]} onPress={() => router.push('/import-statement')}>
        <View style={styles.uploadIcon}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadTitle}>Upload bank CSV</Text>
          <Text style={styles.uploadSub}>Pick a statement from your phone — no copy-paste</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.onAccent} />
      </Pressable>

      {empty ? (
        <Card>
          <EmptyState
            icon="book-outline"
            title="Books are empty"
            body="Download a statement from net banking as CSV, then upload it here."
          />
        </Card>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Income" amount={ledger.totalIncome} color={colors.income} icon="arrow-down-circle" />
            <StatCard label="Expense" amount={ledger.totalExpense} color={colors.expense} icon="arrow-up-circle" />
            <StatCard label="Net" amount={ledger.netBalance} color={colors.savings} icon="swap-horizontal" />
          </View>

          <Pressable onPress={clearImported} style={styles.clear}>
            <Text style={styles.clearText}>Clear statement</Text>
          </Pressable>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Spend by category</Text>
            <Text style={styles.cardHint}>Bars scale to the largest category in this file.</Text>
            <CategoryBars
              items={ledger.expenseByCategory.map((c) => ({ label: c.category, amount: c.amount }))}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Who you pay most</Text>
            {ledger.topPayees.length === 0 ? (
              <Text style={styles.muted}>No outgoing payments.</Text>
            ) : (
              ledger.topPayees.map((p) => <PartyRow key={p.party} party={p} mode="payee" />)
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Who pays you</Text>
            {ledger.topPayers.length === 0 ? (
              <Text style={styles.muted}>No incoming payments.</Text>
            ) : (
              ledger.topPayers.map((p) => <PartyRow key={p.party} party={p} mode="payer" />)
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(6,20,14,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.onAccent },
  uploadSub: { fontSize: 12, color: colors.onAccent, opacity: 0.78, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  clear: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  clearText: { fontSize: 13, color: colors.expense, fontFamily: fontFamily.semiBold },
  card: { marginBottom: spacing.lg },
  cardTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  cardHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 4 },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
});
