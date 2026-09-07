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
import { Button, Input, Header } from '../../src/components';
import { User, Mail, Lock, Phone, Droplet, Shield } from 'lucide-react-native';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    const res = await register({
      fullName,
      email,
      password,
      phoneNumber,
      bloodGroup,
    });

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMessage(res.message || 'Registration failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Account"
        subtitle="Your private health repository"
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name *"
            placeholder="e.g. John Doe"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={20} color={palette.slate400} />}
          />

          <Input
            label="Email Address *"
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={palette.slate400} />}
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={palette.slate400} />}
          />

          {/* Blood Group Selector */}
          <View style={styles.bloodGroupSection}>
            <View style={styles.bloodGroupHeader}>
              <Droplet size={16} color={palette.teal600} />
              <Text style={styles.bloodGroupLabel}>Blood Group</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bloodGroupRow}
            >
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  onPress={() => setBloodGroup(bg)}
                  style={[
                    styles.bloodChip,
                    bloodGroup === bg && styles.bloodChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.bloodChipText,
                      bloodGroup === bg && styles.bloodChipTextSelected,
                    ]}
                  >
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Input
            label="Password *"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={palette.slate400} />}
          />

          <Input
            label="Confirm Password *"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={palette.slate400} />}
          />

          {/* Disclaimer / Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Shield size={12} color={palette.white} />}
            </View>
            <Text style={styles.termsText}>
              I agree that Meditalk is a health record & reminder tool, and does not replace medical advice.
            </Text>
          </TouchableOpacity>

          <Button
            title="Register & Continue"
            onPress={handleRegister}
            loading={isLoading}
            size="lg"
            fullWidth
            style={{ marginTop: spacing.md }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Log In</Text>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
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
  bloodGroupSection: {
    marginBottom: spacing.base,
  },
  bloodGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  bloodGroupLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate700,
  },
  bloodGroupRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bloodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.slate50,
  },
  bloodChipSelected: {
    borderColor: palette.teal600,
    backgroundColor: palette.teal600,
  },
  bloodChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate700,
  },
  bloodChipTextSelected: {
    color: palette.white,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: palette.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  termsText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
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
