import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import ScreenGlow from '../components/ScreenGlow';
import { useAuth } from '../context/AuthContext';
import { colors, fontFamily, radius, spacing } from '../constants/theme';

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
    if (message) setError(message);
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#07090E', '#0C1814', '#07090E']} style={StyleSheet.absoluteFill} />
      <ScreenGlow />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Ionicons name="sparkles" size={22} color={colors.onAccent} />
            </View>
            <Text style={styles.brandName}>Fin</Text>
            <Text style={styles.tagline}>Books, cash-flow plots and GST — empty until you add a statement.</Text>
          </View>

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
                {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </Text>
            </Pressable>
          </Card>

          <Text style={styles.footnote}>Your books stay on this account. Nothing is generated for you.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandName: {
    fontSize: 34,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  cardTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  errorText: { flex: 1, fontSize: 12.5, color: colors.danger, lineHeight: 17 },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 14, fontFamily: fontFamily.extraBold, color: colors.onAccent },
  switchMode: { marginTop: spacing.md, alignItems: 'center' },
  switchModeText: { fontSize: 12.5, fontFamily: fontFamily.semiBold, color: colors.accent },
  footnote: { fontSize: 11.5, textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
});
