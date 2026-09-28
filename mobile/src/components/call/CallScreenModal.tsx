import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { useRealtimeStore } from '../../store/useRealtimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { voiceService } from '../../services/voice';
import { MediaView } from './MediaView';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Stethoscope,
  User,
  AlertTriangle,
  Loader,
} from 'lucide-react-native';

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The live call screen.
 *
 * Media is real WebRTC: the remote peer's stream fills the stage and the local
 * camera sits in a self-view box. On platforms without WebRTC (Expo Go, an
 * insecure web page) the screen states exactly why instead of showing a dead
 * video area.
 */
export const CallScreenModal: React.FC = () => {
  const {
    activeCall,
    endCall,
    lastCallOutcome,
    localStream,
    remoteStream,
    mediaState,
    mediaError,
    mediaAvailable,
    mediaUnavailableReason,
    setMuted,
    setVideoEnabled,
  } = useRealtimeStore();
  const { t } = useSettingsStore();

  const [muted, setMutedLocal] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visible = !!activeCall;
  const isVideoCall = activeCall?.callType === 'VIDEO';
  const isLive = activeCall?.status === 'ACCEPTED';
  const isTerminal = !!activeCall && activeCall.status !== 'RINGING' && activeCall.status !== 'ACCEPTED';
  const peerIsDoctor = !!activeCall && !!activeCall.doctorName;

  // Reset controls for every new call.
  useEffect(() => {
    if (!visible) return;
    setMutedLocal(false);
    setSpeakerOn(false);
    setVideoOn(true);
    setMuted(false);
    setVideoEnabled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, activeCall?.id]);

  // Voice announcement for every call-state change, in the active language.
  const announcedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeCall) {
      announcedRef.current = null;
      return;
    }
    const key = `${activeCall.id}:${activeCall.status}`;
    if (announcedRef.current === key) return;
    announcedRef.current = key;

    const { language, voiceEnabled } = useSettingsStore.getState();
    if (!voiceEnabled) return;

    switch (activeCall.status) {
      case 'ACCEPTED':
        voiceService.speak(
          language === 'bn' ? 'কল সংযুক্ত হয়েছে, এখন কথা বলতে পারেন' : 'Call connected. You can talk now.',
          language
        );
        break;
      case 'DECLINED':
        voiceService.speak(
          language === 'bn' ? 'কলটি প্রত্যাখ্যান করা হয়েছে' : 'The call was declined.',
          language
        );
        break;
      case 'MISSED':
        voiceService.speak(
          language === 'bn' ? 'কলটি কেউ ধরেনি' : 'The call was not answered.',
          language
        );
        break;
      case 'ENDED':
        voiceService.speak(language === 'bn' ? 'কল শেষ হয়েছে' : 'Call ended.', language);
        break;
    }
  }, [activeCall?.id, activeCall?.status]);

  // Talk timer, measured from the moment the call was accepted.
  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (!activeCall || activeCall.status !== 'ACCEPTED') {
      setElapsed(0);
      return;
    }

    const startedAt = activeCall.acceptedAt ? new Date(activeCall.acceptedAt).getTime() : Date.now();
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));

    update();
    tickRef.current = setInterval(update, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [activeCall?.id, activeCall?.status, activeCall?.acceptedAt]);

  const statusText = useMemo(() => {
    if (!activeCall) return '';
    switch (activeCall.status) {
      case 'ACCEPTED':
        return formatDuration(elapsed);
      case 'RINGING':
        return t.ringing;
      case 'ENDED':
        return t.callEnded;
      case 'DECLINED':
        return t.declinedCall;
      case 'MISSED':
        return t.missedCall;
      default:
        return t.connecting;
    }
  }, [activeCall?.status, elapsed, t]);

  if (!activeCall) return null;

  const handleToggleMute = () => {
    const next = !muted;
    setMutedLocal(next);
    setMuted(next);
  };

  const handleToggleVideo = () => {
    const next = !videoOn;
    setVideoOn(next);
    setVideoEnabled(next);
  };

  // Status line above the controls: live, connecting, or the failure reason.
  const renderMediaNotice = () => {
    if (!mediaAvailable) {
      return (
        <View style={[styles.notice, styles.noticeWarning]}>
          <AlertTriangle size={13} color={palette.warning700} />
          <Text style={styles.noticeTextWarning} numberOfLines={3}>
            {mediaUnavailableReason || t.devBuildTitle}
          </Text>
        </View>
      );
    }

    if (mediaError) {
      return (
        <View style={[styles.notice, styles.noticeWarning]}>
          <AlertTriangle size={13} color={palette.warning700} />
          <Text style={styles.noticeTextWarning} numberOfLines={3}>
            {mediaError}
          </Text>
        </View>
      );
    }

    if (mediaState === 'live') {
      return (
        <View style={[styles.notice, styles.noticeLive]}>
          <View style={styles.liveDot} />
          <Text style={styles.noticeTextLive}>{t.mediaHint}</Text>
        </View>
      );
    }

    if (isLive && mediaState === 'connecting') {
      return (
        <View style={styles.notice}>
          <Loader size={12} color={palette.slate400} />
          <Text style={styles.noticeText}>{t.mediaStarting}</Text>
        </View>
      );
    }

    return null;
  };

  const showRemoteVideo = isVideoCall && isLive && !!remoteStream && videoOn;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={endCall}>
      <View style={styles.container}>
        {/* Stage: remote video, or the avatar for audio calls */}
        {isVideoCall ? (
          <View style={styles.videoStage}>
            <MediaView
              stream={remoteStream}
              video={showRemoteVideo}
              style={styles.remoteVideo}
              placeholderText={mediaError || mediaUnavailableReason || undefined}
            />

            {/* Self view */}
            <View style={styles.selfView}>
              <MediaView
                stream={localStream}
                video={videoOn}
                mirror
                muted
                style={styles.selfVideo}
                placeholderText={videoOn ? undefined : t.mute}
              />
            </View>
          </View>
        ) : (
          <View style={styles.audioStage}>
            {/* Keeps remote audio playing on web even though no video is shown */}
            <View style={styles.hiddenMedia}>
              <MediaView stream={remoteStream} video={false} muted={false} style={styles.audioOnly} />
            </View>

            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {peerIsDoctor ? (
                  <Stethoscope size={44} color={palette.teal700} />
                ) : (
                  <User size={44} color={palette.teal700} />
                )}
              </View>
            </View>
          </View>
        )}

        {/* Peer identity + live status */}
        <View style={styles.identity}>
          <Text style={styles.peerName} numberOfLines={1}>
            {activeCall.peerName || activeCall.doctorName || activeCall.patientName || '—'}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isLive
                    ? mediaState === 'live'
                      ? palette.success500
                      : palette.warning500
                    : isTerminal
                      ? palette.slate400
                      : palette.warning500,
                },
              ]}
            />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          <Text style={styles.modeText}>
            {isVideoCall ? t.videoCall : t.audioCall}
            {lastCallOutcome ? ` · ${t.callEnded}` : ''}
          </Text>

          {isLive ? renderMediaNotice() : null}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, muted && styles.controlBtnActive]}
            onPress={handleToggleMute}
            disabled={isTerminal}
          >
            {muted ? (
              <MicOff size={22} color={palette.white} />
            ) : (
              <Mic size={22} color={palette.white} />
            )}
            <Text style={styles.controlLabel}>{muted ? t.unmute : t.mute}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, speakerOn && styles.controlBtnActive]}
            onPress={() => setSpeakerOn((prev) => !prev)}
            disabled={isTerminal}
          >
            {speakerOn ? (
              <Volume2 size={22} color={palette.white} />
            ) : (
              <VolumeX size={22} color={palette.white} />
            )}
            <Text style={styles.controlLabel}>{t.speaker}</Text>
          </TouchableOpacity>

          {isVideoCall ? (
            <TouchableOpacity
              style={[styles.controlBtn, !videoOn && styles.controlBtnActive]}
              onPress={handleToggleVideo}
              disabled={isTerminal}
            >
              {videoOn ? (
                <Video size={22} color={palette.white} />
              ) : (
                <VideoOff size={22} color={palette.white} />
              )}
              <Text style={styles.controlLabel}>{t.videoCall}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.controlBtn, styles.endBtn]}
            onPress={endCall}
            activeOpacity={0.85}
          >
            <PhoneOff size={22} color={palette.white} />
            <Text style={styles.controlLabel}>{t.endCall}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate900,
    paddingTop: Platform.OS === 'android' ? spacing['2xl'] : spacing['3xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.base,
  },
  videoStage: {
    flex: 1,
    borderRadius: borderRadius['2xl'],
    backgroundColor: palette.slate800,
    overflow: 'hidden',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    borderRadius: borderRadius['2xl'],
  },
  selfView: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 88,
    height: 124,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: palette.slate900,
  },
  selfVideo: {
    flex: 1,
    width: '100%',
  },
  audioStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenMedia: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  audioOnly: {
    width: 1,
    height: 1,
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identity: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  peerName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate200,
  },
  modeText: {
    marginTop: 4,
    fontSize: typography.sizes.xs,
    color: palette.slate400,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    maxWidth: '94%',
  },
  noticeLive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  noticeWarning: {
    backgroundColor: 'rgba(245,158,11,0.14)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.success500,
  },
  noticeText: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.slate400,
  },
  noticeTextLive: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.success500,
  },
  noticeTextWarning: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.warning300,
    flexShrink: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  controlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  controlBtnActive: {
    backgroundColor: palette.teal600,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: palette.white,
  },
  endBtn: {
    backgroundColor: palette.danger600,
  },
});
