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
import { useAuthStore, useMedicineStore } from '../../src/store';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
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
  Bell,
  Plus,
  Camera,
  FileText,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  Download,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayLogs, adherence, markDose, fetchMedicines, fetchTodayLogs, fetchAdherence, isLoading } = useMedicineStore();

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

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const nextUpcomingDose = todayLogs.find((l) => l.status === 'PENDING');

  const handleTake = (id: string) => {
    markDose(id, 'TAKEN');
  };

  const handleSkip = (id: string) => {
    markDose(id, 'SKIPPED');
  };

  const userName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Patient';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {userName} 👋</Text>
          <View style={styles.dateRow}>
            <Calendar size={14} color={palette.slate500} />
            <Text style={styles.dateText}>{todayDateFormatted}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notificationBtn}
          activeOpacity={0.7}
          onPress={() => setShowExportPdfModal(true)}
        >
          <Download size={20} color={palette.teal700} />
        </TouchableOpacity>
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
              <Text style={styles.upcomingTitle}>Upcoming Medication</Text>
              <Text style={styles.upcomingDetails}>
                {nextUpcomingDose.medicineName} ({nextUpcomingDose.dose}) at{' '}
                <Text style={{ fontWeight: '700' }}>{nextUpcomingDose.scheduledTime}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Adherence Card */}
        <Card style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.sectionTitle}>Medication Adherence</Text>
            <Badge label="Active Goal: 90%+" status="PRIMARY" size="sm" />
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
            <Text style={styles.quickActionLabel}>Add Med</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowScanRxModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.blue50 }]}>
              <Camera size={20} color={palette.blue600} />
            </View>
            <Text style={styles.quickActionLabel}>Scan Rx</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowAddReportModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: palette.success50 }]}>
              <FileText size={20} color={palette.success600} />
            </View>
            <Text style={styles.quickActionLabel}>Add Report</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Medicines Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/medicines')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.medicinesList}>
          {todayLogs.length === 0 ? (
            <Card style={styles.emptyScheduleCard}>
              <Text style={styles.emptyScheduleText}>No doses scheduled for today.</Text>
              <TouchableOpacity
                style={styles.addDoseBtn}
                onPress={() => setShowAddMedModal(true)}
              >
                <Text style={styles.addDoseBtnText}>+ Add Medication</Text>
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
          <Text style={styles.sectionHeading}>Recent Prescriptions</Text>
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
                <Text style={styles.doctorName}>Dr. Rahman, MD</Text>
                <Text style={styles.clinicName}>Apollo Heart & General Clinic</Text>
                <Text style={styles.diagnosisText}>Diagnosis: Hypertension & Acid Reflux</Text>
              </View>
              <Badge label="3 Meds" status="INFO" size="sm" />
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewDate}>Prescribed: Sept 5, 2026</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Recent Medical Reports Preview */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Lab Reports</Text>
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
                <Text style={styles.diagnosisText}>All vital markers within normal range</Text>
              </View>
              <Badge label="Verified" status="TAKEN" size="sm" />
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewDate}>Date: Sept 6, 2026</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Medical Safety Disclaimer Notice */}
        <View style={styles.disclaimerContainer}>
          <ShieldAlert size={18} color={palette.slate500} style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: '700' }}>Healthcare Disclaimer: </Text>
            Meditalk helps organize your medical records and reminders. It does not replace professional medical advice. Always follow your doctor's official prescription.
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
  greeting: {
    fontSize: typography.sizes.xl,
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
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.teal100,
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
