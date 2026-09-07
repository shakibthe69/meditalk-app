import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  X,
  User,
  Pill,
  FileSpreadsheet,
  Activity,
  AlertTriangle,
} from 'lucide-react-native';
import { palette, typography, spacing, borderRadius, shadows } from '../../theme';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { pdfApi } from '../../services/api/pdfApi';
import { useAuthStore } from '../../store/useAuthStore';

interface ExportPdfModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeMedicines, setIncludeMedicines] = useState(true);
  const [includePrescriptions, setIncludePrescriptions] = useState(true);
  const [includeReports, setIncludeReports] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setDownloadSuccess(false);
    try {
      const payload = {
        includeProfile,
        includeMedicines,
        includePrescriptions,
        includeReports,
        dateRange,
      };

      const blob = await pdfApi.downloadMedicalHistoryPdf(payload);

      if (Platform.OS === 'web') {
        // Web direct download
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        const patientName = user?.fullName ? user.fullName.replace(/\s+/g, '_') : 'Patient';
        link.setAttribute('download', `Meditalk_Medical_History_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Mobile platform handling
        Alert.alert(
          'PDF Generated',
          'Your clinical medical history report has been generated successfully!',
          [{ text: 'OK' }]
        );
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      Alert.alert(
        'Export Failed',
        err?.response?.data?.message || 'Failed to generate medical history PDF. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCheckbox = (
    label: string,
    description: string,
    checked: boolean,
    onToggle: () => void,
    IconComponent: React.ElementType
  ) => (
    <TouchableOpacity
      style={[styles.optionCard, checked && styles.optionCardActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, checked && styles.iconWrapperActive]}>
        <IconComponent size={20} color={checked ? palette.teal700 : palette.slate500} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionTitle, checked && styles.optionTitleActive]}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <CheckCircle2 size={16} color={palette.white} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badge}>
                <FileText size={18} color={palette.teal700} />
              </View>
              <Text style={styles.headerTitle}>Export Medical Record</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={palette.slate600} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <ShieldCheck size={20} color={palette.teal700} />
              <Text style={styles.infoBannerText}>
                Generates a standardized clinical PDF with doctor-ready summary suitable for hospital visits & consultations.
              </Text>
            </View>

            {/* Patient Header Preview */}
            <Card style={styles.patientPreviewCard}>
              <View style={styles.patientPreviewHeader}>
                <User size={24} color={palette.teal700} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.patientName}>{user?.fullName || 'Patient Record'}</Text>
                  <Text style={styles.patientMeta}>
                    {user?.bloodGroup ? `Blood: ${user.bloodGroup}` : 'Blood group not set'} • {user?.gender || 'Gender unassigned'}
                  </Text>
                </View>
              </View>
              {user?.allergies && user.allergies.length > 0 ? (
                <View style={styles.allergyTag}>
                  <AlertTriangle size={14} color={palette.danger600} />
                  <Text style={styles.allergyText}>Allergies: {user.allergies.join(', ')}</Text>
                </View>
              ) : null}
            </Card>

            {/* Date Range Selection */}
            <Text style={styles.sectionHeading}>TIME PERIOD</Text>
            <View style={styles.dateRangeRow}>
              {(['all', '30d', '90d', '1y'] as const).map((range) => {
                const labels = {
                  all: 'All Time',
                  '30d': 'Last 30D',
                  '90d': 'Last 90D',
                  '1y': 'Past Year',
                };
                const active = dateRange === range;
                return (
                  <TouchableOpacity
                    key={range}
                    style={[styles.rangeTab, active && styles.rangeTabActive]}
                    onPress={() => setDateRange(range)}
                  >
                    <Text style={[styles.rangeTabText, active && styles.rangeTabTextActive]}>
                      {labels[range]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Included Modules Checklist */}
            <Text style={styles.sectionHeading}>INCLUDED SECTIONS</Text>

            {renderCheckbox(
              'Patient & Health Profile',
              'Personal info, emergency contacts, blood group, allergies & chronic conditions',
              includeProfile,
              () => setIncludeProfile(!includeProfile),
              User
            )}

            {renderCheckbox(
              'Active Medications & Dosages',
              'Medication names, dosage schedules, times, food instructions and treatment durations',
              includeMedicines,
              () => setIncludeMedicines(!includeMedicines),
              Pill
            )}

            {renderCheckbox(
              'Prescriptions & Diagnoses',
              'Prescription history, consulting physicians, clinical diagnosis and visit dates',
              includePrescriptions,
              () => setIncludePrescriptions(!includePrescriptions),
              FileSpreadsheet
            )}

            {renderCheckbox(
              'Medical Reports & Lab Results',
              'Summary of blood tests, imaging reports, pathology results and doctor impressions',
              includeReports,
              () => setIncludeReports(!includeReports),
              Activity
            )}

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            {downloadSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={24} color={palette.success600} />
                <Text style={styles.successText}>Medical History PDF Generated!</Text>
              </View>
            ) : (
              <Button
                title="Generate Doctor-Ready PDF"
                variant="primary"
                size="lg"
                loading={loading}
                icon={<Download size={20} color={palette.white} />}
                onPress={handleExport}
                fullWidth
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
    paddingTop: spacing.base,
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: palette.teal100,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate900,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: palette.slate100,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  infoBannerText: {
    fontSize: typography.sizes.xs,
    color: palette.teal900,
    flex: 1,
    lineHeight: 18,
  },
  patientPreviewCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: palette.slate50,
    borderColor: palette.slate200,
  },
  patientPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  patientMeta: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.danger50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  allergyText: {
    fontSize: typography.sizes.xs,
    color: palette.danger600,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate400,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
  },
  dateRangeRow: {
    flexDirection: 'row',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  rangeTabActive: {
    backgroundColor: palette.white,
    ...shadows.sm,
  },
  rangeTabText: {
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    fontWeight: '600',
  },
  rangeTabTextActive: {
    color: palette.teal700,
    fontWeight: '700',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  optionCardActive: {
    borderColor: palette.teal500,
    backgroundColor: palette.teal50,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapperActive: {
    backgroundColor: palette.teal100,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate800,
    marginBottom: 2,
  },
  optionTitleActive: {
    color: palette.teal900,
  },
  optionDescription: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: palette.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.slate200,
    backgroundColor: palette.white,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.success50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  successText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.success600,
  },
});
