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
import { Stethoscope, Mail, Lock, Phone, Hospital, Hash, Clock, Building2 } from 'lucide-react-native';

export default function DoctorRegisterScreen() {
  const router = useRouter();
  const { registerDoctor, isLoading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('');
  const [chamberAddress, setChamberAddress] = useState('');
  const [visitingHours, setVisitingHours] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password.trim() || !specialization.trim() || !licenseNumber.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const res = await registerDoctor({
      fullName,
      email,
      password,
      specialization,
      licenseNumber,
      hospitalOrClinic,
      phoneNumber,
      chamberAddress,
      visitingHours,
    });

    if (res.success) {
      router.replace('/(doctor-tabs)');
    } else {
      setErrorMessage(res.message || 'Doctor registration failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Doctor Registration"
        subtitle="Join MediTalk to reach your patients online"
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
            placeholder="e.g. Dr. Ayesha Rahman"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<Stethoscope size={20} color={palette.slate400} />}
          />

          <Input
            label="Email Address *"
            placeholder="doctor@example.com"
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

          <Input
            label="Specialization *"
            placeholder="e.g. Cardiology & Internal Medicine"
            value={specialization}
            onChangeText={setSpecialization}
            leftIcon={<Stethoscope size={20} color={palette.slate400} />}
          />

          <Input
            label="Medical License Number *"
            placeholder="e.g. BD-MED-2019-4482"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            autoCapitalize="characters"
            leftIcon={<Hash size={20} color={palette.slate400} />}
          />

          <Input
            label="Hospital / Clinic"
            placeholder="e.g. Apollo Heart & General Clinic"
            value={hospitalOrClinic}
            onChangeText={setHospitalOrClinic}
            leftIcon={<Hospital size={20} color={palette.slate400} />}
          />

          <Input
            label="Chamber Address"
            placeholder="Suite 402, Medical Center Tower"
            value={chamberAddress}
            onChangeText={setChamberAddress}
            leftIcon={<Building2 size={20} color={palette.slate400} />}
          />

          <Input
            label="Visiting Hours"
            placeholder="Mon - Fri (04:00 PM - 08:00 PM)"
            value={visitingHours}
            onChangeText={setVisitingHours}
            leftIcon={<Clock size={20} color={palette.slate400} />}
          />

          <Input
            label="Password *"
            placeholder="At least 6 characters"
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

          <Button
            title="Register as Doctor"
            onPress={handleRegister}
            loading={isLoading}
            size="lg"
            fullWidth
            style={{ marginTop: spacing.md }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already registered? </Text>
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
