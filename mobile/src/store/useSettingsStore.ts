import { create } from 'zustand';
import { AppLanguage, translations, TranslationDict } from '../theme/i18n/translations';

interface SettingsState {
  language: AppLanguage;
  voiceEnabled: boolean;
  t: TranslationDict;

  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
  toggleVoice: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  voiceEnabled: true,
  t: translations.en,

  setLanguage: (language: AppLanguage) => {
    set({
      language,
      t: translations[language] || translations.en,
    });
  },

  toggleLanguage: () => {
    const nextLang: AppLanguage = get().language === 'en' ? 'bn' : 'en';
    get().setLanguage(nextLang);
  },

  setVoiceEnabled: (voiceEnabled: boolean) => {
    set({ voiceEnabled });
  },

  toggleVoice: () => {
    set((state) => ({ voiceEnabled: !state.voiceEnabled }));
  },
}));
