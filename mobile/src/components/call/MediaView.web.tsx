import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VideoOff } from 'lucide-react-native';
import { palette, typography, spacing } from '../../theme';
import { MediaViewProps } from './mediaView.types';

/**
 * Web media surface. On react-native-web the app renders into the DOM, so a
 * native `<video>` element carries the MediaStream.
 *
 * The element is always mounted whenever a stream exists — even for audio-only
 * calls — because on the web the remote audio is played *by that element*. When
 * video should not be visible it is collapsed to a hidden 1×1 box rather than
 * unmounting it, so the call audio keeps playing.
 */
export const MediaView: React.FC<MediaViewProps> = ({
  stream,
  video,
  mirror,
  muted,
  style,
  placeholderText,
}) => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (element.srcObject !== stream) {
      element.srcObject = stream ?? null;
    }

    if (stream && typeof element.play === 'function') {
      const playing = element.play();
      // Autoplay can be rejected until the user interacts; that is recoverable.
      if (playing && typeof playing.catch === 'function') {
        playing.catch(() => {});
      }
    }

    return () => {
      if (element) {
        element.srcObject = null;
      }
    };
  }, [stream]);

  // No stream at all — nothing to play, show the placeholder on its own.
  if (!stream) {
    return (
      <View style={[styles.placeholder, style as any]}>
        <VideoOff size={30} color={palette.slate400} />
        {placeholderText ? <Text style={styles.placeholderText}>{placeholderText}</Text> : null}
      </View>
    );
  }

  const showVideo = video;

  return (
    <View style={[styles.wrapper, style as any]}>
      {React.createElement('video' as any, {
        ref: elementRef,
        autoPlay: true,
        playsInline: true,
        muted: !!muted,
        style: showVideo
          ? {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: mirror ? 'scaleX(-1)' : undefined,
              backgroundColor: palette.slate900,
            }
          : { width: 1, height: 1, opacity: 0, position: 'absolute' },
      } as any)}

      {!showVideo ? (
        <View style={styles.overlay}>
          <VideoOff size={30} color={palette.slate400} />
          {placeholderText ? <Text style={styles.placeholderText}>{placeholderText}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: palette.slate800,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.slate800,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
