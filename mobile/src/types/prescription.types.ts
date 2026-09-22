import { Medicine, MedicineSchedule, FoodInstruction } from './medicine.types';

export interface ExtractedMedicine {
  name: string;
  genericName?: string;
  dose: string;
  form?: string;
  frequency: string;
  dosePattern?: string; // e.g. "1+1+1", "1+0+1"
  timing: string[];
  foodInstruction: string;
  duration?: string;
  durationDays?: number;
  isUncertain?: boolean;
  confidenceScore?: number;
  schedules?: Array<{
    time: string;
    label: string;
    dosageAmount: string;
    foodInstruction: string;
    isEnabled: boolean;
  }>;
}

export interface Prescription {
  id: string;
  userId: string;
  doctorName: string;
  hospitalOrClinic?: string;
  prescriptionDate: string; // YYYY-MM-DD
  diagnosis?: string;
  notes?: string;
  imageUrl?: string;
  rawOcrText?: string;
  medicines: Medicine[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionOcrDraft {
  doctorName?: string;
  hospitalOrClinic?: string;
  prescriptionDate?: string;
  diagnosis?: string;
  rawOcrText: string;
  imageUrl?: string;
  medicines?: ExtractedMedicine[];
  extractedMedicines?: ExtractedMedicine[];
  detectedLanguages?: string[];
  confidenceScore?: number;
  preprocessingSummary?: string;
  notes?: string;
  requiresUserVerification?: boolean;
  safetyDisclaimer?: string;
  imageUri?: string;
}
