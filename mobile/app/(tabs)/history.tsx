import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import {
  Card,
  Badge,
  Header,
  AddReportModal,
  AddPrescriptionModal,
} from '../../src/components';
import { MedicalHistoryItem, HistoryCategory } from '../../src/types';
import { prescriptionApi } from '../../src/services/api/prescriptionApi';
import { reportApi } from '../../src/services/api/reportApi';
import { medicineApi } from '../../src/services/api/medicineApi';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useMedicineStore } from '../../src/store/useMedicineStore';
import {
  Search,
  Calendar,
  Stethoscope,
  FileCheck,
  Activity,
  CheckCircle2,
  Plus,
  Trash2,
  Camera,
  FileText,
  AlertCircle,
} from 'lucide-react-native';

interface HistoryItemExtended extends MedicalHistoryItem {
  rawId?: string | number;
  dbType?: 'PRESCRIPTION' | 'REPORT' | 'MEDICINE' | 'DEMO';
}

const DEFAULT_HISTORY: HistoryItemExtended[] = [
  {
    id: 'demo_1',
    dbType: 'DEMO',
    category: 'MEDICINE',
    title: 'Treatment Completed',
    subtitle: 'Napa 500mg (10 days course)',
    date: 'Sept 12, 2026',
    doctorName: 'Dr. Rahman, MD',
    details: 'Completed short-term fever relief medication protocol.',
    badgeLabel: 'Completed',
    badgeType: 'success',
  },
  {
    id: 'demo_2',
    dbType: 'DEMO',
    category: 'REPORT',
    title: 'Complete Blood Count (CBC)',
    subtitle: 'National Diagnostic Lab',
    date: 'Sept 6, 2026',
    doctorName: 'Dr. Rahman, MD',
    details: 'WBC, RBC, Platelet levels and Hemoglobin checked within standard baseline.',
    badgeLabel: 'Verified Report',
    badgeType: 'info',
  },
  {
    id: 'demo_3',
    dbType: 'DEMO',
    category: 'PRESCRIPTION',
    title: 'Prescription Digitalized',
    subtitle: '3 medicines prescribed',
    date: 'Sept 5, 2026',
    doctorName: 'Dr. Rahman, MD',
    facilityName: 'Apollo Heart & General Clinic',
    details: 'Omeprazole 20mg, Napa 500mg, Rosuvastatin 10mg.',
    badgeLabel: 'Prescription',
    badgeType: 'info',
  },
];

