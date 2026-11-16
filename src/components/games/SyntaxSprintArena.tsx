import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LangId } from '@/data/courses';
import {
  SyntaxSprintCard,
  SyntaxSprintLevel,
  computeSyntaxSprintStars,
} from '@/data/syntaxSprintCampaign';
import { SyntaxToken, tokenizeCodeLine } from '@/utils/syntaxLexer';
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
import { GemIcon } from '@/components/ui/CurrencyIcons';
import { useUserStore } from '@/store/useUserStore';

const VIOLET = '#7C5CFC';
const GOLD = '#FBBF24';
const STAR_DIM = '#27273A';
const CORAL = '#EF4444';
const EMERALD = '#10B981';
const SWIPE_THRESHOLD = 95;

export interface SyntaxSprintArenaProps {
  lang: LangId;
  level: SyntaxSprintLevel;
  hasNextLevel: boolean;
  bottomInset?: number;
  onBackToMap: () => void;
  onCompleteLevel: (payload: {
    level: SyntaxSprintLevel;
    stars: 1 | 2 | 3;
    elapsedMs: number;
  }) => {
    reward: RecordBugLevelResult;
  };
  onNextLevel: () => void;
}

interface LaneMotion {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.AnimatedInterpolation<string>;
  validStampOpacity: Animated.AnimatedInterpolation<number>;
  errorStampOpacity: Animated.AnimatedInterpolation<number>;
  secondScale: Animated.AnimatedInterpolation<number>;
  secondTranslateY: Animated.AnimatedInterpolation<number>;
  thirdScale: Animated.AnimatedInterpolation<number>;
  thirdTranslateY: Animated.AnimatedInterpolation<number>;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildLaneMotion(x: Animated.Value, y: Animated.Value): LaneMotion {
  const lift = x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp',
  });

  return {
    x,
    y,
    rotate: x.interpolate({
      inputRange: [-180, 0, 180],
      outputRange: ['-12deg', '0deg', '12deg'],
      extrapolate: 'clamp',
    }),
    validStampOpacity: x.interpolate({
      inputRange: [15, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    errorStampOpacity: x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, -15],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
    secondScale: lift.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    }),
    secondTranslateY: lift.interpolate({
      inputRange: [0, 1],
      outputRange: [11, 0],
    }),
    thirdScale: lift.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 0.95],
    }),
    thirdTranslateY: lift.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 11],
    }),
  };
}

/**
 * Isolated native-driver timer bar.
 * Runs the countdown drain bar purely via UI-thread `translateX` animation
 * so timer progress NEVER triggers parent or card deck React re-renders.
 */
