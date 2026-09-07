import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { palette, typography, borderRadius, spacing } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getContainerStyles = (): ViewStyle[] => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      opacity: disabled || loading ? 0.6 : 1,
    };

    if (fullWidth) {
      base.width = '100%';
    }

    // Size
    switch (size) {
      case 'sm':
        base.paddingVertical = spacing.xs + 2;
        base.paddingHorizontal = spacing.md;
        break;
      case 'lg':
        base.paddingVertical = spacing.base;
        base.paddingHorizontal = spacing.xl;
        break;
      case 'md':
      default:
        base.paddingVertical = spacing.md;
        base.paddingHorizontal = spacing.lg;
        break;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        base.backgroundColor = palette.teal50;
        base.borderWidth = 1;
        base.borderColor = palette.teal200;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = palette.teal600;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'danger':
        base.backgroundColor = palette.danger600;
        break;
      case 'success':
        base.backgroundColor = palette.success600;
        break;
      case 'primary':
      default:
        base.backgroundColor = palette.teal600;
        break;
    }

    return [base, style as ViewStyle];
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (size) {
      case 'sm':
        base.fontSize = typography.sizes.sm;
        break;
      case 'lg':
        base.fontSize = typography.sizes.lg;
        break;
      case 'md':
      default:
        base.fontSize = typography.sizes.base;
        break;
    }

    switch (variant) {
      case 'secondary':
        base.color = palette.teal700;
        break;
      case 'outline':
        base.color = palette.teal600;
        break;
      case 'ghost':
        base.color = palette.slate700;
        break;
      case 'danger':
      case 'success':
      case 'primary':
      default:
        base.color = palette.white;
        break;
    }

    return base;
  };

  const spinnerColor = variant === 'outline' || variant === 'secondary' || variant === 'ghost' ? palette.teal600 : palette.white;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyles()}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
