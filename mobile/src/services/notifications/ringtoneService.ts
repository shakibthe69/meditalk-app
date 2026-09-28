import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../../store/useSettingsStore';

const RING_INTERVAL_SECONDS = 3;
const ANDROID_CALL_CHANNEL = 'meditalk-calls';

/**
 * Rings while an incoming audio/video call is being displayed.
 *
 * Native: a repeating, high-priority notification (sound + vibration, both
 * controllable from the notification settings) plus device vibration.
 * Web: a two-tone beep generated with the Web Audio API.
 *
 * `stop()` is safe to call at any time and is idempotent.
 */
class RingtoneService {
  private active = false;
  private immediateId: string | null = null;
  private repeatId: string | null = null;
  private vibrateTimer: ReturnType<typeof setInterval> | null = null;
  private webTimer: ReturnType<typeof setInterval> | null = null;
  private webContext: AudioContext | null = null;

  get isRinging(): boolean {
    return this.active;
  }

  async start(callerName?: string): Promise<void> {
    if (this.active) return;
    this.active = true;

    const { language, notifications } = useSettingsStore.getState();

    if (Platform.OS === 'web') {
      if (notifications.soundEnabled) this.startWebBeep();
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // Permission is requested again by the reminder bootstrap if needed.
    }

    // The call may have been answered/declined while permission was pending.
    if (!this.active) return;

    const title = language === 'bn' ? 'ইনকামিং কল' : 'Incoming call';
    const body = callerName
      ? language === 'bn'
        ? `${callerName} আপনাকে কল করছেন`
        : `${callerName} is calling you`
      : language === 'bn'
        ? 'একজন ব্যক্তি আপনাকে কল করছেন'
        : 'Someone is calling you';

    try {
      await this.ensureAndroidChannel(notifications.soundEnabled, notifications.vibrationEnabled);

      const content: Notifications.NotificationContentInput = {
        title,
        body,
        sound: notifications.soundEnabled ? 'default' : false,
        priority: 'max',
        data: { type: 'call-ring' },
      };

      // One notification almost immediately, then more every few seconds until
      // the call is accepted, declined or times out.
      this.immediateId = await Notifications.scheduleNotificationAsync({
        identifier: 'call-ring-now',
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
          channelId: ANDROID_CALL_CHANNEL,
        },
      });
      this.repeatId = await Notifications.scheduleNotificationAsync({
        identifier: 'call-ring-repeat',
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: RING_INTERVAL_SECONDS,
          repeats: true,
          channelId: ANDROID_CALL_CHANNEL,
        },
      });
    } catch (e) {
      console.warn('Failed to start call ringtone:', e);
    }

    if (notifications.vibrationEnabled && this.active) {
      this.startVibration();
    }
  }

  stop(): void {
    if (!this.active && !this.immediateId && !this.repeatId) return;
    this.active = false;

    if (Platform.OS !== 'web') {
      const ids = [this.immediateId, this.repeatId].filter(Boolean) as string[];
      this.immediateId = null;
      this.repeatId = null;
      ids.forEach((id) => {
        Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
      });
      // Also clear the delivered "Incoming call" entries from the tray.
      ['call-ring-now', 'call-ring-repeat'].forEach((id) => {
        Notifications.dismissNotificationAsync(id).catch(() => undefined);
      });
    }

    if (this.vibrateTimer) {
      clearInterval(this.vibrateTimer);
      this.vibrateTimer = null;
    }
    try {
      Vibration.cancel();
    } catch {
      // Not supported everywhere; vibration simply stops on its own.
    }

    this.stopWebBeep();
  }

  /** Android needs the ring channel recreated when sound/vibration prefs flip. */
  async syncChannel(): Promise<void> {
    if (Platform.OS === 'web') return;
    const { notifications } = useSettingsStore.getState();
    await this.ensureAndroidChannel(notifications.soundEnabled, notifications.vibrationEnabled);
  }

  private async ensureAndroidChannel(sound: boolean, vibration: boolean): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CALL_CHANNEL, {
        name: 'Incoming calls',
        importance: Notifications.AndroidImportance.MAX,
        sound: sound ? 'default' : null,
        vibrationPattern: vibration ? [0, 500, 500, 500, 500] : null,
        bypassDnd: true,
        enableVibrate: vibration,
        lightColor: '#14B8A6',
        description: 'Ringing sound and vibration for incoming doctor/patient calls',
      });
    } catch (e) {
      console.warn('Failed to configure call notification channel:', e);
    }
  }

  private startVibration(): void {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 500, 500, 500, 500], true);
      } else {
        // iOS only honours single vibration calls, so repeat it manually.
        Vibration.vibrate(500);
        this.vibrateTimer = setInterval(() => {
          if (!this.active) return;
          try {
            Vibration.vibrate(500);
          } catch {
            // ignore
          }
        }, RING_INTERVAL_SECONDS * 1000);
      }
    } catch {
      // Vibration unavailable — the audible ring still plays.
    }
  }

  private startWebBeep(): void {
    try {
      const AudioCtx =
        typeof window !== 'undefined'
          ? window.AudioContext || (window as any).webkitAudioContext
          : null;
      if (!AudioCtx) return;

      this.webContext = this.webContext || new AudioCtx();
      const context = this.webContext;
      if (context.state === 'suspended') context.resume().catch(() => undefined);

      const beep = () => {
        if (!this.active || !this.webContext) return;
        [880, 660].forEach((frequency, index) => {
          const oscillator = this.webContext!.createOscillator();
          const gain = this.webContext!.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          const start = this.webContext!.currentTime + index * 0.28;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
          oscillator.connect(gain);
          gain.connect(this.webContext!.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.26);
        });
      };

      beep();
      this.webTimer = setInterval(beep, RING_INTERVAL_SECONDS * 1000);
    } catch (e) {
      console.warn('Web ringtone unavailable:', e);
    }
  }

  private stopWebBeep(): void {
    if (this.webTimer) {
      clearInterval(this.webTimer);
      this.webTimer = null;
    }
    if (this.webContext) {
      const context = this.webContext;
      this.webContext = null;
      try {
        context.close().catch(() => undefined);
      } catch {
        // ignore
      }
    }
  }
}

export const ringtoneService = new RingtoneService();
