import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { palette, typography, spacing, borderRadius, shadows } from '../../theme';
import { Button, Card, Badge } from '../common';
import { prescriptionApi } from '../../services/api';
import { reminderService } from '../../services/notifications/reminderService';
import { voiceService } from '../../services/voice';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useMedicineStore } from '../../store/useMedicineStore';
import { ExtractedMedicine, PrescriptionOcrDraft } from '../../types';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  X,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  Volume2,
  VolumeX,
  Languages,
  AlertTriangle,
  Pill,
  RefreshCw,
} from 'lucide-react-native';

interface AddPrescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSuccess?: () => void;
}

const DOSE_PATTERNS = ['1+1+1', '1+0+1', '1+1+1+1', '0+1+0', '1+0+0', '0+0+1'];

/**
 * Slot naming must match the backend (OcrAiParserService.buildSchedulesForMedicine) so
 * the review screen and the saved reminders show identical dose times.
 */
const PATTERN_SLOT_LABELS: Record<number, string[]> = {
  1: ['morning'],
  2: ['morning', 'night'],
  3: ['morning', 'afternoon', 'night'],
  4: ['morning', 'afternoon', 'evening', 'night'],
};

const SLOT_TIMES: Record<
  string,
  { time: string; label: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' }
> = {
  morning: { time: '08:00 AM', label: 'MORNING' },
  afternoon: { time: '02:00 PM', label: 'AFTERNOON' },
  evening: { time: '06:00 PM', label: 'EVENING' },
  night: { time: '10:00 PM', label: 'NIGHT' },
};

const capitalizeWord = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';

/**
 * Converts a dose pattern such as '2+0+1' into reminder slots. Nothing is produced when
 * no schedule was stated, because MediTalk never invents dose times.
 */
const buildScheduleSlots = (
  dosePattern?: string | null,
  form?: string | null,
  foodInstruction?: string | null
) => {
  const parts = String(dosePattern || '')
    .split('+')
    .map((p) => parseInt(p.trim(), 10) || 0);

  if (!parts.some((count) => count > 0)) {
    return [];
  }

  const labels = PATTERN_SLOT_LABELS[parts.length] || PATTERN_SLOT_LABELS[4];
  const unit = capitalizeWord(form) || 'Tablet';

  return parts
    .map((count, index) => ({ count, slot: labels[index] }))
    .filter((entry) => entry.slot && entry.count > 0)
    .map((entry) => ({
      time: SLOT_TIMES[entry.slot].time,
      label: SLOT_TIMES[entry.slot].label,
      dosageAmount: `${entry.count} ${entry.count > 1 ? `${unit}s` : unit}`,
      foodInstruction: foodInstruction || undefined,
      isEnabled: true,
    }));
};

/**
 * Reminder slots used when saving: the schedule the prescription states when there is
 * one, otherwise a single editable 08:00 AM morning reminder so the medicine still
 * appears in the patient's reminder list. The review screen shows which one applies.
 */
const schedulesForMedicine = (med: ExtractedMedicine) => {
  const stated = buildScheduleSlots(med.dosePattern, med.form, med.foodInstruction);
  if (stated.length > 0) {
    return stated;
  }
  return [
    {
      time: '08:00 AM',
      label: 'MORNING' as const,
      dosageAmount: '1 dose',
      foodInstruction: med.foodInstruction || 'AFTER_MEAL',
      isEnabled: true,
    },
  ];
};

/** Dose-pattern choices, always including whatever the AI extracted. */
const dosePatternOptions = (current?: string | null) => {
  const options = current && !DOSE_PATTERNS.includes(current)
    ? [current, ...DOSE_PATTERNS]
    : DOSE_PATTERNS;
  return options;
};

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  visible,
  onClose,
  onSaved,
  onSuccess,
}) => {
  const { language, voiceEnabled, t, toggleLanguage, toggleVoice } = useSettingsStore();

  const [step, setStep] = useState<'CAPTURE' | 'RAW_TEXT' | 'CONFIRM_AI'>('CAPTURE');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>(t.processingPrescription);
  const [ocrDraft, setOcrDraft] = useState<PrescriptionOcrDraft | null>(null);

  // Editable fields in CONFIRM_AI. Unreadable values stay empty — MediTalk never
  // pre-fills medical details that the prescription did not state.
  const [doctorName, setDoctorName] = useState('');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);

  // Trigger step voice prompt whenever step changes and modal is visible
  useEffect(() => {
    if (visible) {
      if (step === 'CAPTURE') {
        voiceService.speakStep('CAPTURE', language);
      } else if (step === 'CONFIRM_AI' && medicines.length > 0) {
        voiceService.speakMedicineReviewSummary(medicines, language);
      }
    } else {
      voiceService.stop();
    }
  }, [visible, step]);

  const resetState = () => {
    setStep('CAPTURE');
    setSelectedImage(null);
    setRawOcrText('');
    setOcrDraft(null);
    setIsProcessing(false);
    setProcessingStage(t.processingPrescription);
    setDoctorName('');
    setHospitalOrClinic('');
    setPrescriptionDate(new Date().toISOString().split('T')[0]);
    setDiagnosis('');
    setMedicines([]);
  };

  const handleClose = () => {
    voiceService.stop();
    resetState();
    onClose();
  };

  const handlePickImage = async (fromCamera: boolean) => {
    try {
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          language === 'bn' ? 'অনুমতি প্রয়োজন' : 'Permission Denied',
          language === 'bn'
            ? 'প্রেসক্রিপশনের ছবি তোলার জন্য ক্যামেরা বা মিডিয়া গ্যালারির অনুমতি প্রয়োজন।'
            : 'Camera / Media Library permission is required to capture prescription images.'
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        await executeOcrPipeline(uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
      Alert.alert('Error', 'Failed to pick or capture image.');
    }
  };

  const handleUseSamplePrescription = async () => {
    const sampleText =
      'Dr. S. M. Rahman, MBBS, FCPS\nApollo Heart & General Clinic\nDiagnosis: Seasonal fever & hyperacidity\n\n1. Tab. Napa 500mg\n   1+1+1 - খাবারের পরে (After meal) - 5 days\n2. Cap. Omeprazole 20mg\n   1+0+0 - খাবারের আগে (Before meal) - 14 days\n3. Tab. Rosuvastatin 10mg\n   0+0+1 - রাতে খাবারের পরে - 30 days';

    setRawOcrText(sampleText);
    setSelectedImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80');

    setIsProcessing(true);
    setProcessingStage(t.processingPrescription);
    voiceService.speakStep('SCANNING', language);

    const timer = startProgressStages([
      t.loadingReadingPrescription,
      t.loadingUnderstandingPrescription,
      t.loadingPreparingMedicines,
    ]);

    try {
      const parsed = await prescriptionApi.parseOcrText(sampleText);
      populateDraftFields(parsed);
      setStep('CONFIRM_AI');
    } catch (err) {
      setStep('RAW_TEXT');
    } finally {
      clearInterval(timer);
      setIsProcessing(false);
    }
  };

  /**
   * Shows honest progress while the single scan request is in flight. The stage text
   * is a guide, not a fabricated percentage.
   */
  const startProgressStages = (stages: string[]) => {
    let index = 0;
    setProcessingStage(stages[0]);
    return setInterval(() => {
      index = Math.min(index + 1, stages.length - 1);
      setProcessingStage(stages[index]);
    }, 2000);
  };

  const executeOcrPipeline = async (uri: string) => {
    setIsProcessing(true);
    setSelectedImage(uri);
    voiceService.speakStep('SCANNING', language);

    const timer = startProgressStages([
      t.loadingUploadingPrescription,
      t.loadingReadingPrescription,
      t.loadingUnderstandingPrescription,
      t.loadingPreparingMedicines,
    ]);

    try {
      const response = await prescriptionApi.scanPrescriptionImage(uri);
      setOcrDraft(response);
      setRawOcrText(response.rawOcrText || '');
      populateDraftFields(response);
      setStep('CONFIRM_AI');
    } catch (error: any) {
      // Medical safety: never fabricate prescription text on failure. Surface the
      // real error so the user can retry with a clearer photo or type it manually.
      console.warn('Prescription OCR failed:', error);
      setRawOcrText('');
      setStep('CAPTURE');
      const message =
        error?.response?.data?.message ||
        (language === 'bn'
          ? 'প্রেসক্রিপশন পড়া যায়নি। পরিষ্কার ছবি দিয়ে আবার চেষ্টা করুন।'
          : 'Could not read the prescription. Please try a clearer photo or enter the text manually.');
      Alert.alert(language === 'bn' ? 'স্ক্যান ব্যর্থ' : 'Scan failed', message, [
        { text: t.backToCapture, style: 'cancel' },
        { text: t.retryOcr, onPress: () => executeOcrPipeline(uri) },
      ]);
    } finally {
      clearInterval(timer);
      setIsProcessing(false);
    }
  };

  const populateDraftFields = (draft: PrescriptionOcrDraft) => {
    setOcrDraft(draft);
    if (draft.doctorName) setDoctorName(draft.doctorName);
    if (draft.hospitalOrClinic) setHospitalOrClinic(draft.hospitalOrClinic);
    if (draft.prescriptionDate) setPrescriptionDate(draft.prescriptionDate);
    if (draft.diagnosis) setDiagnosis(draft.diagnosis);

    // Fields the prescription did not state stay empty so the patient fills them in
    // consciously instead of accepting an invented value.
    const medsList = draft.medicines || draft.extractedMedicines || [];
    const normalizedMeds: ExtractedMedicine[] = medsList.map((m) => ({
      ...m,
      dose: m.dose ?? '',
      dosePattern: m.dosePattern ?? '',
      foodInstruction: m.foodInstruction ?? '',
      duration: m.duration ?? '',
      form: m.form ?? '',
      frequency: m.frequency ?? '',
      timing: m.timing ?? [],
    }));
    setMedicines(normalizedMeds);
  };

  const handleRunAiParser = async () => {
    if (!rawOcrText.trim()) return;
    setIsProcessing(true);
    setProcessingStage(t.processingPrescription);
    voiceService.speakStep('SCANNING', language);

    const timer = startProgressStages([
      t.loadingUnderstandingPrescription,
      t.loadingPreparingMedicines,
    ]);

    try {
      const parsed = await prescriptionApi.parseOcrText(rawOcrText, selectedImage || undefined);
      populateDraftFields(parsed);
      setStep('CONFIRM_AI');
    } catch (error: any) {
      Alert.alert(
        language === 'bn' ? 'বিশ্লেষণ ব্যর্থ' : 'AI Parsing Failed',
        error?.response?.data?.message ||
          (language === 'bn'
            ? 'টেক্সট বিশ্লেষণ করা যায়নি। সম্পাদনা করে আবার চেষ্টা করুন।'
            : 'Could not analyze the text. Please edit it and try again.')
      );
    } finally {
      clearInterval(timer);
      setIsProcessing(false);
    }
  };

  // Medicine Card Update Helpers
  const updateMedicineField = (index: number, field: keyof ExtractedMedicine, value: any) => {
    setMedicines((prev) => {
      const updated = [...prev];
      const med = { ...updated[index], [field]: value };

      // If dosePattern changed, auto-update the reminder slots from the stated pattern
      if (field === 'dosePattern') {
        const parts = String(value).split('+').map((p) => parseInt(p.trim(), 10) || 0);
        const labels = PATTERN_SLOT_LABELS[parts.length] || PATTERN_SLOT_LABELS[4];
        med.timing = parts
          .map((count, index) => (count > 0 ? labels[index] : null))
          .filter((slot): slot is string => Boolean(slot));
      }

      updated[index] = med;
      return updated;
    });
  };

  const handleDeleteMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMedicine = () => {
    // Blank template: the patient types what the prescription actually says.
    const newMed: ExtractedMedicine = {
      name: '',
      dose: '',
      form: '',
      frequency: '',
      dosePattern: '',
      timing: [],
      foodInstruction: '',
      duration: '',
      isUncertain: false,
      confidenceScore: 1.0,
    };
    setMedicines((prev) => [...prev, newMed]);
  };

  const handleSpeakMedicine = (med: ExtractedMedicine) => {
    const foodText =
      med.foodInstruction === 'BEFORE_MEAL'
        ? t.beforeMeal
        : med.foodInstruction === 'EMPTY_STOMACH'
        ? t.emptyStomach
        : t.afterMeal;

    const speechText =
      language === 'bn'
        ? `ওষুধের নাম: ${med.name || 'নতুন ওষুধ'}, মাত্রা: ${med.dose || '৫০০ মিগ্রা'}, খাওয়ার নিয়ম: ${med.dosePattern || '১+০+১'}, ${foodText}, মেয়াদ: ${med.duration || '৫ দিন'}।`
        : `Medicine: ${med.name || 'Medicine'}, Dose: ${med.dose || '500mg'}, Schedule: ${med.dosePattern || '1+0+1'}, ${foodText}, Duration: ${med.duration || '5 days'}.`;

    voiceService.speak(speechText, language);
  };

  const buildMedicinesPayload = () =>
    medicines.map((med) => {
      const schedules = schedulesForMedicine(med);
      return {
        name: med.name.trim(),
        genericName: med.genericName || undefined,
        dose: (med.dose || '').trim(),
        form: med.form || 'TABLET',
        frequency:
          med.frequency ||
          (schedules.length >= 4
            ? 'FOUR_TIMES_DAILY'
            : schedules.length === 3
            ? 'THRICE_DAILY'
            : schedules.length === 2
            ? 'TWICE_DAILY'
            : 'ONCE_DAILY'),
        foodInstruction: med.foodInstruction || 'AFTER_MEAL',
        startDate: prescriptionDate || new Date().toISOString().split('T')[0],
        durationDays: med.durationDays,
        instructions:
          [med.foodInstruction || null, med.duration ? `Duration: ${med.duration}` : null]
            .filter(Boolean)
            .join(', ') || undefined,
        isActive: true,
        schedules,
      };
    });

  const persistPrescription = async (allowDuplicate: boolean) => {
    setIsProcessing(true);
    setProcessingStage(language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving prescription and reminders...');
    try {
      const medicinesPayload = buildMedicinesPayload();

      const savedPrescription = await prescriptionApi.createPrescription(
        {
          doctorName: doctorName.trim(),
          hospitalOrClinic: hospitalOrClinic.trim() || undefined,
          prescriptionDate: prescriptionDate || new Date().toISOString().split('T')[0],
          diagnosis: diagnosis.trim() || undefined,
          rawOcrText: rawOcrText || ocrDraft?.rawOcrText,
          imageUrl: selectedImage || undefined,
          medicines: medicinesPayload,
        },
        allowDuplicate
      );

      // Schedule local notifications for each returned medicine
      if (savedPrescription && savedPrescription.medicines) {
        for (const med of savedPrescription.medicines) {
          await reminderService.scheduleMedicineReminders(med);
        }
      }

      // Synchronize medicine store, today logs, and adherence immediately
      await Promise.allSettled([
        useMedicineStore.getState().fetchMedicines(),
        useMedicineStore.getState().fetchTodayLogs(),
        useMedicineStore.getState().fetchAdherence(),
      ]);

      voiceService.speakStep('SAVED', language);
      Alert.alert(t.prescriptionSavedAlert, t.prescriptionSavedMsg);
      resetState();
      (onSaved || onSuccess)?.();
      onClose();
    } catch (error: any) {
      console.warn('Failed to save prescription:', error);

      // The backend refuses to store the same prescription twice; ask the patient
      // before creating a deliberate copy.
      if (prescriptionApi.isDuplicatePrescriptionError(error)) {
        Alert.alert(t.duplicateTitle, t.duplicateMsg, [
          { text: t.backToCapture, style: 'cancel' },
          { text: t.saveAnyway, onPress: () => persistPrescription(true) },
        ]);
        return;
      }

      Alert.alert(
        t.saveFailedAlert,
        error?.response?.data?.message || t.saveFailedMsg
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (medicines.length === 0) {
      Alert.alert(
        language === 'bn' ? 'ওষুধ প্রয়োজন' : 'No Medicines',
        language === 'bn'
          ? 'অনুগ্রহ করে প্রেসক্রিপশনে কমপক্ষে একটি ওষুধ যোগ করুন।'
          : 'Please add at least one medicine to the prescription.'
      );
      return;
    }

    if (!doctorName.trim()) {
      Alert.alert(
        language === 'bn' ? 'চিকিৎসকের নাম প্রয়োজন' : 'Doctor name required',
        language === 'bn'
          ? 'প্রেসক্রিপশনে লেখা চিকিৎসকের নাম লিখুন। মেডিটক এটি অনুমান করে বসায় না।'
          : "Enter the prescribing doctor's name as written on the prescription. MediTalk does not guess it."
      );
      return;
    }

    // A medicine with no name can never be stored or turned into a reminder.
    const nameless = medicines.filter((med) => !med.name?.trim());
    if (nameless.length > 0) {
      Alert.alert(t.namelessMedicineAlert, t.namelessMedicineMsg);
      return;
    }

    // Medical safety: we never invent a dose or a schedule just to make the form valid.
    // When OCR could not read them the medicine is still saved — with the dose left
    // unreadable and a single default reminder — after the patient confirms.
    const needsAttention = medicines.filter(
      (med) =>
        !med.dose?.trim() ||
        !med.dosePattern?.trim() ||
        buildScheduleSlots(med.dosePattern, med.form, med.foodInstruction).length === 0
    );

    if (needsAttention.length > 0) {
      const list = needsAttention
        .map((med) => `• ${med.name?.trim() || '—'}${med.dose?.trim() ? ` (${med.dose.trim()})` : ''}`)
        .join('\n');
      Alert.alert(t.incompleteWarningTitle, `${t.incompleteWarningMsg}\n\n${list}`, [
        { text: t.keepEditing, style: 'cancel' },
        { text: t.saveAnyway, onPress: () => persistPrescription(false) },
      ]);
      return;
    }

    await persistPrescription(false);
  };

  const getFoodOptions = () => [
    { key: 'AFTER_MEAL', label: t.afterMeal },
    { key: 'BEFORE_MEAL', label: t.beforeMeal },
    { key: 'EMPTY_STOMACH', label: t.emptyStomach },
    { key: 'WITH_MEAL', label: t.withMeal },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Top Header with Language & Voice Controls */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeftGroup}>
            <Text style={styles.headerTitle}>
              {step === 'CAPTURE'
                ? t.scanPrescriptionTitle
                : step === 'RAW_TEXT'
                ? t.verifyOcrTitle
                : t.reviewMedicinesTitle}
            </Text>
          </View>

          <View style={styles.headerControlsRow}>
            {/* Language Switcher */}
            <TouchableOpacity
              style={styles.controlPill}
              onPress={() => {
                toggleLanguage();
                voiceService.speak(
                  language === 'en' ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে' : 'Language changed to English',
                  language === 'en' ? 'bn' : 'en'
                );
              }}
            >
              <Languages size={15} color={palette.teal700} />
              <Text style={styles.controlPillText}>{language === 'en' ? 'বাংলা' : 'EN'}</Text>
            </TouchableOpacity>

            {/* Voice Toggle */}
            <TouchableOpacity
              style={[styles.controlPill, !voiceEnabled && styles.controlPillDisabled]}
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
            >
              {voiceEnabled ? (
                <Volume2 size={16} color={palette.teal700} />
              ) : (
                <VolumeX size={16} color={palette.slate400} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={palette.slate600} />
            </TouchableOpacity>
          </View>
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={palette.teal700} />
            <Text style={styles.loadingText}>{processingStage}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* STEP 1: CAPTURE */}
          {step === 'CAPTURE' && (
            <View>
              <Text style={styles.instructionText}>{t.captureInstruction}</Text>

              <View style={styles.captureButtonsRow}>
                <TouchableOpacity style={styles.captureCard} onPress={() => handlePickImage(true)}>
                  <View style={[styles.captureIconCircle, { backgroundColor: palette.teal50 }]}>
                    <Camera size={32} color={palette.teal700} />
                  </View>
                  <Text style={styles.captureCardTitle}>{t.takePhotoButton}</Text>
                  <Text style={styles.captureCardSub}>{t.takePhotoSub}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureCard} onPress={() => handlePickImage(false)}>
                  <View style={[styles.captureIconCircle, { backgroundColor: palette.blue50 }]}>
                    <ImageIcon size={32} color={palette.blue600} />
                  </View>
                  <Text style={styles.captureCardTitle}>{t.uploadImageButton}</Text>
                  <Text style={styles.captureCardSub}>{t.uploadImageSub}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t.orQuickDemo}</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.samplePrescriptionBtn} onPress={handleUseSamplePrescription}>
                <Sparkles size={20} color={palette.teal700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sampleTitle}>{t.useSamplePrescription}</Text>
                  <Text style={styles.sampleSub}>{t.useSampleSub}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: RAW TEXT */}
          {step === 'RAW_TEXT' && (
            <View>
              {selectedImage && (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                </View>
              )}

              <Text style={styles.stepTitle}>{t.rawOcrTextLabel}</Text>
              <Text style={styles.stepDesc}>{t.rawOcrTextDesc}</Text>

              <TextInput
                style={styles.ocrTextInput}
                value={rawOcrText}
                onChangeText={setRawOcrText}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <View style={styles.confirmActionsRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setStep('CAPTURE')}>
                  <Text style={styles.editBtnText}>{t.backToCapture}</Text>
                </TouchableOpacity>
                <Button
                  title={t.runAiParser}
                  onPress={handleRunAiParser}
                  loading={isProcessing}
                  size="lg"
                  style={{ flex: 2 }}
                  icon={<Sparkles size={18} color={palette.white} />}
                />
              </View>
            </View>
          )}

          {/* STEP 3: CONFIRM & REVIEW AI */}
          {step === 'CONFIRM_AI' && (
            <View>
              {/* Mandatory Review Alert Banner */}
              <View style={styles.verificationBanner}>
                <ShieldCheck size={24} color={palette.teal700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verificationTitle}>{t.verificationRequired}</Text>
                  <Text style={styles.verificationText}>{t.verificationBannerDesc}</Text>
                </View>
              </View>

              {/* OCR Metadata Badges */}
              {ocrDraft && (
                <View style={styles.badgeMetaRow}>
                  {ocrDraft.confidenceScore ? (
                    <Badge
                      label={`Confidence: ${Math.round(ocrDraft.confidenceScore * 100)}%`}
                      status={ocrDraft.confidenceScore >= 0.85 ? 'PRIMARY' : 'SKIPPED'}
                      size="sm"
                    />
                  ) : null}
                  {ocrDraft.detectedLanguages && ocrDraft.detectedLanguages.length > 0 && (
                    <Badge
                      label={`Lang: ${ocrDraft.detectedLanguages.join(', ').toUpperCase()}`}
                      status="INFO"
                      size="sm"
                    />
                  )}
                  {/* Makes OCR vs AI vs user-confirmed data explicit (medical safety). */}
                  <Badge
                    label={`${t.extractionSourceLabel}: ${
                      ocrDraft.extractionSource === 'gemini' ? t.extractionGemini : t.extractionRuleBased
                    }`}
                    status={ocrDraft.extractionSource === 'gemini' ? 'PRIMARY' : 'WARNING'}
                    size="sm"
                  />
                  {!!ocrDraft.ocrEngine && (
                    <Badge label={`${t.ocrEngineLabel}: ${ocrDraft.ocrEngine}`} status="DEFAULT" size="sm" />
                  )}
                </View>
              )}

              {!!ocrDraft?.aiNotes && (
                <View style={styles.aiNotesBox}>
                  <Text style={styles.aiNotesText}>{ocrDraft.aiNotes}</Text>
                </View>
              )}

              {/* Doctor & Clinic Info Card */}
              <Card style={styles.draftCard}>
                <Text style={styles.cardHeader}>{t.prescriptionDetails}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.doctorName}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={doctorName}
                    onChangeText={setDoctorName}
                    placeholder="Doctor Name"
                    placeholderTextColor={palette.slate400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.hospitalOrClinic}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={hospitalOrClinic}
                    onChangeText={setHospitalOrClinic}
                    placeholder="Clinic or Hospital"
                    placeholderTextColor={palette.slate400}
                  />
                </View>

                <View style={styles.metaSplitRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>{t.date}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={prescriptionDate}
                      onChangeText={setPrescriptionDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={palette.slate400}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>{t.diagnosis}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={diagnosis}
                      onChangeText={setDiagnosis}
                      placeholder="Diagnosis / Condition"
                      placeholderTextColor={palette.slate400}
                    />
                  </View>
                </View>
              </Card>

              {/* Structured Medicines Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>
                  {t.medicinesCount} ({medicines.length})
                </Text>
                <TouchableOpacity style={styles.addMedBtn} onPress={handleAddMedicine}>
                  <Plus size={14} color={palette.teal700} />
                  <Text style={styles.addMedBtnText}>{t.addMedicine}</Text>
                </TouchableOpacity>
              </View>

              {medicines.map((med, idx) => (
                <Card key={idx} style={styles.medDraftCard}>
                  <View style={styles.medCardTopRow}>
                    <View style={styles.medIconBadge}>
                      <Pill size={18} color={palette.teal700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldSubLabel}>{t.medicineName}</Text>
                      <TextInput
                        style={styles.medNameInput}
                        value={med.name}
                        onChangeText={(val) => updateMedicineField(idx, 'name', val)}
                        placeholder="e.g. Napa Extra"
                        placeholderTextColor={palette.slate400}
                      />
                    </View>
                    {/* Read Medicine via TTS Button */}
                    <TouchableOpacity
                      style={styles.audioMedBtn}
                      onPress={() => handleSpeakMedicine(med)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Volume2 size={18} color={palette.teal700} />
                    </TouchableOpacity>
                    {/* Delete Medicine Button */}
                    <TouchableOpacity
                      style={styles.deleteMedBtn}
                      onPress={() => handleDeleteMedicine(idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={palette.danger500} />
                    </TouchableOpacity>
                  </View>

                  {med.isUncertain && (
                    <View style={styles.uncertainBanner}>
                      <AlertTriangle size={14} color={palette.warning600} />
                      <Text style={styles.uncertainText}>{t.verifySpellingNotice}</Text>
                    </View>
                  )}

                  {/* Dose & Duration Row */}
                  <View style={styles.metaSplitRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.fieldSubLabel}>{t.strengthDose}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={med.dose ?? ''}
                        onChangeText={(val) => updateMedicineField(idx, 'dose', val)}
                        placeholder="500mg, 20mg, 10ml"
                        placeholderTextColor={palette.slate400}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.fieldSubLabel}>{t.duration}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={med.duration ?? ''}
                        onChangeText={(val) => updateMedicineField(idx, 'duration', val)}
                        placeholder="e.g. 5 days, 1 month"
                        placeholderTextColor={palette.slate400}
                      />
                    </View>
                  </View>

                  {/* Dose Pattern Selector (1+1+1, 1+0+1, etc.) */}
                  <Text style={styles.fieldSubLabel}>{t.dosePattern}</Text>
                  <View style={styles.pillSelectorRow}>
                    {dosePatternOptions(med.dosePattern).map((pattern) => (
                      <TouchableOpacity
                        key={pattern}
                        style={[
                          styles.patternPill,
                          med.dosePattern === pattern && styles.patternPillActive,
                        ]}
                        onPress={() => updateMedicineField(idx, 'dosePattern', pattern)}
                      >
                        <Text
                          style={[
                            styles.patternPillText,
                            med.dosePattern === pattern && styles.patternPillTextActive,
                          ]}
                        >
                          {pattern}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Meal Instruction Selector */}
                  <Text style={styles.fieldSubLabel}>{t.mealInstruction}</Text>
                  <View style={styles.pillSelectorRow}>
                    {getFoodOptions().map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.foodPill,
                          med.foodInstruction === opt.key && styles.foodPillActive,
                        ]}
                        onPress={() => updateMedicineField(idx, 'foodInstruction', opt.key)}
                      >
                        <Text
                          style={[
                            styles.foodPillText,
                            med.foodInstruction === opt.key && styles.foodPillTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Reminder Times Summary — only shows times the prescription actually states */}
                  <View style={styles.schedulePreviewBox}>
                    <Clock size={14} color={palette.teal700} />
                    <Text style={styles.schedulePreviewText}>
                      {t.reminders}{' '}
                      {(() => {
                        const stated = buildScheduleSlots(med.dosePattern, med.form, med.foodInstruction);
                        if (stated.length > 0) {
                          return stated.map((slot) => slot.time).join(', ');
                        }
                        // Transparent about the fallback instead of silently inventing a time.
                        return language === 'bn'
                          ? '08:00 AM (ডিফল্ট — প্রেসক্রিপশনে লেখা নেই)'
                          : '08:00 AM (default — not stated on the prescription)';
                      })()}
                    </Text>
                  </View>
                </Card>
              ))}

              {/* Retry the scan without re-taking the photo */}
              {!!selectedImage && (
                <TouchableOpacity
                  style={styles.retryOcrBtn}
                  onPress={() => executeOcrPipeline(selectedImage)}
                  disabled={isProcessing}
                >
                  <RefreshCw size={16} color={palette.teal700} />
                  <Text style={styles.retryOcrText}>{t.retryOcr}</Text>
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              <View style={styles.confirmActionsRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setStep('RAW_TEXT')}>
                  <Text style={styles.editBtnText}>{t.backToRaw}</Text>
                </TouchableOpacity>

                <Button
                  title={t.confirmAndSave}
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
  headerLeftGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.base + 1,
    fontWeight: '700',
    color: palette.slate900,
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  controlPillDisabled: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate300,
  },
  controlPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: 4,
  },
  loadingOverlay: {
    backgroundColor: palette.teal50,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.teal200,
  },
  loadingText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal800,
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
    ...shadows.sm,
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
    borderWidth: 1,
    borderColor: palette.teal200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  verificationTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: palette.teal900,
  },
  verificationText: {
    fontSize: typography.sizes.xs,
    color: palette.teal800,
    marginTop: 1,
  },
  badgeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  aiNotesBox: {
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  aiNotesText: {
    fontSize: typography.sizes.xs,
    color: palette.slate600,
  },
  draftCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate600,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  metaSplitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    gap: 4,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  addMedBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
  },
  medDraftCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  medCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  medIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medNameInput: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    borderBottomWidth: 1,
    borderBottomColor: palette.teal300,
    paddingVertical: 2,
  },
  audioMedBtn: {
    padding: spacing.xs,
    backgroundColor: palette.teal50,
    borderRadius: borderRadius.full,
  },
  deleteMedBtn: {
    padding: spacing.xs,
  },
  fieldSubLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate500,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  uncertainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.warning50,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  uncertainText: {
    fontSize: typography.sizes.xs,
    color: palette.warning600,
    flex: 1,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  patternPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  patternPillActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal700,
  },
  patternPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  patternPillTextActive: {
    color: palette.white,
    fontWeight: '700',
  },
  foodPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  foodPillActive: {
    backgroundColor: palette.blue600,
    borderColor: palette.blue700,
  },
  foodPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  foodPillTextActive: {
    color: palette.white,
    fontWeight: '700',
  },
  schedulePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  schedulePreviewText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal800,
  },
  retryOcrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  retryOcrText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '700',
    color: palette.teal700,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate300,
  },
  editBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate700,
  },
});
