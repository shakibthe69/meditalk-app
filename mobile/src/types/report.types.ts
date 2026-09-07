export type ReportType =
  | 'BLOOD_TEST'
  | 'URINE_TEST'
  | 'X_RAY'
  | 'MRI'
  | 'CT_SCAN'
  | 'ULTRASOUND'
  | 'ECG'
  | 'PATHOLOGY'
  | 'OTHER';

export interface MedicalReport {
  id: string;
  userId: string;
  doctorId?: string;
  doctorName?: string;
  title: string;
  type: ReportType;
  testDate: string; // YYYY-MM-DD
  hospitalOrLab: string;
  notes?: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'PDF';
  fileName: string;
  fileSizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}
