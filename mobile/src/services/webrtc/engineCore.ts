import { CallType } from '../../types';
import {
  DEFAULT_ICE_SERVERS,
  HandleOfferResult,
  IceServerConfig,
  MediaConnectionState,
  MediaEngine,
  MediaStreamLike,
  StartCallResult,
  WebRtcPrimitives,
} from './types';

interface PeerEntry {
  pc: any;
  localStream: MediaStreamLike;
}

function describeError(err: unknown): string {
  if (!err) return 'Media connection failed.';
  const anyErr = err as any;
  if (anyErr?.name === 'NotAllowedError') {
    return 'Camera/microphone permission was denied. Allow access and try again.';
  }
  if (anyErr?.name === 'NotFoundError' || anyErr?.name === 'DevicesNotFoundError') {
    return 'No camera or microphone was found on this device.';
  }
  if (anyErr?.name === 'NotReadableError') {
    return 'The camera or microphone is already in use by another app.';
  }
  return anyErr?.message || String(err);
}

/**
 * Builds a {@link MediaEngine} over a platform's WebRTC primitives.
 *
 * The browser and react-native-webrtc expose near-identical peer-connection
 * APIs, so the whole negotiation lives here and each platform file only supplies
 * the globals. When no primitives are available a disabled engine is returned so
 * callers can degrade gracefully instead of crashing.
 */
export function createEngine(
  primitives: WebRtcPrimitives | null,
  unavailableReason: string | null
): MediaEngine {
  if (!primitives || !primitives.RTCPeerConnection || !primitives.mediaDevices) {
    return createUnavailableEngine(unavailableReason);
  }
  return new EngineImpl(primitives);
}

function createUnavailableEngine(reason: string | null): MediaEngine {
  const message = reason ?? 'In-app audio and video are not available on this platform.';
  return {
    available: false,
    unavailableReason: message,
    setIceServers() {},
    onRemoteStream() {},
    onIceCandidate() {},
    onError() {},
    onConnectionState() {},
    async startCall(): Promise<StartCallResult> {
      throw new Error(message);
    },
    async handleOffer(): Promise<HandleOfferResult> {
      throw new Error(message);
    },
    async handleAnswer() {},
    async addIceCandidate() {},
    setMuted() {},
    setVideoEnabled() {},
    stop() {},
    stopAll() {},
  };
}

class EngineImpl implements MediaEngine {
  readonly available = true;
  readonly unavailableReason: string | null = null;

  private readonly rtc: WebRtcPrimitives;
  private iceServers: IceServerConfig[] = DEFAULT_ICE_SERVERS;

  private peers = new Map<string, PeerEntry>();
  /** Candidates that arrived before the remote description was applied. */
  private queuedCandidates = new Map<string, any[]>();

  private remoteStreamCb: ((callId: string, stream: MediaStreamLike) => void) | null = null;
  private iceCandidateCb: ((callId: string, candidate: any) => void) | null = null;
  private errorCb: ((callId: string, message: string) => void) | null = null;
  private connectionStateCb: ((callId: string, state: MediaConnectionState) => void) | null = null;

  constructor(rtc: WebRtcPrimitives) {
    this.rtc = rtc;
  }

  setIceServers(servers: IceServerConfig[]) {
    if (servers && servers.length > 0) {
      this.iceServers = servers;
    }
  }

  onRemoteStream(cb: (callId: string, stream: MediaStreamLike) => void) {
    this.remoteStreamCb = cb;
  }

  onIceCandidate(cb: (callId: string, candidate: any) => void) {
    this.iceCandidateCb = cb;
  }

  onError(cb: (callId: string, message: string) => void) {
    this.errorCb = cb;
  }

  onConnectionState(cb: (callId: string, state: MediaConnectionState) => void) {
    this.connectionStateCb = cb;
  }

