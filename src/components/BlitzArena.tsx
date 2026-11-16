import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BugCampaignLevel,
  BugCampaignSnippet,
  computeBugLevelStars,
} from '@/data/bugCampaign';
import { LangId } from '@/data/courses';
import { CodeLine, SyntaxPalette } from '@/components/CodeLine';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { RecordBugLevelResult } from '@/store/GameStore';
import { MONO, UI_FONT } from '@/theme';
import {
  errorHaptic,
  mediumHaptic,
  successHaptic,
  tapHaptic,
} from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import { playComboChime, playTactileSound } from '@/services/soundEngine';
import { GemIcon, HeartIcon } from '@/components/ui/CurrencyIcons';
import { useUserStore } from '@/store/useUserStore';

const VIOLET = '#7C5CFC';
const GOLD = '#FBBF24';
const STAR_DIM = '#27273A';
const CORAL = '#F85149';
const GREEN = '#3FB950';

export const BLITZ_SYNTAX: SyntaxPalette = {
  keyword: '#C084FC',
  string: '#34D399',
  number: '#FB923C',
  operator: '#38BDF8',
  comment: '#71717A',
  plain: '#FAFAFA',
};

const LANG_SHORT: Record<LangId, string> = {
  python: 'PYTHON',
  cpp: 'C++',
  js: 'JAVASCRIPT',
  go: 'GO',
  java: 'JAVA',
  rust: 'RUST',
  sql: 'SQL',
  c: 'C',
  ts: 'TYPESCRIPT',
  css: 'CSS',
  html: 'HTML',
  php: 'PHP',
  asm: 'ASSEMBLY',
  swift: 'SWIFT',
  kotlin: 'KOTLIN',
  julia: 'JULIA',
  lua: 'LUA',
  csharp: 'C#',
};

type ArenaPhase = 'playing' | 'stage_clear' | 'cleared' | 'timeout';

export interface BlitzArenaProps {
  lang: LangId;
  level: BugCampaignLevel;
  previousBestTimeMs?: number;
  hasNextLevel: boolean;
  isRecoveryMode?: boolean;
  bottomInset?: number;
  onBackToMap: () => void;
  onCompleteLevel: (payload: {
    level: BugCampaignLevel;
    stars: 1 | 2 | 3;
    elapsedMs: number;
  }) => {
    reward: RecordBugLevelResult;
    heartsRecovered: number;
  };
  onNextLevel: () => void;
  onReturnToLesson?: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function BlitzArena({
  lang,
  level,
  previousBestTimeMs,
  hasNextLevel,
  isRecoveryMode = false,
  bottomInset = 16,
  onBackToMap,
  onCompleteLevel,
  onNextLevel,
  onReturnToLesson,
}: BlitzArenaProps) {
  const { addMistakeToVault } = useUserStore();
  const stages: readonly BugCampaignSnippet[] = level.stages;

  const [phase, setPhase] = useState<ArenaPhase>('playing');
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [wrongTappedLine, setWrongTappedLine] = useState<number | null>(null);
  const [penaltyFlash, setPenaltyFlash] = useState(false);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(3);
  const [clearSummary, setClearSummary] = useState<{
    reward: RecordBugLevelResult;
    heartsRecovered: number;
    isNewBestTime: boolean;
  } | null>(null);

  const activeMsRef = useRef(0);
  const lastTickRef = useRef<number>(0);
  const phaseRef = useRef<ArenaPhase>('playing');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Native-driver animations
  const wrongShakeX = useRef(new Animated.Value(0)).current;
  const drawerSlideY = useRef(new Animated.Value(340)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0.2)).current;
  const star2Scale = useRef(new Animated.Value(0.2)).current;
  const star3Scale = useRef(new Animated.Value(0.2)).current;

  const [t3, t2, t1] = level.starThresholds; // [10, 18, 30]
  const maxMs = t1 * 1000;

