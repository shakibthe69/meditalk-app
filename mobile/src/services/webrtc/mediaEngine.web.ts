import { createEngine } from './engineCore';
import { MediaEngine, WebRtcPrimitives } from './types';

/**
 * Browser WebRTC binding — no dependencies at all, the browser already has a
 * full peer connection and `getUserMedia`.
 *
 * Note the secure-context rule: browsers only expose camera/microphone on
 * HTTPS or `localhost`. Serving the app on a plain LAN IP silently hides
 * `navigator.mediaDevices`, so that case is detected and reported explicitly
 * rather than failing with a confusing error.
 */
const runtime = globalThis as any;

const PeerConnectionCtor = runtime.RTCPeerConnection ?? runtime.webkitRTCPeerConnection;
const mediaDevices = runtime.navigator?.mediaDevices;

let primitives: WebRtcPrimitives | null = null;
let unavailableReason: string | null = null;

if (!PeerConnectionCtor) {
  unavailableReason = 'This browser does not support WebRTC calls.';
} else if (!mediaDevices?.getUserMedia) {
  unavailableReason = runtime.isSecureContext === false
    ? 'Camera and microphone need a secure page. Open the app on localhost or over HTTPS.'
    : 'This browser cannot access the camera or microphone.';
} else {
  primitives = {
    RTCPeerConnection: PeerConnectionCtor,
    mediaDevices,
  };
}

export const mediaEngine: MediaEngine = createEngine(primitives, unavailableReason);
