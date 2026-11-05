import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Colors, UI_FONT } from '@/theme';
import { Tactile3DBox } from './Tactile3D';

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
  lipHeight?: number;
}

const VARIANT_PALETTE: Record<
  ButtonVariant,
  { bg: string; lip: string; text: string; borderColor?: string }
> = {
  violet: { bg: Colors.violet, lip: Colors.violetLip, text: Colors.white },
  green: { bg: Colors.green, lip: Colors.greenLip, text: Colors.white },
  red: { bg: Colors.red, lip: Colors.redLip, text: Colors.white },
  sky: { bg: Colors.sky, lip: Colors.skyLip, text: Colors.white },
  emerald: { bg: Colors.emerald, lip: Colors.emeraldLip, text: Colors.white },
  white: { bg: Colors.white, lip: Colors.whiteLip, text: Colors.bg },
  outline: {
    bg: Colors.card,
    lip: Colors.cardLip,
    text: Colors.white,
    borderColor: Colors.border,
  },
  disabled: {
    bg: Colors.card,
    lip: Colors.card,
    text: Colors.textDisabled,
    borderColor: Colors.card,
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
  lipHeight = 5,
}: DuolingoButtonProps) {
  const effectiveVariant: ButtonVariant = disabled ? 'disabled' : variant;
  const palette = VARIANT_PALETTE[effectiveVariant];

  return (
    <Tactile3DBox
      onPress={onPress}
      disabled={disabled}
      faceColor={palette.bg}
      lipColor={palette.lip}
      borderColor={palette.borderColor ?? palette.lip}
      depth={disabled ? 0 : lipHeight}
      borderRadius={16}
      style={style}
      faceStyle={styles.face}
    >
      <View style={styles.inner}>
        {icon}
        <Text style={[styles.label, { color: palette.text }, textStyle]}>{label}</Text>
      </View>
    </Tactile3DBox>
  );
}

export const CyberButton = DuolingoButton;

const styles = StyleSheet.create({
  face: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
