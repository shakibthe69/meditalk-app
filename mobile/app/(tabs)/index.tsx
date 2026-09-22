import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, useMedicineStore, useSettingsStore } from '../../src/store';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { voiceService } from '../../src/services/voice';
import {
  Card,
  Badge,
  AdherenceRing,
  MedicineDoseCard,
  AddMedicineModal,
  AddPrescriptionModal,
  AddReportModal,
  ExportPdfModal,
} from '../../src/components';
import {
  Plus,
  Camera,
  FileText,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  Download,
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayLogs, adherence, markDose, fetchMedicines, fetchTodayLogs, fetchAdherence, isLoading } = useMedicineStore();
  const { language, voiceEnabled, t, toggleLanguage, toggleVoice } = useSettingsStore();

  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showScanRxModal, setShowScanRxModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        fetchMedicines(),
        fetchTodayLogs(),
        fetchAdherence(),
      ]);
    } catch (err) {
      console.log('Error refreshing dashboard:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const todayDateFormatted = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const nextUpcomingDose = todayLogs.find((l) => l.status === 'PENDING');

  const handleTake = (id: string) => {
    markDose(id, 'TAKEN');
    voiceService.speakStep('TAKEN', language);
  };

  const handleSkip = (id: string) => {
    markDose(id, 'SKIPPED');
    voiceService.speakStep('SKIPPED', language);
  };

  const userName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || (language === 'bn' ? 'রোগী' : 'Patient');

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header with Controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {t.goodDay}, {userName} 👋
          </Text>
          <View style={styles.dateRow}>
            <Calendar size={13} color={palette.slate500} />
            <Text style={styles.dateText}>{todayDateFormatted}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Language Switcher */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              toggleLanguage();
              voiceService.speak(
                language === 'en' ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে' : 'Language changed to English',
                language === 'en' ? 'bn' : 'en'
              );
            }}
            activeOpacity={0.7}
          >
            <Languages size={15} color={palette.teal700} />
            <Text style={styles.headerLangText}>{language === 'en' ? 'বাংলা' : 'EN'}</Text>
          </TouchableOpacity>

          {/* Voice Narration Toggle */}
          <TouchableOpacity
            style={[styles.headerIconBtn, !voiceEnabled && styles.headerIconBtnDisabled]}
            onPress={() => {
              const nextState = !voiceEnabled;
              toggleVoice();
              if (nextState) {
                voiceService.speak(
                  language === 'bn' ? 'ভয়েস চালু হয়েছে' : 'Voice enabled',
                  language
                );
              }
            }}
            activeOpacity={0.7}
          >
            {voiceEnabled ? (
              <Volume2 size={16} color={palette.teal700} />
            ) : (
              <VolumeX size={16} color={palette.slate400} />
            )}
          </TouchableOpacity>

          {/* Export PDF Button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: palette.teal600, borderColor: palette.teal700 }]}
            activeOpacity={0.7}
            onPress={() => setShowExportPdfModal(true)}
          >
            <Download size={15} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.teal600} />
        }
      >
        {/* Next Upcoming Dose Alert Banner */}
        {nextUpcomingDose && (
          <View style={styles.upcomingBanner}>
            <View style={styles.upcomingIconCircle}>
              <Sparkles size={20} color={palette.teal600} />
            </View>
            <View style={styles.upcomingTextContainer}>
              <Text style={styles.upcomingTitle}>{t.upcomingMedication}</Text>
              <Text style={styles.upcomingDetails}>
                {nextUpcomingDose.medicineName} ({nextUpcomingDose.dose}) {t.at}{' '}
                <Text style={{ fontWeight: '700' }}>{nextUpcomingDose.scheduledTime}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Adherence Card */}
        <Card style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.sectionTitle}>{t.adherenceTitle}</Text>
            <Badge label={t.adherenceGoal} status="PRIMARY" size="sm" />
          </View>
          <AdherenceRing stats={adherence} size={105} strokeWidth={9} />
        </Card>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowAddMedModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.teal50 }]}>
              <Plus size={20} color={palette.teal700} />
            </View>
            <Text style={styles.quickActionLabel}>{t.addMed}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowScanRxModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.blue50 }]}>
              <Camera size={20} color={palette.blue600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.scanRx}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowAddReportModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.success50 }]}>
              <FileText size={20} color={palette.success600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.addReport}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(tabs)/guide')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.teal50 }]}>
              <BookOpen size={20} color={palette.teal600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.healthGuide}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Medicines Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t.todaySchedule}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/medicines')}>
            <Text style={styles.seeAllText}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.medicinesList}>
          {todayLogs.length === 0 ? (
            <Card style={styles.emptyScheduleCard}>
              <Text style={styles.emptyScheduleText}>{t.noDosesToday}</Text>
              <TouchableOpacity
                style={styles.addDoseBtn}
                onPress={() => setShowAddMedModal(true)}
              >
                <Text style={styles.addDoseBtnText}>{t.addMedicationBtn}</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            todayLogs.map((log) => (
              <MedicineDoseCard
                key={log.id}
                log={log}
                onTake={handleTake}
                onSkip={handleSkip}
              />
            ))
          )}
        </View>

        {/* Recent Prescriptions Preview */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t.recentPrescriptions}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/history')}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/history')}
        >
          <Card style={styles.previewCard}>
            <View style={styles.previewRow}>
              <View style={styles.previewLeft}>
                <Text style={styles.doctorName}>Dr. S. M. Rahman, FCPS</Text>
                <Text style={styles.clinicName}>Apollo Heart & General Clinic</Text>
                <Text style={styles.diagnosisText}>
                  {language === 'bn' ? 'রোগ নির্ণয়: জ্বর ও এসিডিটি' : 'Diagnosis: Seasonal fever & hyperacidity'}
                </Text>
              </View>
              <Badge label={language === 'bn' ? '৩টি ওষুধ' : '3 Meds'} status="INFO" size="sm" />
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewDate}>
                {language === 'bn' ? 'প্রেসক্রিপশন তারিখ: ৫ সেপ্টেম্বর ২০২৬' : 'Prescribed: Sept 5, 2026'}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Recent Medical Reports Preview */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t.recentReports}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/history')}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/history')}
        >
          <Card style={styles.previewCard}>
            <View style={styles.previewRow}>
              <View style={styles.previewLeft}>
                <Text style={styles.doctorName}>Complete Blood Count (CBC)</Text>
                <Text style={styles.clinicName}>National Diagnostic Laboratory</Text>
                <Text style={styles.diagnosisText}>
                  {language === 'bn' ? 'সকল প্যারামিটার স্বাভাবিক রয়েছে' : 'All vital markers within normal range'}
                </Text>
              </View>
              <Badge label={language === 'bn' ? 'যাচাইকৃত' : 'Verified'} status="TAKEN" size="sm" />
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewDate}>
                {language === 'bn' ? 'তারিখ: ৬ সেপ্টেম্বর ২০২৬' : 'Date: Sept 6, 2026'}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Medical Safety Disclaimer Notice */}
        <View style={styles.disclaimerContainer}>
          <ShieldAlert size={18} color={palette.slate500} style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: '700' }}>{t.disclaimerTitle} </Text>
            {t.disclaimerText}
          </Text>
        </View>
      </ScrollView>

      {/* Action Modals */}
      <AddMedicineModal
        visible={showAddMedModal}
        onClose={() => setShowAddMedModal(false)}
        onSuccess={loadDashboardData}
      />

      <AddPrescriptionModal
        visible={showScanRxModal}
        onClose={() => setShowScanRxModal(false)}
        onSuccess={loadDashboardData}
      />

      <AddReportModal
        visible={showAddReportModal}
        onClose={() => setShowAddReportModal(false)}
        onSuccess={loadDashboardData}
      />

      <ExportPdfModal
        visible={showExportPdfModal}
        onClose={() => setShowExportPdfModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'android' ? spacing.base : spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.sizes.lg + 1,
    fontWeight: '800',
    color: palette.slate900,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.teal100,
    gap: 4,
  },
  headerIconBtnDisabled: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate300,
  },
  headerLangText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  upcomingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  upcomingTextContainer: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upcomingDetails: {
    fontSize: typography.sizes.sm,
    color: palette.slate800,
    marginTop: 1,
  },
  adherenceCard: {
    marginBottom: spacing.base,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.slate200,
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate700,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate900,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.teal600,
  },
  medicinesList: {
    marginBottom: spacing.base,
  },
  emptyScheduleCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyScheduleText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    marginBottom: spacing.sm,
  },
  addDoseBtn: {
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  addDoseBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
  },
  previewCard: {
    marginBottom: spacing.base,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  doctorName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  clinicName: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  diagnosisText: {
    fontSize: typography.sizes.sm,
    color: palette.slate700,
    marginTop: spacing.xs,
  },
  previewFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  previewDate: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  disclaimerIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    lineHeight: 18,
  },
});
