import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Card from '../components/Card';
import DetailHeader from '../components/DetailHeader';
import EmptyState from '../components/EmptyState';
import Screen from '../components/Screen';
import TransactionRow from '../components/TransactionRow';
import { Transaction } from '../data/mockData';
import { fontFamily, colors, radius, spacing } from '../constants/theme';
import { useImportedTransactions, DEFAULT_CATEGORIES } from '../context/ImportedTransactionsContext';
import { useTheme } from '../context/ThemeContext';

export default function TransactionsScreen() {
  const params = useLocalSearchParams<{ search?: string; cat?: string; type?: string }>();
  const { imported, customCategories } = useImportedTransactions();
  const { colors: themeColors } = useTheme();
  const [query, setQuery] = useState(params.search ? String(params.search) : '');
  const [category, setCategory] = useState(params.cat ? String(params.cat) : 'All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(
    params.type === 'income' ? 'income' : params.type === 'expense' ? 'expense' : 'all'
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    DEFAULT_CATEGORIES.forEach((c) => set.add(c));
    customCategories.forEach((c) => {
      const trimmed = c.trim();
      if (trimmed) set.add(trimmed);
    });
    imported.forEach((tx) => {
      const trimmed = (tx.category || '').trim();
      if (trimmed && trimmed !== 'Uncategorized') set.add(trimmed);
    });
    set.delete('Uncategorized');
    return Array.from(set);
  }, [imported, customCategories]);

  const all: Transaction[] = useMemo(() => {
    return imported.map((tx) => ({
      id: tx.id,
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      time: tx.dateLabel,
      flagged: false,
      rawDescription: tx.rawDescription,
    }));
  }, [imported]);

  const filtered = useMemo(() => {
    return all.filter((tx) => {
      // Type filtering (income vs expense)
      if (typeFilter === 'income' && tx.amount < 0) return false;
      if (typeFilter === 'expense' && tx.amount >= 0) return false;

      const matchesCategory = category === 'All' || tx.category === category;
      const matchesQuery =
        !query.trim() ||
        tx.merchant.toLowerCase().includes(query.trim().toLowerCase()) ||
        (Boolean((tx as any).rawDescription) && (tx as any).rawDescription.toLowerCase().includes(query.trim().toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [query, category, all, typeFilter]);

  const pageTitle =
    typeFilter === 'income'
      ? 'Income Transactions'
      : typeFilter === 'expense'
      ? 'Expense Transactions'
      : 'Transactions';

  return (
    <Screen scroll={true} contentStyle={{ paddingHorizontal: 0, maxWidth: undefined }}>
      <DetailHeader title={pageTitle} />

      {/* Active Filter Indicators */}
      {(typeFilter !== 'all' || params.search) && (
        <View style={styles.filterBannerRow}>
          {typeFilter !== 'all' && (
            <View
              style={[
                styles.typePill,
                {
                  backgroundColor:
                    (typeFilter === 'income' ? themeColors.income : themeColors.expense) + '22',
                },
              ]}
            >
              <Ionicons
                name={typeFilter === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={14}
                color={typeFilter === 'income' ? themeColors.income : themeColors.expense}
              />
              <Text
                style={[
                  styles.typePillText,
                  { color: typeFilter === 'income' ? themeColors.income : themeColors.expense },
                ]}
              >
                {typeFilter === 'income' ? 'Income only (+)' : 'Expenses only (-)'}
              </Text>
              <Pressable onPress={() => setTypeFilter('all')} hitSlop={6}>
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={typeFilter === 'income' ? themeColors.income : themeColors.expense}
                />
              </Pressable>
            </View>
          )}

          {Boolean(query) && (
            <View style={[styles.typePill, { backgroundColor: themeColors.accent + '22' }]}>
              <Text style={[styles.typePillText, { color: themeColors.accent }]}>"{query}"</Text>
              <Pressable onPress={() => setQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={14} color={themeColors.accent} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Search Bar - scrolls away with content */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <Ionicons name="search" size={16} color={themeColors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search merchant or party..."
          placeholderTextColor={themeColors.textMuted}
          style={[styles.searchInput, { color: themeColors.textPrimary }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={themeColors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category Chips - scrolls away with content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {categories.map((c) => {
          const active = category === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                active && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: themeColors.textSecondary },
                  active && styles.chipTextActive,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Transactions List */}
      <View style={styles.content}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No matching transactions"
            body="Try clearing your search query or selecting a different category."
          />
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
                      rawDescription: (tx as any).rawDescription || '',
                      flagged: tx.flagged ? '1' : '0',
                    },
                  })
                }
              />
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterBannerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typePillText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fontFamily.regular },
  chipsRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12.5, fontFamily: fontFamily.semiBold },
  chipTextActive: { color: colors.onAccent },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: 40 },
  txCard: { paddingVertical: 4, paddingHorizontal: spacing.lg },
});
