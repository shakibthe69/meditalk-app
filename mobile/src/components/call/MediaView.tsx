import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VideoOff } from 'lucide-react-native';
import { palette, typography, spacing } from '../../theme';
import { MediaViewProps } from './mediaView.types';

/**
 * Native video surface. `RTCView` comes from `react-native-webrtc`, which is a
 * native module, so it is resolved lazily and defensively — in Expo Go the
 * module is missing and we fall back to a placeholder instead of crashing.
 */
let cachedRTCView: any = null;
let lookupDone = false;

function getRTCView(): any {
  if (lookupDone) return cachedRTCView;
  lookupDone = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedRTCView = require('react-native-webrtc').RTCView ?? null;
  } catch {
    cachedRTCView = null;
  }
  return cachedRTCView;
}

export const MediaView: React.FC<MediaViewProps> = ({
  stream,
  video,
  mirror,
  muted,
  style,
  placeholderText,
}) => {
  const RTCView = getRTCView();

  if (!video || !stream || !RTCView) {
    return (
      <View style={[styles.placeholder, style]}>
        <VideoOff size={30} color={palette.slate400} />
        {placeholderText ? <Text style={styles.placeholderText}>{placeholderText}</Text> : null}
      </View>
    );
  }

  const streamUrl = typeof stream.toURL === 'function' ? stream.toURL() : stream;

  return (
    <RTCView
      streamURL={streamUrl}
      objectFit="cover"
      mirror={!!mirror}
      zOrder={0}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.slate800,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  placeholderText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate400,
    textAlign: 'center',
  },
});
