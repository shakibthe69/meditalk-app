export interface DiseaseCategory {
  id: number;
  nameEn: string;
  nameBn: string;
  slug: string;
  icon?: string;
  descriptionEn?: string;
  descriptionBn?: string;
  displayOrder?: number;
  diseaseCount?: number;
}

export interface DiseaseSummary {
  id: number;
  nameEn: string;
  nameBn: string;
  slug: string;
  categoryId: number;
  categoryNameEn: string;
  categoryNameBn: string;
  categoryIcon?: string;
  subcategoryEn?: string;
  subcategoryBn?: string;
  shortOverviewEn?: string;
  shortOverviewBn?: string;
  isPopular?: boolean;
  viewCount?: number;
  status?: string;
}

export interface DiseaseSymptom {
  id: number;
  symptomEn: string;
  symptomBn: string;
  isPrimary?: boolean;
}

export interface DiseaseCause {
  id: number;
  causeEn: string;
  causeBn: string;
}

export interface DiseaseRiskFactor {
  id: number;
  factorEn: string;
  factorBn: string;
}

export interface DiseaseMedicineInfo {
  id: number;
  nameEn: string;
  nameBn: string;
  drugClassEn?: string;
  drugClassBn?: string;
  generalInfoEn?: string;
  generalInfoBn?: string;
  disclaimerEn?: string;
  disclaimerBn?: string;
}

export interface DiseaseWarningSign {
  id: number;
  signEn: string;
  signBn: string;
  isEmergency?: boolean;
}

export interface RelatedDisease {
  id: number;
  nameEn: string;
  nameBn: string;
  slug: string;
}

export interface DiseaseDetail {
  id: number;
  nameEn: string;
  nameBn: string;
  slug: string;
  categoryId: number;
  categoryNameEn: string;
  categoryNameBn: string;
  categoryIcon?: string;
  subcategoryEn?: string;
  subcategoryBn?: string;
  alternativeNamesEn?: string;
  alternativeNamesBn?: string;
  overviewEn?: string;
  overviewBn?: string;
  diagnosisEn?: string;
  diagnosisBn?: string;
  treatmentOverviewEn?: string;
  treatmentOverviewBn?: string;
  homeCareEn?: string;
  homeCareBn?: string;
  dietLifestyleEn?: string;
  dietLifestyleBn?: string;
  preventionEn?: string;
  preventionBn?: string;
  doctorVisitEn?: string;
  doctorVisitBn?: string;
  emergencyEn?: string;
  emergencyBn?: string;
  durationEn?: string;
  durationBn?: string;
  isPopular?: boolean;
  viewCount?: number;
  status?: string;
  sourceName?: string;
  sourceUrl?: string;
  referenceNote?: string;
  lastReviewedAt?: string;

  symptoms: DiseaseSymptom[];
  causes: DiseaseCause[];
  riskFactors: DiseaseRiskFactor[];
  medicines: DiseaseMedicineInfo[];
  warningSigns: DiseaseWarningSign[];
  relatedDiseases: RelatedDisease[];
}
