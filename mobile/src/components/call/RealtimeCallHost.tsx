import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { ShieldAlert } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useRealtimeStore } from '../../store/useRealtimeStore';
import { useMedicineStore } from '../../store/useMedicineStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { reminderService } from '../../services/notifications/reminderService';
import { activityApi } from '../../services/api';
import { IncomingCallModal } from './IncomingCallModal';
import { CallScreenModal } from './CallScreenModal';

/**
 * Owns the realtime connection for the whole app and renders the call overlays
 * on top of whatever screen is open, so an incoming call is never missed.
 *
 * Mounted once in the root layout.
 */
export const RealtimeCallHost: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  const init = useRealtimeStore((state) => state.init);
  const teardown = useRealtimeStore((state) => state.teardown);
  const adminNotice = useRealtimeStore((state) => state.adminNotice);
  const clearAdminNotice = useRealtimeStore((state) => state.clearAdminNotice);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  // Restore language, voice and notification preferences on every launch.
  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    if (isAuthenticated && token) {
      init(token, userId);

      // Ask for notification permission and re-arm every medicine reminder
      // (they are device-local, so they must be rebuilt each session).
      (async () => {
        try {
          await useMedicineStore.getState().fetchMedicines();
          await reminderService.init(useMedicineStore.getState().medicines);
        } catch (err) {
          console.warn('Failed to initialise reminders:', err);
        }
      })();

      // Record "last seen" for the admin follow-up signal: once now, then on
      // a 5-minute timer so an app left open still counts as active.
      activityApi.startHeartbeats();
    } else {
      teardown();
      activityApi.stopHeartbeats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, userId]);

  return (
    <>
      <IncomingCallModal />
      <CallScreenModal />

      {/* Admin-authored notice (e.g. a medication follow-up message). */}
      <Modal
        visible={!!adminNotice}
        transparent
        animationType="fade"
        onRequestClose={clearAdminNotice}
      >
        <View style={noticeStyles.overlay}>
          <View style={noticeStyles.card}>
            <View style={noticeStyles.iconWrap}>
              <ShieldAlert size={22} color={palette.teal700} />
            </View>
            <Text style={noticeStyles.title}>{adminNotice?.title}</Text>
            <Text style={noticeStyles.body}>{adminNotice?.body}</Text>
            <TouchableOpacity style={noticeStyles.button} onPress={clearAdminNotice} activeOpacity={0.8}>
              <Text style={noticeStyles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const noticeStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: palette.teal600,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  buttonText: { color: palette.white, fontWeight: '700', fontSize: typography.sizes.sm },
});
