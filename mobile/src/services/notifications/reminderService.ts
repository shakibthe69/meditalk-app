import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Medicine, MedicineSchedule } from '../../types';
import { voiceService } from '../voice';
import { useSettingsStore } from '../../store/useSettingsStore';

export const REMINDER_CHANNEL = 'meditalk-reminders';

// Configure default notification handler with alert, sound, badge
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { notifications } = useSettingsStore.getState();
      const isCallRing = notification.request.content.data?.type === 'call-ring';
      // Call rings always ring; reminders follow the user's sound preference.
      const playSound = isCallRing || notifications.soundEnabled;
      return {
        shouldShowAlert: true,
        shouldPlaySound: playSound,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  // Listen for incoming notifications and speak reminder if voice readout is on
  Notifications.addNotificationReceivedListener((notification) => {
    try {
      const data = notification.request.content.data;
      const { language, notifications } = useSettingsStore.getState();
      if (!data?.medicineName) return;

      if (!notifications.voiceReadoutEnabled || !notifications.remindersEnabled) return;

      const medName = data.medicineName;
      const dose = data.dosageAmount || (language === 'bn' ? '১ ডোজ' : '1 dose');
      const food = data.foodInstruction || (language === 'bn' ? 'খাবারের পরে' : 'After meal');

      if (language === 'bn') {
        voiceService.speak(`ওষুধ খাওয়ার সময় হয়েছে: ${medName}, মাত্রা: ${dose}, নির্দেশ: ${food}।`, 'bn');
      } else {
        voiceService.speak(`It's time to take ${medName}, dose: ${dose}, instruction: ${food}.`, 'en');
      }
    } catch (e) {
      console.warn('Notification speech listener error:', e);
    }
  });

  // Listen for notification taps
  Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response.notification.request.content.data;
      const { language, notifications } = useSettingsStore.getState();
      if (!data?.medicineName) return;
      if (!notifications.voiceReadoutEnabled) return;

      const medName = data.medicineName;
      if (language === 'bn') {
        voiceService.speak(`ওষুধ খাওয়ার রিমাইন্ডার: ${medName} গ্রহণ করুন।`, 'bn');
      } else {
        voiceService.speak(`Medicine reminder: Please take ${medName}.`, 'en');
      }
    } catch (e) {
      console.warn('Notification response listener error:', e);
    }
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

  /**
   * Creates/updates the Android reminder channel so sound + vibration match the
   * user's custom notification options. iOS ignores channels.
   */
  applyChannelPrefs: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    const { notifications } = useSettingsStore.getState();
    try {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
        name: notifications.remindersEnabled ? 'Medicine reminders' : 'Medicine reminders (off)',
        importance: Notifications.AndroidImportance.HIGH,
        sound: notifications.soundEnabled ? 'default' : null,
        enableVibrate: notifications.vibrationEnabled,
        vibrationPattern: notifications.vibrationEnabled ? [0, 400, 300, 400] : null,
        lightColor: '#14B8A6',
        description: 'Reminders for scheduled medicine doses',
      });
    } catch (e) {
      console.warn('Failed to configure reminder channel:', e);
    }
  },

  /**
   * Full bootstrap: permission + channel, then re-arm every active schedule.
   * Called at app start so reminders survive reinstalls, permission grants and
   * day rollovers.
   */
  init: async (medicines: Medicine[]): Promise<boolean> => {
    const granted = await reminderService.requestPermissions();
    await reminderService.applyChannelPrefs();
    if (granted) {
      await reminderService.rescheduleAll(medicines);
    }
    return granted;
  },

  rescheduleAll: async (medicines: Medicine[]): Promise<void> => {
    for (const medicine of medicines) {
      await reminderService.scheduleMedicineReminders(medicine);
    }
  },

  scheduleMedicineReminders: async (medicine: Medicine): Promise<void> => {
    if (Platform.OS === 'web') return;

    try {
      await reminderService.cancelMedicineReminders(medicine.id);

      const { notifications } = useSettingsStore.getState();
      if (!notifications.remindersEnabled) return;
      if (!medicine.isActive || !medicine.schedules) return;

      // Reminders silently failed before the permission was ever requested.
      const granted = await reminderService.requestPermissions();
      if (!granted) return;

      await reminderService.applyChannelPrefs();

      const { language } = useSettingsStore.getState();

      for (const schedule of medicine.schedules) {
        if (!schedule.isEnabled) continue;

        const timeParts = parseTimeString(schedule.time);
        if (!timeParts) continue;

        const foodEn = formatFoodInstructionEn(schedule.foodInstruction || medicine.foodInstruction);
        const foodBn = formatFoodInstructionBn(schedule.foodInstruction || medicine.foodInstruction);

        const title =
          language === 'bn'
            ? `💊 ওষুধের রিমাইন্ডার: ${medicine.name}`
            : `💊 Medicine Reminder: ${medicine.name}`;

        const body =
          language === 'bn'
            ? `এখন ${medicine.name} (${schedule.dosageAmount || medicine.dose || '১টি ট্যাবলেট'}) খাওয়ার সময় - ${foodBn}`
            : `It's time to take ${medicine.name} (${schedule.dosageAmount || medicine.dose || '1 dose'}) - ${foodEn}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: {
              medicineId: medicine.id,
              scheduleId: schedule.id,
              medicineName: medicine.name,
              dosageAmount: schedule.dosageAmount || medicine.dose,
              foodInstruction: language === 'bn' ? foodBn : foodEn,
            },
            sound: notifications.soundEnabled ? 'default' : false,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: timeParts.hour,
            minute: timeParts.minute,
            channelId: REMINDER_CHANNEL,
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

  /** Fires a notification shortly so the user can verify their preferences. */
  sendTestReminder: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const { notifications } = useSettingsStore.getState();
      if (!notifications.remindersEnabled) return false;
      const granted = await reminderService.requestPermissions();
      if (!granted) return false;
      await reminderService.applyChannelPrefs();

      const { language } = useSettingsStore.getState();
      await Notifications.scheduleNotificationAsync({
        content: {
          title:
            language === 'bn' ? '🧪 টেস্ট রিমাইন্ডার' : '🧪 Test reminder',
          body:
            language === 'bn'
              ? 'রিমাইন্ডার কাজ করছে। পরবর্তী ডোজের সময় নির্ধারিত সময়ে অ্যালার্ট পাবেন।'
              : 'Reminders are working. Your next dose will alert you at its scheduled time.',
          sound: notifications.soundEnabled ? 'default' : false,
          data: { type: 'test-reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          repeats: false,
          channelId: REMINDER_CHANNEL,
        },
      });
      return true;
    } catch (e) {
      console.warn('Failed to send test reminder:', e);
      return false;
    }
  },

  speakReminder: (medicineName: string, dose?: string, foodInstruction?: string) => {
    const { language, notifications } = useSettingsStore.getState();
    if (!notifications.voiceReadoutEnabled) return;

    const food = foodInstruction || (language === 'bn' ? 'খাবারের পরে' : 'After meal');
    const doseText = dose || (language === 'bn' ? '১টি ট্যাবলেট' : '1 dose');

    if (language === 'bn') {
      voiceService.speak(`ওষুধ খাওয়ার সময় হয়েছে: ${medicineName}, মাত্রা: ${doseText}, নির্দেশ: ${food}।`, 'bn');
    } else {
      voiceService.speak(`It's time to take ${medicineName}, dose: ${doseText}, instruction: ${food}.`, 'en');
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

    if (Number.isNaN(hour)) return null;
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    if (hour > 23 || minute > 59) return null;

    return { hour, minute };
  } catch {
    return null;
  }
};

const formatFoodInstructionEn = (inst?: string): string => {
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

const formatFoodInstructionBn = (inst?: string): string => {
  switch (inst) {
    case 'BEFORE_MEAL':
      return 'খাবারের আগে';
    case 'AFTER_MEAL':
      return 'খাবারের পরে';
    case 'WITH_MEAL':
      return 'খাবারের সাথে';
    case 'EMPTY_STOMACH':
      return 'খালি পেটে';
    default:
      return 'নির্দেশ অনুযায়ী';
  }
};
