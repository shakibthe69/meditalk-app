import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { authApi } from '../../src/services/api';
import { setAuthTokenHeader } from '../../src/services/api/apiClient';
import { Mail, Lock, HeartPulse, Sparkles, Stethoscope } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('john.doe@meditalk.com');
  const [password, setPassword] = useState('SecurePass123!');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    const res = await login({ email, password });
    if (res.success) {
      // Route by role: admins to the admin panel, doctors to their portal.
      const role = useAuthStore.getState().user?.role;
      if (role === 'ROLE_ADMIN') {
        router.replace('/(admin-tabs)');
      } else {
        router.replace(role === 'ROLE_DOCTOR' ? '/(doctor-tabs)' : '/(tabs)');
      }
    } else {
      setErrorMessage(res.message || 'Login failed.');
    }
  };

  const handleDemoFill = () => {
    setEmail('john.doe@meditalk.com');
    setPassword('SecurePass123!');
    setErrorMessage('');
  };

  const handleDoctorLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    try {
      const authRes = await authApi.loginDoctor({ email, password });
      setAuthTokenHeader(authRes.token);
      router.replace('/(doctor-tabs)');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        'Doctor login failed. Please check credentials.';
      setErrorMessage(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top-corner Doctor Portal Link */}
          <View style={styles.doctorPortalRow}>
            <TouchableOpacity
              style={styles.doctorPortalBtn}
              onPress={handleDoctorLogin}
              activeOpacity={0.7}
            >
              <Stethoscope size={14} color={palette.blue700} />
              <Text style={styles.doctorPortalText}>Doctor Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doctorPortalBtn, styles.doctorRegisterBtn]}
              onPress={() => router.push('/(auth)/register-doctor')}
              activeOpacity={0.7}
            >
              <Stethoscope size={14} color={palette.teal700} />
              <Text style={[styles.doctorPortalText, styles.doctorRegisterText]}>
                Doctor Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <HeartPulse size={28} color={palette.teal600} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your prescriptions and medication reminders.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Mail size={20} color={palette.slate400} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={palette.slate400} />}
            />

            <TouchableOpacity
              style={styles.forgotPassBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />

            {/* Quick Demo Autofill Button */}
            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={handleDemoFill}
            >
              <Sparkles size={16} color={palette.teal700} />
              <Text style={styles.demoFillText}>Quick Demo Credentials</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    justifyContent: 'space-between',
  },
  doctorPortalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  doctorPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.blue50,
    borderWidth: 1,
    borderColor: palette.blue100,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  doctorPortalText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.blue700,
  },
  doctorRegisterBtn: {
    backgroundColor: palette.teal50,
    borderColor: palette.teal200,
  },
  doctorRegisterText: {
    color: palette.teal700,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    marginTop: spacing.base,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: palette.teal100,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: palette.danger50,
    borderColor: palette.danger100,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  errorBannerText: {
    color: palette.danger600,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.base,
  },
  forgotPassText: {
    fontSize: typography.sizes.sm,
    color: palette.teal600,
    fontWeight: '600',
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  demoFillText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.teal800,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
  },
  footerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.teal600,
  },
});
