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
import {
  Search,
  Calendar,
  Stethoscope,
  FileCheck,
  Activity,
  CheckCircle2,
  Plus,
  FileText,
  Filter,
} from 'lucide-react-native';

const DEFAULT_HISTORY: MedicalHistoryItem[] = [
  {
    id: 'hist_1',
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
    id: 'hist_2',
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
    id: 'hist_3',
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
  {
    id: 'hist_4',
    category: 'DOCTOR_VISIT',
    title: 'Consultation & Diagnosis',
    subtitle: 'Dr. Rahman, MD (Cardiologist)',
    date: 'Sept 5, 2026',
    facilityName: 'Apollo Heart & General Clinic',
    details: 'Diagnosis: Seasonal fever with mild hypertension. Blood test advised.',
    badgeLabel: 'Doctor Visit',
    badgeType: 'warning',
  },
];

export default function HistoryScreen() {
  const [historyItems, setHistoryItems] = useState<MedicalHistoryItem[]>(DEFAULT_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HistoryCategory>('ALL');
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showScanRxModal, setShowScanRxModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const [rxRes, reportRes] = await Promise.allSettled([
        prescriptionApi.getPrescriptions(),
        reportApi.getReports(),
      ]);

      const items: MedicalHistoryItem[] = [...DEFAULT_HISTORY];

      if (rxRes.status === 'fulfilled' && rxRes.value.data) {
        rxRes.value.data.forEach((rx: any) => {
          if (!items.some((i) => i.id === `rx_${rx.id}`)) {
            items.unshift({
              id: `rx_${rx.id}`,
              category: 'PRESCRIPTION',
              title: `Prescription: ${rx.diagnosis || 'General Consultation'}`,
              subtitle: rx.doctorName || 'Doctor Prescription',
              date: rx.prescriptionDate || 'Recent',
              doctorName: rx.doctorName,
              facilityName: rx.hospitalName,
              details: rx.notes || `${rx.medicines?.length || 0} medicines included.`,
              badgeLabel: 'Prescription',
              badgeType: 'info',
            });
          }
        });
      }

      if (reportRes.status === 'fulfilled' && reportRes.value.data) {
        reportRes.value.data.forEach((rep: any) => {
          if (!items.some((i) => i.id === `rep_${rep.id}`)) {
            items.unshift({
              id: `rep_${rep.id}`,
              category: 'REPORT',
              title: rep.reportType || 'Medical Lab Report',
              subtitle: rep.facilityName || 'Diagnostic Center',
              date: rep.reportDate || 'Recent',
              doctorName: rep.doctorName,
              details: rep.summary || rep.diagnosis || 'Lab test results verified and recorded.',
              badgeLabel: 'Lab Report',
              badgeType: 'info',
            });
          }
        });
      }

      setHistoryItems(items);
    } catch (err) {
      console.log('Error fetching history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const filteredHistory = historyItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());

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
        title="Medical History"
        subtitle="Chronological timeline of your health journey"
        rightAction={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => setShowAddReportModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color={palette.white} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color={palette.slate400} style={styles.searchIcon} />
          <TextInput
            placeholder="Search records, doctors, test names..."
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
            { key: 'ALL', label: 'All Records' },
            { key: 'PRESCRIPTION', label: 'Prescriptions' },
            { key: 'REPORT', label: 'Lab Reports' },
            { key: 'DOCTOR_VISIT', label: 'Doctor Visits' },
            { key: 'MEDICINE', label: 'Medicines' },
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
            <Text style={styles.monthHeaderText}>Timeline Records</Text>
          </View>

          {filteredHistory.map((item, index) => (
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
                  {item.badgeLabel && (
                    <Badge label={item.badgeLabel} status="PRIMARY" size="sm" />
                  )}
                </View>

                {item.details && (
                  <Text style={styles.detailsText}>{item.details}</Text>
                )}

                {item.doctorName && (
                  <View style={styles.doctorFooter}>
                    <Text style={styles.doctorFooterText}>
                      Physician: <Text style={{ fontWeight: '600' }}>{item.doctorName}</Text>
                    </Text>
                  </View>
                )}
              </Card>
            </View>
          ))}
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
  },
  doctorFooterText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
});
