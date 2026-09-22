import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, useSettingsStore } from '../../src/store';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge, Header, ExportPdfModal } from '../../src/components';
import { voiceService } from '../../src/services/voice';
import {
  User,
  Calendar,
  Phone,
  ShieldAlert,
  FileDown,
  Stethoscope,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  Languages,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

const DEFAULT_EMERGENCY_CONTACT = '01701660169';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { language, voiceEnabled, t, setLanguage, setVoiceEnabled, toggleLanguage } = useSettingsStore();
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const showSafetyDisclaimer = () => {
    Alert.alert(
      language === 'bn' ? 'চিকিৎসা সংক্রান্ত সুরক্ষা ও দায়মুক্তি' : 'Medical Safety & Legal Disclaimer',
      language === 'bn'
        ? 'মেডিটক একটি ডিজিটাল স্বাস্থ্য রেকর্ড ও ওষুধ রিমাইন্ডার সহায়ক অ্যাপ্লিকেশন।\n\n' +
          '• মেডিটক লাইসেন্সপ্রাপ্ত স্বাস্থ্যসেবা প্রদানকারী নয়।\n' +
          '• ও সি আর এবং কৃত্রিম বুদ্ধিমত্তা দ্বারা সনাক্তকৃত তথ্য রোগীর মূল প্রেসক্রিপশনের সাথে মিলিয়ে নিশ্চিত করা উচিত।\n' +
          '• জরুরি পরিস্থিতিতে নিকটস্থ হাসপাতাল অথবা চিকিৎসকের শরণাপন্ন হোন।'
        : 'Meditalk is a digital health record keeper, reminder system, and AI-assisted transcription tool.\n\n' +
          '• Meditalk is NOT a licensed healthcare provider.\n' +
          '• AI transcription must always be verified by the patient against the physical prescription.\n' +
          '• In case of emergency or severe symptoms, immediately contact your nearest hospital or emergency services.',
      [{ text: language === 'bn' ? 'বুঝেছি' : 'I Understand' }]
    );
  };

  const showSecurityInfo = () => {
    Alert.alert(
      language === 'bn' ? 'নিরাপত্তা ও গোপনীয়তা' : 'Security & Data Protection',
      language === 'bn'
        ? '• পাসওয়ার্ড সুরক্ষিত এনক্রিপশন (BCrypt)\n' +
          '• সিকিউর REST API ও JWT Bearer অথেনটিকেশন\n' +
          '• রোগীর প্রেসক্রিপশন ও তথ্য সুরক্ষিত ডাটাবেজে সংরক্ষিত'
        : '• Passwords hashed with BCrypt (12 rounds)\n' +
          '• REST APIs secured with JWT Bearer tokens\n' +
          '• Medical documents and prescription scans are securely stored and encrypted in transit\n' +
          '• Full data ownership belongs to the patient',
      [{ text: 'OK' }]
    );
  };

  const showReminderSettings = () => {
    Alert.alert(
      language === 'bn' ? 'ওষুধের রিমাইন্ডার ও নোটিফিকেশন' : 'Medicine Alarms & Notifications',
      language === 'bn'
        ? 'আপনার নির্ধারিত ওষুধের সময় অনুযায়ী সাউন্ড ও ভাইব্রেশনসহ প্রতিদিন স্বয়ংক্রিয় রিমাইন্ডার পাঠানো হয়।\n\nঅবস্থা: সক্রিয় ও কার্যকর'
        : 'Notifications are configured with sound, vibration, and persistent daily schedules matching your prescribed dosing times.\n\nStatus: ACTIVE & ENABLED',
      [{ text: language === 'bn' ? 'সম্পন্ন' : 'Done' }]
    );
  };

  const showDoctorsDirectory = () => {
    Alert.alert(
      language === 'bn' ? 'ডাক্তারদের ডিরেক্টরি' : 'My Doctors Directory',
      '1. Dr. S. M. Rahman, FCPS (Cardiology) - Apollo Heart Clinic\n' +
      '2. Dr. Sarah Jenkins, MD (General Medicine) - City Care Hospital',
      [{ text: language === 'bn' ? 'বন্ধ করুন' : 'Close' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={language === 'bn' ? 'প্রোফাইল ও সেটিংস' : 'Patient Profile'}
        subtitle={language === 'bn' ? 'ব্যক্তিগত তথ্য, ভাষা ও ভয়েস সেটিংস' : 'Personal medical identity & preferences'}
      />

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
                <Text style={styles.vitalLabel}>{language === 'bn' ? 'জন্মতারিখ' : 'Date of Birth'}</Text>
                <Text style={styles.vitalValue}>{user?.dateOfBirth || 'June 15, 1985'}</Text>
              </View>
            </View>

            <View style={styles.vitalItem}>
              <Phone size={14} color={palette.slate400} />
              <View>
                <Text style={styles.vitalLabel}>{language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}</Text>
                <Text style={styles.vitalValue}>
                  {user?.emergencyContactPhone || DEFAULT_EMERGENCY_CONTACT}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Section: Language & Voice Settings */}
        <Text style={styles.sectionHeader}>{language === 'bn' ? 'ভাষা ও ভয়েস নির্দেশনা' : 'Language & Voice Settings'}</Text>
        <Card style={styles.menuCard}>
          {/* Language Selection */}
          <View style={styles.settingRow}>
            <View style={[styles.menuIconCircle, { backgroundColor: palette.teal50 }]}>
              <Languages size={20} color={palette.teal700} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{t.language}</Text>
              <Text style={styles.menuSubtitle}>
                {language === 'en' ? 'English (বর্তমান: English)' : 'বাংলা (Current: Bengali)'}
              </Text>
            </View>
            <View style={styles.langPillContainer}>
              <TouchableOpacity
                style={[styles.langChoicePill, language === 'en' && styles.langChoicePillActive]}
                onPress={() => {
                  setLanguage('en');
                  voiceService.speak('Language set to English', 'en');
                }}
              >
                <Text style={[styles.langChoiceText, language === 'en' && styles.langChoiceTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langChoicePill, language === 'bn' && styles.langChoicePillActive]}
                onPress={() => {
                  setLanguage('bn');
                  voiceService.speak('ভাষা বাংলায় সেট করা হয়েছে', 'bn');
                }}
              >
                <Text style={[styles.langChoiceText, language === 'bn' && styles.langChoiceTextActive]}>বাংলা</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.menuDivider} />

          {/* Voice Narration Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.menuIconCircle, { backgroundColor: voiceEnabled ? palette.teal50 : palette.slate100 }]}>
              {voiceEnabled ? (
                <Volume2 size={20} color={palette.teal700} />
              ) : (
                <VolumeX size={20} color={palette.slate500} />
              )}
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{t.voiceNarration}</Text>
              <Text style={styles.menuSubtitle}>
                {voiceEnabled
                  ? (language === 'bn' ? 'ধাপে ধাপে অডিও নির্দেশনা চালু' : 'Step-by-step audio narration active')
                  : (language === 'bn' ? 'ভয়েস নির্দেশনা বন্ধ' : 'Narration is muted')}
              </Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={(val) => {
                setVoiceEnabled(val);
                if (val) {
                  voiceService.speak(
                    language === 'bn' ? 'ভয়েস নির্দেশনা চালু করা হয়েছে' : 'Voice narration enabled',
                    language
                  );
                }
              }}
              trackColor={{ false: palette.slate300, true: palette.teal500 }}
              thumbColor={palette.white}
            />
          </View>
        </Card>

        {/* Section: Medical Records Tools */}
        <Text style={styles.sectionHeader}>{language === 'bn' ? 'রেকর্ড ও এক্সপোর্ট' : 'Medical Records & Export'}</Text>
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
              <Text style={styles.menuTitle}>{t.exportPdf}</Text>
              <Text style={styles.menuSubtitle}>
                {language === 'bn' ? 'সম্পূর্ণ প্রেসক্রিপশন ও রিপোর্ট ডাউনলোড' : 'Compile complete history, prescriptions & reports'}
              </Text>
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
              <Text style={styles.menuTitle}>{language === 'bn' ? 'ডাক্তারদের ডিরেক্টরি' : 'My Doctors Directory'}</Text>
              <Text style={styles.menuSubtitle}>
                {language === 'bn' ? 'চিকিৎসকদের চেম্বার ও সময়সূচি' : 'Manage physician contacts and chamber timings'}
              </Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </Card>

        {/* Section: App Settings */}
        <Text style={styles.sectionHeader}>{language === 'bn' ? 'নিরাপত্তা ও সেটিংস' : 'Preferences & Safety'}</Text>
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
              <Text style={styles.menuTitle}>{language === 'bn' ? 'রিমাইন্ডার নোটিফিকেশন' : 'Reminder Notifications'}</Text>
              <Text style={styles.menuSubtitle}>{language === 'bn' ? 'সাউন্ড ও অ্যালার্ম শিডিউল' : 'Sound, vibration and recurring alarms'}</Text>
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
              <Text style={styles.menuTitle}>{language === 'bn' ? 'নিরাপত্তা ও গোপনীয়তা' : 'Security & Privacy'}</Text>
              <Text style={styles.menuSubtitle}>{language === 'bn' ? 'এনক্রিপ্টেড ডাটা ও নিরাপদ লগইন' : 'Encrypted records & JWT token auth'}</Text>
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
              <Text style={styles.menuTitle}>{t.disclaimerTitle}</Text>
              <Text style={styles.menuSubtitle}>{language === 'bn' ? 'ব্যবহারবিধি ও চিকিৎসাগত নির্দেশিকা' : 'Medical advice & usage boundaries'}</Text>
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
          <Text style={styles.logoutBtnText}>
            {language === 'bn' ? 'লগআউট করুন' : 'Sign Out of Meditalk'}
          </Text>
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
    marginBottom: spacing.xs,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  langChoicePill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  langChoicePillActive: {
    backgroundColor: palette.teal600,
  },
  langChoiceText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate600,
  },
  langChoiceTextActive: {
    color: palette.white,
    fontWeight: '700',
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
