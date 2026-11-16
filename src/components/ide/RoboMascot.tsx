import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { type RoboSkinId, useUserStore } from '@/store/useUserStore';
import { MONO } from '@/theme';
import { playSound } from '@/utils/sounds';
import { SPRING_JIGGLE_BOUNCE } from '@/utils/springPhysics';

export type { RoboSkinId };

export interface RoboSkinSpec {
  id: RoboSkinId;
  name: string;
  tagline: string;
  cost: number;
  frameBg: string;
  frameBorder: string;
  chassisFill: string;
  chassisStroke: string;
  handFill: string;
  visorBg: string;
  visorBorder: string;
  eyeColor: string;
  eyeAccent: string;
  mouthFill: string;
  antennaColor: string;
  foreheadBar: string;
}

export const ROBO_SKINS: readonly RoboSkinSpec[] = [
  {
    id: 'default_violet',
    name: 'Cyber Violet',
    tagline: 'Standard matte carbon chassis with electric violet optics',
    cost: 0,
    frameBg: '#161522',
    frameBorder: 'rgba(124, 92, 252, 0.34)',
    chassisFill: '#1E1B36',
    chassisStroke: '#7C5CFC',
    handFill: '#252338',
    visorBg: '#141226',
    visorBorder: 'rgba(196, 181, 253, 0.16)',
    eyeColor: '#C4B5FD',
    eyeAccent: '#38BDF8',
    mouthFill: 'rgba(196, 181, 253, 0.65)',
    antennaColor: '#A78BFA',
    foreheadBar: 'rgba(196, 181, 253, 0.22)',
  },
  {
    id: 'obsidian_gold',
    name: 'Obsidian Gold',
    tagline: 'Forged stealth obsidian shell with 24K gold visor & trim',
    cost: 250,
    frameBg: '#14141B',
    frameBorder: 'rgba(251, 191, 36, 0.42)',
    chassisFill: '#181820',
    chassisStroke: '#FBBF24',
    handFill: '#22222C',
    visorBg: '#0E0E14',
    visorBorder: 'rgba(251, 191, 36, 0.24)',
    eyeColor: '#FBBF24',
    eyeAccent: '#FDE68A',
    mouthFill: 'rgba(251, 191, 36, 0.72)',
    antennaColor: '#FBBF24',
    foreheadBar: 'rgba(251, 191, 36, 0.34)',
  },
  {
    id: 'matrix_phosphor',
    name: 'Matrix Phosphor',
    tagline: 'Terminal green PCB armor with crisp emerald cathode eyes',
    cost: 300,
    frameBg: '#0A130E',
    frameBorder: 'rgba(16, 185, 129, 0.42)',
    chassisFill: '#0D1912',
    chassisStroke: '#10B981',
    handFill: '#13261B',
    visorBg: '#060D09',
    visorBorder: 'rgba(16, 185, 129, 0.25)',
    eyeColor: '#10B981',
    eyeAccent: '#6EE7B7',
    mouthFill: 'rgba(16, 185, 129, 0.75)',
    antennaColor: '#34D399',
    foreheadBar: 'rgba(52, 211, 153, 0.3)',
  },
  {
    id: 'cyber_crimson',
    name: 'Cyber Crimson',
    tagline: 'Overclocked ruby-crimson chassis built for speed duels',
    cost: 350,
    frameBg: '#170E12',
    frameBorder: 'rgba(239, 68, 68, 0.44)',
    chassisFill: '#1F1216',
    chassisStroke: '#EF4444',
    handFill: '#2C181E',
    visorBg: '#12090C',
    visorBorder: 'rgba(239, 68, 68, 0.26)',
    eyeColor: '#EF4444',
    eyeAccent: '#FCA5A5',
    mouthFill: 'rgba(248, 113, 113, 0.75)',
    antennaColor: '#F87171',
    foreheadBar: 'rgba(248, 113, 113, 0.32)',
  },
  {
    id: 'ghost_titanium',
    name: 'Ghost Titanium',
    tagline: 'Brushed silver aerospace hull with glacier ice-blue optics',
    cost: 500,
    frameBg: '#1E293B',
    frameBorder: 'rgba(56, 189, 248, 0.5)',
    chassisFill: '#E2E8F0',
    chassisStroke: '#94A3B8',
    handFill: '#CBD5E1',
    visorBg: '#0F172A',
    visorBorder: 'rgba(56, 189, 248, 0.35)',
    eyeColor: '#38BDF8',
    eyeAccent: '#E0F2FE',
    mouthFill: 'rgba(56, 189, 248, 0.78)',
    antennaColor: '#38BDF8',
    foreheadBar: 'rgba(255, 255, 255, 0.65)',
  },
];

