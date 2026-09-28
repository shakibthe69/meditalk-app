import { Platform } from 'react-native';
import { apiClient, getApiBaseUrl } from './apiClient';
import { DoctorPortalAccount, PatientThread, DoctorMessage, DoctorPost } from '../../types';

export const doctorPortalApi = {
  getMyAccount: async (): Promise<DoctorPortalAccount> => {
    const res = await apiClient.get('/api/doctor-portal/me');
    return res.data.data;
  },

  setAvailability: async (isAvailable: boolean): Promise<DoctorPortalAccount> => {
    const res = await apiClient.put('/api/doctor-portal/availability', { isAvailable });
    return res.data.data;
  },

  /** Updates the doctor's own professional profile (partial payload). */
  updateProfile: async (data: Partial<DoctorPortalAccount>): Promise<DoctorPortalAccount> => {
    const res = await apiClient.put('/api/doctor-portal/profile', data);
    return res.data.data;
  },

  getPatientThreads: async (): Promise<PatientThread[]> => {
    const res = await apiClient.get('/api/doctor-portal/patients');
    return res.data.data;
  },

  getThread: async (patientId: string): Promise<DoctorMessage[]> => {
    const res = await apiClient.get(`/api/doctor-portal/patients/${patientId}/messages`);
    return res.data.data;
  },

  sendMessage: async (patientId: string, body: string): Promise<DoctorMessage> => {
    const res = await apiClient.post('/api/doctor-portal/messages', { patientId, body });
    return res.data.data;
  },

  getMyPosts: async (): Promise<DoctorPost[]> => {
    const res = await apiClient.get('/api/doctor-portal/posts');
    return res.data.data;
  },

  createPost: async (data: { title: string; body: string; category?: string; imageUrl?: string }): Promise<DoctorPost> => {
    const res = await apiClient.post('/api/doctor-portal/posts', data);
    return res.data.data;
  },

  uploadPostImage: async (fileUri: string, fileName: string = 'post-image.jpg', mimeType: string = 'image/jpeg'): Promise<string> => {
    const formData = new FormData();
    if (Platform.OS === 'web' || fileUri.startsWith('data:') || fileUri.startsWith('blob:')) {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const res = await apiClient.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    let fileUrl: string = res.data.data.fileUrl;
    if (fileUrl && fileUrl.startsWith('/')) {
      fileUrl = getApiBaseUrl() + fileUrl;
    }
    return fileUrl;
  },

  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/doctor-portal/posts/${id}`);
  },

  // Patient-facing endpoints
  getAllPosts: async (): Promise<DoctorPost[]> => {
    const res = await apiClient.get('/api/doctor-posts');
    const posts: DoctorPost[] = res.data.data || [];
    return posts.map((p) => {
      if (p.imageUrl && p.imageUrl.startsWith('/')) {
        return { ...p, imageUrl: getApiBaseUrl() + p.imageUrl };
      }
      return p;
    });
  },

  getInbox: async (): Promise<DoctorMessage[]> => {
    const res = await apiClient.get('/api/doctor-messages/inbox');
    return res.data.data;
  },

  /** Patient's chat thread with one doctor (marks the doctor's messages read). */
  getPatientThread: async (doctorAccountId: string): Promise<DoctorMessage[]> => {
    const res = await apiClient.get(`/api/doctor-messages/thread/${doctorAccountId}`);
    return res.data.data;
  },

  /** Doctors the patient can call, SMS or message. */
  getDoctorDirectory: async (): Promise<DoctorPortalAccount[]> => {
    const res = await apiClient.get('/api/doctor-portal/directory');
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get('/api/doctor-messages/unread-count');
    return res.data.data;
  },

  sendPatientMessage: async (doctorAccountId: string, body: string): Promise<DoctorMessage> => {
    const res = await apiClient.post('/api/doctor-messages', { doctorAccountId, body });
    return res.data.data;
  },
};
