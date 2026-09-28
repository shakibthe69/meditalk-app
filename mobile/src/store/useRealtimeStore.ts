import { create } from 'zustand';
import {
  DoctorMessage,
  CallSession,
  CallType,
  CallStatus,
  RealtimeStatus,
  SignalEvent,
} from '../types';
import { realtimeClient } from '../services/realtime/realtimeClient';
import { callApi } from '../services/api';
import { mediaEngine, MediaConnectionState, MediaStreamLike } from '../services/webrtc';

const TERMINAL_DISPLAY_MS = 1800;

interface LastMessage {
  seq: number;
  /** The other party in the conversation, as a string id. */
  peerUserId: string;
  message: DoctorMessage;
}

interface LastCallOutcome {
  status: CallStatus;
  peerName: string;
}

interface RealtimeState {
  status: RealtimeStatus;
  myUserId: string | null;

  /** Live presence, stored as string ids so numeric/string comparisons always match. */
  onlineUserIds: string[];
  peerTyping: Record<string, boolean>;

  lastMessage: LastMessage | null;
  lastCallOutcome: LastCallOutcome | null;

  incomingCall: CallSession | null;
  activeCall: CallSession | null;

  // ---- WebRTC media ----
  localStream: MediaStreamLike | null;
  remoteStream: MediaStreamLike | null;
  mediaState: MediaConnectionState;
  mediaError: string | null;
  /** False when this platform cannot do in-app media (Expo Go, insecure web page). */
  mediaAvailable: boolean;
  mediaUnavailableReason: string | null;

  callHistory: CallSession[];
  isLoadingHistory: boolean;

  /** Latest admin-authored notification, surfaced as an in-app notice. */
  adminNotice: { title: string; body: string; at: number } | null;

  init: (token: string, myUserId?: string | number) => void;
  teardown: () => void;

  isUserOnline: (userId?: string | number) => boolean;
  isPeerTyping: (userId?: string | number) => boolean;

  sendChatMessage: (
    peerUserId: string,
    body: string,
    restFallback?: () => Promise<DoctorMessage>
  ) => Promise<void>;
  sendTyping: (peerUserId: string, isTyping: boolean) => void;

  startCall: (peerUserId: string, peerName: string, callType: CallType) => boolean;
  acceptCall: () => void;
  declineCall: (reason?: string) => void;
  endCall: () => void;
  fetchCallHistory: () => Promise<void>;

