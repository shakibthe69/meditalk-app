import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Button, Card, Badge, Header } from '../common';
import { prescriptionApi, reportApi } from '../../services/api';
import { ExtractedMedicine, PrescriptionOcrDraft } from '../../types';
import {
  Camera,
  Image as ImageIcon,
  ScanLine,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Pill,
  Sparkles,
  X,
  ShieldCheck,
} from 'lucide-react-native';

interface AddPrescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSuccess?: () => void;
}

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  visible,
  onClose,
  onSaved,
  onSuccess,
}) => {
  const [step, setStep] = useState<'CAPTURE' | 'RAW_TEXT' | 'CONFIRM_AI'>('CAPTURE');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrDraft, setOcrDraft] = useState<PrescriptionOcrDraft | null>(null);

  const resetState = () => {
    setStep('CAPTURE');
    setSelectedImage(null);
    setRawOcrText('');
    setOcrDraft(null);
    setIsProcessing(false);
  };

  const handlePickImage = async (fromCamera: boolean) => {
    try {
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera / Media Library permission is required to capture prescription images.');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        simulateOcrRun(uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleUseSamplePrescription = () => {
    const sampleText =
      'Dr. Rahman, MD\nApollo Heart & General Clinic\nDiagnosis: Seasonal fever & hyperacidity\n\n1. Omeprazole 20mg - 1+0+0 Before breakfast - 30 days\n2. Napa 500mg - 1+1+1 After meal - 5 days\n3. Rosuvastatin 10mg - 0+0+1 After dinner - 30 days';
    setRawOcrText(sampleText);
    setSelectedImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80');
    setStep('RAW_TEXT');
  };

  const simulateOcrRun = (uri: string) => {
    setIsProcessing(true);
    // Simulate OCR text extraction from image
    setTimeout(() => {
      const detected =
        'Dr. Rahman, MD\nApollo Heart & General Clinic\nDiagnosis: Hypertension & Fever\n\nNapa 500mg\n1+1+1\nAfter meal\n5 days\n\nOmeprazole 20mg\n1+0+0\nBefore breakfast\n30 days';
      setRawOcrText(detected);
      setIsProcessing(false);
      setStep('RAW_TEXT');
    }, 1000);
  };

  const handleRunAiParser = async () => {
    if (!rawOcrText.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = await prescriptionApi.parseOcrText(rawOcrText, selectedImage || undefined);
      setOcrDraft(parsed);
      setStep('CONFIRM_AI');
    } catch (error) {
      Alert.alert('AI Parsing Failed', 'Could not parse text. Please edit or try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!ocrDraft) return;
    setIsProcessing(true);
    try {
      // Map extracted medicines to API payload
      const medicinesPayload = (ocrDraft.extractedMedicines || []).map((med) => {
        const schedules = (med.timing || ['morning']).map((timeLabel) => {
          let time = '08:00 AM';
          let label: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'CUSTOM' = 'MORNING';

          if (timeLabel.toLowerCase().includes('afternoon') || timeLabel.toLowerCase().includes('noon')) {
            time = '02:00 PM';
            label = 'AFTERNOON';
          } else if (timeLabel.toLowerCase().includes('night') || timeLabel.toLowerCase().includes('dinner')) {
            time = '10:00 PM';
            label = 'NIGHT';
          }

          return {
            time,
            label,
            dosageAmount: '1 Tablet',
            foodInstruction: med.foodInstruction || 'AFTER_MEAL',
            isEnabled: true,
          };
        });

        return {
          name: med.name,
          genericName: med.genericName,
          dose: med.dose,
          form: med.form || 'TABLET',
          frequency: med.frequency || 'ONCE_DAILY',
          foodInstruction: med.foodInstruction || 'AFTER_MEAL',
          startDate: new Date().toISOString().split('T')[0],
          durationDays: med.durationDays || 5,
          instructions: `${med.foodInstruction || 'After meal'}, duration: ${med.duration || '5 days'}`,
          isActive: true,
          schedules,
        };
      });

      await prescriptionApi.createPrescription({
        doctorName: ocrDraft.doctorName || 'Dr. Rahman',
        hospitalOrClinic: ocrDraft.hospitalOrClinic || 'Health Clinic',
        prescriptionDate: ocrDraft.prescriptionDate || new Date().toISOString().split('T')[0],
        diagnosis: ocrDraft.diagnosis || 'Prescription digitalized via Meditalk AI',
        rawOcrText: ocrDraft.rawOcrText,
        imageUrl: selectedImage || undefined,
        medicines: medicinesPayload,
      });

      Alert.alert('Prescription Saved', 'Prescription and medicine reminders have been created successfully!');
      resetState();
      (onSaved || onSuccess)?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save prescription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>
            {step === 'CAPTURE' ? 'Add Prescription' : step === 'RAW_TEXT' ? 'Verify OCR Text' : 'AI Medicine Review'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 'CAPTURE' && (
            <View>
              <Text style={styles.instructionText}>
                Take a photo of your doctor's prescription or choose from your gallery to extract text with OCR.
              </Text>

              <View style={styles.captureButtonsRow}>
                <TouchableOpacity style={styles.captureCard} onPress={() => handlePickImage(true)}>
                  <View style={[styles.captureIconCircle, { backgroundColor: palette.teal50 }]}>
                    <Camera size={32} color={palette.teal700} />
                  </View>
                  <Text style={styles.captureCardTitle}>Take Photo</Text>
                  <Text style={styles.captureCardSub}>Capture using camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureCard} onPress={() => handlePickImage(false)}>
                  <View style={[styles.captureIconCircle, { backgroundColor: palette.blue50 }]}>
                    <ImageIcon size={32} color={palette.blue600} />
                  </View>
                  <Text style={styles.captureCardTitle}>Upload Image</Text>
                  <Text style={styles.captureCardSub}>Select from gallery</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR QUICK DEMO</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.samplePrescriptionBtn} onPress={handleUseSamplePrescription}>
                <Sparkles size={20} color={palette.teal700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sampleTitle}>Use Sample Prescription</Text>
                  <Text style={styles.sampleSub}>Instant OCR demo with preloaded doctor note</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {step === 'RAW_TEXT' && (
            <View>
              {selectedImage && (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                </View>
              )}

              <Text style={styles.stepTitle}>Extracted Raw OCR Text</Text>
              <Text style={styles.stepDesc}>
                Review or edit any extracted characters before running the AI structured parser:
              </Text>

              <TextInput
                style={styles.ocrTextInput}
                value={rawOcrText}
                onChangeText={setRawOcrText}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <Button
                title="Run AI Structure Parser"
                onPress={handleRunAiParser}
                loading={isProcessing}
                size="lg"
                fullWidth
                icon={<Sparkles size={18} color={palette.white} />}
              />
            </View>
          )}

          {step === 'CONFIRM_AI' && ocrDraft && (
            <View>
              {/* Mandatory Review Alert Banner */}
              <View style={styles.verificationBanner}>
                <ShieldCheck size={24} color={palette.teal700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verificationTitle}>Verification Required</Text>
                  <Text style={styles.verificationText}>
                    Please verify the extracted information with your original prescription before saving.
                  </Text>
                </View>
              </View>

              {/* Doctor & Clinic Details */}
              <Card style={styles.draftCard}>
                <Text style={styles.cardHeader}>Prescription Info</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Physician:</Text>
                  <Text style={styles.metaValue}>{ocrDraft.doctorName || 'Dr. Rahman'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Hospital / Clinic:</Text>
                  <Text style={styles.metaValue}>{ocrDraft.hospitalOrClinic || 'Apollo Clinic'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>{ocrDraft.prescriptionDate}</Text>
                </View>
              </Card>

              {/* Extracted Medicines List */}
              <Text style={styles.sectionHeading}>Structured Medicines ({ocrDraft.extractedMedicines?.length || 0})</Text>

              {ocrDraft.extractedMedicines?.map((med, idx) => (
                <Card key={idx} style={styles.medDraftCard}>
                  <View style={styles.medDraftHeader}>
                    <View style={styles.medIconBadge}>
                      <Pill size={18} color={palette.teal700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medNameText}>{med.name}</Text>
                      <Text style={styles.medDoseText}>Dose: {med.dose}</Text>
                    </View>
                    <Badge label="AI Parsed" status="PRIMARY" size="sm" />
                  </View>

                  <View style={styles.medSpecsRow}>
                    <Text style={styles.medSpecItem}>
                      • Frequency: <Text style={{ fontWeight: '700' }}>{med.frequency}</Text>
                    </Text>
                    <Text style={styles.medSpecItem}>
                      • Food: <Text style={{ fontWeight: '700' }}>{med.foodInstruction}</Text>
                    </Text>
                    <Text style={styles.medSpecItem}>
                      • Duration: <Text style={{ fontWeight: '700' }}>{med.duration || '5 days'}</Text>
                    </Text>
                  </View>
                </Card>
              ))}

              <View style={styles.confirmActionsRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setStep('RAW_TEXT')}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <Button
                  title="Confirm & Save"
                  onPress={handleConfirmAndSave}
                  loading={isProcessing}
                  size="lg"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}
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
  topHeader: {
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
  instructionText: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  captureButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  captureCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.slate200,
  },
  captureIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  captureCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  captureCardSub: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: palette.slate200,
  },
  dividerText: {
    fontSize: typography.sizes.xs - 2,
    color: palette.slate400,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
  },
  samplePrescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    borderWidth: 1.5,
    borderColor: palette.teal200,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  sampleTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.teal900,
  },
  sampleSub: {
    fontSize: typography.sizes.xs,
    color: palette.teal700,
    marginTop: 2,
  },
  imagePreviewWrapper: {
    height: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.base,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stepTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginBottom: spacing.md,
  },
  ocrTextInput: {
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: palette.slate800,
    minHeight: 140,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    borderColor: palette.teal300,
    borderWidth: 1.5,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  verificationTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.teal900,
  },
  verificationText: {
    fontSize: typography.sizes.xs,
    color: palette.teal800,
    marginTop: 2,
    lineHeight: 18,
  },
  draftCard: {
    marginBottom: spacing.base,
  },
  cardHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  metaValue: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate900,
  },
  sectionHeading: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  medDraftCard: {
    marginBottom: spacing.md,
  },
  medDraftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  medNameText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  medDoseText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  medSpecsRow: {
    backgroundColor: palette.slate50,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  medSpecItem: {
    fontSize: typography.sizes.xs,
    color: palette.slate700,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  editBtn: {
    flex: 1,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  editBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: palette.slate700,
  },
});
