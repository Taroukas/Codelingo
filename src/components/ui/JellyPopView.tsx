import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

export interface JellyPopViewProps {
  /** Change to replay the snap-in jelly bounce (optional; runs on mount by default). */
  triggerKey?: string | number | boolean;
  /** Skip initial bounce when mounted empty/inactive. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const JELLY_SNAP_SPRING = {
  damping: 10,
  stiffness: 420,
  mass: 0.55,
  useNativeDriver: true,
} as const;

/**
 * Asymmetric snap-in jelly bounce (`scaleX: 0.7 -> 1.0`, `scaleY: 1.25 -> 1.0`, `rotate: '-3deg' -> '0deg'`)
 * executed 100% on the native UI thread for seated tokens and queued commands.
 */
export function JellyPopView({
  triggerKey,
  active = true,
  style,
  children,
}: JellyPopViewProps) {
  const scaleX = useRef(new Animated.Value(active ? 0.7 : 1)).current;
  const scaleY = useRef(new Animated.Value(active ? 1.25 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(active ? -1 : 0)).current;

  useEffect(() => {
    if (!active) {
      scaleX.stopAnimation();
      scaleY.stopAnimation();
      rotateAnim.stopAnimation();
      scaleX.setValue(1);
      scaleY.setValue(1);
      rotateAnim.setValue(0);
      return;
    }

    scaleX.stopAnimation();
    scaleY.stopAnimation();
    rotateAnim.stopAnimation();
    scaleX.setValue(0.7);
    scaleY.setValue(1.25);
    rotateAnim.setValue(-1);

    const anim = Animated.parallel([
      Animated.spring(scaleX, {
        toValue: 1,
        ...JELLY_SNAP_SPRING,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        ...JELLY_SNAP_SPRING,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        ...JELLY_SNAP_SPRING,
      }),
    ]);
    anim.start();

    return () => {
      anim.stop();
    };
  }, [active, triggerKey, scaleX, scaleY, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scaleX }, { scaleY }, { rotate }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
