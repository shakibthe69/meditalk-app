import { apiClient } from './apiClient';
import { Doctor } from '../../types';

export const doctorApi = {
  getDoctors: async (): Promise<Doctor[]> => {
    const res = await apiClient.get('/api/doctors');
    return res.data.data;
  },

  createDoctor: async (data: Partial<Doctor>): Promise<Doctor> => {
    const res = await apiClient.post('/api/doctors', data);
    return res.data.data;
  },

  deleteDoctor: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/doctors/${id}`);
  },
};
