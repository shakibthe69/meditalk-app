import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Medicine, MedicineSchedule } from '../../types';

// Configure default notification handler
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const reminderService = {
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  },

  scheduleMedicineReminders: async (medicine: Medicine): Promise<void> => {
    if (Platform.OS === 'web') return;

    try {
      await reminderService.cancelMedicineReminders(medicine.id);

      if (!medicine.isActive || !medicine.schedules) return;

      for (const schedule of medicine.schedules) {
        if (!schedule.isEnabled) continue;

        const timeParts = parseTimeString(schedule.time);
        if (!timeParts) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 Medicine Reminder: ${medicine.name}`,
            body: `Take ${schedule.dosageAmount || '1 dose'} - ${formatFoodInstruction(schedule.foodInstruction || medicine.foodInstruction)}`,
            data: {
              medicineId: medicine.id,
              scheduleId: schedule.id,
              medicineName: medicine.name,
            },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: timeParts.hour,
            minute: timeParts.minute,
          },
        });
      }
    } catch (e) {
      console.warn('Failed to schedule reminder:', e);
    }
  },

  cancelMedicineReminders: async (medicineId: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.medicineId === medicineId) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (e) {
      console.warn('Failed to cancel reminders:', e);
    }
  },
};

const parseTimeString = (timeStr: string): { hour: number; minute: number } | null => {
  try {
    const isPM = timeStr.toUpperCase().includes('PM');
    const isAM = timeStr.toUpperCase().includes('AM');
    const clean = timeStr.replace(/AM|PM/gi, '').trim();
    const [hStr, mStr] = clean.split(':');
    let hour = parseInt(hStr, 10);
    const minute = parseInt(mStr || '0', 10);

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return { hour, minute };
  } catch {
    return null;
  }
};

const formatFoodInstruction = (inst?: string): string => {
  switch (inst) {
    case 'BEFORE_MEAL':
      return 'Before meal';
    case 'AFTER_MEAL':
      return 'After meal';
    case 'WITH_MEAL':
      return 'With meal';
    case 'EMPTY_STOMACH':
      return 'Empty stomach';
    default:
      return 'As directed';
  }
};
