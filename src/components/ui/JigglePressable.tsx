import React, { useCallback, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { playSound, type SoundCue } from '@/utils/sounds';
import {
  SPRING_JIGGLE_BOUNCE,
  runElasticRelease,
  runSquashPress,
} from '@/utils/springPhysics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface JigglePressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Horizontal expansion factor during press squash (default 1.04). */
  pressScaleX?: number;
  /** Vertical compression factor during press squash (default 0.92). */
  pressScaleY?: number;
  /** Downward translation in px during press squash (default 3). */
  pressTranslateY?: number;
  /** Legacy uniform scale alias: maps to pressScaleY while preserving gentle X expansion. */
  pressScale?: number;
  /** Pressed opacity (default 0.95). */
  pressOpacity?: number;
  /** Haptic impact on press-in (default 'light'). */
  haptic?: 'light' | 'medium' | 'selection' | 'none';
  /** Optional audio cue on press-in (default 'none'). */
  sound?: SoundCue | 'auto' | 'none';
  /** Override elastic release spring preset (default SPRING_JIGGLE_BOUNCE). */
  releaseSpring?: {
    damping: number;
    stiffness: number;
    mass: number;
    useNativeDriver: true;
  };
  children?: React.ReactNode;
}

/**
 * Drop-in tactile Pressable featuring 120fps volume-preserving squash & stretch
 * + elastic jiggle physics executed strictly on the native UI thread.
 */
export function JigglePressable({
  style,
  pressScaleX,
  pressScaleY,
  pressTranslateY = 3,
  pressScale,
  pressOpacity = 0.95,
  haptic = 'light',
  sound = 'none',
  releaseSpring = SPRING_JIGGLE_BOUNCE,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: JigglePressableProps) {
  const scaleXAnim = useRef(new Animated.Value(1)).current;
  const scaleYAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const targetScaleY = pressScaleY ?? (pressScale !== undefined ? Math.min(pressScale, 0.96) : 0.92);
  const targetScaleX =
    pressScaleX ??
    (pressScale !== undefined && pressScale > 1
      ? pressScale
      : 1 + Math.max(0.02, (1 - targetScaleY) * 0.5));

  const triggerHaptic = useCallback(() => {
    if (haptic === 'none') return;
    if (haptic === 'medium') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (haptic === 'selection') {
      void Haptics.selectionAsync();
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [haptic]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        triggerHaptic();
        if (sound !== 'none') {
          playSound(sound === 'auto' ? 'tap' : sound);
        }
        runSquashPress(scaleXAnim, scaleYAnim, translateYAnim, {
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          translateY: pressTranslateY,
        });
        opacityAnim.stopAnimation();
        Animated.timing(opacityAnim, {
          toValue: pressOpacity,
          duration: 55,
          useNativeDriver: true,
        }).start();
      }
      onPressIn?.(e);
    },
    [
      disabled,
      triggerHaptic,
      sound,
      scaleXAnim,
      scaleYAnim,
      translateYAnim,
      targetScaleX,
      targetScaleY,
      pressTranslateY,
      opacityAnim,
      pressOpacity,
      onPressIn,
    ]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      runElasticRelease(scaleXAnim, scaleYAnim, translateYAnim, releaseSpring);
      opacityAnim.stopAnimation();
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [scaleXAnim, scaleYAnim, translateYAnim, releaseSpring, opacityAnim, onPressOut]
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scaleX: scaleXAnim },
            { scaleY: scaleYAnim },
          ],
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
