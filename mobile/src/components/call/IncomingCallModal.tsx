import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { palette, typography, spacing, borderRadius, shadows } from '../../theme';
import { useRealtimeStore } from '../../store/useRealtimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ringtoneService } from '../../services/notifications/ringtoneService';
import { voiceService } from '../../services/voice';
import { Phone, PhoneOff, Video, Stethoscope, User } from 'lucide-react-native';

const RING_TIMEOUT_SECONDS = 30;

/**
 * Rings when the doctor or the patient receives a `call.incoming` event.
 * Unanswered rings are reported back as a timeout so the caller sees "Missed".
 */
export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useRealtimeStore();
  const { t, language } = useSettingsStore();
  const [secondsLeft, setSecondsLeft] = useState(RING_TIMEOUT_SECONDS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = !!incomingCall;

  useEffect(() => {
    if (!visible) return;

    // Audible ring + spoken announcement, both following the active language.
    ringtoneService.start(incomingCall?.peerName || undefined);
    const isVideo = incomingCall?.callType === 'VIDEO';
    const caller = incomingCall?.peerName || '';
    voiceService.speak(
      language === 'bn'
        ? `ইনকামিং ${isVideo ? 'ভিডিও' : 'অডিও'} কল${caller ? `: ${caller}` : ''}`
        : `Incoming ${isVideo ? 'video' : 'audio'} call${caller ? ` from ${caller}` : ''}`,
      language
    );

    setSecondsLeft(RING_TIMEOUT_SECONDS);
    const deadline = Date.now() + RING_TIMEOUT_SECONDS * 1000;

    const ticker = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 500);

    timeoutRef.current = setTimeout(() => {
      declineCall('timeout');
    }, RING_TIMEOUT_SECONDS * 1000);

    return () => {
      clearInterval(ticker);
      ringtoneService.stop();
      voiceService.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, incomingCall?.id]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'VIDEO';
  const isDoctorCalling = !!incomingCall.doctorName;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => declineCall()}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.label}>{isVideo ? t.videoCall : t.audioCall}</Text>

          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {isDoctorCalling ? (
                <Stethoscope size={38} color={palette.teal700} />
              ) : (
                <User size={38} color={palette.teal700} />
              )}
            </View>
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {incomingCall.peerName || t.incomingCall}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isDoctorCalling
              ? incomingCall.doctorSpecialization || t.incomingCall
              : incomingCall.patientName || t.incomingCall}
          </Text>

          <View style={styles.ringBadge}>
            {isVideo ? (
              <Video size={14} color={palette.teal700} />
            ) : (
              <Phone size={14} color={palette.teal700} />
            )}
            <Text style={styles.ringText}>
              {t.ringing} · {secondsLeft}s
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              activeOpacity={0.85}
              onPress={() => {
                ringtoneService.stop();
                declineCall();
              }}
            >
              <PhoneOff size={26} color={palette.white} />
              <Text style={styles.actionLabel}>{t.declineCall}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              activeOpacity={0.85}
              onPress={() => {
                ringtoneService.stop();
                voiceService.stop();
                acceptCall();
              }}
            >
              {isVideo ? (
                <Video size={26} color={palette.white} />
              ) : (
                <Phone size={26} color={palette.white} />
              )}
              <Text style={styles.actionLabel}>{t.acceptCall}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 28,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    ...shadows.lg,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  avatarRing: {
    marginTop: spacing.lg,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: palette.teal50,
    borderWidth: 2,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
  },
  ringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  ringText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal800,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing['2xl'],
  },
  actionBtn: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  declineBtn: {
    backgroundColor: palette.danger600,
  },
  acceptBtn: {
    backgroundColor: palette.success600,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
