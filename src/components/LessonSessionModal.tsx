import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, MONO, UI_FONT } from '@/theme';
import {
  buildFallbackExercises,
  getLanguage,
  getNodeById,
  LangId,
  LessonNode,
} from '@/data/courses';
import { HEART_REFILL_COST, useUserStore } from '@/store/useUserStore';
import { LanguageLogo } from '@/components/LanguageLogo';
import { GemIcon, HeartIcon } from '@/components/ui/CurrencyIcons';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { RoboMascot } from '@/components/ide/RoboMascot';
import { playTactileSound } from '@/services/soundEngine';
import { VictoryCrestAnimation } from '@/components/VictoryCrestAnimation';
import { SpringPressable } from '@/components/CyberButton';
import { CodeBlocks, ExerciseSelectionState } from '@/components/exercises/CodeBlocks';
import { CodeTokenBuilder } from '@/components/exercises/CodeTokenBuilder';
import { FindBug } from '@/components/exercises/FindBug';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { PredictOutput } from '@/components/exercises/PredictOutput';
import { TheoryBiteCard } from '@/components/exercises/TheoryBiteCard';
import { errorHaptic, successHaptic, tapHaptic } from '@/utils/haptics';
import { playCorrectStreakSound, playSound } from '@/utils/sounds';
import { SPRING_JIGGLE_BOUNCE, runShiverShake } from '@/utils/springPhysics';

type GradeResult = 'correct' | 'wrong' | null;

/**
 * Extracts the first standalone sentence outside backticks/quotes and caps cleanly
 * at 94 characters without slicing inside inline code tokens.
 */
