import { Medicine, MedicineSchedule, FoodInstruction } from './medicine.types';

export interface ExtractedMedicine {
  name: string;
  genericName?: string;
  /** null / empty when the prescription did not state a strength — never auto-filled. */
  dose: string | null;
  form?: string | null;
  frequency: string | null;
  dosePattern?: string | null; // e.g. "1+1+1", "1+0+1"
  timing: string[];
  foodInstruction: string | null;
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
  /** "gemini" when the draft was structured by the prescription AI, otherwise "rule-based". */
  extractionSource?: 'gemini' | 'rule-based' | string;
  /** Which OCR provider read the image ("ocr.space", "google-cloud-vision", ...). */
  ocrEngine?: string;
  /** Human readable notes about what happened while reading the prescription. */
  aiNotes?: string;
  requiresUserVerification?: boolean;
  safetyDisclaimer?: string;
  imageUri?: string;
}
