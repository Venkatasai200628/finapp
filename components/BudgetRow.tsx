import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fontFamily, colors, radius, spacing } from '../constants/theme';
import { Budget } from '../data/mockData';

type Props = {
  budget: Budget;
  delay?: number;
  /** When provided, tapping the row opens an inline editor for the limit. */
  onChangeLimit?: (category: string, budgeted: number) => void;
};

export default function BudgetRow({ budget, delay = 0, onChangeLimit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(budget.budgeted));

  const pct = budget.spent / budget.budgeted;
  const isOver = pct > 1;
  const barColor = isOver ? colors.danger : pct > 0.85 ? colors.warn : budget.color;

  const save = () => {
    const value = Number(draft);
    if (onChangeLimit && Number.isFinite(value) && value > 0) onChangeLimit(budget.category, value);
    setEditing(false);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.category}>{budget.category}</Text>
        {editing ? (
          <View style={styles.editRow}>
            <Text style={styles.editPrefix}>₹</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              keyboardType="numeric"
              autoFocus
              style={styles.editInput}
              onSubmitEditing={save}
            />
            <Pressable onPress={save} hitSlop={6}>
              <Ionicons name="checkmark-circle" size={20} color={colors.good} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.amountsPressable}
            onPress={onChangeLimit ? () => { setDraft(String(budget.budgeted)); setEditing(true); } : undefined}
            hitSlop={4}
          >
            <Text style={[styles.amounts, isOver && styles.over]}>
              ₹{budget.spent.toLocaleString('en-IN')} <Text style={styles.of}>/ ₹{budget.budgeted.toLocaleString('en-IN')}</Text>
            </Text>
            {onChangeLimit && <Ionicons name="pencil" size={11} color={colors.textMuted} style={{ marginLeft: 4 }} />}
          </Pressable>
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct * 100)}%`, backgroundColor: barColor }]} />
      </View>
      {isOver && !editing && (
        <Text style={styles.overNote}>₹{(budget.spent - budget.budgeted).toLocaleString('en-IN')} over budget</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  amountsPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amounts: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  over: {
    color: colors.danger,
  },
  of: {
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editPrefix: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  editInput: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 1,
    minWidth: 60,
    textAlign: 'right',
  },
  track: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  overNote: {
    fontSize: 10.5,
    color: colors.danger,
    fontFamily: fontFamily.semiBold,
    marginTop: 4,
  },
});
