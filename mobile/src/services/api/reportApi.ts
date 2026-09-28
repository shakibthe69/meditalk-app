import { Platform } from 'react-native';
import { apiClient, getApiBaseUrl } from './apiClient';
import { MedicalReport } from '../../types';

export const reportApi = {
  getReports: async (type?: string): Promise<MedicalReport[]> => {
    const res = await apiClient.get('/api/reports', { params: { type } });
    return res.data.data;
  },

  createReport: async (data: any): Promise<MedicalReport> => {
    const res = await apiClient.post('/api/reports', data);
    return res.data.data;
  },

  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/reports/${id}`);
  },

  uploadFile: async (fileUri: string, fileName: string = 'medical_report.jpg', mimeType: string = 'image/jpeg'): Promise<{ fileUrl: string; fileName: string; fileSizeBytes: number }> => {
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

    const data = res.data.data;
    if (data.fileUrl && data.fileUrl.startsWith('/')) {
      data.fileUrl = getApiBaseUrl() + data.fileUrl;
    }

    return data;
  },
};
