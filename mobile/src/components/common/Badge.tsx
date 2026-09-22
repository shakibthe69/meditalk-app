import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { palette, typography, borderRadius, spacing } from '../../theme';
import { LogStatus } from '../../types';

interface BadgeProps {
  label: string;
  status?: LogStatus | 'PRIMARY' | 'DEFAULT' | 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status = 'DEFAULT',
  size = 'sm',
  style,
}) => {
  const getColors = (): { bg: string; text: string; border: string } => {
    switch (status) {
      case 'TAKEN':
      case 'SUCCESS':
        return {
          bg: palette.success50,
          text: palette.success600,
          border: palette.success100,
        };
      case 'SKIPPED':
      case 'WARNING':
        return {
          bg: palette.warning50,
          text: palette.warning600,
          border: palette.warning100,
        };
      case 'MISSED':
      case 'DANGER':
        return {
          bg: palette.danger50,
          text: palette.danger600,
          border: palette.danger100,
        };
      case 'PENDING':
      case 'INFO':
        return {
          bg: palette.blue50,
          text: palette.blue600,
          border: palette.blue100,
        };
      case 'PRIMARY':
        return {
          bg: palette.teal50,
          text: palette.teal700,
          border: palette.teal200,
        };
      case 'DEFAULT':
      default:
        return {
          bg: palette.slate100,
          text: palette.slate600,
          border: palette.slate200,
        };
    }
  };

  const colors = getColors();

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isSmall ? typography.sizes.xs : typography.sizes.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
