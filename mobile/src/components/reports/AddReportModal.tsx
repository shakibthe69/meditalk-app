import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Button, Input, Card } from '../common';
import { reportApi } from '../../services/api';
import { ReportType } from '../../types';
import { X, UploadCloud, Camera, Activity, FileText } from 'lucide-react-native';

interface AddReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSuccess?: () => void;
}

const REPORT_TYPES: { key: ReportType; label: string }[] = [
  { key: 'BLOOD_TEST', label: 'Blood Test (CBC, Lipid)' },
  { key: 'X_RAY', label: 'X-Ray' },
  { key: 'MRI', label: 'MRI Scan' },
  { key: 'CT_SCAN', label: 'CT Scan' },
  { key: 'ULTRASOUND', label: 'Ultrasound' },
  { key: 'ECG', label: 'ECG / EKG' },
  { key: 'URINE_TEST', label: 'Urine Analysis' },
  { key: 'PATHOLOGY', label: 'Pathology / Biopsy' },
  { key: 'OTHER', label: 'Other Test Report' },
];

export const AddReportModal: React.FC<AddReportModalProps> = ({
  visible,
  onClose,
  onSaved,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReportType>('BLOOD_TEST');
  // Never pre-fill clinical facts: whatever the patient leaves blank is stored as blank.
  const [hospitalOrLab, setHospitalOrLab] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFileUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setFileUri(null);
    setHospitalOrLab('');
    setDoctorName('');
  };

  /**
   * Writes the report to the database. The backend requires a file URL column, so a
   * report saved without an attachment stores an empty URL and fileType NONE instead
   * of a placeholder pointing at an unrelated image.
   */
  const persistReport = async (attachment: {
    fileUrl: string;
    fileName: string;
    fileType: 'IMAGE' | 'PDF' | 'NONE';
    fileSizeBytes?: number;
  }) => {
    setIsSaving(true);
    try {
      await reportApi.createReport({
        title: title.trim(),
        type,
        testDate: new Date().toISOString().split('T')[0],
        hospitalOrLab: hospitalOrLab.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        notes: notes.trim() || undefined,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileName: attachment.fileName || undefined,
        fileSizeBytes: attachment.fileSizeBytes,
      });

      Alert.alert('Report Saved', 'Medical test report saved to your records!');
      resetForm();
      (onSaved || onSuccess)?.();
      onClose();
    } catch (e: any) {
      console.warn('Failed to save medical report:', e);
      Alert.alert(
        'Could Not Save Report',
        e?.response?.data?.message ||
          'The report was not saved. Please check your connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for this medical report.');
      return;
    }
    if (isSaving) return;

    const safeName = `${title.trim().replace(/[^a-zA-Z0-9]+/g, '_') || 'medical_report'}.jpg`;

    // Nothing attached: save the record on its own.
    if (!fileUri) {
      await persistReport({ fileUrl: '', fileName: '', fileType: 'NONE' });
      return;
    }

    setIsSaving(true);
    try {
      const upload = await reportApi.uploadFile(fileUri, safeName);
      await persistReport({
        fileUrl: upload.fileUrl ?? '',
        fileName: upload.fileName ?? safeName,
        fileType: 'IMAGE',
        fileSizeBytes: upload.fileSizeBytes,
      });
    } catch (uploadError: any) {
      console.warn('Report image upload failed:', uploadError);
      Alert.alert(
        'Image Upload Failed',
        'The selected image could not be uploaded, so the report was not saved yet. You can retry, or save the report details now and attach the image later.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Save Without Image',
            onPress: () => persistReport({ fileUrl: '', fileName: '', fileType: 'NONE' }),
          },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Medical Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Input
            label="Report / Test Title *"
            placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray"
            value={title}
            onChangeText={setTitle}
            leftIcon={<Activity size={18} color={palette.slate400} />}
          />

          {/* Test Category Selector */}
          <Text style={styles.sectionLabel}>Test Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {REPORT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, type === t.key && styles.typeChipActive]}
                onPress={() => setType(t.key)}
              >
                <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Diagnostic Lab / Hospital"
            placeholder="e.g. National Diagnostic Laboratory"
            value={hospitalOrLab}
            onChangeText={setHospitalOrLab}
          />

          <Input
            label="Ordering Physician"
            placeholder="e.g. Dr. Rahman, MD"
            value={doctorName}
            onChangeText={setDoctorName}
          />

          <Input
            label="Clinical Findings & Notes"
            placeholder="e.g. Normal baseline, all key markers in optimal range"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* File Picker */}
          <Text style={styles.sectionLabel}>Report Image or Document</Text>
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
            {fileUri ? (
              <Image source={{ uri: fileUri }} style={styles.imageThumb} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <UploadCloud size={32} color={palette.teal600} />
                <Text style={styles.uploadTitle}>Choose Report Image / PDF</Text>
                <Text style={styles.uploadSub}>Tap to select from device</Text>
              </View>
            )}
          </TouchableOpacity>

          <Button
            title="Save Medical Report"
            onPress={handleSave}
            loading={isSaving}
            size="lg"
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    paddingVertical: spacing.md,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate900,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate700,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  typeChipActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  typeChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  typeChipTextActive: {
    color: palette.white,
  },
  uploadArea: {
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.teal200,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginTop: spacing.xs,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate800,
    marginTop: spacing.xs,
  },
  uploadSub: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  imageThumb: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
});
