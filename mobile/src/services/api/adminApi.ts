import { apiClient } from './apiClient';
import { HelpRequest } from './supportApi';
export type { HelpRequest };

// ---------------------------------------------------------------------------
// Types — mirror of the backend AdminDtos records.
// ---------------------------------------------------------------------------

export interface AdminThresholds {
  inactiveMonitorDays: number;
  inactiveFollowUpDays: number;
  inactiveHighPriorityDays: number;
  unconfirmedDosesFollowUp: number;
  unconfirmedDosesHighPriority: number;
  lowAdherencePercent: number;
  prescriptionExpiryWarningDays: number;
  missedDoseAlertAggregation: number;
}

export interface AdminAlert {
  type: 'FOLLOW_UP' | 'HELP_REQUEST' | string;
  patientId: number | null;
  patientName: string | null;
  priority: string;
  message: string | null;
  at: string | null;
}

export interface AdminDashboard {
  totalPatients: number;
  activeToday: number;
  inactive2PlusDays: number;
  missedMedicationAlerts: number;
  highPriorityFollowUps: number;
  openFollowUps: number;
  openSupportRequests: number;
  alerts: AdminAlert[];
  thresholds: AdminThresholds;
}

export interface PatientSummary {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  bloodGroup: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
  inactiveDays: number | null;
  scheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  unconfirmedDoses: number;
  adherencePercent: number | null;
  followUpPriority: string;
  followUpStatus: string;
  followUpId: number | null;
  prescriptionStatus: string;
  followUpCallsOptIn: boolean;
}

export interface MedicationInfo {
  id: number;
  name: string;
  genericName: string | null;
  dose: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  scheduleTimes: string[];
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  pending: number;
  adherencePercent: number | null;
}

export interface PrescriptionInfo {
  id: number;
  diagnosis: string | null;
  doctorName: string | null;
  hospitalOrClinic: string | null;
  prescriptionDate: string | null;
  status: string;
  medicines: string[];
}

export interface PatientActivity {
  accountCreatedAt: string | null;
  lastAppActivity: string | null;
  lastMedicationInteraction: string | null;
  recentActions: string[];
}

export interface AdminNote {
  id: number;
  body: string | null;
  adminName: string | null;
  createdAt: string | null;
}

export interface AdminContact {
  id: number;
  type: string;
  result: string | null;
  note: string | null;
  subject: string | null;
  adminName: string | null;
  createdAt: string | null;
}

export interface FollowUp {
  id: number;
  patientId: number | null;
  patientName: string | null;
  priority: string;
  status: string;
  reason: string | null;
  inactiveDays: number;
  unconfirmedDoses: number;
  adherencePercent: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastContactedAt: string | null;
  resolvedAt: string | null;
}

export interface PatientDetail {
  summary: PatientSummary;
  dateOfBirth: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  helpRequestsOptIn: boolean;
  medications: MedicationInfo[];
  prescriptions: PrescriptionInfo[];
  activity: PatientActivity;
  notes: AdminNote[];
  contacts: AdminContact[];
  followUp: FollowUp | null;
}

export interface AdherenceReport {
  from: string | null;
  to: string | null;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  unconfirmed: number;
  adherencePercent: number;
  patientsWithRecords: number;
}

export interface ActivityReport {
  from: string | null;
  to: string | null;
  totalPatients: number;
  activeInPeriod: number;
  inactive2PlusDays: number;
  inactive3PlusDays: number;
  newPatients: number;
}

export interface AuditEntry {
  id: number;
  adminName: string | null;
  action: string;
  patientId: number | null;
  detail: string | null;
  createdAt: string | null;
}

export interface PatientQuery {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  adherence?: 'OK' | 'LOW' | string;
  priority?: string;
  minMissedDoses?: number;
  limit?: number;
}

export interface ContactPayload {
  type?: 'PHONE' | 'MESSAGE' | 'NOTIFICATION';
  result?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// API — every call hits an ADMIN-only backend endpoint.
// ---------------------------------------------------------------------------

export const adminApi = {
  dashboard: async (): Promise<AdminDashboard> => {
    const res = await apiClient.get('/api/admin/dashboard');
    return res.data.data;
  },

  settings: async (): Promise<AdminThresholds> => {
    const res = await apiClient.get('/api/admin/settings');
    return res.data.data;
  },

  patients: async (query: PatientQuery = {}): Promise<PatientSummary[]> => {
    const res = await apiClient.get('/api/admin/patients', { params: query });
    return res.data.data;
  },

  inactivePatients: async (): Promise<PatientSummary[]> => {
    const res = await apiClient.get('/api/admin/patients/inactive');
    return res.data.data;
  },

  adherenceList: async (): Promise<PatientSummary[]> => {
    const res = await apiClient.get('/api/admin/medication-adherence');
    return res.data.data;
  },

  patientDetail: async (id: number | string): Promise<PatientDetail> => {
    const res = await apiClient.get(`/api/admin/patients/${id}`);
    return res.data.data;
  },

  patientMedications: async (id: number | string): Promise<MedicationInfo[]> => {
    const res = await apiClient.get(`/api/admin/patients/${id}/medications`);
    return res.data.data;
  },

  addNote: async (id: number | string, body: string): Promise<AdminNote> => {
    const res = await apiClient.post(`/api/admin/patients/${id}/notes`, { body });
    return res.data.data;
  },

  sendNotification: async (
    id: number | string,
    title: string,
    body: string
  ): Promise<AdminContact> => {
    const res = await apiClient.post(`/api/admin/patients/${id}/notification`, {
      title,
      body,
    });
    return res.data.data;
  },

  followUps: async (status?: string): Promise<FollowUp[]> => {
    const res = await apiClient.get('/api/admin/follow-ups', {
      params: status ? { status } : {},
    });
    return res.data.data;
  },

  contactFollowUp: async (
    id: number | string,
    payload: ContactPayload
  ): Promise<FollowUp> => {
    const res = await apiClient.post(`/api/admin/follow-ups/${id}/contact`, payload);
    return res.data.data;
  },

  resolveFollowUp: async (id: number | string): Promise<FollowUp> => {
    const res = await apiClient.post(`/api/admin/follow-ups/${id}/resolve`);
    return res.data.data;
  },

  helpRequests: async (status?: string): Promise<HelpRequest[]> => {
    const res = await apiClient.get('/api/admin/help-requests', {
      params: status ? { status } : {},
    });
    return res.data.data;
  },

  updateHelpRequest: async (
    id: number | string,
    status: string,
    note?: string
  ): Promise<HelpRequest> => {
    const res = await apiClient.patch(`/api/admin/help-requests/${id}`, {
      status,
      note,
    });
    return res.data.data;
  },

  adherenceReport: async (from?: string, to?: string): Promise<AdherenceReport> => {
    const res = await apiClient.get('/api/admin/reports/adherence', {
      params: { from, to },
    });
    return res.data.data;
  },

  activityReport: async (from?: string, to?: string): Promise<ActivityReport> => {
    const res = await apiClient.get('/api/admin/reports/activity', {
      params: { from, to },
    });
    return res.data.data;
  },

  auditLogs: async (): Promise<AuditEntry[]> => {
    const res = await apiClient.get('/api/admin/audit-logs');
    return res.data.data;
  },
};
