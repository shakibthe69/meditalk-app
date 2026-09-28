import { DoctorMessage } from './doctorPortal.types';

export type CallType = 'AUDIO' | 'VIDEO';

export type CallStatus = 'RINGING' | 'ACCEPTED' | 'DECLINED' | 'MISSED' | 'ENDED';

/** A call between a patient and a doctor, as seen by one participant. */
export interface CallSession {
  id: string;
  patientId: string;
  patientName: string;
  doctorAccountId: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialization?: string;
  /** User id of whoever placed the call. */
  initiatedByUserId: string;
  callType: CallType;
  status: CallStatus;
  /** Reserved for the media layer — both sides join this room. */
  roomId?: string;
  /** The other party, resolved for the viewer. */
  peerUserId: string;
  peerName: string;
  createdAt: string;
  acceptedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface TypingEvent {
  fromUserId: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  online: boolean;
}

export interface PresenceSnapshot {
  onlineUserIds: (string | number)[];
}

export interface ConnectedEvent {
  userId: string | number;
  onlineCount: number;
}

/** Envelope every realtime frame arrives in. */
export interface RealtimeEnvelope<T = unknown> {
  type: RealtimeEventType | string;
  payload: T;
}

export type RealtimeEventType =
  | 'connected'
  | 'pong'
  | 'message'
  | 'typing'
  | 'presence'
  | 'presence.snapshot'
  | 'call.incoming'
  | 'call.ringing'
  | 'call.accepted'
  | 'call.declined'
  | 'call.missed'
  | 'call.ended'
  // WebRTC media negotiation, relayed verbatim between the two peers.
  | 'call.offer'
  | 'call.answer'
  | 'call.ice'
  | 'error';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected';

/** Outbound command shapes accepted by the backend socket. */
export type RealtimeOutbound =
  | { type: 'ping' }
  | { type: 'message'; toUserId: string; body: string }
  | { type: 'typing'; toUserId: string; isTyping: boolean }
  | { type: 'call.invite'; toUserId: string; callType: CallType }
  | { type: 'call.accept'; callId: string }
  | { type: 'call.decline'; callId: string; reason?: string }
  | { type: 'call.end'; callId: string }
  | { type: 'call.offer'; callId: string; sdp: string }
  | { type: 'call.answer'; callId: string; sdp: string }
  | { type: 'call.ice'; callId: string; candidate: any };

/** Signalling frame received from the peer. */
export interface SignalEvent {
  callId: string;
  sdp?: string;
  candidate?: any;
}

export interface IncomingRealtimeMessage {
  peerUserId: string;
  message: DoctorMessage;
}
