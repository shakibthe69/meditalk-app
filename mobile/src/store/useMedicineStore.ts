import { create } from 'zustand';
import { Medicine, MedicineLog, LogStatus, AdherenceStats } from '../types';
import { medicineApi } from '../services/api';
import { reminderService } from '../services/notifications/reminderService';

interface MedicineState {
  medicines: Medicine[];
  todayLogs: MedicineLog[];
  adherence: AdherenceStats;
  isLoading: boolean;

  fetchMedicines: () => Promise<void>;
  fetchTodayLogs: () => Promise<void>;
  fetchAdherence: () => Promise<void>;
  markDose: (logId: string, status: LogStatus) => Promise<void>;
  addMedicine: (medicine: Partial<Medicine>) => Promise<Medicine | null>;
  deleteMedicine: (medicineId: string) => Promise<void>;
  toggleMedicineStatus: (medicineId: string) => Promise<void>;
}

const DEFAULT_ADHERENCE: AdherenceStats = {
  takenPercentage: 92,
  missedPercentage: 5,
  skippedPercentage: 3,
  totalScheduled: 0,
  totalTaken: 0,
  totalMissed: 0,
  totalSkipped: 0,
};

export const useMedicineStore = create<MedicineState>((set, get) => ({
  medicines: [],
  todayLogs: [],
  adherence: DEFAULT_ADHERENCE,
  isLoading: false,

  fetchMedicines: async () => {
    set({ isLoading: true });
    try {
      const data = await medicineApi.getMedicines();
      set({ medicines: data, isLoading: false });
    } catch (error) {
      console.warn('Failed to fetch medicines from backend:', error);
      set({ isLoading: false });
    }
  },

  fetchTodayLogs: async () => {
    try {
      const logs = await medicineApi.getTodayLogs();
      set({ todayLogs: logs });
      get().fetchAdherence();
    } catch (error) {
      console.warn('Failed to fetch today logs:', error);
    }
  },

  fetchAdherence: async () => {
    try {
      const stats = await medicineApi.getAdherence();
      set({ adherence: stats });
    } catch (error) {
      console.warn('Failed to fetch adherence:', error);
    }
  },

  markDose: async (logId: string, status: LogStatus) => {
    // Optimistic UI update
    const prevLogs = get().todayLogs;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    set({
      todayLogs: prevLogs.map((l) =>
        l.id === logId
          ? {
              ...l,
              status,
              takenTime: status === 'TAKEN' ? nowTime : undefined,
            }
          : l
      ),
    });

    try {
      await medicineApi.updateLogStatus(logId, status);
      await get().fetchAdherence();
    } catch (error) {
      console.warn('Failed to sync dose update to backend:', error);
    }
  },

  addMedicine: async (medData) => {
    set({ isLoading: true });
    try {
      const created = await medicineApi.createMedicine(medData);
      set((state) => ({
        medicines: [created, ...state.medicines],
        isLoading: false,
      }));
      // Schedule notifications for this medicine
      reminderService.scheduleMedicineReminders(created);
      get().fetchTodayLogs();
      return created;
    } catch (error) {
      console.warn('Failed to add medicine:', error);
      set({ isLoading: false });
      return null;
    }
  },

  deleteMedicine: async (medicineId: string) => {
    set((state) => ({
      medicines: state.medicines.filter((m) => m.id !== medicineId),
      todayLogs: state.todayLogs.filter((l) => l.medicineId !== medicineId),
    }));

    try {
      await reminderService.cancelMedicineReminders(medicineId);
      await medicineApi.deleteMedicine(medicineId);
      get().fetchAdherence();
    } catch (error) {
      console.warn('Failed to delete medicine on backend:', error);
    }
  },

  toggleMedicineStatus: async (medicineId: string) => {
    try {
      const updated = await medicineApi.toggleActive(medicineId);
      set((state) => ({
        medicines: state.medicines.map((m) => (m.id === medicineId ? updated : m)),
      }));
      if (updated.isActive) {
        reminderService.scheduleMedicineReminders(updated);
      } else {
        reminderService.cancelMedicineReminders(medicineId);
      }
      get().fetchTodayLogs();
    } catch (error) {
      console.warn('Failed to toggle medicine status:', error);
    }
  },
}));