  async startCall(callId: string, callType: CallType): Promise<StartCallResult> {
    const entry = await this.ensurePeer(callId, callType);

    const offer = await entry.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: callType === 'VIDEO',
    });
    await entry.pc.setLocalDescription(offer);
    await this.drainCandidates(callId);

    const sdp = entry.pc.localDescription?.sdp ?? offer.sdp;
    return { localStream: entry.localStream, offerSdp: sdp };
  }

  async handleOffer(
    callId: string,
    offerSdp: string,
    callType: CallType
  ): Promise<HandleOfferResult> {
    const entry = await this.ensurePeer(callId, callType);

    await entry.pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
    await this.drainCandidates(callId);

    const answer = await entry.pc.createAnswer();
    await entry.pc.setLocalDescription(answer);
    await this.drainCandidates(callId);

    const sdp = entry.pc.localDescription?.sdp ?? answer.sdp;
    return { localStream: entry.localStream, answerSdp: sdp };
  }

  async handleAnswer(callId: string, answerSdp: string) {
    const entry = this.peers.get(callId);
    if (!entry) return;
    await entry.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    await this.drainCandidates(callId);
  }

  async addIceCandidate(callId: string, candidate: any) {
    if (!candidate) return;

    const entry = this.peers.get(callId);
    // Hold candidates until the peer and its remote description exist.
    if (!entry || !entry.pc.remoteDescription) {
      const queue = this.queuedCandidates.get(callId) ?? [];
      queue.push(candidate);
      this.queuedCandidates.set(callId, queue);
      return;
    }

    try {
      await entry.pc.addIceCandidate(candidate);
    } catch (err) {
      console.warn('Failed to add ICE candidate:', err);
    }
  }

  setMuted(muted: boolean) {
    this.forEachLocalStream((stream) => {
      stream.getAudioTracks?.().forEach((track: any) => {
        track.enabled = !muted;
      });
    });
  }

  setVideoEnabled(enabled: boolean) {
    this.forEachLocalStream((stream) => {
      stream.getVideoTracks?.().forEach((track: any) => {
        track.enabled = enabled;
      });
    });
  }

  stop(callId: string) {
    const entry = this.peers.get(callId);
    if (!entry) return;

    this.stopStream(entry.localStream);
    try {
      entry.pc.getSenders?.().forEach((sender: any) => sender.track?.stop?.());
      entry.pc.close();
    } catch {
      // peer already closed
    }

    this.peers.delete(callId);
    this.queuedCandidates.delete(callId);
  }

  stopAll() {
    Array.from(this.peers.keys()).forEach((callId) => this.stop(callId));
    this.peers.clear();
    this.queuedCandidates.clear();
  }

  // ---------- internals ----------

  private async ensurePeer(callId: string, callType: CallType): Promise<PeerEntry> {
    const existing = this.peers.get(callId);
    if (existing) return existing;

    const wantsVideo = callType === 'VIDEO';
    const pc = new this.rtc.RTCPeerConnection({ iceServers: this.iceServers });

    pc.onicecandidate = (event: any) => {
      if (!event?.candidate) return;
      const candidate =
        typeof event.candidate.toJSON === 'function' ? event.candidate.toJSON() : event.candidate;
      this.iceCandidateCb?.(callId, candidate);
    };

    pc.ontrack = (event: any) => {
      const stream = event?.streams?.[0];
      if (stream) {
        this.remoteStreamCb?.(callId, stream);
      }
    };

    const reportState = () => {
      // react-native-webrtc may only expose iceConnectionState.
      const state = pc.connectionState ?? pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        this.connectionStateCb?.(callId, 'live');
      } else if (state === 'failed') {
        this.connectionStateCb?.(callId, 'failed');
        this.errorCb?.(callId, 'The media connection failed. Check your network and try again.');
      } else if (state === 'connecting' || state === 'checking') {
        this.connectionStateCb?.(callId, 'connecting');
      }
    };
    pc.onconnectionstatechange = reportState;
    pc.oniceconnectionstatechange = reportState;

    let localStream: MediaStreamLike;
    try {
      localStream = await this.rtc.mediaDevices.getUserMedia({
        audio: true,
        video: wantsVideo ? { facingMode: 'user' } : false,
      });
    } catch (err) {
      this.errorCb?.(callId, describeError(err));
      throw err;
    }

    localStream.getTracks().forEach((track: any) => pc.addTrack(track, localStream));

    const entry: PeerEntry = { pc, localStream };
    this.peers.set(callId, entry);
    this.connectionStateCb?.(callId, 'connecting');
    return entry;
  }

  /** Flush candidates that were queued before the remote description was set. */
  private async drainCandidates(callId: string) {
    const queued = this.queuedCandidates.get(callId);
    const entry = this.peers.get(callId);
    if (!queued || queued.length === 0 || !entry?.pc.remoteDescription) return;

    this.queuedCandidates.delete(callId);
    for (const candidate of queued) {
      try {
        await entry.pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('Failed to replay queued ICE candidate:', err);
      }
    }
  }

  private forEachLocalStream(fn: (stream: MediaStreamLike) => void) {
    this.peers.forEach((entry) => {
      if (entry.localStream) fn(entry.localStream);
    });
  }

  private stopStream(stream: MediaStreamLike) {
    try {
      stream?.getTracks?.().forEach((track: any) => track.stop?.());
    } catch {
      // stream already released
    }
  }
}
