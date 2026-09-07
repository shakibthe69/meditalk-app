import { apiClient } from './apiClient';
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
};
