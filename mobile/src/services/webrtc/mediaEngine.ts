import { createEngine } from './engineCore';
import { MediaEngine, WebRtcPrimitives } from './types';

/**
 * Native (iOS/Android) WebRTC binding.
 *
 * `react-native-webrtc` is a native module, so it is loaded through a guarded
 * `require` instead of a static import: in Expo Go the module is missing and a
 * top-level import would crash the whole app. Here we simply end up with an
 * unavailable engine and a clear reason the UI can display.
 *
 * A development build (`npx expo prebuild && npx expo run:android`) provides the
 * native module and this engine becomes live.
 */
let primitives: WebRtcPrimitives | null = null;
let unavailableReason: string | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webrtc = require('react-native-webrtc');

  if (webrtc?.RTCPeerConnection && webrtc?.mediaDevices?.getUserMedia) {
    primitives = {
      RTCPeerConnection: webrtc.RTCPeerConnection,
      mediaDevices: webrtc.mediaDevices,
    };
  } else {
    unavailableReason = 'The native WebRTC module did not expose the expected API.';
  }
} catch {
  unavailableReason =
    'In-app audio and video need a development build. Expo Go cannot load native WebRTC modules.';
}

export const mediaEngine: MediaEngine = createEngine(primitives, unavailableReason);
