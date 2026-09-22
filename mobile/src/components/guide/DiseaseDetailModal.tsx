import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { Badge, Card } from '../common';
import { DiseaseDetail } from '../../types';
import { diseaseApi } from '../../services/api/diseaseApi';
import { useSettingsStore } from '../../store/useSettingsStore';
import { voiceService } from '../../services/voice/voiceService';
import {
  X,
  Volume2,
  VolumeX,
  Languages,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Stethoscope,
  HeartPulse,
  Pill,
  Home,
  Utensils,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';

interface DiseaseDetailModalProps {
  visible: boolean;
  diseaseId: number | null;
  onClose: () => void;
  onSelectRelated?: (diseaseId: number) => void;
}

export const DiseaseDetailModal: React.FC<DiseaseDetailModalProps> = ({
  visible,
  diseaseId,
  onClose,
  onSelectRelated,
}) => {
  const { language, setLanguage, t } = useSettingsStore();
  const [activeLang, setActiveLang] = useState<'en' | 'bn'>(language);
  const [disease, setDisease] = useState<DiseaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    symptoms: false,
    causes: false,
    riskFactors: false,
    treatment: false,
    medicines: false,
    homeCare: false,
    diet: false,
    prevention: false,
    warning: false,
    doctor: false,
    emergency: false,
    related: false,
  });

  useEffect(() => {
    setActiveLang(language);
  }, [language]);

  useEffect(() => {
    if (visible && diseaseId) {
      loadDiseaseDetails(diseaseId);
    } else {
      setDisease(null);
      if (isSpeaking) {
        voiceService.stop();
        setIsSpeaking(false);
      }
    }
  }, [visible, diseaseId]);

  const loadDiseaseDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await diseaseApi.getDiseaseById(id);
      setDisease(data);
    } catch (err) {
      console.error('Error loading disease details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleToggleAudio = () => {
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
    } else if (disease) {
      const textToSpeak = activeLang === 'bn'
        ? `${disease.nameBn}। ${disease.overviewBn || ''}`
        : `${disease.nameEn}. ${disease.overviewEn || ''}`;
      
      voiceService.speak(textToSpeak, activeLang);
      setIsSpeaking(true);
    }
  };

  const handleLanguageSwitch = (lang: 'en' | 'bn') => {
    setActiveLang(lang);
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            {/* Language Switch Pills */}
            <View style={styles.langPills}>
              <TouchableOpacity
                style={[styles.langPill, activeLang === 'en' && styles.langPillActive]}
                onPress={() => handleLanguageSwitch('en')}
              >
                <Text style={[styles.langPillText, activeLang === 'en' && styles.langPillTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langPill, activeLang === 'bn' && styles.langPillActive]}
                onPress={() => handleLanguageSwitch('bn')}
              >
                <Text style={[styles.langPillText, activeLang === 'bn' && styles.langPillTextActive]}>বাংলা</Text>
              </TouchableOpacity>
            </View>

            {/* Audio narration button */}
            <TouchableOpacity
              style={[styles.audioBtn, isSpeaking && styles.audioBtnActive]}
              onPress={handleToggleAudio}
              accessibilityLabel="Listen overview"
            >
              {isSpeaking ? (
                <VolumeX size={18} color={palette.white} />
              ) : (
                <Volume2 size={18} color={palette.teal700} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <X size={22} color={palette.slate600} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={palette.teal600} />
            <Text style={styles.loadingText}>
              {activeLang === 'bn' ? 'রোগের তথ্য লোড হচ্ছে...' : 'Loading disease information...'}
            </Text>
          </View>
        ) : disease ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Title Header Card */}
            <View style={styles.titleCard}>
              <View style={styles.badgeRow}>
                <Badge
                  label={activeLang === 'bn' ? (disease.categoryNameBn || 'চিকিৎসা বিভাগ') : (disease.categoryNameEn || 'Medical Category')}
                  status="PRIMARY"
                  size="md"
                />
                {disease.isPopular && (
                  <Badge
                    label={activeLang === 'bn' ? 'জনপ্রিয়' : 'Common'}
                    status="SUCCESS"
                    size="sm"
                  />
                )}
              </View>

              <Text style={styles.mainTitle}>
                {activeLang === 'bn' ? disease.nameBn : disease.nameEn}
              </Text>
              <Text style={styles.subTitle}>
                {activeLang === 'bn' ? disease.nameEn : disease.nameBn}
              </Text>

              {/* Alternative Names */}
              {((activeLang === 'bn' && disease.alternativeNamesBn) || (activeLang === 'en' && disease.alternativeNamesEn)) && (
                <View style={styles.altNamesRow}>
                  <Text style={styles.altNamesLabel}>
                    {activeLang === 'bn' ? 'অন্যান্য নাম:' : 'Also known as:'}
                  </Text>
                  <Text style={styles.altNamesText}>
                    {activeLang === 'bn' ? disease.alternativeNamesBn : disease.alternativeNamesEn}
                  </Text>
                </View>
              )}

              {/* Duration / Course info */}
              {((activeLang === 'bn' && disease.durationBn) || (activeLang === 'en' && disease.durationEn)) && (
                <View style={styles.durationRow}>
                  <Clock size={14} color={palette.teal700} />
                  <Text style={styles.durationText}>
                    {activeLang === 'bn' ? disease.durationBn : disease.durationEn}
                  </Text>
                </View>
              )}
            </View>

            {/* Emergency Warning Banner (If high alert) */}
            {((activeLang === 'bn' && disease.emergencyBn) || (activeLang === 'en' && disease.emergencyEn)) && (
              <View style={styles.emergencyCard}>
                <View style={styles.emergencyHeader}>
                  <AlertOctagon size={20} color={palette.danger700} />
                  <Text style={styles.emergencyTitle}>
                    {activeLang === 'bn' ? 'জরুরি চিকিৎসা সতর্কতা' : 'Emergency Warning Signs'}
                  </Text>
                </View>
                <Text style={styles.emergencyText}>
                  {activeLang === 'bn' ? disease.emergencyBn : disease.emergencyEn}
                </Text>
              </View>
            )}

            {/* Overview Section */}
            {((activeLang === 'bn' && disease.overviewBn) || (activeLang === 'en' && disease.overviewEn)) && (
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Info size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.overview}</Text>
                  </View>
                </View>
                <Text style={styles.bodyParagraph}>
                  {activeLang === 'bn' ? disease.overviewBn : disease.overviewEn}
                </Text>
              </Card>
            )}

            {/* Symptoms Section */}
            {disease.symptoms && disease.symptoms.length > 0 && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('symptoms')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Activity size={18} color={palette.blue600} />
                    <Text style={styles.sectionHeading}>{t.symptoms}</Text>
                  </View>
                  {collapsedSections.symptoms ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.symptoms && (
                  <View style={styles.symptomsList}>
                    {disease.symptoms.map((s, idx) => (
                      <View key={s.id || idx} style={styles.symptomItemRow}>
                        <View style={[styles.bulletDot, s.isPrimary && styles.primaryBulletDot]} />
                        <Text style={[styles.symptomText, s.isPrimary && styles.primarySymptomText]}>
                          {activeLang === 'bn' ? s.symptomBn : s.symptomEn}
                        </Text>
                        {s.isPrimary && (
                          <Badge label={activeLang === 'bn' ? 'প্রধান' : 'Primary'} status="WARNING" size="sm" />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* Causes Section */}
            {disease.causes && disease.causes.length > 0 && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('causes')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <HeartPulse size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.causes}</Text>
                  </View>
                  {collapsedSections.causes ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.causes && (
                  <View style={styles.causesList}>
                    {disease.causes.map((c, idx) => (
                      <View key={c.id || idx} style={styles.causeItemRow}>
                        <CheckCircle2 size={16} color={palette.teal600} style={styles.checkIcon} />
                        <Text style={styles.causeText}>
                          {activeLang === 'bn' ? c.causeBn : c.causeEn}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* Risk Factors Section */}
            {disease.riskFactors && disease.riskFactors.length > 0 && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('riskFactors')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <AlertTriangle size={18} color={palette.warning600} />
                    <Text style={styles.sectionHeading}>{t.riskFactors}</Text>
                  </View>
                  {collapsedSections.riskFactors ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.riskFactors && (
                  <View style={styles.riskList}>
                    {disease.riskFactors.map((r, idx) => (
                      <View key={r.id || idx} style={styles.riskItemRow}>
                        <View style={styles.riskBullet} />
                        <Text style={styles.riskText}>
                          {activeLang === 'bn' ? r.factorBn : r.factorEn}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* Diagnosis Section */}
            {((activeLang === 'bn' && disease.diagnosisBn) || (activeLang === 'en' && disease.diagnosisEn)) && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('diagnosis')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Stethoscope size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.diagnosis}</Text>
                  </View>
                  {collapsedSections.diagnosis ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.diagnosis && (
                  <Text style={styles.bodyParagraph}>
                    {activeLang === 'bn' ? disease.diagnosisBn : disease.diagnosisEn}
                  </Text>
                )}
              </Card>
            )}

            {/* Treatment & Management Section */}
            {((activeLang === 'bn' && disease.treatmentOverviewBn) || (activeLang === 'en' && disease.treatmentOverviewEn)) && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('treatment')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <FileText size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.treatment}</Text>
                  </View>
                  {collapsedSections.treatment ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.treatment && (
                  <Text style={styles.bodyParagraph}>
                    {activeLang === 'bn' ? disease.treatmentOverviewBn : disease.treatmentOverviewEn}
                  </Text>
                )}
              </Card>
            )}

            {/* Educational Medicine Information */}
            {disease.medicines && disease.medicines.length > 0 && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('medicines')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Pill size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.medicineInfo}</Text>
                  </View>
                  {collapsedSections.medicines ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.medicines && (
                  <View style={styles.medicineList}>
                    {disease.medicines.map((m, idx) => (
                      <View key={m.id || idx} style={styles.medicineItemBox}>
                        <View style={styles.medicineHeaderRow}>
                          <Text style={styles.medicineName}>
                            {activeLang === 'bn' ? m.nameBn : m.nameEn}
                          </Text>
                          {(m.drugClassEn || m.drugClassBn) && (
                            <Badge
                              label={activeLang === 'bn' ? (m.drugClassBn || m.drugClassEn || '') : (m.drugClassEn || '')}
                              status="DEFAULT"
                              size="sm"
                            />
                          )}
                        </View>
                        <Text style={styles.medicineDesc}>
                          {activeLang === 'bn' ? m.generalInfoBn : m.generalInfoEn}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.medicineDisclaimerBox}>
                      <AlertTriangle size={14} color={palette.warning700} />
                      <Text style={styles.medicineDisclaimerText}>
                        {activeLang === 'bn'
                          ? 'ওষুধের তথ্য শুধুমাত্র সাধারণ শিক্ষার উদ্দেশ্যে। চিকিৎসকের লিখিত প্রেসক্রিপশন ব্যতীত কখনোই কোনো ওষুধ গ্রহণ করবেন না।'
                          : 'Educational overview only. Never take or adjust medications without direct supervision from a qualified doctor.'}
                      </Text>
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* Home & Supportive Care */}
            {((activeLang === 'bn' && disease.homeCareBn) || (activeLang === 'en' && disease.homeCareEn)) && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('homeCare')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Home size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.homeCare}</Text>
                  </View>
                  {collapsedSections.homeCare ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.homeCare && (
                  <Text style={styles.bodyParagraph}>
                    {activeLang === 'bn' ? disease.homeCareBn : disease.homeCareEn}
                  </Text>
                )}
              </Card>
            )}

            {/* Diet & Lifestyle */}
            {((activeLang === 'bn' && disease.dietLifestyleBn) || (activeLang === 'en' && disease.dietLifestyleEn)) && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('diet')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Utensils size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.dietLifestyle}</Text>
                  </View>
                  {collapsedSections.diet ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.diet && (
                  <Text style={styles.bodyParagraph}>
                    {activeLang === 'bn' ? disease.dietLifestyleBn : disease.dietLifestyleEn}
                  </Text>
                )}
              </Card>
            )}

            {/* Prevention */}
            {((activeLang === 'bn' && disease.preventionBn) || (activeLang === 'en' && disease.preventionEn)) && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('prevention')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <ShieldCheck size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.prevention}</Text>
                  </View>
                  {collapsedSections.prevention ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.prevention && (
                  <Text style={styles.bodyParagraph}>
                    {activeLang === 'bn' ? disease.preventionBn : disease.preventionEn}
                  </Text>
                )}
              </Card>
            )}

            {/* Warning Signs & Red Flags */}
            {disease.warningSigns && disease.warningSigns.length > 0 && (
              <Card style={[styles.sectionCard, styles.warningCardBorder]}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('warning')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <AlertTriangle size={18} color={palette.danger600} />
                    <Text style={[styles.sectionHeading, { color: palette.danger700 }]}>{t.warningSigns}</Text>
                  </View>
                  {collapsedSections.warning ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.warning && (
                  <View style={styles.warningList}>
                    {disease.warningSigns.map((w, idx) => (
                      <View key={w.id || idx} style={styles.warningItemRow}>
                        <AlertTriangle size={14} color={w.isEmergency ? palette.danger600 : palette.warning600} />
                        <Text style={[styles.warningText, w.isEmergency && styles.emergencySignText]}>
                          {activeLang === 'bn' ? w.signBn : w.signEn}
                        </Text>
                        {w.isEmergency && (
                          <Badge label={activeLang === 'bn' ? 'জরুরি' : 'Emergency'} status="DANGER" size="sm" />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* When to See a Doctor */}
            {((activeLang === 'bn' && disease.doctorVisitBn) || (activeLang === 'en' && disease.doctorVisitEn)) && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('doctor')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Stethoscope size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.whenToSeeDoctor}</Text>
                  </View>
                  {collapsedSections.doctor ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.doctor && (
                  <Text style={styles.bodyParagraph}>
                    {activeLang === 'bn' ? disease.doctorVisitBn : disease.doctorVisitEn}
                  </Text>
                )}
              </Card>
            )}

            {/* Related Conditions */}
            {disease.relatedDiseases && disease.relatedDiseases.length > 0 && (
              <Card style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('related')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <HeartPulse size={18} color={palette.teal700} />
                    <Text style={styles.sectionHeading}>{t.relatedConditions}</Text>
                  </View>
                  {collapsedSections.related ? <ChevronDown size={18} color={palette.slate500} /> : <ChevronUp size={18} color={palette.slate500} />}
                </TouchableOpacity>

                {!collapsedSections.related && (
                  <View style={styles.relatedGrid}>
                    {disease.relatedDiseases.map((rel) => (
                      <TouchableOpacity
                        key={rel.id}
                        style={styles.relatedChip}
                        onPress={() => {
                          if (onSelectRelated) {
                            onSelectRelated(rel.id);
                          } else {
                            loadDiseaseDetails(rel.id);
                          }
                        }}
                      >
                        <Text style={styles.relatedChipText}>
                          {activeLang === 'bn' ? rel.nameBn : rel.nameEn}
                        </Text>
                        <ExternalLink size={12} color={palette.teal700} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* Sources & Last Reviewed */}
            <View style={styles.sourcesBox}>
              <Text style={styles.sourcesHeading}>{t.sources}</Text>
              {disease.sourceName && (
                <Text style={styles.sourceNameText}>• {disease.sourceName}</Text>
              )}
              {disease.referenceNote && (
                <Text style={styles.sourceNoteText}>• {disease.referenceNote}</Text>
              )}
              {disease.lastReviewedAt && (
                <Text style={styles.lastReviewedText}>
                  {t.lastReviewed}: {disease.lastReviewedAt}
                </Text>
              )}
            </View>

            {/* Prominent Safety Disclaimer */}
            <View style={styles.disclaimerBox}>
              <ShieldCheck size={18} color={palette.slate500} />
              <Text style={styles.disclaimerText}>
                {t.educationalDisclaimer}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noDiseasesFound}</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  langPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  langPillActive: {
    backgroundColor: palette.teal600,
  },
  langPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  langPillTextActive: {
    color: palette.white,
  },
  audioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  audioBtnActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: palette.slate600,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  titleCard: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  mainTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: palette.slate900,
    lineHeight: 30,
  },
  subTitle: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  altNamesRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  altNamesLabel: {
    fontSize: typography.sizes.xs - 1,
    color: palette.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  altNamesText: {
    fontSize: typography.sizes.xs + 1,
    color: palette.slate700,
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  durationText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal800,
  },
  emergencyCard: {
    backgroundColor: palette.danger50,
    borderWidth: 1.5,
    borderColor: palette.danger200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  emergencyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.danger800,
  },
  emergencyText: {
    fontSize: typography.sizes.xs + 1,
    color: palette.danger900,
    lineHeight: 19,
  },
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  warningCardBorder: {
    borderColor: palette.warning300,
    backgroundColor: '#FFFCF5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  bodyParagraph: {
    fontSize: typography.sizes.sm,
    color: palette.slate700,
    lineHeight: 22,
  },
  symptomsList: {
    gap: spacing.xs + 2,
  },
  symptomItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.blue500,
  },
  primaryBulletDot: {
    backgroundColor: palette.warning600,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  symptomText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate800,
  },
  primarySymptomText: {
    fontWeight: '600',
  },
  causesList: {
    gap: spacing.xs + 2,
  },
  causeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  checkIcon: {
    marginTop: 2,
  },
  causeText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate700,
    lineHeight: 20,
  },
  riskList: {
    gap: spacing.xs + 2,
  },
  riskItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  riskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.warning500,
    marginTop: 6,
  },
  riskText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate700,
    lineHeight: 20,
  },
  medicineList: {
    gap: spacing.sm,
  },
  medicineItemBox: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  medicineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate900,
  },
  medicineDesc: {
    fontSize: typography.sizes.xs + 1,
    color: palette.slate600,
    lineHeight: 18,
  },
  medicineDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: palette.warning50,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  medicineDisclaimerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: palette.warning800,
    lineHeight: 17,
  },
  warningList: {
    gap: spacing.xs + 2,
  },
  warningItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  warningText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate800,
  },
  emergencySignText: {
    fontWeight: '700',
    color: palette.danger800,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  relatedChipText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    color: palette.teal800,
  },
  sourcesBox: {
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sourcesHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate600,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  sourceNameText: {
    fontSize: typography.sizes.xs + 1,
    color: palette.slate700,
    lineHeight: 18,
  },
  sourceNoteText: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  lastReviewedText: {
    fontSize: typography.sizes.xs - 1,
    color: palette.slate400,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: palette.slate500,
  },
});
