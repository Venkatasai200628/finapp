import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../constants/theme';
import { NewGoalInput } from '../context/GoalsContext';

const ICON_OPTIONS: Array<{ icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { icon: 'shield-checkmark', color: '#33D6A6' },
  { icon: 'airplane', color: '#FFB454' },
  { icon: 'laptop', color: '#5B8CFF' },
  { icon: 'home', color: '#8B6BFF' },
  { icon: 'car', color: '#FF6B6B' },
  { icon: 'school', color: '#33D6A6' },
];

export default function NewGoalCard({ onCreate }: { onCreate: (input: NewGoalInput) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [choice, setChoice] = useState(0);

  const reset = () => {
    setName('');
    setTarget('');
    setDate('');
    setChoice(0);
    setOpen(false);
  };

  const submit = () => {
    const targetAmount = Number(target);
    if (!name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) return;
    onCreate({ name, target: targetAmount, targetDate: date, icon: ICON_OPTIONS[choice].icon, color: ICON_OPTIONS[choice].color });
    reset();
  };

  if (!open) {
    return (
      <Pressable style={styles.addCard} onPress={() => setOpen(true)}>
        <Ionicons name="add-circle" size={22} color={colors.accent} />
        <Text style={styles.addText}>New goal</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.formCard}>
      <View style={styles.iconRow}>
        {ICON_OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.icon}
            onPress={() => setChoice(i)}
            style={[styles.iconChoice, { backgroundColor: opt.color + '22' }, choice === i && { borderColor: opt.color }]}
          >
            <Ionicons name={opt.icon} size={13} color={opt.color} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Goal name"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        value={target}
        onChangeText={setTarget}
        placeholder="Target ₹"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        value={date}
        onChangeText={setDate}
        placeholder="By when (e.g. Dec 2026)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <View style={styles.formActions}>
        <Pressable onPress={reset} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={submit} style={styles.createBtn}>
          <Text style={styles.createText}>Create</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addCard: {
    width: 150,
    minHeight: 150,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.accent,
  },
  formCard: {
    width: 190,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  iconChoice: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 34,
    color: colors.textPrimary,
    fontSize: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  cancelText: {
    fontSize: 11.5,
    fontFamily: fontFamily.semiBold,
    color: colors.textMuted,
  },
  createBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  createText: {
    fontSize: 11.5,
    fontFamily: fontFamily.extraBold,
    color: colors.ringCore,
  },
});
