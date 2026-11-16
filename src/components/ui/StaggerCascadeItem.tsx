import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { SPRING_STAGGER_ENTRANCE } from '@/utils/springPhysics';

export interface StaggerCascadeItemProps {
  /** Zero-based card/row index used to calculate the stagger offset. */
  index: number;
  /** Change this key (e.g., active segment or focus counter) to replay the cascade. */
  triggerKey?: string | number;
  /** Delay between items in ms (default 35ms). */
  delayMs?: number;
  /** Initial vertical entrance offset in px (default 18). */
  initialTranslateY?: number;
  /** Initial scale factor (default 0.94). */
  initialScale?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Staggered Bento/Card entrance running 100% on the native UI thread.
 */
export function StaggerCascadeItem({
  index,
  triggerKey = 0,
  delayMs = 35,
  initialTranslateY = 18,
  initialScale = 0.94,
  style,
  children,
}: StaggerCascadeItemProps) {
  const translateY = useRef(new Animated.Value(initialTranslateY)).current;
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateY.stopAnimation();
    scale.stopAnimation();
    opacity.stopAnimation();

    translateY.setValue(initialTranslateY);
    scale.setValue(initialScale);
    opacity.setValue(0);

    const staggerDelay = Math.min(Math.max(index, 0), 12) * delayMs;
    const anim = Animated.sequence([
      Animated.delay(staggerDelay),
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          ...SPRING_STAGGER_ENTRANCE,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...SPRING_STAGGER_ENTRANCE,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start();

    return () => {
      anim.stop();
    };
  }, [index, triggerKey, delayMs, initialTranslateY, initialScale, translateY, scale, opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