const SprintTimerBar = React.memo(function SprintTimerBar({
  isPlaying,
  runId,
  starThresholds,
  mistakes,
  cardIndex,
  totalCards,
}: {
  isPlaying: boolean;
  runId: number;
  starThresholds: readonly [number, number, number];
  mistakes: number;
  cardIndex: number;
  totalCards: number;
}) {
  const [t3, t2, t1] = starThresholds;
  const maxMs = Math.max(1000, t1 * 1000);
  const [trackWidth, setTrackWidth] = useState(320);
  const [timeTier, setTimeTier] = useState<3 | 2 | 1>(3);
  const drainRatio = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    drainRatio.stopAnimation();
    if (!isPlaying) return;

    drainRatio.setValue(1);
    const tierReset = requestAnimationFrame(() => setTimeTier(3));

    const anim = Animated.timing(drainRatio, {
      toValue: 0,
      duration: maxMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();

    const toTier2 = setTimeout(() => setTimeTier(2), t3 * 1000);
    const toTier1 = setTimeout(() => setTimeTier(1), t2 * 1000);

    return () => {
      cancelAnimationFrame(tierReset);
      anim.stop();
      clearTimeout(toTier2);
      clearTimeout(toTier1);
    };
  }, [drainRatio, isPlaying, maxMs, runId, t2, t3]);

  const drainTranslateX = useMemo(
    () =>
      drainRatio.interpolate({
        inputRange: [0, 1],
        outputRange: [-trackWidth, 0],
      }),
    [drainRatio, trackWidth],
  );

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 10 && Math.abs(w - trackWidth) > 1) {
      setTrackWidth(w);
    }
  }, [trackWidth]);

  const mistakeTier: 3 | 2 | 1 = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  const effectiveTier = Math.min(timeTier, mistakeTier);
  const fillColor =
    effectiveTier === 3 ? VIOLET : effectiveTier === 2 ? '#6366F1' : '#F59E0B';

  const star3MarkerPct = Math.round((1 - t3 / t1) * 100);
  const star2MarkerPct = Math.round((1 - t2 / t1) * 100);

  return (
    <View style={styles.progressSection}>
      <View style={styles.drainTrack} onLayout={handleTrackLayout}>
        <Animated.View
          style={[
            styles.drainFill,
            {
              backgroundColor: fillColor,
              transform: [{ translateX: drainTranslateX }],
            },
          ]}
        />
        <View
          style={[styles.starTick, { left: `${star2MarkerPct}%` }]}
          pointerEvents="none"
        />
        <View
          style={[styles.starTickBright, { left: `${star3MarkerPct}%` }]}
          pointerEvents="none"
        />
      </View>

      <View style={styles.progressMetaRow}>
        <View style={styles.starLegendGroup}>
          <Text style={styles.starLegendText}>★</Text>
          <Text style={[styles.starLegendText, styles.starLegendSpaced]}>★★</Text>
          <Text style={[styles.starLegendText, styles.starLegendSpaced]}>★★★</Text>
        </View>
        <Text style={styles.cardCounterText}>
          Cards: {Math.min(cardIndex + 1, totalCards)}/{totalCards}
        </Text>
      </View>
    </View>
  );
});

/**
 * Pure memoized card surface receiving pre-tokenized lines so syntax
 * highlighting never recomputes during drags or sibling updates.
 */
const SprintCodeCard = React.memo(function SprintCodeCard({
  filename,
  tokenizedLines,
}: {
  filename: string;
  tokenizedLines: readonly (readonly SyntaxToken[])[];
}) {
  return (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.windowDots}>
          <View style={[styles.dot, styles.dotRed]} />
          <View style={[styles.dot, styles.dotAmber]} />
          <View style={[styles.dot, styles.dotGreen]} />
        </View>
        <Text style={styles.cardFilename}>{filename}</Text>
        <View style={styles.cardHintRight}>
          <Ionicons name="swap-horizontal" size={12} color="#64748B" />
          <Text style={styles.cardSwipeHint}>SWIPE OR TAP</Text>
        </View>
      </View>

      <View style={styles.codeBlockWrap}>
        {tokenizedLines.map((tokens, idx) => (
          <View key={idx} style={styles.codeRow}>
            <Text style={styles.lineNumText}>{idx + 1}</Text>
            <Text style={styles.codeLineText}>
              {tokens.map((tok, tIdx) => (
                <Text
                  key={tIdx}
                  style={{
                    color: tok.color,
                    fontWeight: tok.bold ? '700' : '500',
                    fontStyle: tok.italic ? 'italic' : 'normal',
                  }}
                >
                  {tok.text}
                </Text>
              ))}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
});

/**
 * Stable per-card animated deck wrapper keyed strictly by `card.id`.
 * Child subview hierarchy stays invariant from back-slot entry through exit.
 */
const DeckCardItem = React.memo(function DeckCardItem({
  card,
  tokenizedLines,
  offset,
  zIndex,
  ownLane,
  frontLane,
}: {
  card: SyntaxSprintCard;
  tokenizedLines: readonly (readonly SyntaxToken[])[];
  offset: 0 | 1 | 2;
  zIndex: number;
  ownLane: LaneMotion;
  frontLane: LaneMotion;
}) {
  const isTop = offset === 0;

  const transformStyle = useMemo(() => {
    if (offset === 0) {
      return {
        transform: [
          { translateX: ownLane.x },
          { translateY: ownLane.y },
          { rotate: ownLane.rotate },
        ],
      };
    }
    if (offset === 1) {
      return {
        transform: [
          { translateY: frontLane.secondTranslateY },
          { scale: frontLane.secondScale },
        ],
      };
    }
    return {
      transform: [
        { translateY: frontLane.thirdTranslateY },
        { scale: frontLane.thirdScale },
      ],
    };
  }, [frontLane, offset, ownLane]);

  const cardSurfaceStyle =
    offset === 0
      ? styles.activeCardTop
      : offset === 1
        ? styles.stackedCardMid
        : styles.stackedCardBack;

  return (
    <Animated.View
      pointerEvents={isTop ? 'auto' : 'none'}
      style={[
        styles.codeCard,
        cardSurfaceStyle,
        { zIndex },
        transformStyle,
      ]}
    >
      <SprintCodeCard filename={card.filename} tokenizedLines={tokenizedLines} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.stampBadge,
          styles.stampValid,
          { opacity: isTop ? ownLane.validStampOpacity : 0 },
        ]}
      >
        <Text style={styles.stampValidText}>VALID SYNTAX ✓</Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.stampBadge,
          styles.stampError,
          { opacity: isTop ? ownLane.errorStampOpacity : 0 },
        ]}
      >
        <Text style={styles.stampErrorText}>SYNTAX ERROR ✕</Text>
      </Animated.View>
    </Animated.View>
  );
});

