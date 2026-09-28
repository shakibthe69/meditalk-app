import { Platform } from 'react-native';
import { apiClient, getApiBaseUrl } from './apiClient';
import { Prescription, PrescriptionOcrDraft } from '../../types';

export const prescriptionApi = {
  getPrescriptions: async (): Promise<Prescription[]> => {
    const res = await apiClient.get('/api/prescriptions');
    return res.data.data;
  },

  createPrescription: async (data: any, allowDuplicate = false): Promise<Prescription> => {
    const res = await apiClient.post('/api/prescriptions', { ...data, allowDuplicate });
    return res.data.data;
  },

  /** True when the backend rejected the save because the same prescription already exists. */
  isDuplicatePrescriptionError: (error: any): boolean => error?.response?.status === 409,

  deletePrescription: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/prescriptions/${id}`);
  },

  parseOcrText: async (rawText: string, imageUri?: string): Promise<PrescriptionOcrDraft> => {
    const res = await apiClient.post('/api/ocr/parse', { rawText, imageUri });
    return res.data.data;
  },

  scanPrescriptionImage: async (fileUri: string, fileName: string = 'prescription.jpg', mimeType: string = 'image/jpeg'): Promise<PrescriptionOcrDraft> => {
    const formData = new FormData();
    if (Platform.OS === 'web' || fileUri.startsWith('data:') || fileUri.startsWith('blob:')) {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('image', blob, fileName);
      formData.append('file', blob, fileName);
    } else {
      const filePayload = {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any;
      formData.append('image', filePayload);
      formData.append('file', filePayload);
    }

    const res = await apiClient.post('/api/prescriptions/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data: PrescriptionOcrDraft = res.data.data;
    if (data.imageUrl && data.imageUrl.startsWith('/')) {
      data.imageUrl = getApiBaseUrl() + data.imageUrl;
    }
    data.imageUri = fileUri;
    return data;
  },
};
