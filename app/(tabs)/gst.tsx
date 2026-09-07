import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import { adviseGstReduction, computeGstLine, computeGstSummary, type GstItem } from '../../lib/gstCalculator';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, fontFamily, radius, rupee, spacing } from '../../constants/theme';

function money(n: number) {
  return rupee(n, { digits: 2 });
}

function parseNum(v: string) {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function GstScreen() {
  const { twoCol } = useResponsive();
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [rate, setRate] = useState(18);
  const [inclusive, setInclusive] = useState(false);
  const [name, setName] = useState('');
  const [bill, setBill] = useState<GstItem[]>([]);
  const [targetIdeal, setTargetIdeal] = useState('');

  const draft: GstItem = {
    id: 'draft',
    name,
    quantity: parseNum(qty) || 1,
    unitPrice: parseNum(price),
    gstRate: rate,
    inclusive,
  };
  const preview = parseNum(price) > 0 ? computeGstLine(draft) : null;
  const summary = useMemo(() => computeGstSummary(bill), [bill]);
  const target = parseNum(targetIdeal);
  const advice = useMemo(() => adviseGstReduction(summary, target), [summary, target]);

  const addLine = () => {
    if (parseNum(price) <= 0) return;
    setBill((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name: name.trim() || `Line ${prev.length + 1}`,
        quantity: parseNum(qty) || 1,
        unitPrice: parseNum(price),
        gstRate: rate,
        inclusive,
      },
    ]);
    setPrice('');
    setName('');
    setQty('1');
  };

  const calculator = (
    <View style={twoCol ? styles.col : undefined}>
      <View style={styles.display}>
        <Text style={styles.displayKicker}>Line preview</Text>
        <View style={styles.displayRow}>
          <Text style={styles.displayLabel}>Before GST</Text>
          <Text style={styles.displayValue}>{preview ? money(preview.baseAmount) : '₹0.00'}</Text>
        </View>
        <View style={styles.displayRow}>
          <Text style={styles.displayLabel}>GST {rate}%</Text>
          <Text style={[styles.displayValue, { color: colors.warn }]}>
            {preview ? money(preview.gstAmount) : '₹0.00'}
          </Text>
        </View>
        <View style={[styles.displayRow, styles.displayTotal]}>
          <Text style={styles.displayTotalLabel}>After GST</Text>
          <Text style={styles.displayTotalValue}>{preview ? money(preview.totalAmount) : '₹0.00'}</Text>
        </View>
      </View>

      <Card style={styles.pad}>
        <Text style={styles.field}>GST %</Text>
        <View style={styles.rateRow}>
          <Pressable onPress={() => setRate(5)} style={[styles.rateMain, rate === 5 && styles.rateOn]}>
            <Text style={[styles.rateMainText, rate === 5 && styles.rateOnText]}>5%</Text>
          </Pressable>
          <Pressable onPress={() => setRate(18)} style={[styles.rateMain, rate === 18 && styles.rateOn]}>
            <Text style={[styles.rateMainText, rate === 18 && styles.rateOnText]}>18%</Text>
          </Pressable>
        </View>
        <View style={styles.rateRow}>
          {[0, 12, 28].map((r) => (
            <Pressable key={r} onPress={() => setRate(r)} style={[styles.rateSmall, rate === r && styles.rateOn]}>
              <Text style={[styles.rateSmallText, rate === r && styles.rateOnText]}>{r}%</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ width: 88 }}>
            <Text style={styles.field}>Qty</Text>
            <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.field}>{inclusive ? 'Price incl. GST' : 'Price excl. GST'}</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>
        </View>

        <Pressable style={styles.check} onPress={() => setInclusive((v) => !v)}>
          <Ionicons name={inclusive ? 'checkbox' : 'square-outline'} size={20} color={colors.accent} />
          <Text style={styles.checkText}>Price already includes GST</Text>
        </Pressable>

        <Text style={styles.field}>Item (optional)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Skip this — lines are numbered on the bill"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Pressable style={[styles.addBtn, !preview && styles.addBtnOff]} onPress={addLine} disabled={!preview}>
          <Text style={styles.addBtnText}>Add to bill</Text>
        </Pressable>
      </Card>
    </View>
  );

  const billPanel = (
    <View style={twoCol ? styles.col : undefined}>
      <View style={styles.billHead}>
        <Text style={styles.billTitle}>Bill</Text>
        {bill.length > 0 && (
          <Pressable onPress={() => setBill([])}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        )}
      </View>

      <Card style={styles.billCard}>
        {bill.length === 0 ? (
          <Text style={styles.emptyBill}>Bill is empty. Calculate a line, then add it.</Text>
        ) : (
          <>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1.2 }]}>Item</Text>
              <Text style={[styles.th, styles.numCol]}>Qty</Text>
              <Text style={[styles.th, styles.amtCol]}>After</Text>
            </View>
            {summary.lines.map((line, i) => (
              <View key={line.id} style={styles.tableRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.tdName}>{line.name}</Text>
                  <Text style={styles.tdMeta}>
                    {line.gstRate}% · {money(line.baseAmount)} + {money(line.gstAmount)}
                  </Text>
                </View>
                <Text style={[styles.td, styles.numCol]}>{line.quantity}</Text>
                <View style={styles.afterCell}>
                  <Text style={styles.tdBold}>{money(line.totalAmount)}</Text>
                  <Pressable onPress={() => setBill((p) => p.filter((_, idx) => idx !== i))} hitSlop={8}>
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            ))}
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Before GST</Text>
                <Text style={styles.totalValue}>{money(summary.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST</Text>
                <Text style={styles.totalValue}>{money(summary.totalGst)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.grandLabel}>After GST</Text>
                <Text style={styles.grandValue}>{money(summary.grandTotal)}</Text>
              </View>
            </View>
          </>
        )}
      </Card>

      {bill.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Target cap (optional)</Text>
          <Text style={styles.hint}>If the bill is over this, the cut is split equally across every line.</Text>
          <TextInput
            value={targetIdeal}
            onChangeText={setTargetIdeal}
            keyboardType="numeric"
            placeholder="e.g. 15000"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          {target > 0 && (
            <Text style={[styles.advice, advice.exceedsTarget ? styles.adviceWarn : styles.adviceOk]}>
              {advice.message}
            </Text>
          )}
          {advice.exceedsTarget &&
            advice.suggestedLines.map((line) => (
              <View key={line.id} style={styles.cutRow}>
                <Text style={styles.cutName}>{line.name}</Text>
                <Text style={styles.cutMeta}>
                  {money(line.totalAmount)} → {money(line.reducedTotal)} (−{money(line.savedAmount)})
                </Text>
              </View>
            ))}
        </Card>
      )}
    </View>
  );

  return (
    <Screen>
      <SectionHeader
        kicker="Tax"
        title="GST"
        subtitle="Type an amount, add it to the bill, then enter the next line."
      />
      <View style={twoCol ? styles.split : undefined}>
        {calculator}
        {billPanel}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  split: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0 },
  display: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  displayKicker: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  displayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  displayLabel: { fontSize: 13, color: colors.textMuted, fontFamily: fontFamily.medium },
  displayValue: { fontSize: 18, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  displayTotal: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  displayTotalLabel: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  displayTotalValue: { fontSize: 28, fontFamily: fontFamily.extraBold, color: colors.accent, letterSpacing: -0.7 },
  pad: { marginBottom: spacing.lg },
  field: { fontSize: 11, color: colors.textMuted, marginBottom: 6, marginTop: spacing.sm, letterSpacing: 0.4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  rateRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rateMain: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateSmall: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  rateOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  rateMainText: { fontSize: 20, fontFamily: fontFamily.bold, color: colors.textPrimary },
  rateSmallText: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  rateOnText: { color: colors.onAccent },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  checkText: { fontSize: 13, color: colors.textSecondary },
  addBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnOff: { opacity: 0.4 },
  addBtnText: { color: colors.onAccent, fontFamily: fontFamily.bold, fontSize: 15 },
  billHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  billTitle: { fontSize: 18, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  clear: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.expense },
  billCard: { marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  emptyBill: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  tableHead: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { fontSize: 10, fontFamily: fontFamily.bold, color: colors.textMuted, textTransform: 'uppercase' },
  numCol: { width: 44, textAlign: 'right' },
  amtCol: { width: 88, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  td: { fontSize: 12, color: colors.textSecondary },
  tdBold: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.textPrimary, textAlign: 'right' },
  tdName: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  tdMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  afterCell: { width: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  totals: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 13, color: colors.textSecondary },
  totalValue: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  grandLabel: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.textPrimary },
  grandValue: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.accent },
  card: { marginBottom: spacing.lg },
  cardTitle: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm, lineHeight: 17 },
  advice: { fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  adviceWarn: { color: colors.warn },
  adviceOk: { color: colors.income },
  cutRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  cutName: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  cutMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
