import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, typography, spacing, borderRadius } from '../../theme';
import { doctorPortalApi } from '../../services/api';
import { DoctorMessage, DoctorPortalAccount } from '../../types';
import { useRealtimeStore } from '../../store/useRealtimeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  Send,
  ChevronLeft,
  Stethoscope,
  PhoneCall,
  Video,
} from 'lucide-react-native';

interface PatientChatModalProps {
  visible: boolean;
  onClose: () => void;
  doctor: DoctorPortalAccount;
}

export const PatientChatModal: React.FC<PatientChatModalProps> = ({
  visible,
  onClose,
  doctor,
}) => {
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useSettingsStore();
  const sendChatMessage = useRealtimeStore((s) => s.sendChatMessage);
  const sendTyping = useRealtimeStore((s) => s.sendTyping);
  const startCall = useRealtimeStore((s) => s.startCall);
  const lastMessage = useRealtimeStore((s) => s.lastMessage);
  const onlineUserIds = useRealtimeStore((s) => s.onlineUserIds);
  const peerTyping = useRealtimeStore((s) => s.peerTyping);

  const peerUserId = String(doctor.userId);
  const isOnline = onlineUserIds.includes(peerUserId);
  const isPeerTyping = Boolean(peerTyping[peerUserId]);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadThread = useCallback(async () => {
    if (!visible) return;
    setIsLoading(true);
    try {
      // Opening the thread also marks the doctor's messages as read
      const data = await doctorPortalApi.getPatientThread(doctor.id);
      setMessages(data);
    } catch (err) {
      console.log('Error loading thread:', err);
    } finally {
      setIsLoading(false);
    }
  }, [visible, doctor.id]);

  useFocusEffect(
    useCallback(() => {
      if (visible) loadThread();
    }, [loadThread, visible])
  );

  // Refresh when the modal opens
  React.useEffect(() => {
    if (visible) loadThread();
  }, [visible, loadThread]);

  // Append messages pushed over the socket, de-duplicated by id.
  useEffect(() => {
    if (!visible || !lastMessage) return;
    if (lastMessage.peerUserId !== peerUserId) return;

    setMessages((prev) =>
      prev.some((m) => String(m.id) === String(lastMessage.message.id))
        ? prev
        : [...prev, lastMessage.message]
    );
  }, [lastMessage, visible, peerUserId]);

  // Stop advertising "typing" when the chat closes.
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
      sendTyping(peerUserId, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUserId]);

  const handleChangeDraft = (text: string) => {
    setDraft(text);
    if (!visible) return;

    sendTyping(peerUserId, text.length > 0);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(peerUserId, false), 1500);
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;

    setDraft('');
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTyping(peerUserId, false);
    setIsSending(true);
    try {
      // Realtime first; falls back to REST if the socket is down.
      await sendChatMessage(peerUserId, body, () =>
        doctorPortalApi.sendPatientMessage(doctor.id, body)
      );
    } catch (err) {
      console.log('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartCall = (callType: 'AUDIO' | 'VIDEO') => {
    const started = startCall(peerUserId, doctor.fullName, callType);
    if (started) onClose();
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={24} color={palette.slate800} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <Stethoscope size={18} color={palette.teal700} />
            </View>
            <View style={styles.headerMain}>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {doctor.fullName}
                </Text>
                {isOnline ? <View style={styles.onlineDot} /> : null}
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {isPeerTyping
                  ? t.typing
                  : isOnline
                    ? t.onlineNow
                    : doctor.specialization}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => handleStartCall('VIDEO')}
              accessibilityLabel={t.videoCall}
            >
              <Video size={20} color={palette.teal700} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => handleStartCall('AUDIO')}
              accessibilityLabel={t.audioCall}
            >
              <PhoneCall size={20} color={palette.teal700} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.body}
          >
            {isPeerTyping ? (
              <View style={styles.typingRow}>
                <Text style={styles.typingText}>
                  {doctor.fullName} {t.typing}
                </Text>
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator size="large" color={palette.teal600} />
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>
                      No messages yet. Ask {doctor.fullName?.split(' ')[0] || 'your doctor'} anything about your treatment.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.bubble,
                      !item.fromDoctor ? styles.bubbleMine : styles.bubbleTheirs,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        item.fromDoctor && styles.bubbleTextTheirs,
                      ]}
                    >
                      {item.body}
                    </Text>
                    <Text
                      style={[
                        styles.bubbleTime,
                        item.fromDoctor && styles.bubbleTimeTheirs,
                      ]}
                    >
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                )}
              />
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={palette.slate400}
                value={draft}
                onChangeText={handleChangeDraft}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!draft.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={palette.white} />
                ) : (
                  <Send size={18} color={palette.white} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    flex: 1,
    backgroundColor: palette.slate50,
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    gap: spacing.xs,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMain: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.success500,
  },
  headerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  headerAction: {
    padding: spacing.xs,
  },
  typingRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  typingText: {
    fontSize: typography.sizes.xs,
    color: palette.teal700,
    fontStyle: 'italic',
  },
  body: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: palette.slate400,
    textAlign: 'center',
    lineHeight: 20,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: palette.teal600,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: typography.sizes.sm,
    color: palette.white,
    lineHeight: 20,
  },
  bubbleTextTheirs: {
    color: palette.slate800,
  },
  bubbleTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  bubbleTimeTheirs: {
    color: palette.slate400,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.teal600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: palette.slate300,
  },
});
