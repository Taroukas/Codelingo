import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import {
  JigglePressable,
  type JigglePressableProps,
} from '@/components/ui/JigglePressable';
import { SPRING_JIGGLE_BOUNCE } from '@/utils/springPhysics';

export interface CurrencyPillButtonProps extends JigglePressableProps {
  /** Monitored currency/counter value (e.g., gems, hearts, xp). Triggers pulse on change. */
  value?: number;
  /** Optional wrapper container style for flex/layout outside the animated pill. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional peak pulse scale (default 1.22). */
  peakScale?: number;
}

/**
 * Shared currency badge button (`Hearts`, `Gems`, `XP`) that combines
 * `<JigglePressable>` squash-and-stretch with an elastic heartbeat / crystal-jiggle
 * (`scale: 1.0 -> 1.22 -> 0.94 -> 1.04 -> 1.0`, `rotate: 0 -> -6deg -> 6deg -> 0deg`)
 * whenever tapped or when the currency value changes.
 */
export function CurrencyPillButton({
  value,
  containerStyle,
  peakScale = 1.22,
  onPress,
  style,
  children,
  ...rest
}: CurrencyPillButtonProps) {
  const jiggleScale = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevValueRef = useRef(value);

  const triggerCrystalJiggle = useCallback(() => {
    jiggleScale.stopAnimation();
    rotateAnim.stopAnimation();

    jiggleScale.setValue(1);
    rotateAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(jiggleScale, {
          toValue: peakScale,
          duration: 75,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(jiggleScale, {
          toValue: 0.94,
          duration: 70,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(jiggleScale, {
          toValue: 1,
          ...SPRING_JIGGLE_BOUNCE,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 85,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          damping: 11,
          stiffness: 380,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [jiggleScale, rotateAnim, peakScale]);

  useEffect(() => {
    if (value !== undefined && prevValueRef.current !== value) {
      prevValueRef.current = value;
      triggerCrystalJiggle();
    }
  }, [value, triggerCrystalJiggle]);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      triggerCrystalJiggle();
      onPress?.(e);
    },
    [triggerCrystalJiggle, onPress]
  );

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-6deg', '0deg', '6deg'],
  });

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          transform: [{ scale: jiggleScale }, { rotate }],
        },
      ]}
    >
      <JigglePressable
        {...rest}
        onPress={handlePress}
        pressScaleX={1.05}
        pressScaleY={0.9}
        pressTranslateY={2}
        style={style}
      >
        {children}
      </JigglePressable>
    </Animated.View>
  );
}
