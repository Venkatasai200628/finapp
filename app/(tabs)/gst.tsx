import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import {
  adviseGstReduction,
  computeGstLine,
  computeGstSummary,
  type GstItem,
  type ReductionStrategy,
} from '../../lib/gstCalculator';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, fontFamily, radius, rupee, shadow, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

function money(n: number) {
  return rupee(n, { digits: 2 });
}

function parseNum(v: string) {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function GstScreen() {
  const { twoCol } = useResponsive();
  const { colors: themeColors, theme } = useTheme();

  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [rate, setRate] = useState(18);
  const [inclusive, setInclusive] = useState(false);
  const [name, setName] = useState('');
  const [bill, setBill] = useState<GstItem[]>([]);
  const [targetIdeal, setTargetIdeal] = useState('');
  const [strategy, setStrategy] = useState<ReductionStrategy>('equal');

  // Edit item state
  const [editingItem, setEditingItem] = useState<GstItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editRate, setEditRate] = useState(18);
  const [editInclusive, setEditInclusive] = useState(false);

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
  const advice = useMemo(() => adviseGstReduction(summary, target, strategy), [summary, target, strategy]);

  const addLine = () => {
    if (parseNum(price) <= 0) return;
    setBill((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name: name.trim() || `Item ${prev.length + 1}`,
        quantity: parseNum(qty) || 1,
        unitPrice: parseNum(price),
        gstRate: rate,
        inclusive,
        fixed: false,
      },
    ]);
    setPrice('');
    setName('');
    setQty('1');
  };

  const toggleFix = (id: string) => {
    setBill((prev) =>
      prev.map((item) => (item.id === id ? { ...item, fixed: !item.fixed } : item))
    );
  };

  const startEdit = (item: GstItem) => {
    if (item.fixed) {
      alert('This line is locked. Unlock it first if you want to edit it.');
      return;
    }
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(String(item.unitPrice));
    setEditQty(String(item.quantity));
    setEditRate(item.gstRate);
    setEditInclusive(item.inclusive);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    setBill((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: editName.trim() || item.name,
              quantity: parseNum(editQty) || 1,
              unitPrice: parseNum(editPrice),
              gstRate: editRate,
              inclusive: editInclusive,
            }
          : item
      )
    );
    setEditingItem(null);
  };

  const cycleStrategy = () => {
    setStrategy((s) => {
      if (s === 'equal') return 'proportional';
      if (s === 'proportional') return 'highest_first';
      return 'equal';
    });
  };

  const calculator = (
    <View style={twoCol ? styles.col : undefined}>
      {/* Dynamic Line Preview Card */}
      <View
        style={[
          styles.display,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.previewHeader}>
          <Text style={styles.displayKicker}>LINE PREVIEW</Text>
          <View style={[styles.rateBadge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.rateBadgeText, { color: colors.accent }]}>{rate}% GST</Text>
          </View>
        </View>

        <View style={styles.displayRow}>
          <Text style={[styles.displayLabel, { color: themeColors.textMuted }]}>Taxable Base</Text>
          <Text style={[styles.displayValue, { color: themeColors.textPrimary }]}>
            {preview ? money(preview.baseAmount) : '₹0.00'}
          </Text>
        </View>

        <View style={styles.displayRow}>
          <Text style={[styles.displayLabel, { color: themeColors.textMuted }]}>GST Amount</Text>
          <Text style={[styles.displayValue, { color: colors.warn }]}>
            {preview ? `+ ${money(preview.gstAmount)}` : '₹0.00'}
          </Text>
        </View>

        <View style={[styles.displayTotal, { borderTopColor: themeColors.border }]}>
          <Text style={[styles.displayTotalLabel, { color: themeColors.textSecondary }]}>Total Price</Text>
          <Text style={[styles.displayTotalValue, { color: colors.accent }]}>
            {preview ? money(preview.totalAmount) : '₹0.00'}
          </Text>
        </View>
      </View>

      {/* Input Controls Card */}
      <Card style={styles.pad}>
        {/* GST Rate Selector */}
        <Text style={[styles.field, { color: themeColors.textMuted }]}>SELECT GST RATE</Text>
        <View style={styles.rateRow}>
          <Pressable
            onPress={() => setRate(5)}
            dataSet={rate === 5 ? { orange: 'true' } : undefined}
            style={[
              styles.rateMain,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
              rate === 5 && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.rateMainText, { color: rate === 5 ? '#FFFFFF' : themeColors.textPrimary }]}>
              5%
            </Text>
            <Text style={[styles.rateSubText, { color: rate === 5 ? 'rgba(255,255,255,0.85)' : themeColors.textMuted }]}>
              Essentials
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRate(18)}
            dataSet={rate === 18 ? { orange: 'true' } : undefined}
            style={[
              styles.rateMain,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
              rate === 18 && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.rateMainText, { color: rate === 18 ? '#FFFFFF' : themeColors.textPrimary }]}>
              18%
            </Text>
            <Text style={[styles.rateSubText, { color: rate === 18 ? 'rgba(255,255,255,0.85)' : themeColors.textMuted }]}>
              Standard
            </Text>
          </Pressable>
        </View>

        <View style={styles.rateRow}>
          {[0, 12, 28].map((r) => {
            const isSel = rate === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRate(r)}
                dataSet={isSel ? { orange: 'true' } : undefined}
                style={[
                  styles.rateSmall,
                  { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                  isSel && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Text style={[styles.rateSmallText, { color: isSel ? '#FFFFFF' : themeColors.textPrimary }]}>
                  {r}%
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Price & Quantity Prominent Section */}
        <Text style={[styles.field, { color: themeColors.textMuted, marginTop: spacing.md }]}>
          {inclusive ? 'UNIT PRICE (INCL. GST)' : 'UNIT PRICE (EXCL. GST)'}
        </Text>
        <View
          style={[
            styles.priceInputBox,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
        >
          <View style={styles.currencyPrefix}>
            <Text style={[styles.currencySymbol, { color: colors.accent }]}>₹</Text>
          </View>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.priceInput, { color: themeColors.textPrimary }]}
          />
        </View>

        {/* Quantity and Inclusive Row */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.field, { color: themeColors.textMuted }]}>QUANTITY</Text>
            <View style={[styles.qtyRow, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => {
                  const current = parseNum(qty) || 1;
                  if (current > 1) setQty(String(current - 1));
                }}
              >
                <Ionicons name="remove" size={16} color={themeColors.textPrimary} />
              </Pressable>
              <TextInput
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                style={[styles.qtyInput, { color: themeColors.textPrimary }]}
                textAlign="center"
              />
              <Pressable
                style={styles.qtyBtn}
                onPress={() => {
                  const current = parseNum(qty) || 0;
                  setQty(String(current + 1));
                }}
              >
                <Ionicons name="add" size={16} color={themeColors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[
              styles.inclusiveBtn,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
              inclusive && { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
            ]}
            onPress={() => setInclusive((v) => !v)}
          >
            <Ionicons
              name={inclusive ? 'checkbox' : 'square-outline'}
              size={20}
              color={inclusive ? colors.accent : themeColors.textMuted}
            />
            <Text
              style={[
                styles.inclusiveText,
                { color: inclusive ? themeColors.textPrimary : themeColors.textSecondary },
              ]}
            >
              Includes GST
            </Text>
          </Pressable>
        </View>

        {/* Item Name */}
        <Text style={[styles.field, { color: themeColors.textMuted, marginTop: spacing.md }]}>
          ITEM DESCRIPTION (OPTIONAL)
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Office Coffee, Cloud Server, Client Bill"
          placeholderTextColor={themeColors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: themeColors.surfaceAlt,
              borderColor: themeColors.border,
              color: themeColors.textPrimary,
            },
          ]}
        />

        {/* Add Line Button */}
        <Pressable
          dataSet={{ orange: 'true' }}
          style={[
            styles.addBtn,
            { backgroundColor: colors.accent },
            !preview && styles.addBtnOff,
          ]}
          onPress={addLine}
          disabled={!preview}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add to Bill</Text>
        </Pressable>
      </Card>
    </View>
  );

  const billPanel = (
    <View style={twoCol ? styles.col : undefined}>
      {/* Bill Header */}
      <View style={styles.billHead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.billTitle, { color: themeColors.textPrimary }]}>Invoice & Bill</Text>
          {bill.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.countBadgeText, { color: colors.accent }]}>
                {bill.length} {bill.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          )}
        </View>
        {bill.length > 0 && (
          <Pressable onPress={() => setBill([])} hitSlop={8}>
            <Text style={[styles.clear, { color: colors.expense }]}>Clear Bill</Text>
          </Pressable>
        )}
      </View>

      {/* Bill Content */}
      {bill.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Ionicons name="receipt-outline" size={40} color={themeColors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Bill is Empty</Text>
          <Text style={[styles.emptyBill, { color: themeColors.textMuted }]}>
            Enter an amount above and click "Add to Bill" to itemize your bill.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {summary.lines.map((line, i) => {
            const rawItem = bill.find((b) => b.id === line.id) || bill[i];
            const isFixed = rawItem?.fixed;

            return (
              <View
                key={line.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: isFixed ? colors.warn : themeColors.border,
                  },
                ]}
              >
                <View style={styles.itemTopRow}>
                  <Pressable style={{ flex: 1 }} onPress={() => rawItem && startEdit(rawItem)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.itemName, { color: themeColors.textPrimary }]} numberOfLines={1}>
                        {line.name}
                      </Text>
                      {isFixed && (
                        <View style={[styles.fixedBadge, { backgroundColor: colors.warn + '20' }]}>
                          <Ionicons name="lock-closed" size={10} color={colors.warn} />
                          <Text style={[styles.fixedBadgeText, { color: colors.warn }]}>Locked</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemSub, { color: themeColors.textMuted }]}>
                      Qty: {line.quantity} × {money(line.unitPrice)} · {line.gstRate}% GST
                    </Text>
                  </Pressable>

                  {/* Lock & Delete Action Buttons */}
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() => toggleFix(line.id)}
                      hitSlop={8}
                      style={[
                        styles.actionIconBtn,
                        { backgroundColor: isFixed ? colors.warn + '22' : themeColors.surfaceAlt },
                      ]}
                    >
                      <Ionicons
                        name={isFixed ? 'lock-closed' : 'lock-open-outline'}
                        size={15}
                        color={isFixed ? colors.warn : themeColors.textMuted}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => setBill((p) => p.filter((_, idx) => idx !== i))}
                      hitSlop={8}
                      style={[styles.actionIconBtn, { backgroundColor: themeColors.surfaceAlt }]}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.expense} />
                    </Pressable>
                  </View>
                </View>

                {/* Amount breakdown row */}
                <View style={[styles.itemAmtRow, { borderTopColor: themeColors.borderSoft }]}>
                  <View>
                    <Text style={[styles.amtSubLabel, { color: themeColors.textMuted }]}>Taxable</Text>
                    <Text style={[styles.amtSubVal, { color: themeColors.textSecondary }]}>
                      {money(line.baseAmount)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.amtSubLabel, { color: themeColors.textMuted }]}>GST ({line.gstRate}%)</Text>
                    <Text style={[styles.amtSubVal, { color: colors.warn }]}>
                      +{money(line.gstAmount)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.amtSubLabel, { color: themeColors.textMuted }]}>Total</Text>
                    <Text style={[styles.amtTotalVal, { color: colors.accent }]}>
                      {money(line.totalAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Grand Totals Card */}
          <View
            style={[
              styles.totalsCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Taxable Subtotal</Text>
              <Text style={[styles.totalValue, { color: themeColors.textPrimary }]}>{money(summary.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Total Tax (CGST + SGST)</Text>
              <Text style={[styles.totalValue, { color: colors.warn }]}>+{money(summary.totalGst)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalDivider, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.grandLabel, { color: themeColors.textPrimary }]}>Grand Total (Incl. GST)</Text>
              <Text style={[styles.grandValue, { color: colors.accent }]}>{money(summary.grandTotal)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Target Cap Optimization Card */}
      {bill.length > 0 && (
        <Card style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>Target Budget Cap (Optional)</Text>
            {target > 0 && (
              <Pressable onPress={cycleStrategy} style={styles.strategyBtn}>
                <Ionicons name="shuffle" size={13} color={colors.accent} />
                <Text style={styles.strategyBtnText}>Split Mode</Text>
              </Pressable>
            )}
          </View>
          <Text style={[styles.hint, { color: themeColors.textMuted }]}>
            Locks prevent items from being reduced. Use split mode to test equal or proportional budget cuts.
          </Text>
          <TextInput
            value={targetIdeal}
            onChangeText={setTargetIdeal}
            keyboardType="numeric"
            placeholder="e.g. 15000"
            placeholderTextColor={themeColors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.surfaceAlt,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
              },
            ]}
          />
          {target > 0 && (
            <View style={styles.adviceWrap}>
              <View style={[styles.strategyBadge, { backgroundColor: themeColors.surfaceAlt }]}>
                <Text style={[styles.strategyBadgeText, { color: themeColors.textSecondary }]}>
                  {advice.strategyLabel}
                </Text>
              </View>
              <Text style={[styles.advice, advice.exceedsTarget ? styles.adviceWarn : styles.adviceOk]}>
                {advice.message}
              </Text>
            </View>
          )}
          {advice.exceedsTarget &&
            advice.suggestedLines.map((line) => (
              <View key={line.id} style={[styles.cutRow, { borderTopColor: themeColors.borderSoft }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.cutName, { color: themeColors.textPrimary }, line.isFixed && { color: colors.warn }]}>
                    {line.name}
                  </Text>
                  {line.isFixed && (
                    <View style={[styles.fixedBadge, { backgroundColor: colors.warn + '20' }]}>
                      <Text style={[styles.fixedBadgeText, { color: colors.warn }]}>Locked · Kept</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cutMeta, { color: themeColors.textMuted }]}>
                  {line.isFixed
                    ? `${money(line.totalAmount)} (No cut)`
                    : `${money(line.totalAmount)} → ${money(line.reducedTotal)} (−${money(line.savedAmount)})`}
                </Text>
              </View>
            ))}
        </Card>
      )}

      {/* Edit Line Item Modal */}
      <Modal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.borderStrong },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>Edit Bill Item</Text>
              <Pressable onPress={() => setEditingItem(null)} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color={themeColors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.field, { color: themeColors.textMuted }]}>ITEM NAME</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  borderColor: themeColors.border,
                  color: themeColors.textPrimary,
                },
              ]}
              placeholder="e.g. Coffee, Domain Renewal"
              placeholderTextColor={themeColors.textMuted}
            />

            <View style={[styles.row, { marginTop: spacing.sm }]}>
              <View style={{ width: 90 }}>
                <Text style={[styles.field, { color: themeColors.textMuted }]}>QUANTITY</Text>
                <TextInput
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.surfaceAlt,
                      borderColor: themeColors.border,
                      color: themeColors.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.field, { color: themeColors.textMuted }]}>
                  {editInclusive ? 'PRICE (INCL. GST)' : 'PRICE (EXCL. GST)'}
                </Text>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="decimal-pad"
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.surfaceAlt,
                      borderColor: themeColors.border,
                      color: themeColors.textPrimary,
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.field, { color: themeColors.textMuted, marginTop: spacing.sm }]}>GST RATE</Text>
            <View style={styles.rateRow}>
              {[0, 5, 12, 18, 28].map((r) => {
                const isSel = editRate === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setEditRate(r)}
                    dataSet={isSel ? { orange: 'true' } : undefined}
                    style={[
                      styles.rateSmall,
                      { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                      isSel && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                  >
                    <Text style={[styles.rateSmallText, { color: isSel ? '#FFFFFF' : themeColors.textPrimary }]}>
                      {r}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.check} onPress={() => setEditInclusive((v) => !v)}>
              <Ionicons
                name={editInclusive ? 'checkbox' : 'square-outline'}
                size={20}
                color={editInclusive ? colors.accent : themeColors.textMuted}
              />
              <Text style={[styles.checkText, { color: themeColors.textSecondary }]}>
                Price already includes GST
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable
                style={[styles.modalBtn, { flex: 1, backgroundColor: themeColors.surfaceAlt }]}
                onPress={() => setEditingItem(null)}
              >
                <Text style={[styles.modalBtnText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                dataSet={{ orange: 'true' }}
                style={[styles.modalBtn, { flex: 1, backgroundColor: colors.accent }]}
                onPress={saveEdit}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <Screen>
      <SectionHeader
        kicker="Tax & Invoicing"
        title="GST"
        subtitle="Quick GST calculation, itemized billing and expense optimization."
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
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadow.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  displayKicker: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
    letterSpacing: 1.4,
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  rateBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  displayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  displayLabel: { fontSize: 13, fontFamily: fontFamily.medium },
  displayValue: { fontSize: 16, fontFamily: fontFamily.semiBold },
  displayTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  displayTotalLabel: { fontSize: 14, fontFamily: fontFamily.semiBold },
  displayTotalValue: { fontSize: 26, fontFamily: fontFamily.extraBold, letterSpacing: -0.7 },
  pad: { marginBottom: spacing.lg },
  field: { fontSize: 10.5, fontFamily: fontFamily.bold, marginBottom: 6, letterSpacing: 0.8 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end', marginTop: spacing.sm },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 54,
  },
  currencyPrefix: {
    marginRight: 6,
  },
  currencySymbol: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
  },
  priceInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: fontFamily.bold,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    height: 46,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 38,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.bold,
    paddingHorizontal: 4,
  },
  inclusiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 46,
    paddingHorizontal: spacing.md,
  },
  inclusiveText: {
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fontFamily.medium,
  },
  rateRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rateMain: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  rateSmall: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  rateMainText: { fontSize: 18, fontFamily: fontFamily.bold },
  rateSubText: { fontSize: 10, fontFamily: fontFamily.medium, marginTop: 2 },
  rateSmallText: { fontSize: 13, fontFamily: fontFamily.semiBold },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  checkText: { fontSize: 13 },
  addBtn: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnOff: { opacity: 0.4 },
  addBtnText: { color: '#FFFFFF', fontFamily: fontFamily.bold, fontSize: 15 },
  billHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  billTitle: { fontSize: 17, fontFamily: fontFamily.semiBold },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  clear: { fontSize: 12.5, fontFamily: fontFamily.semiBold },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 16, fontFamily: fontFamily.bold, marginBottom: 4 },
  emptyBill: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  itemCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: { fontSize: 14, fontFamily: fontFamily.semiBold },
  itemSub: { fontSize: 11, marginTop: 3 },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: spacing.sm,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAmtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  amtSubLabel: { fontSize: 10, fontFamily: fontFamily.medium },
  amtSubVal: { fontSize: 12, fontFamily: fontFamily.semiBold, marginTop: 1 },
  amtTotalVal: { fontSize: 15, fontFamily: fontFamily.extraBold },
  fixedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  fixedBadgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
  },
  totalsCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 13, fontFamily: fontFamily.semiBold },
  grandTotalDivider: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    marginBottom: 0,
  },
  grandLabel: { fontSize: 14, fontFamily: fontFamily.bold },
  grandValue: { fontSize: 20, fontFamily: fontFamily.extraBold },
  card: { marginBottom: spacing.lg },
  cardTitle: { fontSize: 14, fontFamily: fontFamily.semiBold },
  hint: { fontSize: 12, marginTop: 4, marginBottom: spacing.sm, lineHeight: 17 },
  advice: { fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  adviceWarn: { color: colors.warn },
  adviceOk: { color: colors.income },
  cutRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1 },
  cutName: { fontSize: 13, fontFamily: fontFamily.semiBold },
  cutMeta: { fontSize: 12, marginTop: 2 },
  strategyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent + '1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  strategyBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent,
  },
  adviceWrap: {
    marginTop: spacing.sm,
    gap: 6,
  },
  strategyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  strategyBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  modalBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
});
