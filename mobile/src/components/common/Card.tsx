import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { palette, borderRadius, spacing, shadows } from '../../theme';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  children,
  style,
  ...props
}) => {
  const getBaseStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: palette.white,
      borderRadius: borderRadius.xl,
      padding: spacing.base,
    };

    switch (variant) {
      case 'outlined':
        base.borderWidth = 1;
        base.borderColor = palette.slate200;
        break;
      case 'flat':
        base.backgroundColor = palette.slate100;
        break;
      case 'elevated':
      default:
        Object.assign(base, shadows.sm);
        base.borderWidth = 1;
        base.borderColor = palette.slate100;
        break;
    }

    return base;
  };

  return (
    <View style={[getBaseStyle(), style]} {...props}>
      {children}
    </View>
  );
};
