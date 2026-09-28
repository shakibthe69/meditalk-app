import { StyleProp, ViewStyle } from 'react-native';
import { MediaStreamLike } from '../../services/webrtc';

export interface MediaViewProps {
  /** The stream to display (local preview or the remote peer). */
  stream: MediaStreamLike | null;
  /** Render video. When false (audio-only calls) a placeholder is shown instead. */
  video: boolean;
  /** Mirror the local self-view. */
  mirror?: boolean;
  /** Mute playback — always true for the local preview to avoid audio feedback. */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  placeholderText?: string;
}