function toConciseFeedback(raw: string): string {
  const normalized = raw.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  let inBacktick = false;
  let quoteChar: string | null = null;
  let sentenceEnd = -1;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === '`') {
      inBacktick = !inBacktick;
      continue;
    }
    if (!inBacktick) {
      if (quoteChar) {
        if (ch === quoteChar && normalized[i - 1] !== '\\') {
          quoteChar = null;
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quoteChar = ch;
        continue;
      }
      if (ch === '.' || ch === '!' || ch === '?') {
        const next = normalized[i + 1];
        if (!next || next === ' ') {
          sentenceEnd = i + 1;
          break;
        }
      }
    }
  }

  const firstSentence =
    sentenceEnd > 0 ? normalized.slice(0, sentenceEnd).trim() : normalized;
  if (firstSentence.length <= 94) {
    return firstSentence;
  }

  const parts = firstSentence.split(/(`[^`]+`)/g);
  let out = '';
  for (const part of parts) {
    if (part.startsWith('`') && part.endsWith('`')) {
      if (out.length + part.length <= 92) {
        out += part;
      } else {
        break;
      }
    } else {
      const words = part.split(' ');
      for (let w = 0; w < words.length; w += 1) {
        const chunk = w === 0 ? words[w] : ` ${words[w]}`;
        if (out.length + chunk.length <= 92) {
          out += chunk;
        } else {
          return `${out.trimEnd()}…`;
        }
      }
    }
  }
  const clean = out.trimEnd();
  return clean.length < firstSentence.length ? `${clean}…` : clean;
}

interface VictoryCelebrationViewProps {
  badgeLabel: string;
  nodeTitle: string;
  language: LangId;
  languageName: string;
  unitNumber: number;
  unitTitle: string;
  isCube: boolean;
  isBoss: boolean;
  reviewMode: boolean;
  earnedXp: number;
  xpBoostActive?: boolean;
  finalAccuracy: number;
  earnedGems: number;
  streak: number;
  cloudConfigured: boolean;
}

function VictoryCelebrationView({
  badgeLabel,
  nodeTitle,
  language,
  languageName,
  unitNumber,
  unitTitle,
  isCube,
  isBoss,
  reviewMode,
  earnedXp,
  xpBoostActive,
  finalAccuracy,
  earnedGems,
  streak,
  cloudConfigured,
}: VictoryCelebrationViewProps) {
  const star1Scale = useRef(new Animated.Value(0)).current;
  const star2Scale = useRef(new Animated.Value(0)).current;
  const star3Scale = useRef(new Animated.Value(0)).current;
  const card0 = useRef(new Animated.Value(0)).current;
  const card1 = useRef(new Animated.Value(0)).current;
  const card2 = useRef(new Animated.Value(0)).current;
  const syncAnim = useRef(new Animated.Value(0)).current;

  const [displayXp, setDisplayXp] = useState(0);
  const [displayAcc, setDisplayAcc] = useState(0);
  const [displayGems, setDisplayGems] = useState(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );

    star1Scale.setValue(0);
    star2Scale.setValue(0);
    star3Scale.setValue(0);
    card0.setValue(0);
    card1.setValue(0);
    card2.setValue(0);
    syncAnim.setValue(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const starScales = [star1Scale, star2Scale, star3Scale];
    const starDelays = [180, 300, 420];

    starScales.forEach((anim, idx) => {
      const t = setTimeout(() => {
        if (idx === 2) {
          successHaptic();
        } else {
          tapHaptic();
        }
        playSound(idx === 2 ? 'combo' : 'token_in');
        Animated.spring(anim, {
          toValue: 1,
          damping: 13,
          stiffness: 300,
          mass: 0.6,
          useNativeDriver: true,
        }).start();
      }, starDelays[idx]);
      timers.push(t);
    });

    let rafId = 0;
    const statsTimer = setTimeout(() => {
      Animated.stagger(110, [
        Animated.spring(card0, {
          toValue: 1,
          damping: 18,
          stiffness: 260,
          mass: 0.75,
          overshootClamping: true,
          useNativeDriver: true,
        }),
        Animated.spring(card1, {
          toValue: 1,
          damping: 18,
          stiffness: 260,
          mass: 0.75,
          overshootClamping: true,
          useNativeDriver: true,
        }),
        Animated.spring(card2, {
          toValue: 1,
          damping: 18,
          stiffness: 260,
          mass: 0.75,
          overshootClamping: true,
          useNativeDriver: true,
        }),
        Animated.timing(syncAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      const duration = 560;
      const start = Date.now();
      let lastUpdate = 0;
      const tick = () => {
        const now = Date.now();
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        if (progress >= 1 || now - lastUpdate >= 32) {
          lastUpdate = now;
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayXp(Math.round(earnedXp * eased));
          setDisplayAcc(Math.round(finalAccuracy * eased));
          setDisplayGems(Math.round(earnedGems * eased));
        }
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    }, 450);
    timers.push(statsTimer);

    return () => {
      timers.forEach(clearTimeout);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    star1Scale,
    star2Scale,
    star3Scale,
    card0,
    card1,
    card2,
    syncAnim,
    earnedXp,
    finalAccuracy,
    earnedGems,
  ]);

  const cardStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 1, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        }),
      },
    ],
  });

  return (
    <>
      <View style={styles.victoryTop}>
        <VictoryCrestAnimation isCube={isCube} isBoss={isBoss} />

        {/* 3 Gold Stars Pop-In Row (180ms / 300ms / 420ms) */}
        <View style={styles.victoryStarsRow}>
          {[
            { idx: 0, scale: star1Scale, elevate: 0, size: 34 },
            { idx: 1, scale: star2Scale, elevate: -6, size: 42 },
            { idx: 2, scale: star3Scale, elevate: 0, size: 34 },
          ].map((item) => (
            <Animated.View
              key={item.idx}
              style={{
                opacity: item.scale.interpolate({
                  inputRange: [0, 0.25, 1],
                  outputRange: [0, 1, 1],
                  extrapolate: 'clamp',
                }),
                transform: [
                  { translateY: item.elevate },
                  { scale: item.scale },
                ],
              }}
            >
              <Ionicons name="star" size={item.size} color="#FBBF24" />
            </Animated.View>
          ))}
        </View>

        <View style={styles.victoryBadge}>
          <Ionicons
            name={isCube ? 'cube' : 'sparkles'}
            size={12}
            color="#C4B5FD"
          />
          <Text style={styles.victoryBadgeText}>{badgeLabel}</Text>
        </View>
        <Text style={styles.victoryTitle}>
          {reviewMode ? `${nodeTitle} Reviewed` : `${nodeTitle} Mastered`}
        </Text>
        <View style={styles.victorySubRow}>
          <LanguageLogo language={language} size={14} />
          <Text style={styles.victorySubtitle}>
            {`${languageName} · Unit ${unitNumber}: ${unitTitle}`}
          </Text>
        </View>
      </View>

      <View style={styles.bentoStatsRow}>
        <Animated.View style={[styles.bentoStatCard, cardStyle(card0)]}>
          <Text style={styles.bentoStatLabel}>
            {xpBoostActive ? 'TOTAL XP · 2X' : 'TOTAL XP'}
          </Text>
          <Text style={[styles.bentoStatVal, { color: '#C4B5FD' }]}>
            {`+${displayXp} XP`}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.bentoStatCard, cardStyle(card1)]}>
          <Text style={styles.bentoStatLabel}>ACCURACY</Text>
          <Text style={[styles.bentoStatVal, { color: '#34D399' }]}>
            {`${displayAcc}%`}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.bentoStatCard, cardStyle(card2)]}>
          <Text style={styles.bentoStatLabel}>GEMS EARNED</Text>
          <View style={styles.gemValRow}>
            <GemIcon size={16} />
            <Text style={[styles.bentoStatVal, { color: '#38BDF8' }]}>
              {`+${displayGems}`}
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.syncStatusCard,
          {
            opacity: syncAnim,
            transform: [
              {
                translateY: syncAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.syncLeft}>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={14} color="#F97316" />
            <Text style={styles.streakPillText}>{`🔥 ${Math.max(1, streak)} Day Streak Active!`}</Text>
          </View>
          <View style={styles.cloudChip}>
            <Ionicons
              name={cloudConfigured ? 'cloud-done-outline' : 'save-outline'}
              size={13}
              color={cloudConfigured ? '#34D399' : '#94A3B8'}
            />
            <Text style={styles.cloudChipText}>
              {cloudConfigured ? 'Synced to Supabase' : 'Cached offline'}
            </Text>
          </View>
        </View>
        <Text style={styles.syncNote}>
          {reviewMode
            ? 'Review complete · skills sharpened.'
            : 'Next node unlocked along your learning path.'}
        </Text>
      </Animated.View>
    </>
  );
}

const DID_YOU_KNOW_FACTS: Record<LangId, string> = {
  python:
    'Python was named after the comedy group Monty Python, not the snake, to keep coding fun.',
  cpp:
    'Parts of the NASA Mars rovers and most AAA game engines run on C++ because of its raw speed.',
  js:
    'JavaScript was built in just 10 days in 1995 and now powers almost every interactive website.',
  go:
    'Go was created at Google by legends behind Unix and UTF-8 to keep huge systems fast and simple.',
  java:
    'Java’s "Write Once, Run Anywhere" JVM powers Android, banking backends, and Minecraft.',
  rust:
    'Rust guarantees memory safety at compile time with zero garbage collector using ownership rules.',
  sql:
    'Invented in the 1970s at IBM, SQL still powers nearly every relational database in production today.',
  c:
    'Created at Bell Labs in 1972, C wrote the Unix kernel and inspired C++, Java, Go, and Rust.',
  ts:
    'TypeScript catches static type errors at build time and erases types cleanly into standard JS.',
  css:
    'CSS Grid and Flexbox eliminated clunky float hacks, making complex responsive UIs effortless.',
  html:
    'Semantic HTML landmarks let screen readers jump straight to headings, navbars, and forms.',
  php:
    'PHP 8 introduced JIT compilation, match expressions, enums, and constructor property promotion.',
  asm:
    'x86-64 Assembly lets instructions talk directly to CPU registers and flags with zero abstraction.',
  swift:
    'Swift prevents billion-dollar null crashes by forcing optionals (T?) to unwrap safely.',
  kotlin:
    'Kotlin powers modern Android apps with concise data classes, null safety, and coroutines.',
  julia:
    'Julia runs high-level math formulas at near-C machine speed via LLVM multiple dispatch.',
  lua:
    'At roughly 300KB, Lua embeds cleanly into games, Neovim, NGINX, and Redis via one universal table type.',
  csharp:
    'C# pioneered async/await and LINQ, pairing static records cleanly with high-speed .NET runtimes.',
};

export interface LessonSessionModalProps {
  visible: boolean;
  node: LessonNode | null;
  language: LangId;
  /** When true, renders directly inside a full-screen route instead of wrapping in <Modal>. */
  standaloneScreen?: boolean;
  /** When true, lesson was launched in Review Mode (+5 XP, 0 Gems). */
  reviewMode?: boolean;
  onClose: () => void;
  onComplete?: (completedNode: LessonNode) => void;
}

export function LessonSessionModal({
  visible,
  node,
  language,
  standaloneScreen = false,
  reviewMode = false,
  onClose,
  onComplete,
}: LessonSessionModalProps) {
  const insets = useSafeAreaInsets();
  const {
    hearts,
    maxHearts,
    gems,
    streak,
    combo,
    cloudConfigured,
    isXpBoostActive,
    recordAnswer,
    completeLesson,
    refillHeartsWithGems,
    requestBlitzRecovery,
    addMistakeToVault,
  } = useUserStore();

  const resolvedContext = useMemo(() => {
    if (!node) return undefined;
    const fromDict = getNodeById(node.id);
    if (fromDict) return fromDict;
    const langObj = getLanguage(language);
    const fallbackUnit = langObj.units[node.unitIndex] ?? langObj.units[0];
    return { lang: langObj, unit: fallbackUnit, node };
  }, [node, language]);

  const exercises = useMemo(() => {
    if (!resolvedContext) return [];
    const { lang, unit, node: targetNode } = resolvedContext;
    if (targetNode.exercises && targetNode.exercises.length > 0) {
      return targetNode.exercises;
    }
    const count = targetNode.kind === 'checkpoint_cube' ? 3 : 5;
    return buildFallbackExercises(lang.id, targetNode.id, unit.title, count);
  }, [resolvedContext]);

  const sessionKey =
    visible && resolvedContext ? resolvedContext.node.id : '__closed__';

  const [trackedKey, setTrackedKey] = useState<string>(sessionKey);
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState<ExerciseSelectionState>({
    canCheck: false,
    isCorrect: false,
    correctAnswerText: '',
  });
  const [result, setResult] = useState<GradeResult>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [stepHadMistake, setStepHadMistake] = useState(false);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [rewardCommitted, setRewardCommitted] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showOutOfHearts, setShowOutOfHearts] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(100);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [heartFlashRed, setHeartFlashRed] = useState(false);

  // Reset session state cleanly when opening a new lesson node
  if (trackedKey !== sessionKey) {
    setTrackedKey(sessionKey);
    setStepIndex(0);
    setAnswer({ canCheck: false, isCorrect: false, correctAnswerText: '' });
    setResult(null);
    setRetryTrigger(0);
    setStepHadMistake(false);
    setFirstTryCount(0);
    setCompleted(false);
    setRewardCommitted(false);
    setShowQuitModal(false);
    setShowOutOfHearts(false);
    setFinalAccuracy(100);
    setIsBootLoading(true);
    setSessionStreak(0);
    setHeartFlashRed(false);
  }

  // Smooth screen entry, 650ms boot loader, spring progress bar, slide & tactile shake
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterScale = useRef(new Animated.Value(0.86)).current;
  const bootBarAnim = useRef(new Animated.Value(0)).current;
  const bootFadeAnim = useRef(new Animated.Value(1)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;
  const errorShakeX = useRef(new Animated.Value(0)).current;
  const errorRotateVal = useRef(new Animated.Value(0)).current;
  const heartShakeX = useRef(new Animated.Value(0)).current;
  const heartPulseScale = useRef(new Animated.Value(1)).current;
  const streakBadgeScale = useRef(new Animated.Value(0)).current;
  const checkReadyAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressTrackPulseY = useRef(new Animated.Value(1)).current;
  const [progressTrackWidth, setProgressTrackWidth] = useState(220);
  const [bootTrackWidth, setBootTrackWidth] = useState(220);
  const prevTargetProgressRef = useRef(0);
  const drawerSlideAnim = useRef(new Animated.Value(220)).current;
  const drawerOpacityAnim = useRef(new Animated.Value(0)).current;
  const heartFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (heartFlashTimerRef.current) clearTimeout(heartFlashTimerRef.current);
    };
  }, []);

  const animateAndClose = useCallback(
    (afterClose: () => void) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      enterOpacity.stopAnimation();
      enterScale.stopAnimation();

      Animated.parallel([
        Animated.timing(enterOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(enterScale, {
          toValue: 0.9,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        isClosingRef.current = false;
        afterClose();
      });
    },
    [enterOpacity, enterScale],
  );

  useEffect(() => {
    isTransitioningRef.current = false;
    isClosingRef.current = false;
    if (!visible || !node || sessionKey === '__closed__') return;

    enterOpacity.stopAnimation();
    enterScale.stopAnimation();
    bootBarAnim.stopAnimation();
    bootFadeAnim.stopAnimation();
    stepFadeAnim.setValue(1);
    stepSlideAnim.setValue(0);
    errorShakeX.setValue(0);
    errorRotateVal.setValue(0);
    prevTargetProgressRef.current = 0;
    progressTrackPulseY.setValue(1);
    heartPulseScale.setValue(1);
    enterOpacity.setValue(0);
    enterScale.setValue(0.95);
    bootBarAnim.setValue(0);
    bootFadeAnim.setValue(1);

    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterScale, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bootBarAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const fadeTimer = setTimeout(() => {
      playSound('boot_ready', { volumeMultiplier: 0.5 });
      Animated.timing(bootFadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          stepFadeAnim.setValue(0);
          setIsBootLoading(false);
          Animated.timing(stepFadeAnim, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      });
    }, 300);

    const guardTimer = setTimeout(() => {
      stepFadeAnim.setValue(1);
      setIsBootLoading(false);
    }, 680);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(guardTimer);
    };
  }, [
    visible,
    node,
    sessionKey,
    enterOpacity,
    enterScale,
    bootBarAnim,
    bootFadeAnim,
    stepFadeAnim,
    stepSlideAnim,
    errorShakeX,
    errorRotateVal,
    progressTrackPulseY,
    heartPulseScale,
  ]);

  const totalSteps = exercises.length;
  const currentExercise = exercises[stepIndex];
  const isCtaReady =
    currentExercise?.type === 'theory_bite' || answer.canCheck;

  useEffect(() => {
    Animated.spring(checkReadyAnim, {
      toValue: isCtaReady ? 1 : 0,
      damping: 16,
      stiffness: 340,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
  }, [isCtaReady, checkReadyAnim]);

  useEffect(() => {
    if (!visible) return;
    const targetProgress =
      completed && totalSteps > 0
        ? 1
        : totalSteps > 0
        ? stepIndex / totalSteps
        : 0;
    Animated.spring(progressAnim, {
      toValue: targetProgress,
      damping: 20,
      stiffness: 280,
      overshootClamping: true,
      useNativeDriver: true,
    }).start();

    if (targetProgress > prevTargetProgressRef.current) {
      prevTargetProgressRef.current = targetProgress;
      progressTrackPulseY.stopAnimation();
      progressTrackPulseY.setValue(1);
      Animated.sequence([
        Animated.timing(progressTrackPulseY, {
          toValue: 1.28,
          duration: 75,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(progressTrackPulseY, {
          toValue: 1,
          ...SPRING_JIGGLE_BOUNCE,
        }),
      ]).start();
    } else {
      prevTargetProgressRef.current = targetProgress;
    }
  }, [visible, stepIndex, totalSteps, completed, progressAnim, progressTrackPulseY]);

  useEffect(() => {
    if (result !== null) {
      drawerSlideAnim.stopAnimation();
      drawerOpacityAnim.stopAnimation();
      drawerSlideAnim.setValue(180);
      drawerOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(drawerOpacityAnim, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(drawerSlideAnim, {
          toValue: 0,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result, drawerOpacityAnim, drawerSlideAnim]);

  const triggerErrorShakeAndHeartPulse = useCallback(() => {
    runShiverShake(errorShakeX, errorRotateVal, 1);
    runShiverShake(heartShakeX, undefined, 0.7);

    setHeartFlashRed(true);
    if (heartFlashTimerRef.current) clearTimeout(heartFlashTimerRef.current);
    heartFlashTimerRef.current = setTimeout(() => {
      setHeartFlashRed(false);
    }, 450);

    heartPulseScale.stopAnimation();
    heartPulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(heartPulseScale, {
        toValue: 1.24,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heartPulseScale, {
        toValue: 1,
        damping: 14,
        stiffness: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [errorShakeX, errorRotateVal, heartPulseScale, heartShakeX]);

  const handleSelectionChange = useCallback(
    (state: {
      canCheck?: boolean;
      ready?: boolean;
      isCorrect?: boolean;
      correct?: boolean;
      correctAnswerText?: string;
      solution?: string;
    }) => {
      const canCheck = Boolean(state.canCheck ?? state.ready);
      const isCorrect = Boolean(state.isCorrect ?? state.correct);
      const correctAnswerText =
        state.correctAnswerText ?? state.solution ?? '';
      setAnswer({
        canCheck,
        isCorrect,
        correctAnswerText,
      });
    },
    [],
  );

  if (!visible || !resolvedContext || !currentExercise) {
    return null;
  }

  const { lang, unit, node: activeNode } = resolvedContext;
  const isCube = activeNode.kind === 'checkpoint_cube';
  const isBoss = activeNode.kind === 'boss_challenge';
  const isSpecial = isCube || isBoss;

  const earnedXp = reviewMode
    ? 5
    : isSpecial
      ? 50
      : activeNode.xpReward || 25;
  const earnedGems = reviewMode
    ? 0
    : isSpecial
      ? 25
      : activeNode.gemReward || 10;

  const advanceOrFinish = (wasCleanStep = false) => {
    if (isTransitioningRef.current) return;
    tapHaptic();
    const nextFirstTry =
      firstTryCount + (wasCleanStep && !stepHadMistake ? 1 : 0);
    if (wasCleanStep && !stepHadMistake) {
      setFirstTryCount(nextFirstTry);
    }

    if (stepIndex + 1 < totalSteps) {
      playSound('step_next');
      isTransitioningRef.current = true;
      stepFadeAnim.stopAnimation();
      stepSlideAnim.stopAnimation();

      Animated.parallel([
        Animated.timing(stepFadeAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stepSlideAnim, {
          toValue: -24,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setResult(null);
        setStepHadMistake(false);
        setAnswer({ canCheck: false, isCorrect: false, correctAnswerText: '' });
        setStepIndex((i) => i + 1);

        stepFadeAnim.setValue(0);
        stepSlideAnim.setValue(24);
        Animated.parallel([
          Animated.timing(stepFadeAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(stepSlideAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          isTransitioningRef.current = false;
        });
      });
      return;
    }

    const computedAcc = Math.max(
      40,
      Math.min(100, Math.round((nextFirstTry / Math.max(1, totalSteps)) * 100)),
    );
    setFinalAccuracy(computedAcc);
    successHaptic();
    playSound('victory');
    playTactileSound('level_complete', { skipHaptic: true });
    setCompleted(true);
  };

  const captureCurrentMistake = () => {
    if (!currentExercise || currentExercise.type === 'theory_bite') return;
    let prompt = `Review ${lang.name} concept`;
    let codeSnippet = '';
    let correctAnswer = answer.correctAnswerText || 'Review explanation';
    let options: string[] | undefined;

    switch (currentExercise.type) {
      case 'token_builder': {
        prompt = currentExercise.prompt;
        codeSnippet = currentExercise.codeLines.join('\n');
        correctAnswer = currentExercise.expectedTokens.join(' ');
        break;
      }
      case 'code_blocks': {
        prompt = currentExercise.prompt;
        codeSnippet = currentExercise.tokens.join(' ');
        correctAnswer = currentExercise.tokens.join(' ');
        break;
      }
      case 'find_bug': {
        const codeArr = Array.isArray(currentExercise.lines)
          ? currentExercise.lines
          : [];
        prompt = `Identify the buggy line in ${lang.name}`;
        codeSnippet = codeArr.join('\n');
        correctAnswer =
          codeArr[currentExercise.bugLine]?.trim() ||
          currentExercise.fixed ||
          correctAnswer;
        options = codeArr.map((l) => l.trim()).filter(Boolean);
        break;
      }
      case 'predict_output': {
        prompt = 'Predict the output of this code';
        codeSnippet = Array.isArray(currentExercise.code)
          ? currentExercise.code.join('\n')
          : String(currentExercise.code);
        correctAnswer =
          currentExercise.options[currentExercise.answer] ?? correctAnswer;
        options = currentExercise.options;
        break;
      }
      case 'multiple_choice': {
        prompt = currentExercise.question;
        correctAnswer =
          currentExercise.options[currentExercise.answer] ?? correctAnswer;
        options = currentExercise.options;
        break;
      }
    }

    addMistakeToVault({
      language: lang.id,
      unitTitle: unit.title,
      prompt,
      codeSnippet,
      correctAnswer,
      explanation: currentExercise.explanation,
      source: 'lesson',
      options,
    });
  };

  const handleCheckAnswer = () => {
    if (!answer.canCheck || result !== null) return;
    if (hearts <= 0) {
      errorHaptic();
      playSound('heart_lost');
      playTactileSound('error', { skipHaptic: true });
      setShowOutOfHearts(true);
      return;
    }

    if (answer.isCorrect) {
      successHaptic();
      playCorrectStreakSound(combo + 1);
      const nextChain = sessionStreak + 1;
      setSessionStreak(nextChain);
      if (nextChain >= 3) {
        streakBadgeScale.stopAnimation();
        streakBadgeScale.setValue(0.6);
        Animated.spring(streakBadgeScale, {
          toValue: 1,
          damping: 12,
          stiffness: 280,
          useNativeDriver: true,
        }).start();
      }
      recordAnswer(true);
      setResult('correct');
    } else {
      errorHaptic();
      triggerErrorShakeAndHeartPulse();
      setStepHadMistake(true);
      setSessionStreak(0);
      captureCurrentMistake();
      const nextHearts = Math.max(0, hearts - 1);
      playSound(nextHearts === 0 ? 'heart_lost' : 'wrong');
      playTactileSound('error', { skipHaptic: true });
      recordAnswer(false);
      setResult('wrong');
      if (nextHearts === 0) {
        setTimeout(() => {
          setShowOutOfHearts(true);
        }, 380);
      }
    }
  };

  const handleRetryStep = () => {
    if (hearts <= 0) {
      errorHaptic();
      playSound('heart_lost');
      setShowOutOfHearts(true);
      return;
    }
    tapHaptic();
    playSound('tap');
    setResult(null);
    setRetryTrigger((r) => r + 1);
  };

  const handleRefillWithGems = () => {
    const ok = refillHeartsWithGems();
    if (ok) {
      successHaptic();
      playSound('coin');
      setShowOutOfHearts(false);
      setResult(null);
      setRetryTrigger((r) => r + 1);
    } else {
      errorHaptic();
      playSound('wrong');
    }
  };

  const handleGoBlitzRecovery = () => {
    if (isClosingRef.current) return;
    tapHaptic();
    playSound('run_code');
    setShowOutOfHearts(false);
    requestBlitzRecovery(activeNode.id);
    animateAndClose(() => {
      onClose();
      router.navigate('/sandbox');
    });
  };

  const handleCommitVictory = () => {
    if (isClosingRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    playSound(!reviewMode && earnedGems > 0 ? 'coin' : 'drawer_close');
    if (!rewardCommitted) {
      setRewardCommitted(true);
      completeLesson({
        lang: lang.id,
        unitId: unit.id,
        nodeId: activeNode.id,
        xpReward: earnedXp,
        gemReward: earnedGems,
        accuracy: finalAccuracy,
        isCubeCheckpoint: isCube,
      });
    }
    animateAndClose(() => {
      onComplete?.(activeNode);
      onClose();
    });
  };

  const handleRequestClose = () => {
    if (isClosingRef.current) return;
    if (completed) {
      handleCommitVictory();
      return;
    }
    tapHaptic();
    playSound('drawer_open');
    setShowQuitModal(true);
  };

  const progressFillTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-progressTrackWidth, 0],
    extrapolate: 'clamp',
  });

  const isTheory = currentExercise.type === 'theory_bite';
  const correctExplanation = toConciseFeedback(currentExercise.explanation);
  const wrongExplanation = toConciseFeedback(
    currentExercise.type === 'token_builder' && currentExercise.syntaxHint
      ? currentExercise.syntaxHint
      : currentExercise.explanation,
  );

  const bootFillTranslateX = bootBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-bootTrackWidth, 0],
    extrapolate: 'clamp',
  });
  const checkReadyScale = checkReadyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });
  const errorRotateDeg = errorRotateVal.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2.5deg', '0deg', '2.5deg'],
  });
  const unitSlug = `unit_${String(unit.unitNumber).padStart(2, '0')}`;
  const extSuffix = lang.fileExt.split('.').pop() ?? lang.id;
  const triviaFact = DID_YOU_KNOW_FACTS[lang.id];

  const badgeLabel = reviewMode
    ? 'REVIEW COMPLETE'
    : isCube
      ? 'CHEST UNLOCKED'
      : isBoss
        ? 'UNIT BOSS CLEARED'
        : 'LESSON COMPLETE';

  const body = (
    <Animated.View
      style={[
        styles.screen,
        {
          paddingTop: completed ? insets.top + 12 : insets.top + 8,
          paddingBottom: completed ? Math.max(insets.bottom + 16, 24) : 0,
          opacity: enterOpacity,
          transform: [{ scale: enterScale }],
        },
      ]}
    >
      {isBootLoading && !completed ? (
        <Animated.View style={[styles.bootContainer, { opacity: bootFadeAnim }]}>
          <View style={styles.bootCenter}>
            <View style={styles.bootBadgeCard}>
              <View style={styles.bootLogoRow}>
                <LanguageLogo language={lang.id} size={36} />
                <View style={styles.bootTitleGroup}>
                  <Text style={styles.bootUnitLabel}>
                    {`UNIT ${String(unit.unitNumber).padStart(2, '0')} · ${lang.name.toUpperCase()}`}
                  </Text>
                  <Text style={styles.bootFileTitle} numberOfLines={1}>
                    {activeNode.title}
                  </Text>
                </View>
              </View>
              <Text style={styles.bootCmdText}>
                {`> loading ${unitSlug}.${extSuffix}...`}
              </Text>
              <View
                style={styles.bootProgressTrack}
                onLayout={(e) => {
                  const measured = e.nativeEvent.layout.width;
                  if (measured > 0 && Math.abs(measured - bootTrackWidth) > 1) {
                    setBootTrackWidth(measured);
                  }
                }}
              >
                <Animated.View
                  style={[
                    styles.bootProgressFill,
                    { transform: [{ translateX: bootFillTranslateX }] },
                  ]}
                />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.bootTriviaCard,
              { marginBottom: Math.max(insets.bottom + 16, 24) },
            ]}
          >
            <Text style={styles.bootTriviaKicker}>DID YOU KNOW?</Text>
            <Text style={styles.bootTriviaBody}>{triviaFact}</Text>
          </View>
        </Animated.View>
      ) : completed ? (
        <>
          <ScrollView
            contentContainerStyle={styles.victoryScroll}
            showsVerticalScrollIndicator={false}
          >
            <VictoryCelebrationView
              badgeLabel={badgeLabel}
              nodeTitle={activeNode.title}
              language={lang.id}
              languageName={lang.name}
              unitNumber={unit.unitNumber}
              unitTitle={unit.title}
              isCube={isCube}
              isBoss={isBoss}
              reviewMode={reviewMode}
              earnedXp={earnedXp * (isXpBoostActive ? 2 : 1)}
              xpBoostActive={isXpBoostActive}
              finalAccuracy={finalAccuracy}
              earnedGems={earnedGems}
              streak={streak}
              cloudConfigured={cloudConfigured}
            />
          </ScrollView>

          <View style={styles.bottomDock}>
            <SpringPressable
              onPress={handleCommitVictory}
              haptic="none"
              sound="none"
              pressScale={0.97}
              pressTranslateY={3}
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>Continue →</Text>
            </SpringPressable>
          </View>
        </>
      ) : (
        <>
          {/* 1. Lesson Top HUD Bar: Close X | Progress Bar | Streak | Live Hearts */}
          <View style={styles.hudBar}>
            <SpringPressable
              onPress={handleRequestClose}
              hitSlop={10}
              haptic="light"
              sound="none"
              pressScale={0.92}
              accessibilityLabel="Close lesson"
              style={styles.hudCloseBtn}
            >
              <Ionicons name="close" size={20} color="#CBD5E1" />
            </SpringPressable>

            <Animated.View
              style={[
                styles.progressTrack,
                { transform: [{ scaleY: progressTrackPulseY }] },
              ]}
              onLayout={(e) => {
                const measured = e.nativeEvent.layout.width;
                if (measured > 0 && Math.abs(measured - progressTrackWidth) > 1) {
                  setProgressTrackWidth(measured);
                }
              }}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  { transform: [{ translateX: progressFillTranslateX }] },
                ]}
              >
                <View style={styles.progressShine} />
              </Animated.View>
            </Animated.View>

            {sessionStreak >= 3 ? (
              <Animated.View
                style={[
                  styles.streakChainPill,
                  { transform: [{ scale: streakBadgeScale }] },
                ]}
              >
                <Text style={styles.streakChainText}>
                  {`🔥 ${sessionStreak} IN A ROW`}
                </Text>
              </Animated.View>
            ) : null}

            <Animated.View
              style={{
                transform: [
                  { translateX: heartShakeX },
                  { scale: heartPulseScale },
                ],
              }}
            >
              <SpringPressable
                onPress={() => {
                  if (hearts < maxHearts) {
                    tapHaptic();
                    playSound('drawer_open');
                    setShowOutOfHearts(true);
                  }
                }}
                haptic="selection"
                sound="none"
                pressScale={0.95}
                style={[
                  styles.heartPill,
                  hearts <= 1 && styles.heartPillDanger,
                  heartFlashRed && styles.heartPillFlash,
                ]}
              >
                <HeartIcon size={20} depleted={hearts === 0} />
                <Text style={styles.heartCount}>{hearts}</Text>
              </SpringPressable>
            </Animated.View>
          </View>

          {/* Meta Step Strip */}
          <View style={styles.metaStrip}>
            <View style={styles.metaLeft}>
              <LanguageLogo language={lang.id} size={13} />
              <Text style={styles.metaTitle} numberOfLines={1}>
                {activeNode.title}
              </Text>
            </View>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>
                {isCube
                  ? `CHALLENGE ${stepIndex + 1}/${totalSteps}`
                  : `STEP ${stepIndex + 1}/${totalSteps}`}
              </Text>
            </View>
          </View>

          {/* 2. Active Step Viewport */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                opacity: stepFadeAnim,
                transform: [{ translateX: stepSlideAnim }],
              }}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateX: errorShakeX },
                    { rotate: errorRotateDeg },
                  ],
                }}
              >
              {currentExercise.type === 'theory_bite' ? (
                <TheoryBiteCard
                  exercise={currentExercise}
                  fileName={lang.fileExt}
                />
              ) : currentExercise.type === 'token_builder' ? (
                <CodeTokenBuilder
                  exercise={currentExercise}
                  fileName={lang.fileExt}
                  language={lang.id}
                  locked={result !== null}
                  noHints={Boolean(activeNode.noHints)}
                  retryTrigger={retryTrigger}
                  onSelectionChange={handleSelectionChange}
                />
              ) : currentExercise.type === 'code_blocks' ? (
                <CodeBlocks
                  key={`${currentExercise.id}-${retryTrigger}`}
                  exercise={currentExercise}
                  language={lang.id}
                  locked={result !== null}
                  onSelectionChange={handleSelectionChange}
                />
              ) : currentExercise.type === 'find_bug' ? (
                <FindBug
                  key={`${currentExercise.id}-${retryTrigger}`}
                  exercise={currentExercise}
                  fileExt={lang.fileExt}
                  locked={result !== null}
                  onSelectionChange={handleSelectionChange}
                />
              ) : currentExercise.type === 'predict_output' ? (
                <PredictOutput
                  key={`${currentExercise.id}-${retryTrigger}`}
                  exercise={currentExercise}
                  fileExt={lang.fileExt}
                  locked={result !== null}
                  onSelectionChange={handleSelectionChange}
                />
              ) : (
                <MultipleChoice
                  key={`${currentExercise.id}-${retryTrigger}`}
                  exercise={currentExercise}
                  locked={result !== null}
                  onSelectionChange={handleSelectionChange}
                />
              )}
              </Animated.View>
            </Animated.View>
          </ScrollView>

          {/* 3. Bottom Action / Feedback Drawer */}
          <View
            style={[
              styles.bottomDock,
              { paddingBottom: Math.max(insets.bottom + 12, 20) },
            ]}
          >
            {result === null ? (
              isTheory ? (
                <SpringPressable
                  onPress={() => advanceOrFinish(true)}
                  haptic="medium"
                  sound="none"
                  pressScale={0.97}
                  style={styles.primaryCta}
                >
                  <Text style={styles.primaryCtaText}>Continue</Text>
                </SpringPressable>
              ) : (
                <SpringPressable
                  disabled={!answer.canCheck}
                  onPress={handleCheckAnswer}
                  haptic="none"
                  pressScale={0.97}
                  style={styles.primaryCtaPressableWrap}
                >
                  <Animated.View
                    style={[
                      styles.primaryCtaAnimated,
                      isCtaReady ? styles.primaryCtaReady : styles.primaryCtaIdle,
                      {
                        transform: [{ scale: checkReadyScale }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryCtaText,
                        !answer.canCheck && styles.primaryCtaTextDisabled,
                      ]}
                    >
                      Check Answer
                    </Text>
                  </Animated.View>
                </SpringPressable>
              )
            ) : (
              <Animated.View
                style={[
                  styles.feedbackDrawer,
                  result === 'correct'
                    ? styles.feedbackDrawerCorrect
                    : styles.feedbackDrawerWrong,
                  {
                    opacity: drawerOpacityAnim,
                    transform: [{ translateY: drawerSlideAnim }],
                  },
                ]}
              >
                <View style={styles.feedbackMascotRow}>
                  <RoboMascot
                    mood={result === 'correct' ? 'happy' : 'worried'}
                    size={48}
                  />
                  <View style={styles.feedbackCopyCol}>
                    <Text
                      style={[
                        styles.feedbackTitle,
                        { color: result === 'correct' ? '#34D399' : '#FCA5A5' },
                      ]}
                    >
                      {result === 'correct'
                        ? stepIndex % 2 === 0
                          ? 'Spot on!'
                          : 'Clean syntax!'
                        : hearts === 0
                          ? 'Out of Hearts · -1 Heart'
                          : 'Not quite · -1 Heart'}
                    </Text>
                    <RichCodeText
                      text={
                        result === 'correct'
                          ? correctExplanation
                          : answer.correctAnswerText
                            ? `Expected \`${answer.correctAnswerText.split('\n')[0]}\` · ${wrongExplanation}`
                            : wrongExplanation
                      }
                      style={styles.feedbackBody}
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {result === 'correct' ? (
                  <SpringPressable
                    onPress={() => advanceOrFinish(true)}
                    haptic="medium"
                    sound="none"
                    pressScale={0.97}
                    style={styles.correctCta}
                  >
                    <Text style={styles.correctCtaText}>Continue →</Text>
                  </SpringPressable>
                ) : (
                  <View style={styles.wrongActionRow}>
                    <SpringPressable
                      onPress={handleRetryStep}
                      haptic="light"
                      sound="none"
                      pressScale={0.97}
                      style={styles.retryCta}
                    >
                      <Text style={styles.retryCtaText}>Got It →</Text>
                    </SpringPressable>
                    <SpringPressable
                      onPress={() => advanceOrFinish(false)}
                      haptic="light"
                      sound="none"
                      pressScale={0.97}
                      style={styles.skipCta}
                    >
                      <Text style={styles.skipCtaText}>Skip</Text>
                    </SpringPressable>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </>
      )}

      {/* 4. Mid-Lesson Exit Confirmation Modal */}
      <Modal
        visible={showQuitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuitModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowQuitModal(false)}
          />
          <View style={styles.dialogCard}>
            <View style={styles.dialogIconBox}>
              <Ionicons name="exit-outline" size={22} color="#C4B5FD" />
            </View>
            <Text style={styles.dialogTitle}>Leave lesson?</Text>
            <Text style={styles.dialogBody}>
              Your progress in this session will be lost.
            </Text>

            <SpringPressable
              onPress={() => {
                playSound('drawer_close');
                setShowQuitModal(false);
              }}
              haptic="selection"
              sound="none"
              pressScale={0.97}
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>Keep Learning</Text>
            </SpringPressable>

            <SpringPressable
              onPress={() => {
                playSound('drawer_close');
                setShowQuitModal(false);
                animateAndClose(onClose);
              }}
              haptic="light"
              sound="none"
              pressScale={0.97}
              style={styles.secondaryDialogBtn}
            >
              <Text style={styles.secondaryDialogText}>Leave</Text>
            </SpringPressable>
          </View>
        </View>
      </Modal>

      {/* 5. Out of Hearts Recovery Modal */}
      <Modal
        visible={showOutOfHearts}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOutOfHearts(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop} />
          <View style={styles.dialogCard}>
            <View style={[styles.dialogIconBox, styles.heartAlertIconBox]}>
              <HeartIcon size={24} depleted />
            </View>

            <Text style={styles.dialogTitle}>Out of Hearts</Text>
            <Text style={styles.dialogBody}>
              Refill all {maxHearts} hearts with gems or play 1 round of Bug Hunt Blitz to earn +2 hearts free.
            </Text>

            <View style={styles.gemBalanceChip}>
              <GemIcon size={15} />
              <Text style={styles.gemBalanceText}>{`Balance: ${gems} Gems`}</Text>
            </View>

            <SpringPressable
              disabled={gems < HEART_REFILL_COST}
              onPress={handleRefillWithGems}
              haptic="none"
              pressScale={0.97}
              style={[
                styles.refillGemsBtn,
                gems < HEART_REFILL_COST && styles.primaryCtaDisabled,
              ]}
            >
              <Text style={styles.primaryCtaText}>
                {`Refill ${maxHearts} Hearts`}
              </Text>
              <View style={styles.costPill}>
                <GemIcon size={13} />
                <Text style={styles.costPillText}>{HEART_REFILL_COST}</Text>
              </View>
            </SpringPressable>

            <SpringPressable
              onPress={handleGoBlitzRecovery}
              haptic="none"
              pressScale={0.97}
              style={styles.blitzRecoveryBtn}
            >
              <View style={styles.blitzRecoveryLeft}>
                <Ionicons name="bug" size={16} color="#10B981" />
                <Text style={styles.blitzRecoveryText}>Play 60s Bug Blitz</Text>
              </View>
              <View style={styles.freeRewardBadge}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={styles.freeRewardText}>FREE +2</Text>
                  <HeartIcon size={11} />
                </View>
              </View>
            </SpringPressable>

            <SpringPressable
              onPress={() => {
                playSound('drawer_close');
                setShowOutOfHearts(false);
                animateAndClose(onClose);
              }}
              haptic="light"
              sound="none"
              pressScale={0.97}
              style={styles.textDismissBtn}
            >
              <Text style={styles.textDismissText}>Back to Course Map</Text>
            </SpringPressable>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );

  if (standaloneScreen) {
    return body;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.modalBackdropContainer}>
        <Animated.View
          pointerEvents="none"
          style={[styles.modalBackdropSolid, { opacity: enterOpacity }]}
        />
        {body}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdropContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdropSolid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.canvas,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 12,
  },
  hudCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181724',
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1D1B2B',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    justifyContent: 'flex-start',
  },
  progressShine: {
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    marginTop: 2.5,
    marginHorizontal: 6,
  },
  streakChainPill: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakChainText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.2,
  },
  heartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#181724',
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
  },
  heartPillDanger: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  heartPillFlash: {
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: '#EF4444',
  },
  heartCount: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  metaTitle: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    flexShrink: 1,
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 24,
  },
  bottomDock: {
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: Colors.canvas,
  },
  primaryCta: {
    height: 58,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 5,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryCtaPressableWrap: {
    width: '100%',
  },
  primaryCtaAnimated: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryCtaIdle: {
    backgroundColor: '#181824',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: '#0E0D16',
  },
  primaryCtaReady: {
    backgroundColor: '#7C5CFC',
    borderColor: '#8B5CF6',
    borderBottomColor: '#5639D6',
  },
  primaryCtaDisabled: {
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  primaryCtaText: {
    fontFamily: UI_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  primaryCtaTextDisabled: {
    color: '#64748B',
  },
  bootContainer: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  bootCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  bootBadgeCard: {
    backgroundColor: '#12111A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.22)',
    padding: 20,
    gap: 14,
  },
  bootLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bootTitleGroup: {
    flex: 1,
    gap: 3,
  },
  bootUnitLabel: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.7,
  },
  bootFileTitle: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  bootCmdText: {
    fontFamily: MONO,
    fontSize: 13,
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  bootProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
  },
  bootProgressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#7C5CFC',
  },
  bootTriviaCard: {
    backgroundColor: '#12111A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  bootTriviaKicker: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.8,
  },
  bootTriviaBody: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 19.5,
    color: '#CBD5E1',
  },
  feedbackDrawer: {
    backgroundColor: '#12111A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderWidth: 1.5,
    borderTopWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 22,
    gap: 14,
  },
  feedbackDrawerCorrect: {
    backgroundColor: '#0F241D',
    borderColor: '#10B981',
  },
  feedbackDrawerWrong: {
    backgroundColor: '#281319',
    borderColor: '#EF4444',
  },
  feedbackMascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackCopyCol: {
    flex: 1,
    gap: 4,
  },
  feedbackTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  feedbackBody: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 19.5,
    color: '#E2E8F0',
  },
  correctCta: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#10B981',
    borderBottomWidth: 4,
    borderBottomColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctCtaText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wrongActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retryCta: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    borderBottomWidth: 4,
    borderBottomColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryCtaText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipCta: {
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 4,
    borderBottomColor: '#100F1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipCtaText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  victoryScroll: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  victoryTop: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  victoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.35)',
  },
  victoryStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 6,
  },
  victoryBadgeText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.7,
  },
  victoryTitle: {
    fontFamily: UI_FONT,
    fontSize: 24,
    fontWeight: '800',
    color: '#FAFAFA',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  victorySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  victorySubtitle: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#94A3B8',
  },
  bentoStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoStatCard: {
    flex: 1,
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  bentoStatLabel: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.6,
  },
  bentoStatVal: {
    fontFamily: MONO,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  gemValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncStatusCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.32)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 15,
    gap: 8,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
  },
  streakPillText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FDBA74',
  },
  cloudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#181726',
  },
  cloudChipText: {
    fontFamily: MONO,
    fontSize: 10.5,
    color: '#94A3B8',
  },
  syncNote: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    color: '#94A3B8',
  },
  recapCard: {
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 10,
  },
  recapKicker: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.7,
  },
  recapTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  recapSummary: {
    fontFamily: UI_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
  },
  recapCodeBox: {
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 12,
    gap: 4,
  },
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#12111A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  dialogIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartAlertIconBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.30)',
  },
  dialogTitle: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: '#FAFAFA',
    textAlign: 'center',
  },
  dialogBody: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 19.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
  secondaryDialogBtn: {
    height: 44,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryDialogText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  gemBalanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  gemBalanceText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#BAE6FD',
  },
  refillGemsBtn: {
    height: 48,
    width: '100%',
    borderRadius: 13,
    backgroundColor: '#7C5CFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 10, 14, 0.35)',
  },
  costPillText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  blitzRecoveryBtn: {
    height: 48,
    width: '100%',
    borderRadius: 13,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.32)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  blitzRecoveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blitzRecoveryText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  freeRewardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  freeRewardText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#34D399',
  },
  textDismissBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textDismissText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
  },
});
