import { Medicine } from './medicine.types';

export interface ExtractedMedicine {
  name: string;
  genericName?: string;
  dose: string;
  frequency: string;
  timing: string[];
  foodInstruction: string;
  duration?: string;
  confidenceScore?: number;
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
  extractedMedicines: ExtractedMedicine[];
  imageUri?: string;
}
