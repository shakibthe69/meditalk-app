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
} from 'lucide-react-native';

interface AddPrescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSuccess?: () => void;
}

const DOSE_PATTERNS = ['1+1+1', '1+0+1', '0+1+0', '1+0+0', '0+0+1'];

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

  // Editable fields in CONFIRM_AI
  const [doctorName, setDoctorName] = useState('Dr. Prescribing Physician');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('Health Clinic');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('Consultation');
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
    setDoctorName('Dr. Prescribing Physician');
    setHospitalOrClinic('Health Clinic');
    setPrescriptionDate(new Date().toISOString().split('T')[0]);
    setDiagnosis('Consultation');
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

    try {
      const parsed = await prescriptionApi.parseOcrText(sampleText);
      populateDraftFields(parsed);
      setStep('CONFIRM_AI');
    } catch (err) {
      setStep('RAW_TEXT');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeOcrPipeline = async (uri: string) => {
    setIsProcessing(true);
    setProcessingStage(t.processingPrescription);
    voiceService.speakStep('SCANNING', language);

    try {
      const response = await prescriptionApi.scanPrescriptionImage(uri);
      setOcrDraft(response);
      setRawOcrText(response.rawOcrText || '');
      populateDraftFields(response);
      setStep('CONFIRM_AI');
    } catch (error: any) {
      console.warn('OCR Scan fallback:', error);
      // Offline fallback
      setRawOcrText(
        'Dr. S. M. Rahman, MBBS, FCPS\nApollo General Clinic\n\n1. Tab. Napa 500mg\n1+0+1 After meal - 5 days\n2. Cap. Seclo 20mg\n1+0+0 Before meal - 14 days'
      );
      setStep('RAW_TEXT');
    } finally {
      setIsProcessing(false);
    }
  };

  const populateDraftFields = (draft: PrescriptionOcrDraft) => {
    setOcrDraft(draft);
    if (draft.doctorName) setDoctorName(draft.doctorName);
    if (draft.hospitalOrClinic) setHospitalOrClinic(draft.hospitalOrClinic);
    if (draft.prescriptionDate) setPrescriptionDate(draft.prescriptionDate);
    if (draft.diagnosis) setDiagnosis(draft.diagnosis);

    const medsList = draft.medicines || draft.extractedMedicines || [];
    const normalizedMeds: ExtractedMedicine[] = medsList.map((m) => ({
      ...m,
      dosePattern: m.dosePattern || '1+0+0',
      foodInstruction: m.foodInstruction || 'AFTER_MEAL',
      duration: m.duration || '5 days',
      form: m.form || 'TABLET',
    }));
    setMedicines(normalizedMeds);
  };

  const handleRunAiParser = async () => {
    if (!rawOcrText.trim()) return;
    setIsProcessing(true);
    setProcessingStage(t.processingPrescription);
    voiceService.speakStep('SCANNING', language);

    try {
      const parsed = await prescriptionApi.parseOcrText(rawOcrText, selectedImage || undefined);
      populateDraftFields(parsed);
      setStep('CONFIRM_AI');
    } catch (error) {
      Alert.alert('AI Parsing Failed', 'Could not parse text. Please edit or try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Medicine Card Update Helpers
  const updateMedicineField = (index: number, field: keyof ExtractedMedicine, value: any) => {
    setMedicines((prev) => {
      const updated = [...prev];
      const med = { ...updated[index], [field]: value };

      // If dosePattern changed, auto-update timing & schedules
      if (field === 'dosePattern') {
        const parts = String(value).split('+').map((p) => parseInt(p.trim(), 10) || 0);
        const timing: string[] = [];
        if (parts[0] > 0) timing.push('morning');
        if (parts[1] > 0) timing.push('afternoon');
        if (parts[2] > 0) timing.push('night');
        if (parts[3] > 0) timing.push('night');
        med.timing = timing.length > 0 ? timing : ['morning'];
      }

      updated[index] = med;
      return updated;
    });
  };

  const handleDeleteMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMedicine = () => {
    const newMed: ExtractedMedicine = {
      name: '',
      dose: '500mg',
      form: 'TABLET',
      frequency: 'ONCE_DAILY',
      dosePattern: '1+0+0',
      timing: ['morning'],
      foodInstruction: 'AFTER_MEAL',
      duration: '5 days',
      durationDays: 5,
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

    setIsProcessing(true);
    setProcessingStage(language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving prescription and reminders...');
    try {
      const medicinesPayload = medicines.map((med) => {
        const timing = med.timing && med.timing.length > 0 ? med.timing : ['morning'];
        const schedules = timing.map((timeLabel) => {
          let time = '08:00 AM';
          let label: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'CUSTOM' = 'MORNING';

          if (timeLabel.toLowerCase().includes('afternoon') || timeLabel.toLowerCase().includes('noon')) {
            time = '02:00 PM';
            label = 'AFTERNOON';
          } else if (timeLabel.toLowerCase().includes('night') || timeLabel.toLowerCase().includes('dinner')) {
            time = '10:00 PM';
            label = 'NIGHT';
          } else if (timeLabel.toLowerCase().includes('evening')) {
            time = '06:00 PM';
            label = 'EVENING';
          }

          return {
            time,
            label,
            dosageAmount: `1 ${med.form ? med.form.charAt(0) + med.form.slice(1).toLowerCase() : 'Tablet'}`,
            foodInstruction: med.foodInstruction || 'AFTER_MEAL',
            isEnabled: true,
          };
        });

        return {
          name: med.name.trim() || (language === 'bn' ? 'প্রেসক্রিপশন ওষুধ' : 'Prescribed Medicine'),
          genericName: med.genericName,
          dose: med.dose || '500mg',
          form: med.form || 'TABLET',
          frequency: med.frequency || (schedules.length === 3 ? 'THRICE_DAILY' : schedules.length === 2 ? 'TWICE_DAILY' : 'ONCE_DAILY'),
          foodInstruction: med.foodInstruction || 'AFTER_MEAL',
          startDate: prescriptionDate || new Date().toISOString().split('T')[0],
          durationDays: med.durationDays || 5,
          instructions: `${med.foodInstruction || 'After meal'}, Duration: ${med.duration || '5 days'}`,
          isActive: true,
          schedules,
        };
      });

      const savedPrescription = await prescriptionApi.createPrescription({
        doctorName: doctorName || 'Dr. Prescribing Physician',
        hospitalOrClinic: hospitalOrClinic || 'Health Clinic',
        prescriptionDate: prescriptionDate || new Date().toISOString().split('T')[0],
        diagnosis: diagnosis || 'Prescription digitalized via Meditalk AI',
        rawOcrText: rawOcrText || (ocrDraft?.rawOcrText),
        imageUrl: selectedImage || undefined,
        medicines: medicinesPayload,
      });

      // Schedule local notifications for each returned medicine
      if (savedPrescription && savedPrescription.medicines) {
        for (const med of savedPrescription.medicines) {
          await reminderService.scheduleMedicineReminders(med);
        }
      }

      voiceService.speakStep('SAVED', language);
      Alert.alert(t.prescriptionSavedAlert, t.prescriptionSavedMsg);
      resetState();
      (onSaved || onSuccess)?.();
      onClose();
    } catch (error: any) {
      console.warn('Failed to save prescription:', error);
      Alert.alert(t.saveFailedAlert, t.saveFailedMsg);
    } finally {
      setIsProcessing(false);
    }
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
                  <Badge label="Preprocessed" status="PRIMARY" size="sm" />
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
                        value={med.dose}
                        onChangeText={(val) => updateMedicineField(idx, 'dose', val)}
                        placeholder="500mg, 20mg, 10ml"
                        placeholderTextColor={palette.slate400}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.fieldSubLabel}>{t.duration}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={med.duration || '5 days'}
                        onChangeText={(val) => updateMedicineField(idx, 'duration', val)}
                        placeholder="e.g. 5 days, 1 month"
                        placeholderTextColor={palette.slate400}
                      />
                    </View>
                  </View>

                  {/* Dose Pattern Selector (1+1+1, 1+0+1, etc.) */}
                  <Text style={styles.fieldSubLabel}>{t.dosePattern}</Text>
                  <View style={styles.pillSelectorRow}>
                    {DOSE_PATTERNS.map((pattern) => (
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

                  {/* Reminder Times Summary */}
                  <View style={styles.schedulePreviewBox}>
                    <Clock size={14} color={palette.teal700} />
                    <Text style={styles.schedulePreviewText}>
                      {t.reminders}{' '}
                      {(med.timing || ['morning'])
                        .map((slot) => {
                          if (slot === 'morning') return '08:00 AM';
                          if (slot === 'afternoon') return '02:00 PM';
                          if (slot === 'evening') return '06:00 PM';
                          return '10:00 PM';
                        })
                        .join(', ')}
                    </Text>
                  </View>
                </Card>
              ))}

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
    marginBottom: spacing.md,
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
