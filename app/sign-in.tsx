import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Card from '../components/Card';
import ScreenGlow from '../components/ScreenGlow';
import { useAuth } from '../context/AuthContext';
import { colors, fontFamily, radius, spacing, typography } from '../constants/theme';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';

  const submit = async () => {
    setError(null);
    setBusy(true);
    const message = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    // On success the root layout swaps this screen out — nothing to do here.
    if (message) setError(message);
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGlow />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(500)} style={styles.brand}>
            <View style={styles.brandMark}>
              <Ionicons name="pulse" size={22} color={colors.ringCore} />
            </View>
            <Text style={typography.title}>Fin</Text>
            <Text style={styles.tagline}>Spots the transactions that don&apos;t look like you.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Card elevated>
              <Text style={styles.cardTitle}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                textContentType={isSignUp ? 'newPassword' : 'password'}
                style={styles.input}
                onSubmitEditing={canSubmit ? submit : undefined}
              />

              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={submit}
                disabled={!canSubmit}
              >
                <Text style={styles.submitBtnText}>
                  {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.switchMode}
                onPress={() => {
                  setMode(isSignUp ? 'signin' : 'signup');
                  setError(null);
                }}
              >
                <Text style={styles.switchModeText}>
                  {isSignUp ? 'Already have an account? Sign in' : "New here? Create an account"}
                </Text>
              </Pressable>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <Text style={styles.footnote}>
              Your transactions and learned spending profile are private to your account.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, flexGrow: 1, justifyContent: 'center', maxWidth: 460, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tagline: { ...typography.body, textAlign: 'center', marginTop: 6, fontSize: 13 },
  cardTitle: { fontSize: 17, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  errorText: { flex: 1, fontSize: 12.5, color: colors.danger, lineHeight: 17 },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.ringCore },
  switchMode: { marginTop: spacing.md, alignItems: 'center' },
  switchModeText: { fontSize: 12.5, fontFamily: fontFamily.semiBold, color: colors.accent },
  footnote: { ...typography.body, fontSize: 11.5, textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
});