export default function HistoryScreen() {
  const { language, t } = useSettingsStore();
  const [historyItems, setHistoryItems] = useState<HistoryItemExtended[]>(DEFAULT_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HistoryCategory>('ALL');
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showScanRxModal, setShowScanRxModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const [rxRes, reportRes, medRes] = await Promise.allSettled([
        prescriptionApi.getPrescriptions(),
        reportApi.getReports(),
        medicineApi.getMedicines(),
      ]);

      const liveItems: HistoryItemExtended[] = [];

      // Lifetime medication record: every medicine ever added, active or finished.
      if (medRes.status === 'fulfilled' && Array.isArray(medRes.value)) {
        medRes.value.forEach((med: any) => {
          const times = (med.schedules || [])
            .map((s: any) => s?.time)
            .filter(Boolean)
            .join(', ');
          const scheduleInfo = times
            ? `${language === 'bn' ? 'রিমাইন্ডার: ' : 'Reminder times: '}${times}`
            : '';
          const frequency = med.frequency
            ? `${language === 'bn' ? 'সেবন: ' : 'Frequency: '}${String(med.frequency).replace(/_/g, ' ')}`
            : '';
          const details = [scheduleInfo, frequency, med.instructions]
            .filter(Boolean)
            .join(' · ');

          liveItems.push({
            id: `med_${med.id}`,
            rawId: med.id,
            dbType: 'MEDICINE',
            category: 'MEDICINE',
            title: `${med.name}${med.dose ? ` ${med.dose}` : ''}`,
            subtitle:
              med.genericName ||
              (language === 'bn' ? 'ওষুধের রেকর্ড' : 'Medication record'),
            date: med.startDate || med.createdAt?.split('T')[0] || '—',
            details: details || undefined,
            badgeLabel: med.isActive
              ? language === 'bn'
                ? 'সক্রিয় চলছে'
                : 'Active course'
              : language === 'bn'
                ? 'কোর্স সম্পন্ন'
                : 'Course finished',
            badgeType: med.isActive ? 'success' : 'info',
          });
        });
      }

      if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value)) {
        rxRes.value.forEach((rx: any) => {
          const medCount = rx.medicines?.length || 0;
          const medSummary = rx.medicines?.map((m: any) => `${m.name} ${m.dose || ''}`).join(', ');

          liveItems.push({
            id: `rx_${rx.id}`,
            rawId: rx.id,
            dbType: 'PRESCRIPTION',
            category: 'PRESCRIPTION',
            title: rx.diagnosis ? `Prescription: ${rx.diagnosis}` : (language === 'bn' ? 'প্রেসক্রিপশন রেকর্ড' : 'Prescription Record'),
            subtitle: rx.doctorName ? (language === 'bn' ? `ডাঃ ${rx.doctorName}` : `Dr. ${rx.doctorName}`) : (language === 'bn' ? 'চিকিৎসক প্রেসক্রিপশন' : 'Prescribed Record'),
            date: rx.prescriptionDate || rx.createdAt?.split('T')[0] || 'Recent',
            doctorName: rx.doctorName,
            facilityName: rx.hospitalOrClinic,
            details: medSummary || rx.notes || (language === 'bn' ? `${medCount} টি ওষুধ অন্তর্ভুক্ত` : `${medCount} medications included.`),
            badgeLabel: language === 'bn' ? 'প্রেসক্রিপশন' : 'Prescription',
            badgeType: 'info',
          });
        });
      }

      if (reportRes.status === 'fulfilled' && Array.isArray(reportRes.value)) {
        reportRes.value.forEach((rep: any) => {
          liveItems.push({
            id: `rep_${rep.id}`,
            rawId: rep.id,
            dbType: 'REPORT',
            category: 'REPORT',
            title: rep.title || (language === 'bn' ? 'মেডিকেল টেস্ট রিপোর্ট' : 'Medical Test Report'),
            subtitle: rep.hospitalOrLab || (language === 'bn' ? 'ডায়াগনস্টিক ল্যাব' : 'Diagnostic Lab'),
            date: rep.testDate || rep.createdAt?.split('T')[0] || 'Recent',
            doctorName: rep.doctorName,
            details: rep.notes || (language === 'bn' ? `রিপোর্ট টাইপ: ${rep.type}` : `Report Type: ${rep.type}`),
            badgeLabel: rep.type || (language === 'bn' ? 'রিপোর্ট' : 'Report'),
            badgeType: 'success',
          });
        });
      }

      // If user has created records, prioritize them
      if (liveItems.length > 0) {
        setHistoryItems(liveItems);
      } else {
        setHistoryItems(DEFAULT_HISTORY);
      }
    } catch (err) {
      console.log('Error fetching history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [language]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDeleteItem = async (item: HistoryItemExtended) => {
    if (item.dbType === 'DEMO') {
      setHistoryItems((prev) => prev.filter((i) => i.id !== item.id));
      return;
    }

    const confirmDelete = async () => {
      try {
        setDeletingId(item.id);
        if (item.dbType === 'PRESCRIPTION' && item.rawId) {
          await prescriptionApi.deletePrescription(String(item.rawId));
        } else if (item.dbType === 'REPORT' && item.rawId) {
          await reportApi.deleteReport(String(item.rawId));
        } else if (item.dbType === 'MEDICINE' && item.rawId) {
          // Goes through the store so the local reminder notifications are
          // cancelled together with the database record.
          await useMedicineStore.getState().deleteMedicine(String(item.rawId));
        }
        await loadHistory();
      } catch (err) {
        console.error('Delete error:', err);
        Alert.alert(
          language === 'bn' ? 'ত্রুটি' : 'Error',
          language === 'bn' ? 'রেকর্ড মুছে ফেলা যায়নি।' : 'Could not delete record from database.'
        );
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(
        language === 'bn'
          ? 'আপনি কি এই রেকর্ডটি ডেটাবেস থেকে মুছে ফেলতে নিশ্চিত?'
          : 'Are you sure you want to delete this record from the database?'
      );
      if (ok) {
        await confirmDelete();
      }
    } else {
      Alert.alert(
        language === 'bn' ? 'রেকর্ড মুছুন' : 'Delete Record',
        language === 'bn'
          ? 'আপনি কি এই রেকর্ডটি ডেটাবেস থেকে মুছে ফেলতে নিশ্চিত?'
          : 'Are you sure you want to delete this record from database?',
        [
          { text: language === 'bn' ? 'বাতিল' : 'Cancel', style: 'cancel' },
          { text: language === 'bn' ? 'মুছুন' : 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const filteredHistory = historyItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.doctorName && item.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'ALL') return matchesSearch;
    return matchesSearch && item.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DOCTOR_VISIT':
        return <Stethoscope size={18} color={palette.teal700} />;
      case 'REPORT':
        return <Activity size={18} color={palette.blue600} />;
      case 'PRESCRIPTION':
        return <FileCheck size={18} color={palette.teal600} />;
      case 'MEDICINE':
      default:
        return <CheckCircle2 size={18} color={palette.success600} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t.medicalHistory}
        subtitle={language === 'bn' ? 'আপনার সমস্ত প্রেসক্রিপশন ও রিপোর্টের রেকর্ড' : 'Chronological timeline of your health journey'}
        rightAction={
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.scanIconBtn}
              onPress={() => setShowScanRxModal(true)}
              activeOpacity={0.7}
              accessibilityLabel="Scan Prescription"
            >
              <Camera size={18} color={palette.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addIconBtn}
              onPress={() => setShowAddReportModal(true)}
              activeOpacity={0.7}
              accessibilityLabel="Add Medical Report"
            >
              <Plus size={20} color={palette.white} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color={palette.slate400} style={styles.searchIcon} />
          <TextInput
            placeholder={t.searchRecords}
            placeholderTextColor={palette.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            { key: 'ALL', label: t.allRecords },
            { key: 'PRESCRIPTION', label: t.prescriptions },
            { key: 'REPORT', label: t.labReports },
            { key: 'DOCTOR_VISIT', label: t.doctorVisits },
            { key: 'MEDICINE', label: t.allMedicines },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterPill,
                selectedCategory === cat.key && styles.filterPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.key as HistoryCategory)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === cat.key && styles.filterPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeline List */}
        <ScrollView
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.teal600} />
          }
        >
          {/* Month Group Header */}
          <View style={styles.monthHeader}>
            <Calendar size={14} color={palette.teal700} />
            <Text style={styles.monthHeaderText}>{t.timelineRecords}</Text>
          </View>

          {filteredHistory.length === 0 ? (
            <Card style={styles.emptyCard}>
              <AlertCircle size={32} color={palette.slate400} />
              <Text style={styles.emptyTitle}>
                {language === 'bn' ? 'কোন রেকর্ড পাওয়া যায়নি' : 'No Records Found'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'bn'
                  ? 'প্রেসক্রিপশন স্ক্যান করুন অথবা টেস্ট রিপোর্ট যোগ করুন।'
                  : 'Scan a prescription or upload a lab report to start tracking your health history.'}
              </Text>
            </Card>
          ) : (
            filteredHistory.map((item, index) => (
              <View key={item.id} style={styles.timelineItemWrapper}>
                {/* Timeline Connector Line */}
                <View style={styles.timelineLeftColumn}>
                  <View style={styles.iconBullet}>{getCategoryIcon(item.category)}</View>
                  {index < filteredHistory.length - 1 && (
                    <View style={styles.verticalLine} />
                  )}
                </View>

                {/* Timeline Card */}
                <Card style={styles.timelineCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleArea}>
                      <Text style={styles.dateLabel}>{item.date}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.cardTopRight}>
                      {item.badgeLabel && (
                        <Badge label={item.badgeLabel} status="PRIMARY" size="sm" />
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteItem(item)}
                        disabled={deletingId === item.id}
                        accessibilityLabel="Delete item"
                      >
                        <Trash2 size={16} color={palette.danger500} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {item.details && (
                    <Text style={styles.detailsText}>{item.details}</Text>
                  )}

                  {(item.doctorName || item.facilityName) && (
                    <View style={styles.doctorFooter}>
                      {item.doctorName ? (
                        <Text style={styles.doctorFooterText}>
                          {language === 'bn' ? 'চিকিৎসক:' : 'Physician:'}{' '}
                          <Text style={{ fontWeight: '600', color: palette.slate800 }}>{item.doctorName}</Text>
                        </Text>
                      ) : null}
                      {item.facilityName ? (
                        <Text style={styles.facilityFooterText}>
                          {item.facilityName}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </Card>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <AddReportModal
        visible={showAddReportModal}
        onClose={() => setShowAddReportModal(false)}
        onSuccess={loadHistory}
      />

      <AddPrescriptionModal
        visible={showScanRxModal}
        onClose={() => setShowScanRxModal(false)}
        onSuccess={loadHistory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  filterPillActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  filterPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  filterPillTextActive: {
    color: palette.white,
  },
  timelineContent: {
    paddingBottom: spacing['4xl'],
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.base,
  },
  monthHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
    textTransform: 'uppercase',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate800,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  timelineItemWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: spacing.sm,
  },
  iconBullet: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: palette.teal200,
    marginTop: spacing.xs,
    marginBottom: -spacing.xs,
  },
  timelineCard: {
    flex: 1,
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleArea: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: palette.danger50,
  },
  dateLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal700,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  detailsText: {
    fontSize: typography.sizes.sm,
    color: palette.slate700,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  doctorFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorFooterText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  facilityFooterText: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
  },
});
