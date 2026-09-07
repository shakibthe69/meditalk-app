export type HistoryCategory = 'ALL' | 'PRESCRIPTION' | 'MEDICINE' | 'REPORT' | 'DOCTOR_VISIT';

export interface MedicalHistoryItem {
  id: string;
  category: 'PRESCRIPTION' | 'MEDICINE' | 'REPORT' | 'DOCTOR_VISIT';
  title: string;
  subtitle: string;
  date: string; // ISO or YYYY-MM-DD
  doctorName?: string;
  facilityName?: string;
  details?: string;
  referenceId?: string; // ID of the prescription, report, or medicine
  badgeLabel?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
}