  setMuted: (muted: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  clearAdminNotice: () => void;
}

/** Ids arrive as JSON numbers; normalise them so equal ids always compare equal. */
function normalizeSession(session: CallSession): CallSession {
  return {
    ...session,
    id: String(session.id),
    peerUserId: String(session.peerUserId),
    initiatedByUserId: String(session.initiatedByUserId),
    patientId: String(session.patientId),
    doctorUserId: String(session.doctorUserId),
    doctorAccountId: String(session.doctorAccountId),
  };
}

export const useRealtimeStore = create<RealtimeState>((set, get) => {
  let sequence = 0;
  let unsubscribers: Array<() => void> = [];
  let terminalTimer: ReturnType<typeof setTimeout> | null = null;

  const amInitiator = (session: CallSession) =>
    get().myUserId != null && String(session.initiatedByUserId) === get().myUserId;

  const pushMessage = (message: DoctorMessage, peerUserId: string) => {
    set({ lastMessage: { seq: ++sequence, peerUserId: String(peerUserId), message } });
  };

  const clearTerminalTimer = () => {
    if (terminalTimer) {
      clearTimeout(terminalTimer);
      terminalTimer = null;
    }
  };

  const resetMedia = (callId?: string) => {
    if (callId) {
      mediaEngine.stop(String(callId));
    } else {
      mediaEngine.stopAll();
    }
    set({
      localStream: null,
      remoteStream: null,
      mediaState: 'idle',
      mediaError: null,
    });
  };

  /** Caller side: open the camera/mic and send the SDP offer. */
  const beginMediaAsCaller = async (session: CallSession) => {
    set({ mediaState: 'connecting', mediaError: null, localStream: null, remoteStream: null });
    try {
      const { localStream, offerSdp } = await mediaEngine.startCall(session.id, session.callType);
      set({ localStream });
      realtimeClient.send({ type: 'call.offer', callId: session.id, sdp: offerSdp });
    } catch {
      // The engine already reported the reason through its error callback.
    }
  };

  /** Show a finished call for a moment, then close the call screen. */
  const showTerminalCall = (session: CallSession, status: CallStatus) => {
    resetMedia(session.id);

    const active = get().activeCall;
    if (!active || String(active.id) !== String(session.id)) {
      get().fetchCallHistory();
      return;
    }

    clearTerminalTimer();
    set({
      activeCall: { ...session, status },
      lastCallOutcome: { status, peerName: session.peerName },
    });

    terminalTimer = setTimeout(() => {
      terminalTimer = null;
      if (String(get().activeCall?.id) === String(session.id)) {
        set({ activeCall: null });
      }
    }, TERMINAL_DISPLAY_MS);

    get().fetchCallHistory();
  };

  const subscribe = () => {
    unsubscribers = [
      realtimeClient.on('connected', (payload: { userId?: string | number }) => {
        if (payload?.userId != null) {
          set({ myUserId: String(payload.userId) });
        }
      }),

      realtimeClient.on('presence.snapshot', (payload: { onlineUserIds?: (string | number)[] }) => {
        set({ onlineUserIds: (payload?.onlineUserIds ?? []).map((id) => String(id)) });
      }),

      realtimeClient.on('presence', (payload: { userId?: string | number; online?: boolean }) => {
        if (payload?.userId == null) return;
        const id = String(payload.userId);
        const others = get().onlineUserIds.filter((existing) => existing !== id);
        set({ onlineUserIds: payload.online ? [...others, id] : others });
      }),

      realtimeClient.on('typing', (payload: { fromUserId?: string | number; isTyping?: boolean }) => {
        if (payload?.fromUserId == null) return;
        set({
          peerTyping: {
            ...get().peerTyping,
            [String(payload.fromUserId)]: Boolean(payload.isTyping),
          },
        });
      }),

      realtimeClient.on('message', (payload: DoctorMessage) => {
        if (!payload?.id) return;

        // A chat view is keyed by the conversation partner, so resolve it from
        // this user's point of view: if we authored it the partner is the other
        // party, otherwise the partner is the author.
        const authorId = String(payload.fromDoctor ? payload.doctorUserId : payload.patientId);
        const otherId = String(payload.fromDoctor ? payload.patientId : payload.doctorUserId);
        const myId = get().myUserId;
        const partner = myId == null ? otherId : authorId === myId ? otherId : authorId;

        pushMessage(payload, partner);
        set({ peerTyping: { ...get().peerTyping, [partner]: false } });
      }),

      realtimeClient.on('call.incoming', (payload: CallSession) => {
        const session = normalizeSession(payload);
        const active = get().activeCall;
        if (active && active.status === 'ACCEPTED') {
          // Already on a call — decline instead of ringing over it.
          realtimeClient.send({ type: 'call.decline', callId: session.id, reason: 'busy' });
          return;
        }
        set({ incomingCall: session, lastCallOutcome: null });
      }),

      realtimeClient.on('call.ringing', (payload: CallSession) => {
        set({ activeCall: normalizeSession(payload), lastCallOutcome: null });
      }),

      realtimeClient.on('call.accepted', async (payload: CallSession) => {
        const session = normalizeSession(payload);
        set({
          activeCall: session,
          incomingCall: null,
          lastCallOutcome: null,
          mediaError: null,
          mediaState: 'connecting',
          localStream: null,
          remoteStream: null,
        });
        // Only the caller creates the offer; the callee waits for `call.offer`.
        if (amInitiator(session)) {
          await beginMediaAsCaller(session);
        }
      }),

      // ---- WebRTC negotiation relayed through the server ----
      realtimeClient.on('call.offer', async (payload: SignalEvent) => {
        const active = get().activeCall;
        if (!active || String(active.id) !== String(payload?.callId)) return;
        if (!payload?.sdp) return;

        set({ mediaState: 'connecting', mediaError: null });
        try {
          const { localStream, answerSdp } = await mediaEngine.handleOffer(
            String(payload.callId),
            payload.sdp,
            active.callType
          );
          set({ localStream });
          realtimeClient.send({
            type: 'call.answer',
            callId: String(payload.callId),
            sdp: answerSdp,
          });
        } catch {
          // The engine reports the failure through its error callback.
        }
      }),

      realtimeClient.on('call.answer', async (payload: SignalEvent) => {
        if (!payload?.sdp) return;
        await mediaEngine.handleAnswer(String(payload.callId), payload.sdp);
      }),

      realtimeClient.on('call.ice', async (payload: SignalEvent) => {
        if (!payload?.candidate) return;
        await mediaEngine.addIceCandidate(String(payload.callId), payload.candidate);
      }),

      realtimeClient.on('call.declined', (payload: CallSession) => {
        const session = normalizeSession(payload);
        if (String(get().incomingCall?.id) === session.id) {
          set({ incomingCall: null });
        }
        if (amInitiator(session)) {
          showTerminalCall(session, 'DECLINED');
        } else {
          resetMedia(session.id);
          set({ activeCall: null });
          get().fetchCallHistory();
        }
      }),

      realtimeClient.on('call.missed', (payload: CallSession) => {
        const session = normalizeSession(payload);
        if (String(get().incomingCall?.id) === session.id) {
          set({ incomingCall: null });
        }
        if (amInitiator(session)) {
          showTerminalCall(session, 'MISSED');
        } else {
          resetMedia(session.id);
          set({ activeCall: null });
          get().fetchCallHistory();
        }
      }),

      realtimeClient.on('call.ended', (payload: CallSession) => {
        const session = normalizeSession(payload);
        set({ incomingCall: null });
        if (String(get().activeCall?.id) === session.id) {
          showTerminalCall(session, 'ENDED');
        } else {
          resetMedia(session.id);
          get().fetchCallHistory();
        }
      }),

      // Admin-authored notification (sent from the Admin Panel). Surface it so
      // the patient actually sees the message, not just a server-side record.
      realtimeClient.on('admin.notification', (payload: { title?: string; body?: string }) => {
        set({
          adminNotice: {
            title: payload?.title || 'Message from Meditalk Admin',
            body: payload?.body || '',
            at: Date.now(),
          },
        });
      }),

      realtimeClient.on('error', (payload: unknown) => {
        if (payload) console.warn('Realtime error:', payload);
      }),

      realtimeClient.onStatus((status) => set({ status })),
    ];
  };

  return {
    status: 'disconnected',
    myUserId: null,
    onlineUserIds: [],
    peerTyping: {},
    lastMessage: null,
    lastCallOutcome: null,
    incomingCall: null,
    activeCall: null,
    localStream: null,
    remoteStream: null,
    mediaState: 'idle',
    mediaError: null,
    mediaAvailable: mediaEngine.available,
    mediaUnavailableReason: mediaEngine.unavailableReason,
    callHistory: [],
    isLoadingHistory: false,
    adminNotice: null,

    init: (token, myUserId) => {
      if (!token) return;

      unsubscribers.forEach((off) => off());
      unsubscribers = [];
      subscribe();

      // Engine callbacks are idempotent setters, safe to (re)bind per session.
      mediaEngine.onRemoteStream((_callId, stream) => set({ remoteStream: stream }));
      mediaEngine.onIceCandidate((callId, candidate) =>
        realtimeClient.send({ type: 'call.ice', callId, candidate })
      );
      mediaEngine.onError((_callId, message) =>
        set({ mediaState: 'failed', mediaError: message })
      );
      mediaEngine.onConnectionState((_callId, state) => set({ mediaState: state }));

      // ICE servers come from the backend so TURN credentials stay server-side.
      callApi
        .getIceServers()
        .then((res) => mediaEngine.setIceServers(res?.iceServers ?? []))
        .catch((err) => console.warn('Failed to load ICE servers:', err));

      if (myUserId != null) {
        set({ myUserId: String(myUserId) });
      }

      realtimeClient.connect(token);
    },

    teardown: () => {
      unsubscribers.forEach((off) => off());
      unsubscribers = [];
      clearTerminalTimer();
      resetMedia();
      realtimeClient.disconnect();
      set({
        status: 'disconnected',
        myUserId: null,
        onlineUserIds: [],
        peerTyping: {},
        incomingCall: null,
        activeCall: null,
        lastCallOutcome: null,
        callHistory: [],
        adminNotice: null,
      });
    },

    isUserOnline: (userId) => {
      if (userId == null) return false;
      return get().onlineUserIds.includes(String(userId));
    },

    isPeerTyping: (userId) => {
      if (userId == null) return false;
      return Boolean(get().peerTyping[String(userId)]);
    },

    sendChatMessage: async (peerUserId, body, restFallback) => {
      const trimmed = body.trim();
      if (!trimmed) return;

      if (realtimeClient.send({ type: 'message', toUserId: peerUserId, body: trimmed })) {
        // The server echoes to both parties, so the bubble appears via `message`.
        return;
      }

      // Socket down: fall back to REST so the message is not lost.
      if (restFallback) {
        const message = await restFallback();
        if (message) {
          pushMessage(message, peerUserId);
        }
      }
    },

    sendTyping: (peerUserId, isTyping) => {
      realtimeClient.send({ type: 'typing', toUserId: peerUserId, isTyping });
    },

    startCall: (peerUserId, peerName, callType) => {
      if (!realtimeClient.isConnected()) {
        return false;
      }

      // Optimistic screen so the caller starts dialling immediately; the server
      // confirms with `call.ringing` (real id) or `call.missed` (peer offline).
      const pending: CallSession = {
        id: 'pending',
        patientId: '',
        patientName: '',
        doctorAccountId: '',
        doctorUserId: '',
        doctorName: '',
        initiatedByUserId: get().myUserId ?? '',
        callType,
        status: 'RINGING',
        peerUserId: String(peerUserId),
        peerName,
        createdAt: new Date().toISOString(),
      };

      clearTerminalTimer();
      set({
        activeCall: pending,
        incomingCall: null,
        lastCallOutcome: null,
        localStream: null,
        remoteStream: null,
        mediaState: 'idle',
        mediaError: null,
      });
      realtimeClient.send({ type: 'call.invite', toUserId: peerUserId, callType });
      return true;
    },

    acceptCall: () => {
      const incoming = get().incomingCall;
      if (!incoming) return;
      clearTerminalTimer();
      set({
        activeCall: { ...incoming, status: 'ACCEPTED' },
        incomingCall: null,
        lastCallOutcome: null,
        mediaError: null,
        mediaState: 'connecting',
      });
      realtimeClient.send({ type: 'call.accept', callId: incoming.id });
    },

    declineCall: (reason) => {
      const incoming = get().incomingCall;
      if (!incoming) return;
      set({ incomingCall: null });
      realtimeClient.send({ type: 'call.decline', callId: incoming.id, reason });
    },

    endCall: () => {
      const active = get().activeCall;
      if (!active) return;

      if (active.id === 'pending') {
        // Never reached the server.
        resetMedia();
        set({ activeCall: null });
        return;
      }

      realtimeClient.send({ type: 'call.end', callId: active.id });
      resetMedia(active.id);
      clearTerminalTimer();
      set({
        activeCall: { ...active, status: 'ENDED' },
        lastCallOutcome: { status: 'ENDED', peerName: active.peerName },
      });
      terminalTimer = setTimeout(() => {
        terminalTimer = null;
        if (String(get().activeCall?.id) === String(active.id)) {
          set({ activeCall: null });
        }
      }, TERMINAL_DISPLAY_MS);
      get().fetchCallHistory();
    },

    fetchCallHistory: async () => {
      set({ isLoadingHistory: true });
      try {
        const history = await callApi.getHistory();
        set({ callHistory: history.map(normalizeSession) });
      } catch (err) {
        console.warn('Failed to load call history:', err);
      } finally {
        set({ isLoadingHistory: false });
      }
    },

    setMuted: (muted) => {
      mediaEngine.setMuted(muted);
    },

    setVideoEnabled: (enabled) => {
      mediaEngine.setVideoEnabled(enabled);
    },

    clearAdminNotice: () => set({ adminNotice: null }),
  };
});
