import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../components/Card';
import DetailHeader from '../components/DetailHeader';
import EmptyState from '../components/EmptyState';
import Screen from '../components/Screen';
import TransactionRow from '../components/TransactionRow';
import { Transaction } from '../data/mockData';
import { fontFamily, colors, radius, spacing } from '../constants/theme';
import { useImportedTransactions } from '../context/ImportedTransactionsContext';

const CATEGORIES = ['All', 'Food', 'Groceries', 'Transport', 'Subscription', 'Shopping', 'Income', 'Uncategorized'];

export default function TransactionsScreen() {
  const { imported } = useImportedTransactions();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const all: Transaction[] = useMemo(() => {
    return imported.map((tx) => ({
      id: tx.id,
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      time: tx.dateLabel,
      flagged: false,
    }));
  }, [imported]);

  const filtered = useMemo(() => {
    return all.filter((tx) => {
      const matchesCategory = category === 'All' || tx.category === category;
      const matchesQuery = tx.merchant.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category, all]);

  return (
    <Screen scroll={false} contentStyle={{ paddingHorizontal: 0, maxWidth: undefined }}>
      <DetailHeader title="Transactions" />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search merchant"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No transactions" body="Upload a bank statement from Books." />
        ) : (
          <Card style={styles.txCard}>
            {filtered.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onPress={() =>
                  router.push({
                    pathname: '/transaction/[id]',
                    params: {
                      id: tx.id,
                      merchant: tx.merchant,
                      category: tx.category,
                      amount: String(tx.amount),
                      time: tx.time,
                      flagged: tx.flagged ? '1' : '0',
                    },
                  })
                }
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  chipsRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12.5, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  chipTextActive: { color: colors.onAccent },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: 40 },
  txCard: { paddingVertical: 4, paddingHorizontal: spacing.lg },
});
