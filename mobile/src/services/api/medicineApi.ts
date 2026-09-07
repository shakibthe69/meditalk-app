import { apiClient } from './apiClient';
import { Medicine, MedicineLog, AdherenceStats, LogStatus } from '../../types';

export const medicineApi = {
  getMedicines: async (activeOnly?: boolean): Promise<Medicine[]> => {
    const res = await apiClient.get('/api/medicines', {
      params: { activeOnly },
    });
    return res.data.data;
  },

  createMedicine: async (data: Partial<Medicine>): Promise<Medicine> => {
    const res = await apiClient.post('/api/medicines', data);
    return res.data.data;
  },

  updateMedicine: async (id: string, data: Partial<Medicine>): Promise<Medicine> => {
    const res = await apiClient.put(`/api/medicines/${id}`, data);
    return res.data.data;
  },

  toggleActive: async (id: string): Promise<Medicine> => {
    const res = await apiClient.patch(`/api/medicines/${id}/toggle-active`);
    return res.data.data;
  },

  deleteMedicine: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/medicines/${id}`);
  },

  getTodayLogs: async (): Promise<MedicineLog[]> => {
    const res = await apiClient.get('/api/medicine-logs/today');
    return res.data.data;
  },

  updateLogStatus: async (logId: string, status: LogStatus): Promise<MedicineLog> => {
    const res = await apiClient.patch(`/api/medicine-logs/${logId}/status`, null, {
      params: { status },
    });
    return res.data.data;
  },

  getAdherence: async (): Promise<AdherenceStats> => {
    const res = await apiClient.get('/api/medicine-logs/adherence');
    return res.data.data;
  },
};
