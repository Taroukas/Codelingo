import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MONO } from '@/theme';

export interface HeroAmbientGlowProps {
  accentColor?: string;
  secondaryColor?: string;
  intensity?: number;
  showSpecularEdge?: boolean;
}

/**
 * Pure-SVG atmospheric radial depth for #12111A Matte Carbon Hero cards.
 * Keeps surfaces strictly matte while introducing subtle focal lighting
 * behind the emblem badge and top specular edge.
 */
export function HeroAmbientGlow({
  accentColor = '#7C5CFC',
  secondaryColor = '#38BDF8',
  intensity = 1,
  showSpecularEdge = true,
}: HeroAmbientGlowProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const primaryId = `heroGlowPrimary_${uid}`;
  const secondaryId = `heroGlowSecondary_${uid}`;

  const primaryOpacity = Math.min(0.24, Math.max(0.04, 0.14 * intensity));
  const midOpacity = Math.min(0.09, Math.max(0.015, 0.045 * intensity));
  const secondaryOpacity = Math.min(0.14, Math.max(0.02, 0.065 * intensity));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id={primaryId}
            cx="14%"
            cy="28%"
            rx="54%"
            ry="78%"
            fx="14%"
            fy="28%"
          >
            <Stop
              offset="0%"
              stopColor={accentColor}
              stopOpacity={primaryOpacity}
            />
            <Stop
              offset="52%"
              stopColor={accentColor}
              stopOpacity={midOpacity}
            />
            <Stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id={secondaryId}
            cx="92%"
            cy="86%"
            rx="44%"
            ry="58%"
            fx="92%"
            fy="86%"
          >
            <Stop
              offset="0%"
              stopColor={secondaryColor}
              stopOpacity={secondaryOpacity}
            />
            <Stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${primaryId})`} />
        <Rect
          x={0}
          y={0}
          width={100}
          height={100}
          fill={`url(#${secondaryId})`}
        />
      </Svg>

      {showSpecularEdge ? <View style={styles.specularRim} /> : null}
    </View>
  );
}

export interface PulseStatusDotProps {
  color?: string;
  size?: number;
  active?: boolean;
}

/**
 * Living native-driver status beacon with concentric ripple ring.
 */
export function PulseStatusDot({
  color = '#34D399',
  size = 6,
  active = true,
}: PulseStatusDotProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.stopAnimation();
    if (!active) {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(450),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.stopAnimation();
    };
  }, [active, pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.35],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.55, 0],
  });

  const frame = size * 2.4;

  return (
    <View
      style={[styles.pulseWrap, { width: frame, height: frame }]}
      pointerEvents="none"
    >
      {active ? (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export interface CarbonSpinnerDotsProps {
  color?: string;
  size?: 'sm' | 'md';
}

/**
 * Precision 3-bar matte carbon activity equalizer (replaces system spinner in dark buttons/chips).
 */
export function CarbonSpinnerDots({
  color = '#C4B5FD',
  size = 'sm',
}: CarbonSpinnerDotsProps) {
  const bar0 = useRef(new Animated.Value(0.35)).current;
  const bar1 = useRef(new Animated.Value(0.35)).current;
  const bar2 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const bars = [bar0, bar1, bar2];
    const loops = bars.map((anim, index) => {
      anim.stopAnimation();
      anim.setValue(0.35);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 110),
          Animated.timing(anim, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.35,
            duration: 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, (2 - index) * 110 + 60)),
        ]),
      );
    });

    for (const loop of loops) {
      loop.start();
    }

    return () => {
      for (const loop of loops) loop.stop();
      bar0.stopAnimation();
      bar1.stopAnimation();
      bar2.stopAnimation();
    };
  }, [bar0, bar1, bar2]);

  const barHeight = size === 'md' ? 13 : 10;
  const barWidth = size === 'md' ? 2.8 : 2.2;
  const gap = size === 'md' ? 3 : 2.2;
  const bars = [bar0, bar1, bar2];

  return (
    <View style={[styles.spinnerRow, { gap, height: barHeight }]}>
      {bars.map((anim, idx) => (
        <Animated.View
          key={idx}
          style={{
            width: barWidth,
            height: barHeight,
            borderRadius: barWidth / 2,
            backgroundColor: color,
            opacity: anim.interpolate({
              inputRange: [0.35, 1],
              outputRange: [0.42, 1],
            }),
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
}

export interface CarbonCompilerLoaderProps {
  filename: string;
  accentColor?: string;
}

/**
 * Developer-native Matte Carbon compiling state with telemetry shuttle beam & blinking cursor.
 */
export function CarbonCompilerLoader({
  filename,
  accentColor = '#7C5CFC',
}: CarbonCompilerLoaderProps) {
  const [railWidth, setRailWidth] = useState(240);
  const shuttleAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    shuttleAnim.stopAnimation();
    cursorAnim.stopAnimation();
    shuttleAnim.setValue(0);
    cursorAnim.setValue(1);

    const shuttleLoop = Animated.loop(
      Animated.timing(shuttleAnim, {
        toValue: 1,
        duration: 1050,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    const cursorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0.18,
          duration: 380,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    shuttleLoop.start();
    cursorLoop.start();

    return () => {
      shuttleLoop.stop();
      cursorLoop.stop();
      shuttleAnim.stopAnimation();
      cursorAnim.stopAnimation();
    };
  }, [cursorAnim, shuttleAnim]);

  const handleRailLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - railWidth) > 2) {
      setRailWidth(w);
    }
  };

  const shuttleWidth = 88;
  const translateX = shuttleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-shuttleWidth, railWidth + 8],
  });

  const shimmerOpacity = cursorAnim.interpolate({
    inputRange: [0.18, 1],
    outputRange: [0.35, 0.72],
  });

  return (
    <View style={styles.loaderWrap}>
      <View style={styles.loaderTopRow}>
        <CarbonSpinnerDots color="#C4B5FD" size="md" />
        <Text style={styles.loaderLabel} numberOfLines={1}>
          Compiling &amp; executing {filename}
        </Text>
        <Animated.View
          style={[
            styles.terminalCursor,
            { backgroundColor: '#C4B5FD', opacity: cursorAnim },
          ]}
        />
      </View>

      <View style={styles.loaderRail} onLayout={handleRailLayout}>
        <Animated.View
          style={[
            styles.loaderBeam,
            {
              width: shuttleWidth,
              backgroundColor: accentColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>

      <View style={styles.skeletonStack}>
        <Animated.View
          style={[
            styles.skeletonBar,
            { width: '74%', opacity: shimmerOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBar,
            { width: '48%', opacity: shimmerOpacity },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  specularRim: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loaderWrap: {
    paddingVertical: 6,
    gap: 9,
  },
  loaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loaderLabel: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: '#C4B5FD',
    flexShrink: 1,
  },
  terminalCursor: {
    width: 6,
    height: 13,
    borderRadius: 1.5,
  },
  loaderRail: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#161523',
    overflow: 'hidden',
  },
  loaderBeam: {
    height: '100%',
    borderRadius: 2,
  },
  skeletonStack: {
    gap: 6,
    paddingTop: 2,
  },
  skeletonBar: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#181726',
  },
});
