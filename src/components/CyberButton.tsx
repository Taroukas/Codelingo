import React from 'react';
import {
  PressableProps,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, UI_FONT } from '@/theme';
import { JigglePressable } from '@/components/ui/JigglePressable';
import { type SoundCue } from '@/utils/sounds';

export interface SpringPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  pressTranslateY?: number;
  pressOpacity?: number;
  haptic?: 'light' | 'medium' | 'selection' | 'none';
  sound?: SoundCue | 'auto' | 'none';
  children?: React.ReactNode;
}

export type TactilePressableProps = SpringPressableProps;

/**
 * Reusable spring-driven interactive wrapper implementing:
 * - Native driver (`useNativeDriver: true`)
 * - Strict `.stopAnimation()` before every touch gesture
 * - Press-in keycap compression (`scale` + `translateY` 3D press)
 * - Press-out micro-bounce
 * - Instant native haptic feedback
 */
export function SpringPressable({
  style,
  pressScale = 0.94,
  pressTranslateY = 3,
  pressOpacity = 0.94,
  haptic = 'light',
  sound = 'auto',
  disabled,
  children,
  ...rest
}: SpringPressableProps) {
  const resolvedSound: SoundCue | 'none' =
    sound === 'none'
      ? 'none'
      : sound !== 'auto'
      ? sound
      : haptic === 'light'
      ? 'tap'
      : haptic === 'selection' || haptic === 'medium'
      ? 'select'
      : 'none';

  const targetScaleY = pressScale < 1 ? Math.min(pressScale, 0.94) : 0.92;
  const targetScaleX = 1 + Math.max(0.025, (1 - targetScaleY) * 0.55);

  return (
    <JigglePressable
      {...rest}
      disabled={disabled}
      haptic={haptic}
      sound={resolvedSound}
      pressScaleX={targetScaleX}
      pressScaleY={targetScaleY}
      pressTranslateY={pressTranslateY}
      pressOpacity={pressOpacity}
      style={style}
    >
      {children}
    </JigglePressable>
  );
}

export const TactilePressable = SpringPressable;

export type ButtonVariant =
  | 'violet'
  | 'green'
  | 'red'
  | 'white'
  | 'sky'
  | 'emerald'
  | 'outline'
  | 'disabled';

interface DuolingoButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  /** Legacy 3D-lip height. Accepted for compatibility and ignored. */
  lipHeight?: number;
}

/**
 * Flat Linear-style action button with organic spring compression & haptics.
 */
const VARIANT_PALETTE: Record<
  ButtonVariant,
  { bg: string; text: string; borderColor: string }
> = {
  violet: {
    bg: Colors.accent,
    text: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  green: {
    bg: Colors.success,
    text: '#0A0A0C',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  red: {
    bg: Colors.danger,
    text: '#0A0A0C',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  sky: {
    bg: Colors.accent,
    text: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  emerald: {
    bg: Colors.success,
    text: '#0A0A0C',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  white: {
    bg: Colors.textPrimary,
    text: Colors.canvas,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  outline: {
    bg: Colors.control,
    text: Colors.textPrimary,
    borderColor: Colors.hairline,
  },
  disabled: {
    bg: Colors.control,
    text: Colors.textDisabled,
    borderColor: Colors.hairline,
  },
};

export function DuolingoButton({
  label,
  onPress,
  variant = 'violet',
  disabled = false,
  style,
  textStyle,
  icon,
}: DuolingoButtonProps) {
  const palette = VARIANT_PALETTE[disabled ? 'disabled' : variant];

  return (
    <SpringPressable
      onPress={onPress}
      disabled={disabled}
      haptic="medium"
      pressScale={0.97}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.borderColor,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {icon}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[styles.label, { color: palette.text }, textStyle]}
        >
          {label}
        </Text>
      </View>
    </SpringPressable>
  );
}

export const CyberButton = DuolingoButton;

const styles = StyleSheet.create({
  button: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderBottomWidth: 4,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
