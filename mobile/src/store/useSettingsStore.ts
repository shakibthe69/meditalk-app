import { create } from 'zustand';
import { AppLanguage, translations, TranslationDict } from '../theme/i18n/translations';
import { appStorage } from '../services/storage/appStorage';

export interface NotificationPrefs {
  /** Master switch for medicine reminder notifications. */
  remindersEnabled: boolean;
  /** Play a sound with each reminder. */
  soundEnabled: boolean;
  /** Vibrate the device with each reminder. */
  vibrationEnabled: boolean;
  /** Speak the reminder out loud in the active language. */
  voiceReadoutEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  remindersEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  voiceReadoutEnabled: true,
};

interface SettingsState {
  language: AppLanguage;
  voiceEnabled: boolean;
  notifications: NotificationPrefs;
  /** Local profile photo (kept on device; the backend has no image field). */
  avatarUri: string | null;
  /** True once persisted settings have been read from disk. */
  isHydrated: boolean;
  t: TranslationDict;

  hydrate: () => Promise<void>;
  setAvatarUri: (uri: string | null) => void;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
  toggleVoice: () => void;
  setNotificationPref: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K]
  ) => void;
}

const SETTINGS_KEY = 'settings';
const NOTIFICATION_KEY = 'notification-prefs';
const AVATAR_KEY = 'profile-avatar';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  voiceEnabled: true,
  notifications: { ...DEFAULT_NOTIFICATION_PREFS },
  avatarUri: null,
  isHydrated: false,
  t: translations.en,

  hydrate: async () => {
    try {
      const [settings, notificationPrefs, avatarUri] = await Promise.all([
        appStorage.getObject<{ language?: AppLanguage; voiceEnabled?: boolean }>(SETTINGS_KEY),
        appStorage.getObject<NotificationPrefs>(NOTIFICATION_KEY),
        appStorage.getItem(AVATAR_KEY),
      ]);

      const language: AppLanguage =
        settings?.language === 'bn' || settings?.language === 'en' ? settings.language : 'en';
      const voiceEnabled = typeof settings?.voiceEnabled === 'boolean' ? settings.voiceEnabled : true;

      set({
        language,
        voiceEnabled,
        notifications: { ...DEFAULT_NOTIFICATION_PREFS, ...(notificationPrefs || {}) },
        avatarUri: avatarUri || null,
        t: translations[language] || translations.en,
        isHydrated: true,
      });
    } catch (e) {
      console.warn('Failed to hydrate settings:', e);
      set({ isHydrated: true });
    }
  },

  setAvatarUri: (avatarUri: string | null) => {
    set({ avatarUri });
    if (avatarUri) {
      appStorage.setItem(AVATAR_KEY, avatarUri);
    } else {
      appStorage.removeItem(AVATAR_KEY);
    }
  },

  setLanguage: (language: AppLanguage) => {
    set({
      language,
      t: translations[language] || translations.en,
    });
    appStorage.setObject(SETTINGS_KEY, { language, voiceEnabled: get().voiceEnabled });
  },

  toggleLanguage: () => {
    const nextLang: AppLanguage = get().language === 'en' ? 'bn' : 'en';
    get().setLanguage(nextLang);
  },

  setVoiceEnabled: (voiceEnabled: boolean) => {
    set({ voiceEnabled });
    appStorage.setObject(SETTINGS_KEY, { language: get().language, voiceEnabled });
  },

  toggleVoice: () => {
    set((state) => ({ voiceEnabled: !state.voiceEnabled }));
    const { language, voiceEnabled } = get();
    appStorage.setObject(SETTINGS_KEY, { language, voiceEnabled });
  },

  setNotificationPref: (key, value) => {
    const notifications = { ...get().notifications, [key]: value };
    set({ notifications });
    appStorage.setObject(NOTIFICATION_KEY, notifications);
  },
}));
