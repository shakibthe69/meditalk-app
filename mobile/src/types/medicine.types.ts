export type FoodInstruction = 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH' | 'NO_RESTRICTION';

export type DoseFrequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'FOUR_TIMES_DAILY' | 'AS_NEEDED' | 'CUSTOM';

export type LogStatus = 'TAKEN' | 'SKIPPED' | 'MISSED' | 'PENDING';

export interface MedicineSchedule {
  id: string;
  medicineId: string;
  time: string; // "08:00", "14:00", "20:00"
  label: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'CUSTOM';
  dosageAmount: string; // e.g., "1 Tablet", "5ml"
  foodInstruction: FoodInstruction;
  isEnabled: boolean;
}

export interface Medicine {
  id: string;
  userId: string;
  prescriptionId?: string;
  name: string;
  genericName?: string;
  dose: string; // e.g. "500mg"
  form: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'DROPS' | 'OINTMENT' | 'OTHER';
  frequency: DoseFrequency;
  foodInstruction: FoodInstruction;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  durationDays?: number;
  instructions?: string;
  isActive: boolean;
  schedules: MedicineSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicineLog {
  id: string;
  medicineId: string;
  scheduleId?: string;
  medicineName: string;
  dose: string;
  scheduledTime: string; // ISO string
  takenTime?: string;    // ISO string
  status: LogStatus;
  notes?: string;
  foodInstruction?: FoodInstruction;
}

export interface AdherenceStats {
  takenPercentage: number;
  missedPercentage: number;
  skippedPercentage: number;
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  totalSkipped: number;
}
