import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useMedicineStore } from '../../store/useMedicineStore';
import { reminderService } from '../../services/notifications/reminderService';
import { voiceService } from '../../services/voice';
import {
  X,
  Bell,
  BellOff,
  Volume2,
  Vibrate,
  MessageSquareText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react-native';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Custom notification options: each preference is applied immediately — the
 * Android channel is rebuilt, already-scheduled reminders are re-armed and a
 * test notification can be sent to verify the result.
 */
export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { t, language, notifications, setNotificationPref } = useSettingsStore();
  const [hasPermission, setHasPermission] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true);
      return;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch {
      setHasPermission(true);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setTestSent(false);
      checkPermission();
    }
  }, [visible, checkPermission]);

  /** Rebuild the channel and re-arm every reminder with the new preferences. */
  const applyAndReschedule = async () => {
    setBusy(true);
    try {
      if (useMedicineStore.getState().medicines.length === 0) {
        await useMedicineStore.getState().fetchMedicines();
      }
      await reminderService.applyChannelPrefs();
      await reminderService.rescheduleAll(useMedicineStore.getState().medicines);
    } catch (e) {
      console.warn('Failed to apply notification preferences:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = (key: keyof typeof notifications) => async (value: boolean) => {
    setNotificationPref(key, value);
    if (key === 'voiceReadoutEnabled') {
      if (value) {
        voiceService.speak(
          language === 'bn' ? 'ভয়েস রিডআউট চালু করা হয়েছে' : 'Voice readout enabled',
          language
        );
      } else {
        voiceService.stop();
      }
    }
    await applyAndReschedule();
  };

  const handleGrantPermission = async () => {
    const granted = await reminderService.requestPermissions();
    setHasPermission(granted);
    if (granted) await applyAndReschedule();
  };

  const handleTest = async () => {
    const sent = await reminderService.sendTestReminder();
    setTestSent(sent);
    if (sent) {
      voiceService.speak(
        language === 'bn' ? 'টেস্ট রিমাইন্ডার পাঠানো হয়েছে' : 'Test reminder sent',
        language
      );
    }
  };

  const rows: Array<{
    key: 'remindersEnabled' | 'soundEnabled' | 'vibrationEnabled' | 'voiceReadoutEnabled';
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onIcon: React.ReactNode;
  }> = [
    {
      key: 'remindersEnabled',
      icon: notifications.remindersEnabled ? (
        <Bell size={19} color={palette.teal700} />
      ) : (
        <BellOff size={19} color={palette.slate500} />
      ),
      title: t.medicineReminders,
      subtitle: t.medicineRemindersDesc,
      onIcon: <Bell size={19} color={palette.teal700} />,
    },
    {
      key: 'soundEnabled',
      icon: <Volume2 size={19} color={notifications.soundEnabled ? palette.teal700 : palette.slate500} />,
      title: t.reminderSound,
      subtitle:
        language === 'bn'
          ? 'রিমাইন্ডার ও ইনকামিং কলে সাউন্ড বাজাবে'
          : 'Sound for reminders and incoming calls',
      onIcon: <Volume2 size={19} color={palette.teal700} />,
    },
    {
      key: 'vibrationEnabled',
      icon: <Vibrate size={19} color={notifications.vibrationEnabled ? palette.teal700 : palette.slate500} />,
      title: t.reminderVibration,
      subtitle:
        language === 'bn'
          ? 'রিমাইন্ডার ও ইনকামিং কলে ফোন কম্পন করবে'
          : 'Device vibrates for reminders and incoming calls',
      onIcon: <Vibrate size={19} color={palette.teal700} />,
    },
    {
      key: 'voiceReadoutEnabled',
      icon: <MessageSquareText size={19} color={notifications.voiceReadoutEnabled ? palette.teal700 : palette.slate500} />,
      title: t.reminderVoiceReadout,
      subtitle: t.reminderVoiceReadoutDesc,
      onIcon: <MessageSquareText size={19} color={palette.teal700} />,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerMain}>
              <Text style={styles.title}>{t.notificationSettings}</Text>
              <Text style={styles.subtitle}>{t.notificationSettingsSubtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={palette.slate500} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {!hasPermission ? (
              <View style={styles.permissionCard}>
                <AlertTriangle size={18} color={palette.warning600} />
                <View style={styles.permissionTextWrap}>
                  <Text style={styles.permissionText}>{t.notificationPermissionNeeded}</Text>
                  <TouchableOpacity style={styles.permissionBtn} onPress={handleGrantPermission}>
                    <Text style={styles.permissionBtnText}>
                      {language === 'bn' ? 'অনুমতি দিন' : 'Allow notifications'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              {rows.map((row, index) => (
                <View key={row.key}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.row}>
                    <View style={styles.rowIcon}>{row.icon}</View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{row.title}</Text>
                      <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
                    </View>
                    <Switch
                      value={notifications[row.key]}
                      onValueChange={handleToggle(row.key)}
                      disabled={busy}
                      trackColor={{ false: palette.slate300, true: palette.teal500 }}
                      thumbColor={palette.white}
                    />
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.testBtn} activeOpacity={0.8} onPress={handleTest}>
              <Sparkles size={16} color={palette.teal700} />
              <Text style={styles.testBtnText}>{t.sendTestReminder}</Text>
            </TouchableOpacity>

            {testSent ? (
              <View style={styles.testDone}>
                <CheckCircle2 size={15} color={palette.success600} />
                <Text style={styles.testDoneText}>{t.testReminderBody}</Text>
              </View>
            ) : null}

            <View style={styles.hintCard}>
              <ClockNote text={t.customTimesHint} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ClockNote = ({ text }: { text: string }) => (
  <Text style={styles.hintText}>
    <Text style={styles.hintBold}>⏰ </Text>
    {text}
  </Text>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerMain: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.slate900,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  content: {
    padding: spacing.base,
    gap: spacing.md,
  },
  permissionCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.warning50,
    borderWidth: 1,
    borderColor: palette.warning200,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  permissionTextWrap: {
    flex: 1,
  },
  permissionText: {
    fontSize: typography.sizes.xs,
    color: palette.warning700,
    lineHeight: 18,
  },
  permissionBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: palette.warning600,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  permissionBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.white,
  },
  card: {
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.slate900,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: palette.slate200,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  testBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.teal700,
  },
  testDone: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.success50,
    borderWidth: 1,
    borderColor: palette.success100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  testDoneText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: palette.success700,
    lineHeight: 18,
  },
  hintCard: {
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    lineHeight: 18,
  },
  hintBold: {
    fontWeight: '800',
  },
});
