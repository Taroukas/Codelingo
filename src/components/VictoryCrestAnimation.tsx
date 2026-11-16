import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { RoboMascot } from '@/components/ide/RoboMascot';
import { MONO } from '@/theme';

interface ConfettiSpec {
  angleDeg: number;
  distance: number;
  size: number;
  color: string;
  rotateDeg: number;
  shape: 'star' | 'diamond' | 'brace_left' | 'brace_right' | 'semicolon';
}

const VECTOR_CONFETTI: ConfettiSpec[] = [
  { angleDeg: -82, distance: 78, size: 15, color: '#FBBF24', rotateDeg: 24, shape: 'star' },
  { angleDeg: -50, distance: 84, size: 13, color: '#7C5CFC', rotateDeg: -18, shape: 'brace_left' },
  { angleDeg: -22, distance: 80, size: 12, color: '#38BDF8', rotateDeg: 30, shape: 'diamond' },
  { angleDeg: 10, distance: 82, size: 14, color: '#34D399', rotateDeg: 15, shape: 'semicolon' },
  { angleDeg: 38, distance: 86, size: 15, color: '#FBBF24', rotateDeg: -28, shape: 'star' },
  { angleDeg: 68, distance: 76, size: 13, color: '#7C5CFC', rotateDeg: 22, shape: 'brace_right' },
  { angleDeg: 100, distance: 78, size: 12, color: '#38BDF8', rotateDeg: -20, shape: 'diamond' },
  { angleDeg: 132, distance: 84, size: 14, color: '#34D399', rotateDeg: 18, shape: 'star' },
  { angleDeg: 162, distance: 80, size: 13, color: '#FBBF24', rotateDeg: -25, shape: 'semicolon' },
  { angleDeg: 194, distance: 84, size: 13, color: '#7C5CFC', rotateDeg: 26, shape: 'diamond' },
  { angleDeg: 224, distance: 78, size: 14, color: '#38BDF8', rotateDeg: -16, shape: 'brace_left' },
  { angleDeg: 254, distance: 80, size: 14, color: '#34D399', rotateDeg: 20, shape: 'brace_right' },
];

export interface VictoryCrestAnimationProps {
  isCube?: boolean;
  isBoss?: boolean;
}

/**
 * Happy RoboMascot hero inside a violet/gold concentric aura with 12 geometric
 * vector confetti particles bursting outward via spring physics.
 */
export function VictoryCrestAnimation({
  isCube = false,
  isBoss = false,
}: VictoryCrestAnimationProps) {
  const crestScale = useRef(new Animated.Value(0)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;
  const sparksProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    crestScale.setValue(0);
    ringProgress.setValue(0);
    sparksProgress.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(crestScale, {
          toValue: 1.12,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(crestScale, {
          toValue: 1,
          damping: 12,
          stiffness: 190,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ringProgress, {
        toValue: 1,
        duration: 640,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sparksProgress, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [crestScale, ringProgress, sparksProgress]);

  const shockScale = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1.85],
    extrapolate: 'clamp',
  });
  const shockOpacity = ringProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.85, 0.65, 0],
    extrapolate: 'clamp',
  });
  const auraColor = isBoss
    ? 'rgba(251, 191, 36, 0.45)'
    : isCube
      ? 'rgba(56, 189, 248, 0.42)'
      : 'rgba(124, 92, 252, 0.48)';

  return (
    <View style={styles.stage}>
      {/* Expanding Geometric Shockwave Ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shockwaveRing,
          {
            borderColor: isBoss ? '#FBBF24' : '#A78BFA',
            opacity: shockOpacity,
            transform: [{ scale: shockScale }],
          },
        ]}
      />

      {/* 12 Geometric Vector Confetti Particles */}
      {VECTOR_CONFETTI.map((spark, idx) => {
        const rad = (spark.angleDeg * Math.PI) / 180;
        const tx = Math.cos(rad) * spark.distance;
        const ty = Math.sin(rad) * spark.distance;

        const translateX = sparksProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, tx],
          extrapolate: 'clamp',
        });
        const translateY = sparksProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, ty],
          extrapolate: 'clamp',
        });
        const rotate = sparksProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${spark.rotateDeg}deg`],
          extrapolate: 'clamp',
        });
        const opacity = sparksProgress.interpolate({
          inputRange: [0, 0.15, 0.78, 1],
          outputRange: [0, 1, 0.92, 0.7],
          extrapolate: 'clamp',
        });
        const scale = sparksProgress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 1.08, 0.94],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={idx}
            pointerEvents="none"
            style={[
              styles.sparkAnchor,
              {
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate },
                  { scale },
                ],
              },
            ]}
          >
            {spark.shape === 'star' || spark.shape === 'diamond' ? (
              <Svg width={spark.size} height={spark.size} viewBox="0 0 12 12">
                {spark.shape === 'star' ? (
                  <Path
                    d="M6 0 L7.6 4.4 L12 6 L7.6 7.6 L6 12 L4.4 7.6 L0 6 L4.4 4.4 Z"
                    fill={spark.color}
                  />
                ) : (
                  <Polygon
                    points="6,0.5 11.5,6 6,11.5 0.5,6"
                    fill={spark.color}
                  />
                )}
              </Svg>
            ) : (
              <Text
                style={[
                  styles.confettiGlyph,
                  { color: spark.color, fontSize: spark.size + 1 },
                ]}
              >
                {spark.shape === 'brace_left'
                  ? '{'
                  : spark.shape === 'brace_right'
                    ? '}'
                    : ';'}
              </Text>
            )}
          </Animated.View>
        );
      })}

      {/* Central Glowing Concentric Aura + RoboMascot */}
      <Animated.View
        style={[
          styles.concentricOuter,
          { borderColor: auraColor, transform: [{ scale: crestScale }] },
        ]}
      >
        <View style={styles.concentricInner}>
          <RoboMascot mood="happy" size={96} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: 204,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shockwaveRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  sparkAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiGlyph: {
    fontFamily: MONO,
    fontWeight: '900',
  },
  concentricOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concentricInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(196, 181, 253, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