export function SyntaxSprintArena({
  lang,
  level,
  hasNextLevel,
  bottomInset = 16,
  onBackToMap,
  onCompleteLevel,
  onNextLevel,
}: SyntaxSprintArenaProps) {
  const { addMistakeToVault } = useUserStore();
  const cards: readonly SyntaxSprintCard[] = level.cards;
  const totalCards = cards.length;

  const [phase, setPhase] = useState<'playing' | 'cleared'>('playing');
  const [runId, setRunId] = useState(1);
  const [cardIndex, setCardIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    correct: boolean;
    text: string;
  } | null>(null);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(3);
  const [finalElapsedMs, setFinalElapsedMs] = useState(0);
  const [clearReward, setClearReward] = useState<RecordBugLevelResult | null>(
    null,
  );

  // Pre-tokenize every card in the level once per level + language
  const tokenizedByCardId = useMemo(() => {
    const map = new Map<string, SyntaxToken[][]>();
    for (const card of cards) {
      map.set(
        card.id,
        card.codeLines.map((line) => tokenizeCodeLine(line, lang)),
      );
    }
    return map;
  }, [cards, lang]);

  // 3-lane circular native-driver Animated.Values (card i uses lanes[i % 3])
  const lane0X = useRef(new Animated.Value(0)).current;
  const lane0Y = useRef(new Animated.Value(0)).current;
  const lane1X = useRef(new Animated.Value(0)).current;
  const lane1Y = useRef(new Animated.Value(0)).current;
  const lane2X = useRef(new Animated.Value(0)).current;
  const lane2Y = useRef(new Animated.Value(0)).current;

  const lanes = useMemo<readonly [LaneMotion, LaneMotion, LaneMotion]>(
    () => [
      buildLaneMotion(lane0X, lane0Y),
      buildLaneMotion(lane1X, lane1Y),
      buildLaneMotion(lane2X, lane2Y),
    ],
    [lane0X, lane0Y, lane1X, lane1Y, lane2X, lane2Y],
  );

  const drawerSlideY = useRef(new Animated.Value(320)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0.2)).current;
  const star2Scale = useRef(new Animated.Value(0.2)).current;
  const star3Scale = useRef(new Animated.Value(0.2)).current;

  // Refs synced in effects/callbacks for gesture access without re-creating PanResponder
  const cardIndexRef = useRef(0);
  const prevCommittedIndexRef = useRef(0);
  const mistakesRef = useRef(0);
  const comboRef = useRef(0);
  const levelStartAtRef = useRef(0);
  const isAnimatingSwipeRef = useRef(false);
  const phaseRef = useRef<'playing' | 'cleared'>('playing');
  const lanesRef = useRef(lanes);

  useEffect(() => {
    lanesRef.current = lanes;
  }, [lanes]);

  const maxMs = level.starThresholds[2] * 1000;

  // After React commits `cardIndex -> prev + 1` (removing the swiped card),
  // reset that outgoing card's lane quietly on the next animation frame.
  useEffect(() => {
    const prevIdx = prevCommittedIndexRef.current;
    prevCommittedIndexRef.current = cardIndex;
    if (cardIndex > prevIdx) {
      const outgoingLane = lanesRef.current[prevIdx % 3];
      const frame = requestAnimationFrame(() => {
        outgoingLane.x.stopAnimation();
        outgoingLane.y.stopAnimation();
        outgoingLane.x.setValue(0);
        outgoingLane.y.setValue(0);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [cardIndex]);

  const resetLevel = useCallback(() => {
    for (const lane of lanesRef.current) {
      lane.x.stopAnimation();
      lane.y.stopAnimation();
      lane.x.setValue(0);
      lane.y.setValue(0);
    }
    drawerSlideY.stopAnimation();
    drawerOpacity.stopAnimation();
    drawerSlideY.setValue(320);
    drawerOpacity.setValue(0);
    star1Scale.setValue(0.2);
    star2Scale.setValue(0.2);
    star3Scale.setValue(0.2);

    cardIndexRef.current = 0;
    prevCommittedIndexRef.current = 0;
    mistakesRef.current = 0;
    comboRef.current = 0;
    levelStartAtRef.current = Date.now();
    isAnimatingSwipeRef.current = false;
    phaseRef.current = 'playing';

    setCardIndex(0);
    setCombo(0);
    setMistakes(0);
    setFinalElapsedMs(0);
    setFeedbackBanner(null);
    setClearReward(null);
    setPhase('playing');
    setRunId((n) => n + 1);
  }, [
    drawerOpacity,
    drawerSlideY,
    star1Scale,
    star2Scale,
    star3Scale,
  ]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      resetLevel();
    });
    return () => cancelAnimationFrame(id);
  }, [lang, level.levelNumber, resetLevel]);

  const finishLevel = useCallback(
    (finalMs: number, finalMistakes: number) => {
      phaseRef.current = 'cleared';
      setPhase('cleared');
      setFinalElapsedMs(finalMs);

      const starsWon = computeSyntaxSprintStars(
        finalMs,
        finalMistakes,
        level.starThresholds,
      );
      setEarnedStars(starsWon);
      const { reward } = onCompleteLevel({
        level,
        stars: starsWon,
        elapsedMs: finalMs,
      });
      setClearReward(reward);
      playTactileSound('level_complete', { skipHaptic: true });

      Animated.parallel([
        Animated.spring(drawerSlideY, {
          toValue: 0,
          damping: 19,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(drawerOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const scales = [star1Scale, star2Scale, star3Scale];
      scales.forEach((anim, idx) => {
        if (idx + 1 <= starsWon) {
          setTimeout(() => {
            if (idx + 1 === starsWon) successHaptic();
            else tapHaptic();
            playSound(idx + 1 === 3 ? 'combo' : 'token_in');
            Animated.spring(anim, {
              toValue: 1,
              damping: 11,
              stiffness: 280,
              useNativeDriver: true,
            }).start();
          }, 180 + idx * 120);
        } else {
          anim.setValue(1);
        }
      });
    },
    [
      drawerOpacity,
      drawerSlideY,
      level,
      onCompleteLevel,
      star1Scale,
      star2Scale,
      star3Scale,
    ],
  );

  const commitCardChoice = useCallback(
    (choseValid: boolean) => {
      if (isAnimatingSwipeRef.current || phaseRef.current !== 'playing') return;
      const curIdx = cardIndexRef.current;
      const currentCard = cards[curIdx];
      if (!currentCard) return;

      isAnimatingSwipeRef.current = true;
      const isCorrect = choseValid === currentCard.isValid;

      if (isCorrect) {
        successHaptic();
        comboRef.current += 1;
        playComboChime(comboRef.current, true);
        setCombo(comboRef.current);
        setFeedbackBanner({
          correct: true,
          text: currentCard.explanation,
        });
      } else {
        errorHaptic();
        playSound('wrong');
        playTactileSound('error', { skipHaptic: true });
        addMistakeToVault({
          language: lang,
          unitTitle: level.title,
          prompt: `Classify \`${currentCard.filename}\` as Valid Syntax or Syntax Error`,
          codeSnippet: currentCard.codeLines.join('\n'),
          correctAnswer: currentCard.isValid ? 'Valid Syntax' : 'Syntax Error',
          explanation: currentCard.explanation,
          source: 'syntax_sprint',
          options: ['Valid Syntax', 'Syntax Error'],
        });
        comboRef.current = 0;
        mistakesRef.current += 1;
        setCombo(0);
        setMistakes(mistakesRef.current);
        setFeedbackBanner({
          correct: false,
          text: currentCard.explanation,
        });
      }

      playTactileSound('card_swipe', { skipHaptic: true });
      const activeLane = lanesRef.current[curIdx % 3];
      const targetX = choseValid ? 420 : -420;
      Animated.parallel([
        Animated.timing(activeLane.x, {
          toValue: targetX,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(activeLane.y, {
          toValue: 18,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished && phaseRef.current !== 'playing') return;
        const nextIdx = curIdx + 1;
        isAnimatingSwipeRef.current = false;

        if (nextIdx >= totalCards) {
          const elapsed = Math.min(maxMs, Math.max(200, Date.now() - levelStartAtRef.current));
          finishLevel(elapsed, mistakesRef.current);
        } else {
          cardIndexRef.current = nextIdx;
          setCardIndex(nextIdx);
        }
      });
    },
    [addMistakeToVault, cards, finishLevel, lang, level.title, maxMs, totalCards],
  );

  const commitChoiceRef = useRef(commitCardChoice);
  useEffect(() => {
    commitChoiceRef.current = commitCardChoice;
  }, [commitCardChoice]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          !isAnimatingSwipeRef.current && phaseRef.current === 'playing',
        onMoveShouldSetPanResponder: (_, g) =>
          !isAnimatingSwipeRef.current &&
          phaseRef.current === 'playing' &&
          (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
        onPanResponderGrant: () => {
          tapHaptic();
          playTactileSound('card_swipe', { skipHaptic: true });
        },
        onPanResponderMove: (_, g) => {
          const activeLane = lanesRef.current[cardIndexRef.current % 3];
          activeLane.x.setValue(g.dx);
          activeLane.y.setValue(g.dy * 0.28);
        },
        onPanResponderRelease: (_, g) => {
          const activeLane = lanesRef.current[cardIndexRef.current % 3];
          if (g.dx >= SWIPE_THRESHOLD || (g.dx > 55 && g.vx > 0.55)) {
            commitChoiceRef.current(true);
          } else if (g.dx <= -SWIPE_THRESHOLD || (g.dx < -55 && g.vx < -0.55)) {
            commitChoiceRef.current(false);
          } else {
            Animated.parallel([
              Animated.spring(activeLane.x, {
                toValue: 0,
                damping: 16,
                stiffness: 290,
                useNativeDriver: true,
              }),
              Animated.spring(activeLane.y, {
                toValue: 0,
                damping: 16,
                stiffness: 290,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
      }),
    [],
  );

  // Pre-mounted visible window (max 3 cards), ordered head-first with descending zIndex
  // so advancing cardIndex removes element 0 in React without moving sibling native views.
  const visibleDeck = useMemo(() => {
    const items: { card: SyntaxSprintCard; idx: number; offset: 0 | 1 | 2 }[] = [];
    for (let offset = 0; offset < 3; offset += 1) {
      const idx = cardIndex + offset;
      const card = cards[idx];
      if (card) {
        items.push({ card, idx, offset: offset as 0 | 1 | 2 });
      }
    }
    return items;
  }, [cardIndex, cards]);

  const frontLane = lanes[cardIndex % 3];

  return (
    <View style={[styles.root, { paddingBottom: Math.max(bottomInset, 14) }]}>
      {/* Top HUD */}
      <View style={styles.topHud}>
        <Pressable
          onPress={() => {
            tapHaptic();
            onBackToMap();
          }}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.pressedFade,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={16} color="#A78BFA" />
          <Text style={styles.backText}>Map</Text>
        </Pressable>

        <Text style={styles.hudTitle} numberOfLines={1}>
          SYNTAX SPRINT • LVL {pad2(level.levelNumber)}/30
        </Text>

        <View style={styles.comboPill}>
          <Ionicons name="flash" size={12} color="#C4B5FD" />
          <Text style={styles.comboPillText}>COMBO x{combo}</Text>
        </View>
      </View>

      {/* Isolated 3-Star Time Drain Bar (zero parent/deck re-renders) */}
      <SprintTimerBar
        isPlaying={phase === 'playing'}
        runId={runId}
        starThresholds={level.starThresholds}
        mistakes={mistakes}
        cardIndex={cardIndex}
        totalCards={totalCards}
      />

      {/* Fixed-height Feedback Slot (prevents vertical deck layout jumps) */}
      <View style={styles.feedbackSlot}>
        {feedbackBanner ? (
          <View
            style={[
              styles.feedbackStrip,
              feedbackBanner.correct
                ? styles.feedbackStripValid
                : styles.feedbackStripError,
            ]}
          >
            <Ionicons
              name={
                feedbackBanner.correct ? 'checkmark-circle' : 'alert-circle'
              }
              size={15}
              color={feedbackBanner.correct ? EMERALD : CORAL}
            />
            <View style={styles.feedbackTextWrap}>
              <RichCodeText
                text={feedbackBanner.text}
                style={styles.feedbackText}
              />
            </View>
          </View>
        ) : (
          <View style={styles.feedbackPlaceholder}>
            <Text style={styles.feedbackPlaceholderText}>
              Inspect syntax fast — swipe right if valid, left if broken
            </Text>
          </View>
        )}
      </View>

      {/* Zero-Flicker 3D Stacked Code Card Deck (single outer PanResponder) */}
      <View {...panResponder.panHandlers} style={styles.deckStage}>
        {phase === 'playing'
          ? visibleDeck.map(({ card, idx, offset }) => (
              <DeckCardItem
                key={card.id}
                card={card}
                tokenizedLines={tokenizedByCardId.get(card.id) ?? []}
                offset={offset}
                zIndex={100 - idx}
                ownLane={lanes[idx % 3]}
                frontLane={frontLane}
              />
            ))
          : null}
      </View>

      {/* Direction Legend Pills */}
      <View style={styles.legendPillsRow}>
        <View style={styles.legendErrorPill}>
          <Text style={styles.legendErrorText}>✕ ERROR (Swipe Left)</Text>
        </View>
        <View style={styles.legendValidPill}>
          <Text style={styles.legendValidText}>✓ VALID (Swipe Right)</Text>
        </View>
      </View>

      {/* Bottom Dual Tactile Buttons */}
      <View style={styles.bottomButtonsRow}>
        <Pressable
          onPress={() => commitCardChoice(false)}
          disabled={phase !== 'playing'}
          style={({ pressed }) => [
            styles.tactileBtnError,
            pressed && styles.pressedScale,
          ]}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
          <Text style={styles.tactileBtnText}>Syntax Error</Text>
        </Pressable>

        <Pressable
          onPress={() => commitCardChoice(true)}
          disabled={phase !== 'playing'}
          style={({ pressed }) => [
            styles.tactileBtnValid,
            pressed && styles.pressedScale,
          ]}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.tactileBtnText}>Valid Code</Text>
        </Pressable>
      </View>

      {/* 3-Star Level Cleared Drawer */}
      {phase === 'cleared' ? (
        <Animated.View
          style={[
            styles.clearDrawer,
            {
              opacity: drawerOpacity,
              transform: [{ translateY: drawerSlideY }],
            },
          ]}
        >
          <Text style={styles.clearTitle}>LEVEL CLEARED!</Text>

          <View style={styles.starsRow}>
            {[star1Scale, star2Scale, star3Scale].map((scaleAnim, idx) => {
              const lit = idx + 1 <= earnedStars;
              return (
                <Animated.View
                  key={idx}
                  style={{ transform: [{ scale: scaleAnim }] }}
                >
                  <Ionicons
                    name="star"
                    size={idx === 1 ? 42 : 34}
                    color={lit ? GOLD : STAR_DIM}
                  />
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.clearMetaText}>
            TIME: {(finalElapsedMs / 1000).toFixed(1)}s · MISTAKES: {mistakes}
          </Text>

          {clearReward ? (
            <View style={styles.rewardRow}>
              <View style={styles.rewardChip}>
                <Ionicons name="flash" size={13} color="#A78BFA" />
                <Text style={styles.rewardChipText}>
                  +{clearReward.earnedXp} XP
                </Text>
              </View>
              <View style={styles.rewardChip}>
                <GemIcon size={13} />
                <Text style={styles.rewardChipText}>
                  +{clearReward.earnedGems} Gems
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.drawerButtonsRow}>
            <Pressable
              onPress={() => {
                mediumHaptic();
                resetLevel();
              }}
              style={({ pressed }) => [
                styles.replayBtn,
                pressed && styles.pressedFade,
              ]}
            >
              <Ionicons name="refresh" size={15} color="#E2E8F0" />
              <Text style={styles.replayBtnText}>Replay</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                mediumHaptic();
                if (hasNextLevel) {
                  onNextLevel();
                } else {
                  onBackToMap();
                }
              }}
              style={({ pressed }) => [
                styles.nextLevelBtn,
                pressed && styles.pressedFade,
              ]}
            >
              <Text style={styles.nextLevelBtnText}>
                {hasNextLevel
                  ? `Next Level ${pad2(level.levelNumber + 1)} →`
                  : 'Back to Map →'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0910',
    paddingHorizontal: 16,
  },
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
  },
  hudTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: 0.3,
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 92, 252, 0.20)',
    borderWidth: 1,
    borderColor: '#7C5CFC',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  comboPillText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  progressSection: {
    marginTop: 12,
  },
  drainTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  drainFill: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  starTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  starTickBright: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  starLegendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starLegendText: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#94A3B8',
  },
  starLegendSpaced: {
    marginLeft: 48,
  },
  cardCounterText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A1A1AA',
    fontVariant: ['tabular-nums'],
  },
  feedbackSlot: {
    height: 46,
    marginTop: 8,
    justifyContent: 'center',
  },
  feedbackStrip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  feedbackStripValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  feedbackStripError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  feedbackTextWrap: {
    flex: 1,
  },
  feedbackText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#F1F5F9',
  },
  feedbackPlaceholder: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  feedbackPlaceholderText: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#71717A',
    letterSpacing: -0.2,
  },
  deckStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  codeCard: {
    position: 'absolute',
    width: '100%',
    minHeight: 235,
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  stackedCardBack: {
    backgroundColor: '#0E0D16',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stackedCardMid: {
    backgroundColor: '#100F18',
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  activeCardTop: {
    backgroundColor: '#12111A',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cardHeader: {
    height: 38,
    backgroundColor: '#171622',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  windowDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  cardFilename: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  cardHintRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardSwipeHint: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  codeBlockWrap: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lineNumText: {
    width: 24,
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: 20,
    color: '#52525B',
    fontVariant: ['tabular-nums'],
  },
  codeLineText: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#F8FAFC',
  },
  stampBadge: {
    position: 'absolute',
    bottom: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 2,
  },
  stampValid: {
    right: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: EMERALD,
    transform: [{ rotate: '-10deg' }],
  },
  stampValidText: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.6,
  },
  stampError: {
    left: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: CORAL,
    transform: [{ rotate: '10deg' }],
  },
  stampErrorText: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '900',
    color: '#F87171',
    letterSpacing: 0.6,
  },
  legendPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  legendErrorPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  legendErrorText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#F87171',
  },
  legendValidPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  legendValidText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#34D399',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  tactileBtnError: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#F87171',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tactileBtnValid: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tactileBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clearDrawer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.42)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 18,
    alignItems: 'center',
    zIndex: 40,
  },
  clearTitle: {
    fontFamily: UI_FONT,
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  clearMetaText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 10,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rewardChipText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  drawerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  nextLevelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: VIOLET,
    borderBottomWidth: 4,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLevelBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pressedFade: {
    opacity: 0.8,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
