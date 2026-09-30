import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, useMedicineStore, useSettingsStore, useRealtimeStore } from '../../src/store';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { voiceService } from '../../src/services/voice';
import {
  Card,
  Badge,
  AdherenceRing,
  MedicineDoseCard,
  AddMedicineModal,
  MedicineDetailModal,
  AddPrescriptionModal,
  AddReportModal,
  ExportPdfModal,
  EmergencyModal,
  CallHistoryModal,
  NotificationBell,
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
  Siren,
  MessageCircle,
  Stethoscope,
  History,
} from 'lucide-react-native';

import { prescriptionApi, reportApi, doctorPortalApi } from '../../src/services/api';
import { Prescription, MedicalReport, DoctorPost } from '../../src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayLogs, adherence, markDose, fetchMedicines, fetchTodayLogs, fetchAdherence, isLoading } = useMedicineStore();
  const { language, voiceEnabled, t, toggleLanguage, toggleVoice } = useSettingsStore();

  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showScanRxModal, setShowScanRxModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  // Additive: medicine name tapped on a dose card opens general Medicine Details.
  const [infoMedicineName, setInfoMedicineName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentPrescription, setRecentPrescription] = useState<Prescription | null>(null);
  const [recentReport, setRecentReport] = useState<MedicalReport | null>(null);
  const [latestDoctorPost, setLatestDoctorPost] = useState<DoctorPost | null>(null);
  const [doctorPosts, setDoctorPosts] = useState<DoctorPost[]>([]);

  const loadDashboardData = async () => {
    try {
      const [_, __, ___, rxRes, repRes, postRes] = await Promise.allSettled([
        fetchMedicines(),
        fetchTodayLogs(),
        fetchAdherence(),
        prescriptionApi.getPrescriptions(),
        reportApi.getReports(),
        doctorPortalApi.getAllPosts(),
      ]);

      if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value) && rxRes.value.length > 0) {
        setRecentPrescription(rxRes.value[0]);
      }
      if (repRes.status === 'fulfilled' && Array.isArray(repRes.value) && repRes.value.length > 0) {
        setRecentReport(repRes.value[0]);
      }
      if (postRes.status === 'fulfilled' && Array.isArray(postRes.value)) {
        setDoctorPosts(postRes.value);
        if (postRes.value.length > 0) {
          setLatestDoctorPost(postRes.value[0]);
        }
      }
    } catch (err) {
      console.log('Error refreshing dashboard:', err);
    }
  };

  /** Find Doctors opens the dedicated full-screen directory, never the home tab. */
  const openDoctorDirectory = () => {
    voiceService.speak(
      language === 'bn' ? 'ডাক্তার তালিকা খোলা হচ্ছে' : 'Opening the doctors list',
      language
    );
    router.push('/doctors');
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
          <Text style={styles.greeting} numberOfLines={1}>
            {t.goodDay}, {userName} 👋
          </Text>
          <View style={styles.dateRow}>
            <Calendar size={13} color={palette.slate500} />
            <Text style={styles.dateText}>{todayDateFormatted}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification centre */}
          <NotificationBell />

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

        {/* Emergency Service Banner */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          activeOpacity={0.8}
          onPress={() => {
            voiceService.speak(
              language === 'bn' ? 'জরুরি সেবা খোলা হচ্ছে' : 'Opening emergency service',
              language
            );
            setShowEmergencyModal(true);
          }}
        >
          <View style={styles.emergencyIconCircle}>
            <Siren size={20} color={palette.white} />
          </View>
          <View style={styles.emergencyTextContainer}>
            <Text style={styles.emergencyTitle}>{t.emergencyAssistance}</Text>
            <Text style={styles.emergencySubtitle}>{t.emergencySubtitle}</Text>
          </View>
          <View style={styles.emergencyChevronWrap}>
            <ChevronRight size={18} color={palette.white} />
          </View>
        </TouchableOpacity>

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
            onPress={() => {
              voiceService.speak(
                language === 'bn' ? 'রিপোর্ট যোগ করার ফর্ম খোলা হয়েছে' : 'Add report form opened',
                language
              );
              setShowAddReportModal(true);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.success50 }]}>
              <FileText size={20} color={palette.success600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.addReport}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={openDoctorDirectory}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.blue50 }]}>
              <Stethoscope size={20} color={palette.blue600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.findDoctors}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowEmergencyModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.danger50 }]}>
              <Siren size={20} color={palette.danger600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.emergencyAssistance}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              voiceService.speak(
                language === 'bn' ? 'স্বাস্থ্য চ্যাট খোলা হচ্ছে' : 'Opening health chat',
                language
              );
              router.push('/(tabs)/guide');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.teal50 }]}>
              <BookOpen size={20} color={palette.teal600} />
            </View>
            <Text style={styles.quickActionLabel}>{t.healthGuide}</Text>
          </TouchableOpacity>
        </View>

        {/* Find Doctors entry — the doctors list now lives ONLY on the Find Doctors page */}
        <TouchableOpacity activeOpacity={0.9} onPress={openDoctorDirectory}>
          <View style={styles.findDoctorsCard}>
            <View style={styles.findDoctorsIconCircle}>
              <Stethoscope size={22} color={palette.white} />
            </View>
            <View style={styles.findDoctorsText}>
              <Text style={styles.findDoctorsTitle}>{t.findDoctors}</Text>
              <Text style={styles.findDoctorsSubtitle}>
                {language === 'bn'
                  ? 'নিবন্ধিত ডাক্তারদের তালিকা দেখুন, চ্যাট করুন বা কল করুন'
                  : 'Browse the full doctors list, chat or call'}
              </Text>
            </View>
            <ChevronRight size={20} color={palette.teal600} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callsBtnFull}
          activeOpacity={0.8}
          onPress={() => setShowCallHistory(true)}
        >
          <History size={14} color={palette.teal700} />
          <Text style={styles.callsBtnText}>{t.calls}</Text>
        </TouchableOpacity>

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
                onShowInfo={(name) => setInfoMedicineName(name)}
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
                <Text style={styles.doctorName}>
                  {recentPrescription
                    ? (recentPrescription.doctorName ? (recentPrescription.doctorName.startsWith('Dr') ? recentPrescription.doctorName : `Dr. ${recentPrescription.doctorName}`) : 'Dr. Prescribing Physician')
                    : 'Dr. S. M. Rahman, FCPS'}
                </Text>
                <Text style={styles.clinicName}>
                  {recentPrescription?.hospitalOrClinic || 'Apollo Heart & General Clinic'}
                </Text>
                <Text style={styles.diagnosisText}>
                  {recentPrescription
                    ? (recentPrescription.diagnosis ? `${language === 'bn' ? 'রোগ নির্ণয়: ' : 'Diagnosis: '}${recentPrescription.diagnosis}` : (language === 'bn' ? 'প্রেসক্রিপশন সংরক্ষিত' : 'Prescription Recorded'))
                    : (language === 'bn' ? 'রোগ নির্ণয়: জ্বর ও এসিডিটি' : 'Diagnosis: Seasonal fever & hyperacidity')}
                </Text>
              </View>
              <Badge
                label={recentPrescription
                  ? `${recentPrescription.medicines?.length || 0} ${language === 'bn' ? 'টি ওষুধ' : 'Meds'}`
                  : (language === 'bn' ? '৩টি ওষুধ' : '3 Meds')}
                status="INFO"
                size="sm"
              />
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewDate}>
                {recentPrescription
                  ? `${language === 'bn' ? 'প্রেসক্রিপশন তারিখ: ' : 'Prescribed: '}${recentPrescription.prescriptionDate || recentPrescription.createdAt?.split('T')[0] || 'Recent'}`
                  : (language === 'bn' ? 'প্রেসক্রিপশন তারিখ: ৫ সেপ্টেম্বর ২০২৬' : 'Prescribed: Sept 5, 2026')}
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
                <Text style={styles.doctorName}>
                  {recentReport?.title || 'Complete Blood Count (CBC)'}
                </Text>
                <Text style={styles.clinicName}>
                  {recentReport?.hospitalOrLab || 'National Diagnostic Laboratory'}
                </Text>
                <Text style={styles.diagnosisText}>
                  {recentReport?.notes || (language === 'bn' ? 'সকল প্যারামিটার স্বাভাবিক রয়েছে' : 'All vital markers within normal range')}
                </Text>
              </View>
              <Badge
                label={recentReport?.type || (language === 'bn' ? 'যাচাইকৃত' : 'Verified')}
                status="TAKEN"
                size="sm"
              />
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewDate}>
                {recentReport
                  ? `${language === 'bn' ? 'তারিখ: ' : 'Date: '}${recentReport.testDate || recentReport.createdAt?.split('T')[0] || 'Recent'}`
                  : (language === 'bn' ? 'তারিখ: ৬ সেপ্টেম্বর ২০২৬' : 'Date: Sept 6, 2026')}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Doctor Updates & Health Newsfeed */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{language === 'bn' ? 'ডাক্তারদের স্বাস্থ্য নিউজফিড' : 'Doctor Health Newsfeed'}</Text>
          <TouchableOpacity onPress={() => router.push('/doctor-posts')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.seeAllText}>{language === 'bn' ? 'সকল আপডেট দেখুন' : 'See All News'}</Text>
            <ChevronRight size={14} color={palette.teal600} />
          </TouchableOpacity>
        </View>

        {doctorPosts.length === 0 ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/doctor-posts')}>
            <Card style={styles.previewCard}>
              <View style={styles.previewRow}>
                <View style={styles.previewLeft}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {latestDoctorPost?.title || (language === 'bn' ? 'স্বাস্থ্য টিপস ও নোটিশ' : 'Seasonal Health Tips & Awareness')}
                  </Text>
                  <Text style={styles.clinicName} numberOfLines={1}>
                    {latestDoctorPost
                      ? `Dr. ${latestDoctorPost.doctorName || ''} · ${latestDoctorPost.doctorSpecialization || ''}`
                      : (language === 'bn' ? 'ডাঃ এস. এম. রহমান · মেডিসিন বিশেষজ্ঞ' : 'Dr. S. M. Rahman · Internal Medicine')}
                  </Text>
                  <Text style={styles.diagnosisText} numberOfLines={2}>
                    {latestDoctorPost?.body || (language === 'bn' ? 'নিয়মিত পানি পান করুন এবং যেকোনো স্বাস্থ্য সমস্যায় অভিজ্ঞ ডাক্তারের পরামর্শ নিন।' : 'Drink plenty of water and consult your doctor for seasonal viral symptoms.')}
                  </Text>
                </View>
                <Badge label={latestDoctorPost?.category?.replace('_', ' ') || 'HEALTH TIP'} status="PRIMARY" size="sm" />
              </View>
            </Card>
          </TouchableOpacity>
        ) : (
          doctorPosts.slice(0, 3).map((post) => (
            <TouchableOpacity key={post.id} activeOpacity={0.9} onPress={() => router.push('/doctor-posts')}>
              <Card style={styles.newsfeedCard}>
                <View style={styles.newsfeedHeader}>
                  <View style={styles.newsfeedAvatar}>
                    <Stethoscope size={16} color={palette.teal700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newsfeedDocName} numberOfLines={1}>
                      {post.doctorName ? (post.doctorName.startsWith('Dr') ? post.doctorName : `Dr. ${post.doctorName}`) : 'Doctor'}
                    </Text>
                    <Text style={styles.newsfeedDocSpec} numberOfLines={1}>
                      {post.doctorSpecialization || (language === 'bn' ? 'চিকিৎসক' : 'Physician')}
                    </Text>
                  </View>
                  <Badge label={(post.category || 'HEALTH_TIP').replace('_', ' ')} status="PRIMARY" size="sm" />
                </View>

                <Text style={styles.newsfeedTitle}>{post.title}</Text>

                {post.imageUrl ? (
                  <View style={styles.newsfeedImageWrap}>
                    <Image source={{ uri: post.imageUrl }} style={styles.newsfeedImage} resizeMode="cover" />
                  </View>
                ) : null}

                <Text style={styles.newsfeedBody} numberOfLines={3}>
                  {post.body}
                </Text>

                <View style={styles.newsfeedFooter}>
                  <Text style={styles.newsfeedDate}>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </Text>
                  <View style={styles.newsfeedAction}>
                    <MessageCircle size={13} color={palette.teal700} />
                    <Text style={styles.newsfeedActionText}>{language === 'bn' ? 'পরামর্শ' : 'Consult'}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

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
      {/* Additive: general Medicine Details opened by tapping a medicine name */}
      <MedicineDetailModal
        visible={infoMedicineName !== null}
        medicineName={infoMedicineName}
        onClose={() => setInfoMedicineName(null)}
      />

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

      <EmergencyModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      <CallHistoryModal
        visible={showCallHistory}
        onClose={() => setShowCallHistory(false)}
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
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.danger600,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  emergencyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.white,
  },
  emergencySubtitle: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  emergencyChevronWrap: {
    marginLeft: spacing.sm,
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
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  quickActionBtn: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
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
  quickActionBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: palette.danger600,
    borderWidth: 1.5,
    borderColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.white,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  onlineCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.success50,
    borderWidth: 1,
    borderColor: palette.success100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  onlineCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.success500,
  },
  onlineCountText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: '700',
    color: palette.success700,
  },
  doctorLoadingCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.base,
  },
  doctorEmptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginBottom: spacing.base,
  },
  doctorEmptyText: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
  },
  doctorList: {
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  doctorCard: {
    marginBottom: 0,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doctorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  doctorFullName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: palette.success50,
    borderColor: palette.success100,
  },
  statusPillOffline: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate200,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  doctorSpec: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  doctorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  doctorMetaText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    flexShrink: 1,
  },
  doctorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  doctorChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.teal600,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  doctorChatText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.white,
  },
  doctorActionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.blue50,
    borderWidth: 1,
    borderColor: palette.blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  callsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  callsBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
  },
  callsBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    marginBottom: spacing.base,
  },
  findDoctorsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: palette.teal200,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  findDoctorsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  findDoctorsText: {
    flex: 1,
  },
  findDoctorsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.slate900,
  },
  findDoctorsSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
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
  newsfeedCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    padding: spacing.base,
  },
  newsfeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  newsfeedAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsfeedDocName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate900,
  },
  newsfeedDocSpec: {
    fontSize: typography.sizes.xs - 1,
    color: palette.slate500,
  },
  newsfeedTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  newsfeedImageWrap: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing.xs,
    backgroundColor: palette.slate100,
  },
  newsfeedImage: {
    width: '100%',
    height: '100%',
  },
  newsfeedBody: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    lineHeight: 20,
  },
  newsfeedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  newsfeedDate: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
  },
  newsfeedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  newsfeedActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
  },
});
