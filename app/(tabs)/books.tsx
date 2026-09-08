import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../../components/Card';
import CategoryBars from '../../components/CategoryBars';
import ChartCard from '../../components/ChartCard';
import EmptyState from '../../components/EmptyState';
import PartyRow from '../../components/PartyRow';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import StatCard from '../../components/StatCard';
import TransactionRow from '../../components/TransactionRow';
import { buildLedgerOverview } from '../../lib/ledgerAnalytics';
import { CATEGORY_COLORS } from '../../lib/financeAnalytics';
import { useImportedTransactions } from '../../context/ImportedTransactionsContext';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, fontFamily, radius, shadow, spacing } from '../../constants/theme';

export default function BooksScreen() {
  const { imported, clearImported } = useImportedTransactions();
  const ledger = useMemo(() => buildLedgerOverview(imported), [imported]);
  const empty = imported.length === 0;
  const { twoCol } = useResponsive();

  return (
    <Screen>
      <SectionHeader
        kicker="Ledger"
        title="Books"
        subtitle="Upload, parties and category spend live here. GST stays on the GST tab."
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
        <Card elevated>
          <EmptyState
            icon="book-outline"
            title="Books are empty"
            body="Download a statement from net banking as CSV, then upload it here. Charts on Home fill in from the same file."
          />
        </Card>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Income" amount={ledger.totalIncome} color={colors.income} icon="arrow-down-circle" />
            <StatCard label="Expense" amount={ledger.totalExpense} color={colors.expense} icon="arrow-up-circle" />
            <StatCard label="Net" amount={ledger.netBalance} color={colors.savings} icon="swap-horizontal" />
          </View>

          <View style={styles.toolbar}>
            <Text style={styles.count}>{imported.length} rows in the ledger</Text>
            <Pressable onPress={clearImported} style={styles.clear}>
              <Text style={styles.clearText}>Clear statement</Text>
            </Pressable>
          </View>

          <ChartCard
            title="Spend by category"
            hint="Bars scale to the largest category in this file."
            style={styles.card}
          >
            <CategoryBars items={ledger.expenseByCategory.map((c) => ({ label: c.category, amount: c.amount, color: CATEGORY_COLORS[c.category] ?? colors.expense }))} />
          </ChartCard>

          <View style={[styles.partyRow, twoCol && styles.partyRowWide]}>
            <Card style={[styles.partyCard, twoCol && styles.partyCardWide]}>
              <Text style={styles.cardTitle}>Who you pay most</Text>
              <Text style={styles.cardHint}>Tap any party to see all transactions with them.</Text>
              {ledger.topPayees.length === 0 ? (
                <Text style={styles.muted}>No outgoing payments.</Text>
              ) : (
                ledger.topPayees.map((p) => <PartyRow key={p.party} party={p} mode="payee" />)
              )}
            </Card>
            <Card style={[styles.partyCard, twoCol && styles.partyCardWide]}>
              <Text style={styles.cardTitle}>Who pays you</Text>
              <Text style={styles.cardHint}>Tap any payer to see all deposits from them.</Text>
              {ledger.topPayers.length === 0 ? (
                <Text style={styles.muted}>No incoming payments.</Text>
              ) : (
                ledger.topPayers.map((p) => <PartyRow key={p.party} party={p} mode="payer" />)
              )}
            </Card>
          </View>

          <SectionHeader
            title={`All transactions (${imported.length})`}
            action="Full screen"
            onAction={() => router.push('/transactions')}
          />
          <Card style={styles.txCard}>
            {imported.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={{
                  id: tx.id,
                  merchant: tx.merchant,
                  category: tx.category,
                  amount: tx.amount,
                  time: tx.dateLabel,
                  flagged: false,
                }}
                onPress={() =>
                  router.push({
                    pathname: '/transaction/[id]',
                    params: {
                      id: tx.id,
                      merchant: tx.merchant,
                      category: tx.category,
                      amount: String(tx.amount),
                      time: tx.dateLabel,
                      rawDescription: tx.rawDescription,
                      flagged: '0',
                    },
                  })
                }
              />
            ))}
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.onAccent },
  uploadSub: { fontSize: 12, color: colors.onAccent, opacity: 0.78, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  count: { fontSize: 12, color: colors.textMuted, fontFamily: fontFamily.medium },
  clear: {
    borderWidth: 1,
    borderColor: colors.expense + '55',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearText: { fontSize: 12, color: colors.expense, fontFamily: fontFamily.semiBold },
  card: { marginBottom: spacing.lg },
  cardTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary, marginBottom: 4 },
  cardHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  partyRow: { gap: spacing.lg, marginBottom: spacing.lg },
  partyRowWide: { flexDirection: 'row', alignItems: 'flex-start' },
  partyCard: { marginBottom: 0 },
  partyCardWide: { flex: 1 },
  txCard: { paddingVertical: 4, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
});