  const clearScheduledTimers = useCallback(() => {
    for (const id of timersRef.current) {
      clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const resetAnimations = useCallback(() => {
    drawerSlideY.stopAnimation();
    drawerOpacity.stopAnimation();
    star1Scale.stopAnimation();
    star2Scale.stopAnimation();
    star3Scale.stopAnimation();
    drawerSlideY.setValue(340);
    drawerOpacity.setValue(0);
    star1Scale.setValue(0.2);
    star2Scale.setValue(0.2);
    star3Scale.setValue(0.2);
  }, [drawerOpacity, drawerSlideY, star1Scale, star2Scale, star3Scale]);

  const startOrReplay = useCallback(() => {
    clearScheduledTimers();
    resetAnimations();
    activeMsRef.current = 0;
    lastTickRef.current = Date.now();
    phaseRef.current = 'playing';
    setStageIndex(0);
    setElapsedMs(0);
    setWrongTappedLine(null);
    setPenaltyFlash(false);
    setEarnedStars(3);
    setClearSummary(null);
    setPhase('playing');
  }, [clearScheduledTimers, resetAnimations]);

  // Reset whenever level or language changes
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startOrReplay();
    });
    return () => {
      cancelAnimationFrame(id);
      clearScheduledTimers();
    };
  }, [lang, level.levelNumber, startOrReplay, clearScheduledTimers]);

  // High-resolution interval while playing (pauses during Boss stage transition / drawer)
  useEffect(() => {
    if (phase !== 'playing') return;
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.max(0, now - lastTickRef.current);
      lastTickRef.current = now;
      activeMsRef.current += delta;

      if (activeMsRef.current >= maxMs) {
        activeMsRef.current = maxMs;
        phaseRef.current = 'timeout';
        setElapsedMs(maxMs);
        setPhase('timeout');
        errorHaptic();
        playSound('wrong');
        drawerSlideY.setValue(240);
        drawerOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(drawerSlideY, {
            toValue: 0,
            damping: 20,
            stiffness: 260,
            useNativeDriver: true,
          }),
          Animated.timing(drawerOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setElapsedMs(activeMsRef.current);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [drawerOpacity, drawerSlideY, maxMs, phase]);

  const runClearCelebration = useCallback(
    (starsWon: 1 | 2 | 3) => {
      drawerSlideY.setValue(320);
      drawerOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(drawerSlideY, {
          toValue: 0,
          damping: 20,
          stiffness: 260,
          mass: 0.75,
          useNativeDriver: true,
        }),
        Animated.timing(drawerOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const scales = [star1Scale, star2Scale, star3Scale];
      const delays = [180, 300, 420];

      scales.forEach((anim, idx) => {
        const starNum = idx + 1;
        const earned = starNum <= starsWon;
        if (!earned) {
          anim.setValue(1);
          return;
        }
        anim.setValue(0.15);
        const timer = setTimeout(() => {
          if (starNum === starsWon) {
            successHaptic();
          } else {
            tapHaptic();
          }
          playSound(starNum === 3 ? 'combo' : 'token_in');
          Animated.spring(anim, {
            toValue: 1,
            damping: 11,
            stiffness: 290,
            mass: 0.55,
            useNativeDriver: true,
          }).start();
        }, delays[idx]);
        timersRef.current.push(timer);
      });
    },
    [drawerOpacity, drawerSlideY, star1Scale, star2Scale, star3Scale],
  );

  const triggerWrongShake = () => {
    wrongShakeX.stopAnimation();
    wrongShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(wrongShakeX, {
        toValue: -9,
        duration: 42,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(wrongShakeX, {
        toValue: 9,
        duration: 48,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(wrongShakeX, {
        toValue: -6,
        duration: 44,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(wrongShakeX, {
        toValue: 0,
        duration: 50,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const activeSnippet: BugCampaignSnippet = stages[stageIndex] ?? level.stages[0];

  const handleTapLine = (lineIndex: number) => {
    if (phaseRef.current !== 'playing') return;

    if (lineIndex === activeSnippet.bugLine) {
      // Boss stage 1 -> transition cleanly to stage 2 without ticking clock
      if (stageIndex + 1 < stages.length) {
        phaseRef.current = 'stage_clear';
        setPhase('stage_clear');
        successHaptic();
        playComboChime(stageIndex + 1, true);
        const nextStageTimer = setTimeout(() => {
          lastTickRef.current = Date.now();
          phaseRef.current = 'playing';
          setStageIndex((s) => s + 1);
          setWrongTappedLine(null);
          setPhase('playing');
        }, 480);
        timersRef.current.push(nextStageTimer);
        return;
      }

      // Final bug caught -> finalize level!
      const finalMs = Math.max(100, Math.min(maxMs - 50, activeMsRef.current));
      phaseRef.current = 'cleared';
      setElapsedMs(finalMs);
      setPhase('cleared');
      const rawStars = computeBugLevelStars(finalMs, level.starThresholds);
      const starsWon: 1 | 2 | 3 = rawStars === 0 ? 1 : rawStars;
      setEarnedStars(starsWon);
      const isNewBestTime =
        previousBestTimeMs === undefined || finalMs < previousBestTimeMs;
      const completed = onCompleteLevel({
        level,
        stars: starsWon,
        elapsedMs: finalMs,
      });
      setClearSummary({
        ...completed,
        isNewBestTime,
      });
      playSound('victory');
      playTactileSound('level_complete', { skipHaptic: true });
      runClearCelebration(starsWon);
      return;
    }

    // Wrong line tapped -> +3s time penalty + shake + red flash
    errorHaptic();
    playSound('wrong');
    playTactileSound('error', { skipHaptic: true });
    addMistakeToVault({
      language: lang,
      unitTitle: level.title,
      prompt: `Spot the buggy line in \`${activeSnippet.filename}\``,
      codeSnippet: activeSnippet.codeLines.join('\n'),
      correctAnswer:
        activeSnippet.codeLines[activeSnippet.bugLine]?.trim() ??
        'Identify the buggy line',
      explanation: activeSnippet.explanation,
      source: 'bug_hunt',
      options: activeSnippet.codeLines.map((l) => l.trim()).filter(Boolean),
    });
    triggerWrongShake();
    setWrongTappedLine(lineIndex);
    setPenaltyFlash(true);

    const flashTimer = setTimeout(() => {
      setPenaltyFlash(false);
      setWrongTappedLine((prev) => (prev === lineIndex ? null : prev));
    }, 650);
    timersRef.current.push(flashTimer);

    activeMsRef.current = Math.min(maxMs, activeMsRef.current + 3000);
    if (activeMsRef.current >= maxMs) {
      phaseRef.current = 'timeout';
      setElapsedMs(maxMs);
      setPhase('timeout');
      drawerSlideY.setValue(240);
      drawerOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(drawerSlideY, {
          toValue: 0,
          damping: 20,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(drawerOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setElapsedMs(activeMsRef.current);
    }
  };

  const elapsedSec = elapsedMs / 1000;
  const remainingPct = Math.max(
    0,
    Math.min(100, ((maxMs - elapsedMs) / maxMs) * 100),
  );
  const liveStars =
    phase === 'timeout'
      ? 0
      : elapsedSec < t3
        ? 3
        : elapsedSec < t2
          ? 2
          : elapsedSec < t1
            ? 1
            : 0;

  // Tick positions along remaining-time drain bar (full right = 0s, 0% left = 30s)
  const tick3Pct = ((t1 - t3) / t1) * 100; // 66.67% for 10s
  const tick2Pct = ((t1 - t2) / t1) * 100; // 40.00% for 18s

  const timerUrgent = elapsedSec >= t1 - 5;
  const timerWarn = !timerUrgent && elapsedSec >= t2;

  return (
    <View style={styles.root}>
      {/* Top Bar: < Map · LANG LVL XX/30 · Timer */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            tapHaptic();
            clearScheduledTimers();
            onBackToMap();
          }}
          style={({ pressed }) => [
            styles.mapBtn,
            pressed && styles.pressedFade,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={16} color="#FAFAFA" />
          <Text style={styles.mapBtnText}>Map</Text>
        </Pressable>

        <View style={styles.centerLevelBlock}>
          <View style={styles.levelTitleRow}>
            <Text style={styles.levelHeaderText} numberOfLines={1}>
              {LANG_SHORT[lang]} · LVL {pad2(level.levelNumber)}/30
            </Text>
            {level.isBoss ? (
              <View style={styles.stageBadge}>
                <Ionicons name="bug" size={10} color={CORAL} />
                <Text style={styles.stageBadgeText}>BOSS</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bugStepBarRow}>
            {stages.map((_, idx) => {
              const isSolved =
                phase === 'cleared' ||
                idx < stageIndex ||
                (phase === 'stage_clear' && idx === stageIndex);
              const isCurrent = phase === 'playing' && idx === stageIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.bugStepPip,
                    isCurrent && styles.bugStepPipActive,
                    isSolved && styles.bugStepPipDone,
                  ]}
                />
              );
            })}
            <Text style={styles.bugStepCount}>
              BUG {stageIndex + 1}/{stages.length}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.timerPill,
            timerWarn && styles.timerPillWarn,
            timerUrgent && styles.timerPillUrgent,
          ]}
        >
          <Ionicons
            name="stopwatch-outline"
            size={13}
            color={timerUrgent ? CORAL : timerWarn ? '#F59E0B' : '#A78BFA'}
          />
          <Text
            style={[
              styles.timerText,
              timerWarn && styles.timerTextWarn,
              timerUrgent && styles.timerTextUrgent,
            ]}
          >
            {elapsedSec.toFixed(1).padStart(4, '0')}s
          </Text>
        </View>
      </View>

      {/* 3-Star Drain Bar with Vertical Time-Gate Markers */}
      <View style={styles.speedBarWrap}>
        <View style={styles.speedTrackOuter}>
          <View
            style={[
              styles.speedTrackFill,
              {
                width: `${remainingPct}%`,
                backgroundColor:
                  liveStars === 3
                    ? VIOLET
                    : liveStars === 2
                      ? '#8B6EFF'
                      : liveStars === 1
                        ? '#F59E0B'
                        : CORAL,
              },
            ]}
          />
          {/* Vertical Gate Ticks inside track */}
          <View style={[styles.gateTick, { left: `${tick2Pct}%` }]} />
          <View style={[styles.gateTick, { left: `${tick3Pct}%` }]} />
        </View>

        <View style={styles.gateLabelsRow}>
          <View style={styles.gateItemLeft}>
            <Ionicons
              name="star"
              size={11}
              color={liveStars >= 1 ? GOLD : STAR_DIM}
            />
            <Text
              style={[
                styles.gateLabel,
                liveStars < 1 && styles.gateLabelDim,
              ]}
            >
              {t1}s
            </Text>
          </View>

          <View
            style={[
              styles.gateItemAbs,
              { left: `${tick2Pct}%`, transform: [{ translateX: -22 }] },
            ]}
          >
            <View style={styles.gateStarsRow}>
              <Ionicons
                name="star"
                size={11}
                color={liveStars >= 2 ? GOLD : STAR_DIM}
              />
              <Ionicons
                name="star"
                size={11}
                color={liveStars >= 2 ? GOLD : STAR_DIM}
              />
            </View>
            <Text
              style={[
                styles.gateLabel,
                liveStars < 2 && styles.gateLabelDim,
              ]}
            >
              {t2}s
            </Text>
          </View>

          <View
            style={[
              styles.gateItemAbs,
              { left: `${tick3Pct}%`, transform: [{ translateX: -28 }] },
            ]}
          >
            <View style={styles.gateStarsRow}>
              <Ionicons
                name="star"
                size={11}
                color={liveStars >= 3 ? GOLD : STAR_DIM}
              />
              <Ionicons
                name="star"
                size={11}
                color={liveStars >= 3 ? GOLD : STAR_DIM}
              />
              <Ionicons
                name="star"
                size={11}
                color={liveStars >= 3 ? GOLD : STAR_DIM}
              />
            </View>
            <Text
              style={[
                styles.gateLabel,
                liveStars < 3 && styles.gateLabelDim,
              ]}
            >
              {t3}s
            </Text>
          </View>
        </View>
      </View>

      {/* Level Meta Subtitle */}
      <View style={styles.levelMetaStrip}>
        <Text style={styles.levelTitleText} numberOfLines={1}>
          {level.title}
        </Text>
        {penaltyFlash ? (
          <View style={styles.penaltyChip}>
            <Text style={styles.penaltyChipText}>+3.0s PENALTY</Text>
          </View>
        ) : phase === 'stage_clear' ? (
          <View style={styles.stageClearChip}>
            <Text style={styles.stageClearText}>
              BUG {stageIndex + 1}/{stages.length} FIXED · NEXT{' '}
              {stageIndex + 2}/{stages.length}
            </Text>
          </View>
        ) : (
          <Text style={styles.tapHintText}>Tap broken line</Text>
        )}
      </View>

      {/* Interactive IDE Shell */}
      <ScrollView
        style={styles.codeScroll}
        contentContainerStyle={[
          styles.codeScrollContent,
          { paddingBottom: phase === 'playing' ? Math.max(bottomInset, 28) : 290 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.ideCard,
            { transform: [{ translateX: wrongShakeX }] },
          ]}
        >
          {/* IDE Titlebar */}
          <View style={styles.ideHeader}>
            <View style={styles.ideDots}>
              <View style={[styles.ideDot, styles.dotRed]} />
              <View style={[styles.ideDot, styles.dotAmber]} />
              <View style={[styles.ideDot, styles.dotGreen]} />
            </View>
            <Text style={styles.ideFilename} numberOfLines={1}>
              {activeSnippet.filename}
            </Text>
            <Text style={styles.ideTag}>
              BUG {stageIndex + 1}/{stages.length}
            </Text>
          </View>

          {/* Tappable Lines */}
          <View style={styles.ideBody}>
            {activeSnippet.codeLines.map((line, idx) => {
              const displayLineNum = idx + 1;
              const isBugLine = idx === activeSnippet.bugLine;
              const isWrongLine = wrongTappedLine === idx;
              const isStageGreen = phase === 'stage_clear' && isBugLine;
              const isRevealedBug =
                (phase === 'cleared' || phase === 'timeout') && isBugLine;

              return (
                <Pressable
                  key={`${stageIndex}-${idx}`}
                  disabled={phase !== 'playing'}
                  onPress={() => handleTapLine(idx)}
                  style={({ pressed }) => [
                    styles.codeRow,
                    pressed && phase === 'playing' && styles.codeRowPressed,
                    isWrongLine && styles.codeRowWrong,
                    isStageGreen && styles.codeRowStageGreen,
                    isRevealedBug && styles.codeRowRevealedBug,
                  ]}
                >
                  <Text
                    style={[
                      styles.lineNum,
                      isRevealedBug && styles.lineNumBug,
                      isStageGreen && styles.lineNumGreen,
                    ]}
                  >
                    {displayLineNum}
                  </Text>
                  <View style={styles.codeTextWrap}>
                    <CodeLine
                      code={line}
                      fontSize={13.5}
                      lineHeight={20}
                      syntax={BLITZ_SYNTAX}
                    />
                  </View>
                  {isRevealedBug ? (
                    <Ionicons
                      name="bug"
                      size={14}
                      color={CORAL}
                      style={styles.lineEndIcon}
                    />
                  ) : isStageGreen ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={GREEN}
                      style={styles.lineEndIcon}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Level Cleared Angry Birds Drawer / Timeout Sheet */}
      {(phase === 'cleared' || phase === 'timeout') && (
        <Animated.View
          style={[
            styles.drawerOverlay,
            {
              paddingBottom: Math.max(bottomInset, 18),
              opacity: drawerOpacity,
              transform: [{ translateY: drawerSlideY }],
            },
          ]}
        >
          <View
            style={[
              styles.drawerCard,
              phase === 'timeout' && styles.drawerCardTimeout,
            ]}
          >
            {phase === 'cleared' ? (
              <>
                <Text style={styles.drawerEyebrow}>
                  {level.isBoss ? 'BOSS NODE CLEARED!' : `LEVEL ${pad2(level.levelNumber)} CLEARED!`}
                </Text>

                {/* Sequential 3-Star Pop-in Row */}
                <View style={styles.starsShowcase}>
                  {[
                    { idx: 1, scale: star1Scale, elevate: 0 },
                    { idx: 2, scale: star2Scale, elevate: -7 },
                    { idx: 3, scale: star3Scale, elevate: 0 },
                  ].map((item) => {
                    const earned = item.idx <= earnedStars;
                    return (
                      <Animated.View
                        key={item.idx}
                        style={{
                          transform: [
                            { translateY: item.elevate },
                            { scale: item.scale },
                          ],
                        }}
                      >
                        <Ionicons
                          name="star"
                          size={item.idx === 2 ? 42 : 34}
                          color={earned ? GOLD : STAR_DIM}
                        />
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Elapsed Time + Rewards */}
                <View style={styles.timeRewardRow}>
                  <View style={styles.timeResultBadge}>
                    <Text style={styles.timeResultText}>
                      TIME: <Text style={styles.timeResultVal}>{elapsedSec.toFixed(1)}s</Text>
                    </Text>
                    {clearSummary?.isNewBestTime ? (
                      <View style={styles.bestTag}>
                        <Text style={styles.bestTagText}>BEST</Text>
                      </View>
                    ) : null}
                  </View>

                  {clearSummary ? (
                    <View style={styles.rewardsRow}>
                      <View style={styles.rewardChip}>
                        <Text style={styles.rewardXpText}>
                          +{clearSummary.reward.earnedXp} XP
                        </Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <GemIcon size={13} />
                        <Text style={styles.rewardGemText}>
                          +{clearSummary.reward.earnedGems}
                        </Text>
                      </View>
                      {clearSummary.heartsRecovered > 0 ? (
                        <View style={styles.rewardHeartChip}>
                          <HeartIcon size={12} />
                          <Text style={styles.rewardHeartText}>
                            +{clearSummary.heartsRecovered}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                {/* Bug Explanation */}
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>BUG EXPLAINED:</Text>
                  <RichCodeText
                    text={activeSnippet.explanation}
                    style={styles.explanationBody}
                  />
                </View>

                {/* Recovery Shortcut when entered from Lesson */}
                {isRecoveryMode && onReturnToLesson ? (
                  <Pressable
                    onPress={() => {
                      mediumHaptic();
                      onReturnToLesson();
                    }}
                    style={({ pressed }) => [
                      styles.recoveryBtn,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <Ionicons name="arrow-back-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.recoveryBtnText}>RETURN TO LESSON</Text>
                  </Pressable>
                ) : null}

                {/* Replay + Next Level Buttons */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      tapHaptic();
                      playSound('tap');
                      startOrReplay();
                    }}
                    style={({ pressed }) => [
                      styles.replayBtn,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <Ionicons name="refresh" size={15} color="#FAFAFA" />
                    <Text style={styles.replayBtnText}>Replay</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      mediumHaptic();
                      playSound('run_code');
                      if (hasNextLevel) {
                        onNextLevel();
                      } else {
                        onBackToMap();
                      }
                    }}
                    style={({ pressed }) => [
                      styles.nextBtn,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <Text style={styles.nextBtnText}>
                      {hasNextLevel
                        ? `Next Level ${pad2(level.levelNumber + 1)} →`
                        : 'Campaign Complete · Map'}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              /* Timeout Sheet (0 stars) */
              <>
                <View style={styles.timeoutHeader}>
                  <Ionicons name="time-outline" size={20} color={CORAL} />
                  <Text style={styles.timeoutTitle}>TIME EXPIRED · 0 ★</Text>
                </View>

                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>
                    BUG WAS ON LINE {activeSnippet.bugLine + 1}:
                  </Text>
                  <RichCodeText
                    text={activeSnippet.explanation}
                    style={styles.explanationBody}
                  />
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      tapHaptic();
                      onBackToMap();
                    }}
                    style={({ pressed }) => [
                      styles.replayBtn,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <Ionicons name="map-outline" size={15} color="#FAFAFA" />
                    <Text style={styles.replayBtnText}>Map</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      mediumHaptic();
                      playSound('run_code');
                      startOrReplay();
                    }}
                    style={({ pressed }) => [
                      styles.nextBtn,
                      pressed && styles.pressedFade,
                    ]}
                  >
                    <Text style={styles.nextBtnText}>
                      Retry Level {pad2(level.levelNumber)}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0911',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: '#151422',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  mapBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  centerLevelBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bugStepBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bugStepPip: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#27273A',
  },
  bugStepPipActive: {
    backgroundColor: VIOLET,
  },
  bugStepPipDone: {
    backgroundColor: GREEN,
  },
  bugStepCount: {
    marginLeft: 3,
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  levelHeaderText: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: 'rgba(248, 81, 73, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.35)',
  },
  stageBadgeText: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FCA5A5',
    letterSpacing: 0.3,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: '#171529',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.45)',
  },
  timerPillWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  timerPillUrgent: {
    backgroundColor: 'rgba(248, 81, 73, 0.16)',
    borderColor: 'rgba(248, 81, 73, 0.55)',
  },
  timerText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  timerTextWarn: {
    color: '#FBBF24',
  },
  timerTextUrgent: {
    color: CORAL,
  },
  speedBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  speedTrackOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  speedTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  gateTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  gateLabelsRow: {
    height: 22,
    marginTop: 5,
    position: 'relative',
  },
  gateItemLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gateItemAbs: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gateStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  gateLabel: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D4D4D8',
    letterSpacing: -0.2,
  },
  gateLabelDim: {
    color: '#52525B',
  },
  levelMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  levelTitleText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tapHintText: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#71717A',
    letterSpacing: -0.2,
  },
  penaltyChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(248, 81, 73, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.45)',
  },
  penaltyChipText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: CORAL,
    letterSpacing: -0.2,
  },
  stageClearChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(63, 185, 80, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(63, 185, 80, 0.40)',
  },
  stageClearText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: -0.2,
  },
  codeScroll: {
    flex: 1,
  },
  codeScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  ideCard: {
    borderRadius: 10,
    backgroundColor: '#08080A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
  },
  ideHeader: {
    height: 38,
    paddingHorizontal: 12,
    backgroundColor: '#0E0E12',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ideDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ideDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotRed: {
    backgroundColor: '#52525B',
  },
  dotAmber: {
    backgroundColor: '#3F3F46',
  },
  dotGreen: {
    backgroundColor: '#27272A',
  },
  ideFilename: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#A1A1AA',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  ideTag: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.4,
  },
  ideBody: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  codeRowPressed: {
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
    borderColor: 'rgba(124, 92, 252, 0.35)',
  },
  codeRowWrong: {
    backgroundColor: 'rgba(248, 81, 73, 0.16)',
    borderColor: 'rgba(248, 81, 73, 0.55)',
  },
  codeRowStageGreen: {
    backgroundColor: 'rgba(63, 185, 80, 0.16)',
    borderColor: 'rgba(63, 185, 80, 0.55)',
  },
  codeRowRevealedBug: {
    backgroundColor: 'rgba(248, 81, 73, 0.16)',
    borderColor: CORAL,
  },
  lineNum: {
    width: 24,
    fontFamily: MONO,
    fontSize: 12,
    lineHeight: 20,
    color: '#52525B',
    textAlign: 'right',
    marginRight: 10,
    fontVariant: ['tabular-nums'],
  },
  lineNumBug: {
    color: CORAL,
    fontWeight: '700',
  },
  lineNumGreen: {
    color: GREEN,
    fontWeight: '700',
  },
  codeTextWrap: {
    flex: 1,
  },
  lineEndIcon: {
    marginLeft: 6,
    marginTop: 3,
  },
  drawerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  drawerCard: {
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: '#151421',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 18,
    gap: 12,
  },
  drawerCardTimeout: {
    borderColor: 'rgba(248, 81, 73, 0.50)',
  },
  drawerEyebrow: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  starsShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 6,
    paddingBottom: 2,
  },
  timeRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeResultText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  timeResultVal: {
    color: '#FAFAFA',
    fontWeight: '800',
  },
  bestTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  bestTagText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: GOLD,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#1B192B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  rewardXpText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  rewardGemText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  rewardHeartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.30)',
  },
  rewardHeartText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FDA4AF',
    letterSpacing: -0.2,
  },
  explanationBox: {
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: '#0E0D17',
    borderWidth: 1.5,
    borderColor: '#242236',
    padding: 13,
    gap: 4,
  },
  explanationLabel: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  explanationBody: {
    fontFamily: UI_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: '#D4D4D8',
  },
  recoveryBtn: {
    height: 44,
    borderRadius: 999,
    backgroundColor: '#E11D48',
    borderBottomWidth: 3,
    borderBottomColor: '#9F1239',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recoveryBtnText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replayBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  replayBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  nextBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: VIOLET,
    borderBottomWidth: 4,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  nextBtnText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  timeoutTitle: {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: '800',
    color: CORAL,
    letterSpacing: 0.5,
  },
  pressedFade: {
    opacity: 0.85,
  },
});
