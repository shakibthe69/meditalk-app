import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Button, Input, Header } from '../../src/components';
import { Mail, CheckCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    // Simulate reset request
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reset Password" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={styles.iconCircle}>
                <CheckCircle size={48} color={palette.success600} />
              </View>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successText}>
                We've sent a password reset link to{' '}
                <Text style={{ fontWeight: '700', color: palette.slate900 }}>{email}</Text>. Follow the instructions in the email to securely reset your password.
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.xl }}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.instruction}>
                Enter your registered email address and we'll send you instructions to reset your password.
              </Text>

              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={20} color={palette.slate400} />}
              />

              <Button
                title="Send Reset Link"
                onPress={handleSubmit}
                loading={loading}
                size="lg"
                fullWidth
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  form: {
    marginTop: spacing.base,
  },
  instruction: {
    fontSize: typography.sizes.base,
    color: palette.slate600,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.success50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.sizes.base,
    color: palette.slate600,
    textAlign: 'center',
    lineHeight: 24,
  },
});
