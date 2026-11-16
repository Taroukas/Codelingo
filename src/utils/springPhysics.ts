import { Animated, Easing } from 'react-native';

/**
 * Centralized 120fps native UI-thread spring & harmonic physics presets.
 * Every animation helper strictly enforces `useNativeDriver: true`.
 */

/** Fast volume-preserving press-in squash. */
export const SPRING_PRESS_SQUASH = {
  damping: 24,
  stiffness: 500,
  mass: 0.45,
  useNativeDriver: true,
} as const;

/** Tactile buttons, path pucks, and code token elastic release jiggle. */
export const SPRING_JIGGLE_BOUNCE = {
  damping: 11,
  stiffness: 380,
  mass: 0.55,
  useNativeDriver: true,
} as const;

/** Anchored popovers, speech bubbles, and modal card bloom. */
export const SPRING_POPOVER_ELASTIC = {
  damping: 14,
  stiffness: 340,
  mass: 0.65,
  useNativeDriver: true,
} as const;

/** Cascading screen cards, Bento grids, and podium reveals. */
export const SPRING_STAGGER_ENTRANCE = {
  damping: 15,
  stiffness: 260,
  mass: 0.7,
  useNativeDriver: true,
} as const;

/** Locked nodes & wrong answers harmonic oscillation (~320ms). */
export const SPRING_SHIVER_SHAKE = {
  offsets: [-9, 9, -6, 6, -3, 3, 0] as const,
  stepDurationMs: 45,
  maxRotateDeg: 2.5,
  useNativeDriver: true,
} as const;

/** Volume-preserving press squash targets (width expands as height compresses). */
export interface SquashTarget {
  scaleX?: number;
  scaleY?: number;
  translateY?: number;
}

const DEFAULT_SQUASH: Required<SquashTarget> = {
  scaleX: 1.04,
  scaleY: 0.92,
  translateY: 3,
};

export function runSquashPress(
  scaleX: Animated.Value,
  scaleY: Animated.Value,
  translateY: Animated.Value,
  target: SquashTarget = DEFAULT_SQUASH
): Animated.CompositeAnimation {
  scaleX.stopAnimation();
  scaleY.stopAnimation();
  translateY.stopAnimation();

  const anim = Animated.parallel([
    Animated.spring(scaleX, {
      toValue: target.scaleX ?? DEFAULT_SQUASH.scaleX,
      ...SPRING_PRESS_SQUASH,
    }),
    Animated.spring(scaleY, {
      toValue: target.scaleY ?? DEFAULT_SQUASH.scaleY,
      ...SPRING_PRESS_SQUASH,
    }),
    Animated.spring(translateY, {
      toValue: target.translateY ?? DEFAULT_SQUASH.translateY,
      ...SPRING_PRESS_SQUASH,
    }),
  ]);
  anim.start();
  return anim;
}

export function runElasticRelease(
  scaleX: Animated.Value,
  scaleY: Animated.Value,
  translateY: Animated.Value,
  springConfig: typeof SPRING_JIGGLE_BOUNCE | {
    damping: number;
    stiffness: number;
    mass: number;
    useNativeDriver: true;
  } = SPRING_JIGGLE_BOUNCE
): Animated.CompositeAnimation {
  scaleX.stopAnimation();
  scaleY.stopAnimation();
  translateY.stopAnimation();

  const anim = Animated.parallel([
    Animated.spring(scaleX, {
      toValue: 1,
      ...springConfig,
    }),
    Animated.spring(scaleY, {
      toValue: 1,
      ...springConfig,
    }),
    Animated.spring(translateY, {
      toValue: 0,
      ...springConfig,
    }),
  ]);
  anim.start();
  return anim;
}

/**
 * Runs a crisp harmonic horizontal shake + micro tilt (~315-320ms on native UI thread).
 * Pair with `rotate = translateX.interpolate({ inputRange: [-9, 0, 9], outputRange: ['-2.5deg', '0deg', '2.5deg'] })`.
 */
export function runShiverShake(
  translateX: Animated.Value,
  rotateVal?: Animated.Value,
  amplitude = 1
): Animated.CompositeAnimation {
  translateX.stopAnimation();
  translateX.setValue(0);
  if (rotateVal) {
    rotateVal.stopAnimation();
    rotateVal.setValue(0);
  }

  const ease = Easing.inOut(Easing.quad);
  const stepMs = SPRING_SHIVER_SHAKE.stepDurationMs;

  const xSequence = Animated.sequence(
    SPRING_SHIVER_SHAKE.offsets.map((offset) =>
      Animated.timing(translateX, {
        toValue: offset * amplitude,
        duration: stepMs,
        easing: ease,
        useNativeDriver: true,
      })
    )
  );

  if (!rotateVal) {
    xSequence.start();
    return xSequence;
  }

  const rSequence = Animated.sequence(
    SPRING_SHIVER_SHAKE.offsets.map((offset) =>
      Animated.timing(rotateVal, {
        toValue: (offset / 9) * amplitude,
        duration: stepMs,
        easing: ease,
        useNativeDriver: true,
      })
    )
  );

  const combined = Animated.parallel([xSequence, rSequence]);
  combined.start();
  return combined;
}

/**
 * Triggers a lively volume-preserving heartbeat / crystal jiggle on badges & currency pills.
 */
export function runBadgeJiggle(
  scaleX: Animated.Value,
  scaleY: Animated.Value,
  rotateVal: Animated.Value
): Animated.CompositeAnimation {
  scaleX.stopAnimation();
  scaleY.stopAnimation();
  rotateVal.stopAnimation();

  scaleX.setValue(0.92);
  scaleY.setValue(1.18);
  rotateVal.setValue(-1);

  const anim = Animated.parallel([
    Animated.sequence([
      Animated.spring(scaleX, {
        toValue: 1.2,
        damping: 16,
        stiffness: 520,
        mass: 0.4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleX, {
        toValue: 1,
        ...SPRING_JIGGLE_BOUNCE,
      }),
    ]),
    Animated.sequence([
      Animated.spring(scaleY, {
        toValue: 0.9,
        damping: 16,
        stiffness: 520,
        mass: 0.4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        ...SPRING_JIGGLE_BOUNCE,
      }),
    ]),
    Animated.sequence([
      Animated.timing(rotateVal, {
        toValue: 1,
        duration: 85,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(rotateVal, {
        toValue: 0,
        damping: 10,
        stiffness: 380,
        mass: 0.5,
        useNativeDriver: true,
      }),
    ]),
  ]);
  anim.start();
  return anim;
}
