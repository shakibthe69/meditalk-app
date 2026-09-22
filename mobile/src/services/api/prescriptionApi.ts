import { apiClient, getApiBaseUrl } from './apiClient';
import { Prescription, PrescriptionOcrDraft } from '../../types';

export const prescriptionApi = {
  getPrescriptions: async (): Promise<Prescription[]> => {
    const res = await apiClient.get('/api/prescriptions');
    return res.data.data;
  },

  createPrescription: async (data: any): Promise<Prescription> => {
    const res = await apiClient.post('/api/prescriptions', data);
    return res.data.data;
  },

  deletePrescription: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/prescriptions/${id}`);
  },

  parseOcrText: async (rawText: string, imageUri?: string): Promise<PrescriptionOcrDraft> => {
    const res = await apiClient.post('/api/ocr/parse', { rawText, imageUri });
    return res.data.data;
  },

  scanPrescriptionImage: async (fileUri: string, fileName: string = 'prescription.jpg', mimeType: string = 'image/jpeg'): Promise<PrescriptionOcrDraft> => {
    const formData = new FormData();
    if (fileUri.startsWith('data:') || fileUri.startsWith('blob:') || (typeof window !== 'undefined' && !fileUri.startsWith('file:'))) {
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

    const res = await apiClient.post('/api/prescriptions/scan', formData, {
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