export function getRoboSkinSpec(skinId?: RoboSkinId): RoboSkinSpec {
  return ROBO_SKINS.find((s) => s.id === skinId) ?? ROBO_SKINS[0];
}

export type RoboMood =
  | 'idle'
  | 'watching_typing'
  | 'thinking'
  | 'happy'
  | 'celebrating'
  | 'worried'
  | 'bug_alert'
  | 'sleeping';

export interface RoboMascotProps {
  mood: RoboMood;
  isTyping?: boolean;
  size?: number;
  skin?: RoboSkinId;
  /** Enable interactive squash-jump-wiggle poke feedback (default true). */
  interactive?: boolean;
  /** Optional tap handler invoked alongside Robo's poke bounce. */
  onPress?: () => void;
}

function normalizeMood(
  mood: RoboMood,
  isTyping?: boolean,
): 'idle' | 'watching_typing' | 'thinking' | 'happy' | 'worried' | 'sleeping' {
  if (mood === 'thinking') return 'thinking';
  if (mood === 'happy' || mood === 'celebrating') return 'happy';
  if (mood === 'worried' || mood === 'bug_alert') return 'worried';
  if (isTyping || mood === 'watching_typing') return 'watching_typing';
  if (mood === 'sleeping') return 'sleeping';
  return 'idle';
}

/**
 * "Duo-Style" cute & expressive geometric vector Robot Mascot with 6 native-driver
 * 60fps emotional states (`idle`, `watching_typing`, `thinking`, `happy`, `worried`, `sleeping`).
 */
