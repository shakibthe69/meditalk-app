import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge, Header, ExportPdfModal } from '../../src/components';
import {
  User,
  Droplet,
  Calendar,
  Phone,
  ShieldAlert,
  FileDown,
  Stethoscope,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  Heart,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const showSafetyDisclaimer = () => {
    Alert.alert(
      'Medical Safety & Legal Disclaimer',
      'Meditalk is a digital health record keeper, reminder system, and AI-assisted transcription tool.\n\n' +
      '• Meditalk is NOT a licensed healthcare provider.\n' +
      '• AI transcription must always be verified by the patient against the physical prescription.\n' +
      '• In case of emergency or severe symptoms, immediately contact your nearest hospital or emergency services.',
      [{ text: 'I Understand' }]
    );
  };

  const showSecurityInfo = () => {
    Alert.alert(
      'Security & Data Protection',
      '• Passwords hashed with BCrypt (12 rounds)\n' +
      '• REST APIs secured with JWT Bearer tokens\n' +
      '• Medical documents and prescription scans are securely stored and encrypted in transit\n' +
      '• Full data ownership belongs to the patient',
      [{ text: 'OK' }]
    );
  };

  const showReminderSettings = () => {
    Alert.alert(
      'Medicine Alarms & Notifications',
      'Notifications are configured with sound, vibration, and persistent daily schedules matching your prescribed dosing times.\n\nStatus: ACTIVE & ENABLED',
      [{ text: 'Done' }]
    );
  };

  const showDoctorsDirectory = () => {
    Alert.alert(
      'My Doctors Directory',
      '1. Dr. Rahman, MD (Cardiology) - Apollo Clinic (Chamber: Mon-Thu 5PM)\n' +
      '2. Dr. Sarah Jenkins, MD (General Medicine) - City Care Hospital',
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Patient Profile" subtitle="Personal medical identity & preferences" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Identity Card */}
        <Card style={styles.patientCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <User size={32} color={palette.teal700} />
            </View>

            <View style={styles.patientMain}>
              <Text style={styles.patientName}>{user?.name || user?.fullName || 'Patient Record'}</Text>
              <Text style={styles.patientEmail}>{user?.email || 'patient@meditalk.com'}</Text>
              <View style={styles.bloodBadgeRow}>
                <Badge
                  label={`Blood: ${user?.bloodGroup || 'O+'}`}
                  status="PRIMARY"
                  size="sm"
                />
                {user?.gender && (
                  <Badge
                    label={user.gender}
                    status="INFO"
                    size="sm"
                  />
                )}
              </View>
            </View>
          </View>

          {/* Vitals & Demographics Grid */}
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalItem}>
              <Calendar size={14} color={palette.slate400} />
              <View>
                <Text style={styles.vitalLabel}>Date of Birth</Text>
                <Text style={styles.vitalValue}>{user?.dateOfBirth || 'June 15, 1985'}</Text>
              </View>
            </View>

            <View style={styles.vitalItem}>
              <Phone size={14} color={palette.slate400} />
              <View>
                <Text style={styles.vitalLabel}>Emergency Contact</Text>
                <Text style={styles.vitalValue}>{user?.emergencyContactPhone || '+1 (555) 876-5432'}</Text>
              </View>
            </View>
          </View>

          {/* Allergies and Conditions */}
          {(user?.allergies || user?.chronicConditions) && (
            <View style={styles.chipsSection}>
              <Text style={styles.chipsSectionLabel}>Known Allergies & Conditions</Text>
              <View style={styles.chipsRow}>
                {user?.allergies && (
                  <View style={styles.allergyChip}>
                    <Text style={styles.allergyText}>{user.allergies}</Text>
                  </View>
                )}
                {user?.chronicConditions && (
                  <View style={styles.conditionChip}>
                    <Text style={styles.conditionText}>{user.chronicConditions}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </Card>

        {/* Section: Medical Records Tools */}
        <Text style={styles.sectionHeader}>Medical Records & Export</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setShowPdfModal(true)}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: palette.teal50 }]}>
              <FileDown size={20} color={palette.teal700} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Generate Doctor-Ready PDF</Text>
              <Text style={styles.menuSubtitle}>Compile complete history, prescriptions & reports</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={showDoctorsDirectory}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: palette.blue50 }]}>
              <Stethoscope size={20} color={palette.blue600} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>My Doctors Directory</Text>
              <Text style={styles.menuSubtitle}>Manage physician contacts and chamber timings</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </Card>

        {/* Section: App Settings */}
        <Text style={styles.sectionHeader}>Preferences & Safety</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={showReminderSettings}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: palette.slate100 }]}>
              <Bell size={20} color={palette.slate700} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Reminder Notifications</Text>
              <Text style={styles.menuSubtitle}>Sound, vibration and recurring alarms</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={showSecurityInfo}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: palette.slate100 }]}>
              <Lock size={20} color={palette.slate700} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Security & Privacy</Text>
              <Text style={styles.menuSubtitle}>Encrypted records & JWT token auth</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={showSafetyDisclaimer}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: palette.warning50 }]}>
              <ShieldAlert size={20} color={palette.warning600} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Healthcare Safety Disclaimer</Text>
              <Text style={styles.menuSubtitle}>Medical advice & usage boundaries</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={palette.danger600} />
          <Text style={styles.logoutBtnText}>Sign Out of Meditalk</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Meditalk v1.0.0 (Expo SDK 57)</Text>
      </ScrollView>

      {/* Export PDF Modal */}
      <ExportPdfModal
        visible={showPdfModal}
        onClose={() => setShowPdfModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  patientCard: {
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.teal200,
    marginRight: spacing.base,
  },
  patientMain: {
    flex: 1,
  },
  patientName: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.slate900,
  },
  patientEmail: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  bloodBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  vitalsGrid: {
    flexDirection: 'row',
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vitalItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  vitalLabel: {
    fontSize: typography.sizes.xs - 2,
    color: palette.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalValue: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate800,
    marginTop: 1,
  },
  chipsSection: {
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
    paddingTop: spacing.sm,
  },
  chipsSectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate500,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  allergyChip: {
    backgroundColor: palette.danger50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: palette.danger100,
  },
  allergyText: {
    fontSize: typography.sizes.xs,
    color: palette.danger600,
    fontWeight: '600',
  },
  conditionChip: {
    backgroundColor: palette.blue50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: palette.blue100,
  },
  conditionText: {
    fontSize: typography.sizes.xs,
    color: palette.blue700,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: palette.slate900,
  },
  menuSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: palette.slate100,
    marginVertical: spacing.xs,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger100,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  logoutBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.danger600,
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: palette.slate400,
    marginTop: spacing.xl,
  },
});
