import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { doctorPortalApi } from '../../src/services/api';
import { PatientThread, DoctorMessage } from '../../src/types';
import { CallHistoryModal } from '../../src/components';
import { useRealtimeStore } from '../../src/store/useRealtimeStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import {
  ChevronLeft,
  Send,
  MessageCircle,
  PhoneCall,
  Video,
  History,
} from 'lucide-react-native';

export default function DoctorMessagesScreen() {
  const router = useRouter();
  const { t } = useSettingsStore();
  const [threads, setThreads] = useState<PatientThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<PatientThread | null>(null);
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);

  const sendChatMessage = useRealtimeStore((s) => s.sendChatMessage);
  const sendTyping = useRealtimeStore((s) => s.sendTyping);
  const startCall = useRealtimeStore((s) => s.startCall);
  const lastMessage = useRealtimeStore((s) => s.lastMessage);
  const onlineUserIds = useRealtimeStore((s) => s.onlineUserIds);
  const peerTyping = useRealtimeStore((s) => s.peerTyping);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerUserId = activeThread ? String(activeThread.patientId) : '';
  const isOnline = !!peerUserId && onlineUserIds.includes(peerUserId);
  const isPeerTyping = !!peerUserId && Boolean(peerTyping[peerUserId]);

  const loadThreads = async () => {
    try {
      const data = await doctorPortalApi.getPatientThreads();
      setThreads(data);
    } catch (err) {
      console.log('Error loading patient threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!activeThread) {
        loadThreads();
      }
    }, [activeThread])
  );

  useEffect(() => {
    if (!activeThread) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await doctorPortalApi.getThread(activeThread.patientId);
        if (!cancelled) setMessages(data);
      } catch (err) {
        console.log('Error loading thread:', err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeThread]);

  // Append messages pushed over the socket, de-duplicated by id.
  useEffect(() => {
    if (!activeThread || !lastMessage) return;
    if (lastMessage.peerUserId !== String(activeThread.patientId)) return;

    setMessages((prev) =>
      prev.some((m) => String(m.id) === String(lastMessage.message.id))
        ? prev
        : [...prev, lastMessage.message]
    );
  }, [lastMessage, activeThread]);

  // Keep the thread list previews fresh while the screen is open.
  useEffect(() => {
    if (!activeThread && lastMessage) {
      loadThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (peerUserId) sendTyping(peerUserId, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUserId]);

  const handleChangeDraft = (text: string) => {
    setDraft(text);
    if (!peerUserId) return;
    sendTyping(peerUserId, text.length > 0);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(peerUserId, false), 1500);
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !activeThread) return;

    setDraft('');
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTyping(peerUserId, false);
    setIsSending(true);
    try {
      // Realtime first; falls back to REST if the socket is down.
      await sendChatMessage(peerUserId, body, () =>
        doctorPortalApi.sendMessage(activeThread.patientId, body)
      );
    } catch (err) {
      console.log('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartCall = (callType: 'AUDIO' | 'VIDEO') => {
    if (!activeThread) return;
    startCall(String(activeThread.patientId), activeThread.patientName, callType);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ---------- Thread (chat) view ----------
  if (activeThread) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setActiveThread(null);
              setMessages([]);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={palette.slate800} />
          </TouchableOpacity>
          <View style={styles.chatHeaderMain}>
            <View style={styles.chatNameRow}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {activeThread.patientName}
              </Text>
              {isOnline ? <View style={styles.onlineDot} /> : null}
            </View>
            <Text style={styles.chatSubtitle} numberOfLines={1}>
              {isPeerTyping
                ? t.typing
                : isOnline
                  ? t.onlineNow
                  : activeThread.patientPhone || t.offlineNow}
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
          style={styles.chatBody}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet. Say hello 👋</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.fromDoctor ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    !item.fromDoctor && styles.bubbleTextTheirs,
                  ]}
                >
                  {item.body}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    !item.fromDoctor && styles.bubbleTimeTheirs,
                  ]}
                >
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            )}
          />

          {isPeerTyping ? (
            <View style={styles.typingRow}>
              <Text style={styles.typingText}>
                {activeThread.patientName} {t.typing}
              </Text>
            </View>
          ) : null}

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
      </SafeAreaView>
    );
  }

  // ---------- Thread list view ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Patient Messages</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          activeOpacity={0.8}
          onPress={() => setShowCallHistory(true)}
        >
          <History size={16} color={palette.teal700} />
          <Text style={styles.historyBtnText}>{t.callHistory}</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.centerWrap}>
          <MessageCircle size={44} color={palette.slate300} />
          <Text style={styles.emptyTitle}>No patient conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            When patients message you, threads will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.patientId}
          contentContainerStyle={styles.threadList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.threadCard}
              activeOpacity={0.8}
              onPress={() => setActiveThread(item)}
            >
              <View style={styles.threadAvatar}>
                <Text style={styles.threadAvatarText}>
                  {item.patientName?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
              </View>
              <View style={styles.threadMain}>
                <View style={styles.threadTopRow}>
                  <View style={styles.threadNameRow}>
                    <Text style={styles.threadName} numberOfLines={1}>
                      {item.patientName}
                    </Text>
                    {onlineUserIds.includes(String(item.patientId)) ? (
                      <View style={styles.threadOnlineDot} />
                    ) : null}
                  </View>
                  <Text style={styles.threadTime}>
                    {formatTime(item.lastMessageAt)}
                  </Text>
                </View>
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {item.lastMessageFromDoctor ? 'You: ' : ''}
                  {item.lastMessage}
                </Text>
              </View>
              <View style={styles.threadActions}>
                <TouchableOpacity
                  style={styles.threadActionBtn}
                  onPress={() =>
                    startCall(String(item.patientId), item.patientName, 'AUDIO')
                  }
                  accessibilityLabel={t.audioCall}
                >
                  <PhoneCall size={16} color={palette.teal700} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.threadActionBtn}
                  onPress={() =>
                    startCall(String(item.patientId), item.patientName, 'VIDEO')
                  }
                  accessibilityLabel={t.videoCall}
                >
                  <Video size={16} color={palette.teal700} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <CallHistoryModal
        visible={showCallHistory}
        onClose={() => setShowCallHistory(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  listTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: palette.slate900,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  historyBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
  },
  typingRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
    backgroundColor: palette.white,
  },
  typingText: {
    fontSize: typography.sizes.xs,
    color: palette.teal700,
    fontStyle: 'italic',
  },
  threadList: {
    padding: spacing.base,
    paddingTop: 0,
    gap: spacing.sm,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate100,
    ...shadows.sm,
  },
  threadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.teal50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  threadAvatarText: {
    fontSize: typography.sizes.base,
    fontWeight: '800',
    color: palette.teal700,
  },
  threadMain: {
    flex: 1,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  threadName: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    flexShrink: 1,
  },
  threadOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.success500,
  },
  threadTime: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
    marginLeft: spacing.xs,
  },
  threadPreview: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    marginTop: 2,
  },
  threadActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  threadActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    gap: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
  },
  chatHeaderMain: {
    flex: 1,
  },
  chatNameRow: {
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
  chatTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
    flexShrink: 1,
  },
  chatSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  headerAction: {
    padding: spacing.xs,
  },
  chatBody: {
    flex: 1,
  },
  messageList: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyChatText: {
    fontSize: typography.sizes.sm,
    color: palette.slate400,
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
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate700,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
  },
});
