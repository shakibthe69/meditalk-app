import { CallType } from '../../types';

/** Web and React Native expose different MediaStream objects; the engine treats them opaquely. */
export type MediaStreamLike = any;

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** Response of {@code GET /api/calls/ice-servers}. */
export interface IceServersResponse {
  iceServers: IceServerConfig[];
  /** True when a TURN relay is configured server-side. */
  relayAvailable: boolean;
}

/** The two WebRTC globals the engine needs, supplied per platform. */
export interface WebRtcPrimitives {
  RTCPeerConnection: any;
  mediaDevices: {
    getUserMedia: (constraints: any) => Promise<any>;
  };
}

export interface StartCallResult {
  localStream: MediaStreamLike;
  offerSdp: string;
}

export interface HandleOfferResult {
  localStream: MediaStreamLike;
  answerSdp: string;
}

export type MediaConnectionState = 'idle' | 'connecting' | 'live' | 'failed';

/**
 * Platform-neutral WebRTC surface. Implemented once in {@link engineCore} and
 * bound to either the browser's WebRTC API or react-native-webrtc.
 */
export interface MediaEngine {
  /** False when the platform cannot do in-app media (e.g. Expo Go, insecure web page). */
  readonly available: boolean;

  /** Human-readable explanation when {@link available} is false. */
  readonly unavailableReason: string | null;

  setIceServers(servers: IceServerConfig[]): void;

  onRemoteStream(cb: (callId: string, stream: MediaStreamLike) => void): void;
  onIceCandidate(cb: (callId: string, candidate: any) => void): void;
  onError(cb: (callId: string, message: string) => void): void;
  onConnectionState(cb: (callId: string, state: MediaConnectionState) => void): void;

  /** Caller side: acquire media and produce the SDP offer. */
  startCall(callId: string, callType: CallType): Promise<StartCallResult>;

  /** Callee side: acquire media and answer an incoming offer. */
  handleOffer(callId: string, offerSdp: string, callType: CallType): Promise<HandleOfferResult>;

  handleAnswer(callId: string, answerSdp: string): Promise<void>;

  addIceCandidate(callId: string, candidate: any): Promise<void>;

  setMuted(muted: boolean): void;
  setVideoEnabled(enabled: boolean): void;

  stop(callId: string): void;
  stopAll(): void;
}

export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];
