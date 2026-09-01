import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from '../components/Card';
import DetailHeader from '../components/DetailHeader';
import ScreenGlow from '../components/ScreenGlow';
import { parseTransactionSms } from '../lib/smsParser';
import { handleIncomingSms, isSmsCaptureSupported, startSmsCapture, SmsStatus } from '../lib/smsListener';
import { useAuth } from '../context/AuthContext';
import { colors, fontFamily, radius, spacing, typography } from '../constants/theme';

const SAMPLES = [
  {
    label: 'HDFC · UPI debit',
    body: 'Rs.450.00 debited from a/c XX1234 on 02-09-25 to VPA swiggy@ybl. Ref 123456789012.',
  },
  {
    label: 'SBI · large debit',
    body: 'Dear UPI user A/C X1234 debited by 18500.0 on date 02Sep25 trf to UNKNOWN STORE Refno 998877665544. -SBI',
  },
  {
    label: 'Salary credit',
    body: 'Dear Customer, INR 45,000.00 credited to your A/c No XX1234 on 02/09/2025 towards SALARY.',
  },
  {
    label: 'OTP (should be ignored)',
    body: '123456 is your OTP for a transaction of Rs.450 at SWIGGY. Do not share this with anyone.',
  },
];

export default function SmsTestScreen() {
  const { token } = useAuth();
  const [body, setBody] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState<SmsStatus | null>(null);

  // The native callback outlives this render, so it reads the token through
  // a ref rather than closing over a value that goes stale on re-login.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const parsed = body.trim() ? parseTransactionSms(body) : null;

  useEffect(() => {
    if (isSmsCaptureSupported()) {
      startSmsCapture(() => tokenRef.current, setCaptureStatus);
    } else {
      setCaptureStatus({
        state: 'unavailable',
        reason: 'Automatic capture needs an Android development build. Manual testing below works anywhere.',
      });
    }
  }, []);

  const send = async () => {
    setResult('Sending…');
    const outcome = await handleIncomingSms(token, body);
    setResult(outcome.detail);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenGlow />
      <DetailHeader title="SMS detection" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={styles.card}>
            <Text style={styles.groupLabel}>Automatic capture</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: captureStatus?.state === 'listening' ? colors.good : colors.warn },
                ]}
              />
              <Text style={styles.statusText}>
                {captureStatus?.state === 'listening'
                  ? 'Listening for incoming bank SMS'
                  : captureStatus?.state === 'needs-permission'
                    ? 'SMS permission was denied'
                    : captureStatus?.state === 'error'
                      ? captureStatus.reason
                      : (captureStatus?.state === 'unavailable' && captureStatus.reason) || 'Checking…'}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Card style={styles.card}>
            <Text style={typography.h3}>Paste a bank SMS</Text>
            <Text style={styles.hint}>
              Runs the exact same path a real incoming message takes — parse, score, alert.
            </Text>

            <View style={styles.sampleRow}>
              {SAMPLES.map((s) => (
                <Pressable
                  key={s.label}
                  style={styles.sampleChip}
                  onPress={() => {
                    setBody(s.body);
                    setResult(null);
                  }}
                >
                  <Text style={styles.sampleChipText}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={body}
              onChangeText={(t) => {
                setBody(t);
                setResult(null);
              }}
              placeholder="Rs.450.00 debited from a/c XX1234…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.input}
            />
          </Card>
        </Animated.View>

        {body.trim().length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={styles.card}>
              <Text style={typography.h3}>Parsed result</Text>
              {!parsed ? (
                <View style={styles.ignoredRow}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  <Text style={styles.hint}>Not a transaction — this message would be ignored.</Text>
                </View>
              ) : (
                <View style={{ marginTop: spacing.sm }}>
                  <Row label="Amount" value={`${parsed.amount < 0 ? '−' : '+'}₹${Math.abs(parsed.amount).toLocaleString('en-IN')}`} />
                  <Row label="Merchant" value={parsed.merchant} />
                  <Row label="Category" value={parsed.category} />
                  {parsed.accountHint && <Row label="Account" value={parsed.accountHint} />}
                  {parsed.reference && <Row label="Reference" value={parsed.reference} />}
                  <Row label="Confidence" value={`${Math.round(parsed.confidence * 100)}%`} />
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {parsed && (
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="paper-plane" size={14} color={colors.ringCore} />
            <Text style={styles.sendBtnText}>Send to engine</Text>
          </Pressable>
        )}

        {result && (
          <Animated.View entering={FadeInDown.duration(250)}>
            <Card style={[styles.card, { marginTop: spacing.lg }]}>
              <Text style={styles.hint}>{result}</Text>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.lg },
  groupLabel: {
    fontSize: 11,
    fontFamily: fontFamily.extraBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  hint: { ...typography.body, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  sampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  sampleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sampleChipText: { fontSize: 11.5, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  input: {
    marginTop: spacing.md,
    minHeight: 90,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  ignoredRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  detailLabel: { fontSize: 12.5, color: colors.textMuted },
  detailValue: { fontSize: 12.5, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 13,
  },
  sendBtnText: { fontSize: 13.5, fontFamily: fontFamily.extraBold, color: colors.ringCore },
});
