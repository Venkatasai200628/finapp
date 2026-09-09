import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, fontFamily, radius, spacing } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      router.replace('/(tabs)/books');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/books';
      }
    }
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.body}>
              An unexpected render issue occurred. Your data is safe in storage.
            </Text>
            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <Pressable style={styles.secondaryBtn} onPress={this.handleReload}>
                <Text style={styles.secondaryBtnText}>Reload App</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={this.handleReset}>
                <Text style={styles.primaryBtnText}>Go to Books</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  errorBox: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: (colors as any).borderSubtle || colors.borderSoft || colors.border,
  },
  errorText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.danger,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.onAccent,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
});