export function RoboMascot({
  mood,
  isTyping = false,
  size = 52,
  skin,
  interactive = true,
  onPress,
}: RoboMascotProps) {
  const { equippedRoboSkin } = useUserStore();
  const activeSkin = getRoboSkinSpec(skin ?? equippedRoboSkin);
  const [pokeHappy, setPokeHappy] = useState(false);
  const pokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseMood = normalizeMood(mood, isTyping);
  const effectiveMood = pokeHappy ? 'happy' : baseMood;

  const bobY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const eyeBlinkY = useRef(new Animated.Value(1)).current;
  const pupilShiftX = useRef(new Animated.Value(0)).current;
  const pupilShiftY = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const sparkScale = useRef(new Animated.Value(0)).current;
  const zzzProgress = useRef(new Animated.Value(0)).current;
  const pokeScaleX = useRef(new Animated.Value(1)).current;
  const pokeScaleY = useRef(new Animated.Value(1)).current;
  const pokeJumpY = useRef(new Animated.Value(0)).current;
  const pokeRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    };
  }, []);

  const handlePoke = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    playSound('token_in');
    setPokeHappy(true);
    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    pokeTimerRef.current = setTimeout(() => {
      setPokeHappy(false);
    }, 760);

    pokeScaleX.stopAnimation();
    pokeScaleY.stopAnimation();
    pokeJumpY.stopAnimation();
    pokeRotateAnim.stopAnimation();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(pokeScaleX, {
          toValue: 1.18,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pokeScaleY, {
          toValue: 0.8,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pokeJumpY, {
          toValue: 3,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(pokeScaleX, {
          toValue: 0.92,
          damping: 14,
          stiffness: 420,
          useNativeDriver: true,
        }),
        Animated.spring(pokeScaleY, {
          toValue: 1.12,
          damping: 14,
          stiffness: 420,
          useNativeDriver: true,
        }),
        Animated.spring(pokeJumpY, {
          toValue: -14,
          damping: 12,
          stiffness: 380,
          mass: 0.55,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pokeRotateAnim, {
            toValue: -1,
            duration: 65,
            useNativeDriver: true,
          }),
          Animated.timing(pokeRotateAnim, {
            toValue: 1,
            duration: 85,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.parallel([
        Animated.spring(pokeScaleX, {
          toValue: 1,
          ...SPRING_JIGGLE_BOUNCE,
        }),
        Animated.spring(pokeScaleY, {
          toValue: 1,
          ...SPRING_JIGGLE_BOUNCE,
        }),
        Animated.spring(pokeJumpY, {
          toValue: 0,
          ...SPRING_JIGGLE_BOUNCE,
        }),
        Animated.spring(pokeRotateAnim, {
          toValue: 0,
          damping: 10,
          stiffness: 360,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress?.();
  }, [onPress, pokeJumpY, pokeRotateAnim, pokeScaleX, pokeScaleY]);

  // Main body motion per mood
  useEffect(() => {
    bobY.stopAnimation();
    shakeX.stopAnimation();
    tiltAnim.stopAnimation();
    haloPulse.stopAnimation();
    sparkScale.stopAnimation();
    zzzProgress.stopAnimation();

    bobY.setValue(0);
    shakeX.setValue(0);
    tiltAnim.setValue(0);
    haloPulse.setValue(0);
    sparkScale.setValue(0);
    zzzProgress.setValue(0);

    if (effectiveMood === 'idle') {
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobY, {
            toValue: -3,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bobY, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      const tiltLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(tiltAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(tiltAnim, {
            toValue: -1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      floatLoop.start();
      tiltLoop.start();
      return () => {
        floatLoop.stop();
        tiltLoop.stop();
      };
    }

    if (effectiveMood === 'watching_typing') {
      const perkLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobY, {
            toValue: -2,
            duration: 450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bobY, {
            toValue: 0,
            duration: 450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      perkLoop.start();
      return () => perkLoop.stop();
    }

    if (effectiveMood === 'thinking') {
      const bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobY, {
            toValue: -5,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bobY, {
            toValue: 0,
            duration: 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      const haloLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(haloPulse, {
            toValue: 1,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(haloPulse, {
            toValue: 0,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      bounceLoop.start();
      haloLoop.start();
      return () => {
        bounceLoop.stop();
        haloLoop.stop();
      };
    }

    if (effectiveMood === 'happy') {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bobY, {
            toValue: -10,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(bobY, {
            toValue: 0,
            damping: 8,
            stiffness: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(sparkScale, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
          Animated.delay(1400),
          Animated.timing(sparkScale, {
            toValue: 0.75,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      return;
    }

    if (effectiveMood === 'worried') {
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: -5,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 5,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -4,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 4,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (effectiveMood === 'sleeping') {
      const zzzLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(zzzProgress, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(zzzProgress, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      );
      zzzLoop.start();
      return () => zzzLoop.stop();
    }
  }, [
    bobY,
    effectiveMood,
    haloPulse,
    shakeX,
    sparkScale,
    tiltAnim,
    zzzProgress,
  ]);

  // Eye double-blink & pupil reading scan
  useEffect(() => {
    eyeBlinkY.stopAnimation();
    pupilShiftX.stopAnimation();
    pupilShiftY.stopAnimation();
    eyeBlinkY.setValue(1);
    pupilShiftX.setValue(0);
    pupilShiftY.setValue(0);

    if (effectiveMood === 'watching_typing') {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pupilShiftX, {
            toValue: -2.4,
            duration: 260,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pupilShiftX, {
            toValue: 2.4,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pupilShiftX, {
            toValue: 0,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      scanLoop.start();
      return () => scanLoop.stop();
    }

    if (effectiveMood === 'worried') {
      // Look slightly down toward the terminal error
      Animated.timing(pupilShiftY, {
        toValue: 1.8,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (effectiveMood === 'idle') {
      // Natural double-blink every 3.5s
      const blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(3500),
          Animated.timing(eyeBlinkY, {
            toValue: 0.08,
            duration: 75,
            useNativeDriver: true,
          }),
          Animated.timing(eyeBlinkY, {
            toValue: 1,
            duration: 85,
            useNativeDriver: true,
          }),
          Animated.delay(90),
          Animated.timing(eyeBlinkY, {
            toValue: 0.08,
            duration: 75,
            useNativeDriver: true,
          }),
          Animated.timing(eyeBlinkY, {
            toValue: 1,
            duration: 95,
            useNativeDriver: true,
          }),
        ]),
      );
      blinkLoop.start();
      return () => blinkLoop.stop();
    }
  }, [effectiveMood, eyeBlinkY, pupilShiftX, pupilShiftY]);

  const headRotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const pokeRotate = pokeRotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const haloScale = haloPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.35],
  });

  const haloOpacity = haloPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.95],
  });

  const zzzTranslateY = zzzProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, -8],
  });

  const zzzOpacity = zzzProgress.interpolate({
    inputRange: [0, 0.25, 0.8, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  const frameBorderColor =
    effectiveMood === 'worried'
      ? 'rgba(248, 113, 113, 0.42)'
      : effectiveMood === 'happy'
      ? 'rgba(52, 211, 153, 0.42)'
      : effectiveMood === 'thinking'
      ? 'rgba(56, 189, 248, 0.42)'
      : activeSkin.frameBorder;

  const chassisStroke =
    effectiveMood === 'worried'
      ? '#F87171'
      : activeSkin.id === 'default_violet' && effectiveMood === 'happy'
      ? '#34D399'
      : activeSkin.id === 'default_violet' && effectiveMood === 'thinking'
      ? '#38BDF8'
      : activeSkin.chassisStroke;

  const antennaTipColor =
    effectiveMood === 'worried'
      ? '#F87171'
      : effectiveMood === 'happy' && activeSkin.id === 'default_violet'
      ? '#34D399'
      : effectiveMood === 'thinking' && activeSkin.id === 'default_violet'
      ? '#38BDF8'
      : activeSkin.antennaColor;

  const svgSize = size - 6;

  return (
    <Pressable
      onPress={interactive ? handlePoke : undefined}
      disabled={!interactive}
      hitSlop={interactive ? 6 : undefined}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={interactive ? 'Tap Robo mascot' : undefined}
      style={[
        styles.outerFrame,
        {
          width: size,
          height: size,
          borderColor: frameBorderColor,
          backgroundColor: activeSkin.frameBg,
        },
      ]}
    >
      {/* Thinking Halo Ring Around Antenna */}
      {effectiveMood === 'thinking' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.antennaHalo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
      ) : null}

      {/* Happy Celebration Geometric Star Sparks */}
      {effectiveMood === 'happy' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sparksOverlay,
            {
              opacity: sparkScale,
              transform: [{ scale: sparkScale }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
            <Path
              d="M9 11 L10.5 7.5 L12 11 L15.5 12.5 L12 14 L10.5 17.5 L9 14 L5.5 12.5 Z"
              fill="#FBBF24"
            />
            <Path
              d="M42 10 L43.2 7 L44.4 10 L47.4 11.2 L44.4 12.4 L43.2 15.4 L42 12.4 L39 11.2 Z"
              fill="#34D399"
            />
            <Circle cx={44} cy={38} r={2} fill="#C084FC" />
          </Svg>
        </Animated.View>
      ) : null}

      {/* Sleeping Floating zZz Badge */}
      {effectiveMood === 'sleeping' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.zzzBadge,
            {
              opacity: zzzOpacity,
              transform: [{ translateY: zzzTranslateY }],
            },
          ]}
        >
          <Text style={styles.zzzText}>zZz</Text>
        </Animated.View>
      ) : null}

      {/* Main Animated Robot Body + Visor */}
      <Animated.View
        style={{
          width: svgSize,
          height: svgSize,
          transform: [
            { translateY: bobY },
            { translateY: pokeJumpY },
            { translateX: shakeX },
            { rotate: headRotate },
            { rotate: pokeRotate },
            { scaleX: pokeScaleX },
            { scaleY: pokeScaleY },
          ],
        }}
      >
        <Svg width={svgSize} height={svgSize} viewBox="0 0 46 46" fill="none">
          {/* Antenna stem & orb (droops slightly when worried, perks up when typing) */}
          {effectiveMood === 'worried' ? (
            <>
              <Path
                d="M23 10 Q25 6 28 7"
                stroke={chassisStroke}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Circle cx={28.5} cy={7} r={2.5} fill={antennaTipColor} />
            </>
          ) : (
            <>
              <Rect
                x={22}
                y={effectiveMood === 'watching_typing' ? 3.5 : 5}
                width={2}
                height={5.5}
                rx={1}
                fill={chassisStroke}
              />
              <Circle
                cx={23}
                cy={effectiveMood === 'watching_typing' ? 3.2 : 4.2}
                r={2.7}
                fill={antennaTipColor}
              />
            </>
          )}

          {/* Cute Floating Side Ear Pods */}
          <Rect
            x={3.5}
            y={18.5}
            width={3.5}
            height={9}
            rx={1.75}
            fill={chassisStroke}
          />
          <Rect
            x={39}
            y={18.5}
            width={3.5}
            height={9}
            rx={1.75}
            fill={chassisStroke}
          />

          {/* Duo-Style Rounded Squircle Head Chassis */}
          <Rect
            x={7.5}
            y={10}
            width={31}
            height={26}
            rx={9.5}
            fill={activeSkin.chassisFill}
            stroke={chassisStroke}
            strokeWidth={1.8}
          />

          {/* Subtle Inner Forehead Highlight Bar */}
          <Rect
            x={14}
            y={12.2}
            width={18}
            height={1.5}
            rx={0.75}
            fill={activeSkin.foreheadBar}
          />

          {/* Deep Carbon Visor Faceplate */}
          <Rect
            x={10.5}
            y={15}
            width={25}
            height={14}
            rx={5.5}
            fill={activeSkin.visorBg}
            stroke={activeSkin.visorBorder}
            strokeWidth={0.9}
          />

          {/* Cute Cheeks & Mouth Indicator inside Head */}
          {effectiveMood === 'happy' ? (
            <Path
              d="M19.5 31.5 Q23 34.2 26.5 31.5"
              stroke={activeSkin.id === 'default_violet' ? '#34D399' : activeSkin.eyeColor}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ) : effectiveMood === 'worried' ? (
            <Path
              d="M19.5 33 Q23 30.8 26.5 33"
              stroke="#F87171"
              strokeWidth={1.7}
              strokeLinecap="round"
            />
          ) : (
            <Rect
              x={18.5}
              y={31.5}
              width={9}
              height={2}
              rx={1}
              fill={activeSkin.mouthFill}
            />
          )}

          {/* Tiny Hovering Geometric Hands */}
          <Circle
            cx={6.5}
            cy={effectiveMood === 'happy' ? 32 : 36.5}
            r={2.4}
            fill={activeSkin.handFill}
            stroke={chassisStroke}
            strokeWidth={1.3}
          />
          <Circle
            cx={39.5}
            cy={effectiveMood === 'happy' ? 32 : 36.5}
            r={2.4}
            fill={activeSkin.handFill}
            stroke={chassisStroke}
            strokeWidth={1.3}
          />
        </Svg>

        {/* Native-Driver Animated Visor Eyes Layer */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.eyesLayer,
            {
              transform: [
                { translateX: pupilShiftX },
                { translateY: pupilShiftY },
                { scaleY: eyeBlinkY },
              ],
            },
          ]}
        >
          <Svg width={svgSize} height={svgSize} viewBox="0 0 46 46" fill="none">
            {effectiveMood === 'happy' ? (
              <>
                <Path
                  d="M14.5 23.2 Q17.5 18.5 20.5 23.2"
                  stroke={activeSkin.id === 'default_violet' ? '#34D399' : activeSkin.eyeColor}
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M25.5 23.2 Q28.5 18.5 31.5 23.2"
                  stroke={activeSkin.id === 'default_violet' ? '#34D399' : activeSkin.eyeColor}
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : effectiveMood === 'thinking' ? (
              <>
                {/* Analytical squint left eye + glowing right eye */}
                <Rect
                  x={14.5}
                  y={20.8}
                  width={6}
                  height={2.6}
                  rx={1.3}
                  fill={activeSkin.eyeColor}
                />
                <Circle cx={28.5} cy={21.8} r={3.2} fill={activeSkin.eyeAccent} />
                <Circle cx={29.4} cy={20.8} r={1} fill="#FFFFFF" />
              </>
            ) : effectiveMood === 'worried' ? (
              <>
                {/* Wide coral-amber alert eyes */}
                <Circle cx={17.5} cy={22.2} r={3.3} fill="#F87171" />
                <Circle cx={17.5} cy={22.8} r={1.2} fill="#FEF2F2" />
                <Circle cx={28.5} cy={22.2} r={3.3} fill="#F87171" />
                <Circle cx={28.5} cy={22.8} r={1.2} fill="#FEF2F2" />
              </>
            ) : effectiveMood === 'sleeping' ? (
              <>
                {/* Peaceful closed horizontal eye lines (- -) */}
                <Rect
                  x={14.5}
                  y={21.5}
                  width={5.8}
                  height={1.8}
                  rx={0.9}
                  fill="#94A3B8"
                />
                <Rect
                  x={25.7}
                  y={21.5}
                  width={5.8}
                  height={1.8}
                  rx={0.9}
                  fill="#94A3B8"
                />
              </>
            ) : (
              <>
                {/* Expressive Duo-style rounded glowing eyes + specular sparkle */}
                <Rect
                  x={14.8}
                  y={18.6}
                  width={5.4}
                  height={6.6}
                  rx={2.7}
                  fill={
                    effectiveMood === 'watching_typing'
                      ? activeSkin.eyeAccent
                      : activeSkin.eyeColor
                  }
                />
                <Circle cx={18.4} cy={20.3} r={1.1} fill="#FFFFFF" />

                <Rect
                  x={25.8}
                  y={18.6}
                  width={5.4}
                  height={6.6}
                  rx={2.7}
                  fill={
                    effectiveMood === 'watching_typing'
                      ? activeSkin.eyeAccent
                      : activeSkin.eyeColor
                  }
                />
                <Circle cx={29.4} cy={20.3} r={1.1} fill="#FFFFFF" />
              </>
            )}
          </Svg>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerFrame: {
    borderRadius: 14,
    backgroundColor: '#161522',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyesLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  antennaHalo: {
    position: 'absolute',
    top: 3,
    width: 16,
    height: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  sparksOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  zzzBadge: {
    position: 'absolute',
    top: 1,
    right: 3,
    zIndex: 5,
  },
  zzzText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#A78BFA',
  },
});
