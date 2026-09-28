import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { AppLanguage, translations } from '../../theme/i18n/translations';
import { useSettingsStore } from '../../store/useSettingsStore';

class VoiceService {
  private isSpeaking = false;

  public async stop(): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      await Speech.stop();
      this.isSpeaking = false;
    } catch (e) {
      console.warn('VoiceService stop error:', e);
    }
  }

  public async speak(
    text: string,
    forcedLang?: AppLanguage,
    rate = 0.95
  ): Promise<void> {
    const { voiceEnabled, language: storeLang } = useSettingsStore.getState();
    if (!voiceEnabled || !text || !text.trim()) {
      return;
    }

    const currentLang = forcedLang || storeLang;
    const speechLanguage = currentLang === 'bn' ? 'bn-BD' : 'en-US';

    try {
      await this.stop();

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLanguage;
        utterance.rate = rate;
        utterance.pitch = 1.0;

        // Try to pick matching voice if available in browser
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(currentLang === 'bn' ? 'bn' : 'en')
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onend = () => {
          this.isSpeaking = false;
        };
        utterance.onerror = () => {
          this.isSpeaking = false;
        };

        this.isSpeaking = true;
        window.speechSynthesis.speak(utterance);
        return;
      }

      // Native iOS / Android via expo-speech
      this.isSpeaking = true;
      Speech.speak(text, {
        language: speechLanguage,
        rate: rate,
        pitch: 1.0,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (err) {
      console.warn('VoiceService speak failed:', err);
      this.isSpeaking = false;
    }
  }

  public speakStep(
    step: 'CAPTURE' | 'SCANNING' | 'REVIEW' | 'SAVED' | 'TAKEN' | 'SKIPPED' | 'VOICE_ON' | 'VOICE_OFF' | 'LANG_CHANGED',
    lang?: AppLanguage
  ): void {
    const activeLang = lang || useSettingsStore.getState().language;
    const dict = translations[activeLang] || translations.en;

    let phrase = '';
    switch (step) {
      case 'CAPTURE':
        phrase = dict.voiceCapturePrompt;
        break;
      case 'SCANNING':
        phrase = dict.voiceScanningPrompt;
        break;
      case 'REVIEW':
        phrase = dict.voiceReviewPrompt;
        break;
      case 'SAVED':
        phrase = dict.voiceSavedPrompt;
        break;
      case 'TAKEN':
        phrase = dict.voiceTakenPrompt;
        break;
      case 'SKIPPED':
        phrase = dict.voiceSkippedPrompt;
        break;
      case 'VOICE_ON':
        phrase = dict.voiceEnabledPrompt;
        break;
      case 'VOICE_OFF':
        phrase = dict.voiceDisabledPrompt;
        break;
      case 'LANG_CHANGED':
        phrase = dict.voiceLangChangedPrompt;
        break;
    }

    if (phrase) {
      this.speak(phrase, activeLang);
    }
  }

  public speakMedicineReviewSummary(
    medicines: Array<{
      name: string;
      dose?: string | null;
      dosePattern?: string | null;
      foodInstruction?: string | null;
    }>,
    lang?: AppLanguage
  ): void {
    const activeLang = lang || useSettingsStore.getState().language;
    if (medicines.length === 0) return;

    if (activeLang === 'bn') {
      const names = medicines.map((m) => m.name).join(', ');
      this.speak(`প্রেসক্রিপশনে ${medicines.length}টি ওষুধ সনাক্ত হয়েছে: ${names}। অনুগ্রহ করে সময়সূচি নিশ্চিত করুন।`, 'bn');
    } else {
      const names = medicines.map((m) => `${m.name} ${m.dose || ''}`).join(', ');
      this.speak(`Extracted ${medicines.length} medications: ${names}. Please verify details before confirming.`, 'en');
    }
  }
}

export const voiceService = new VoiceService();
