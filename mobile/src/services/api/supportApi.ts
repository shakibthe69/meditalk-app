import { apiClient } from './apiClient';
import { User } from '../../types';

export type HelpRequestType = 'MEDICATION' | 'APP_SUPPORT' | 'GENERAL' | 'EMERGENCY';
export type HelpRequestStatus = 'NEW' | 'ACKNOWLEDGED' | 'CONTACTED' | 'RESOLVED';

export interface HelpRequest {
  id: number;
  patientId: number | null;
  patientName: string | null;
  patientPhone: string | null;
  type: HelpRequestType | string;
  message: string | null;
  status: HelpRequestStatus | string;
  resolutionNote: string | null;
  handledBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Patient-facing side of the follow-up system: "I need help" requests are
 * reviewed by an authorized admin — the app never infers a medical emergency
 * on its own, the patient chooses the request type.
 */
export const supportApi = {
  createHelpRequest: async (
    type: HelpRequestType,
    message: string
  ): Promise<HelpRequest> => {
    const res = await apiClient.post('/api/help-requests', { type, message });
    return res.data.data;
  },

  myHelpRequests: async (): Promise<HelpRequest[]> => {
    const res = await apiClient.get('/api/help-requests/mine');
    return res.data.data;
  },

  /**
   * Explicit consent for automated medication follow-up calls (future AI
   * voice feature). Off by default; the patient can turn it off any time.
   */
  setFollowUpCallsConsent: async (optIn: boolean): Promise<User> => {
    const res = await apiClient.put('/api/follow-up-consent', {
      followUpCallsOptIn: optIn,
    });
    return res.data.data;
  },
};
