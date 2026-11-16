import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Rect,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  GitCampaignLevel,
  GitGraphState,
  GitLaneColor,
  cloneGitGraphState,
  computeGitSimStars,
  executeGitCommandOnState,
  isGitLevelSolved,
  resolveHeadCommitId,
} from '@/data/gitCampaign';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { RecordGitSimLevelResult } from '@/store/GameStore';
import { MONO, UI_FONT } from '@/theme';
import {
  errorHaptic,
  mediumHaptic,
  selectionHaptic,
  successHaptic,
  tapHaptic,
} from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import { GemIcon } from '@/components/ui/CurrencyIcons';

const VIOLET = '#7C5CFC';
const CYAN = '#38BDF8';
const AMBER = '#FBBF24';
const GOLD = '#FBBF24';
const STAR_DIM = '#27273A';
const CORAL = '#EF4444';
const EMERALD = '#10B981';

export interface GitSimulatorArenaProps {
  level: GitCampaignLevel;
  hasNextLevel: boolean;
  bottomInset?: number;
  onBackToMap: () => void;
  onCompleteLevel: (payload: {
    level: GitCampaignLevel;
    stars: 1 | 2 | 3;
    movesUsed: number;
  }) => {
    reward: RecordGitSimLevelResult;
  };
  onNextLevel: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function colorForLane(color: GitLaneColor): {
  stroke: string;
  fill: string;
  halo: string;
} {
  switch (color) {
    case 'cyan':
      return {
        stroke: CYAN,
        fill: '#0E4F6E',
        halo: 'rgba(56, 189, 248, 0.25)',
      };
    case 'amber':
      return {
        stroke: AMBER,
        fill: '#5C3D08',
        halo: 'rgba(251, 191, 36, 0.25)',
      };
    default:
      return {
        stroke: VIOLET,
        fill: '#31236B',
        halo: 'rgba(124, 92, 252, 0.28)',
      };
  }
}

function buildCubicCommitCurve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  if (Math.abs(x1 - x2) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

export function GitSimulatorArena({
  level,
  hasNextLevel,
  bottomInset = 16,
  onBackToMap,
  onCompleteLevel,
  onNextLevel,
}: GitSimulatorArenaProps) {
  const [repoState, setRepoState] = useState<GitGraphState>(() =>
    cloneGitGraphState(level.initialState),
  );
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [movesUsed, setMovesUsed] = useState(0);
  const [statusFeedback, setStatusFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [phase, setPhase] = useState<'playing' | 'cleared'>('playing');
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(3);
  const [clearReward, setClearReward] =
    useState<RecordGitSimLevelResult | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 340, height: 225 });

  // Native animations
  const nodePopScale = useRef(new Animated.Value(1)).current;
  const drawerSlideY = useRef(new Animated.Value(320)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0.2)).current;
  const star2Scale = useRef(new Animated.Value(0.2)).current;
  const star3Scale = useRef(new Animated.Value(0.2)).current;

  const resetLevel = useCallback(() => {
    drawerSlideY.stopAnimation();
    drawerOpacity.stopAnimation();
    drawerSlideY.setValue(320);
    drawerOpacity.setValue(0);
    star1Scale.setValue(0.2);
    star2Scale.setValue(0.2);
    star3Scale.setValue(0.2);

    setRepoState(cloneGitGraphState(level.initialState));
    const firstStep = level.expectedSteps[0];
    setSelectedAction(firstStep?.action ?? level.actionTokens[0] ?? null);
    setSelectedTarget(firstStep?.target ?? null);
    setMovesUsed(0);
    setStatusFeedback(null);
    setClearReward(null);
    setPhase('playing');
  }, [
    drawerOpacity,
    drawerSlideY,
    level,
    star1Scale,
    star2Scale,
    star3Scale,
  ]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      resetLevel();
    });
    return () => cancelAnimationFrame(id);
  }, [level.levelNumber, resetLevel]);

  const celebrateLevelWin = useCallback(
    (finalMoves: number) => {
      const starsWon = computeGitSimStars(finalMoves, level.parMoves);
      setEarnedStars(starsWon);
      setPhase('cleared');
      const { reward } = onCompleteLevel({
        level,
        stars: starsWon,
        movesUsed: finalMoves,
      });
      setClearReward(reward);

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

  const animateCommitPulse = useCallback(() => {
    nodePopScale.stopAnimation();
    nodePopScale.setValue(0.84);
    Animated.spring(nodePopScale, {
      toValue: 1,
      damping: 12,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }, [nodePopScale]);

  const handleExecuteCommand = () => {
    if (phase !== 'playing') return;
    if (!selectedAction) {
      errorHaptic();
      setStatusFeedback({
        ok: false,
        text: 'Tap a Git action token (e.g. `merge`, `commit -m`, `checkout`) first.',
      });
      return;
    }

    const res = executeGitCommandOnState(
      repoState,
      selectedAction,
      selectedTarget,
      level,
    );

    if (!res.ok) {
      errorHaptic();
      playSound('wrong');
      setStatusFeedback({ ok: false, text: res.feedback });
      return;
    }

    const nextMoves = movesUsed + 1;
    setMovesUsed(nextMoves);
    setRepoState(res.nextState);
    setStatusFeedback({ ok: true, text: res.feedback });
    animateCommitPulse();

    if (res.triggeredConflict) {
      mediumHaptic();
      playSound('token_in');
      return;
    }

    if (isGitLevelSolved(res.nextState, level)) {
      successHaptic();
      playSound('correct');
      celebrateLevelWin(nextMoves);
    } else {
      mediumHaptic();
      playSound('run_code');
      // Auto-select next expected step hint if available
      const nextStep = level.expectedSteps[nextMoves];
      if (nextStep) {
        setSelectedAction(nextStep.action);
        setSelectedTarget(nextStep.target ?? null);
      }
    }
  };

  const handleResolveConflict = (choice: 'current' | 'incoming' | 'both') => {
    const conflict = repoState.activeConflict;
    if (!conflict) return;

    if (choice !== conflict.requiredResolution) {
      errorHaptic();
      playSound('wrong');
      setStatusFeedback({
        ok: false,
        text: conflict.explanation,
      });
      return;
    }

    // Correct conflict resolution! Now complete the pending merge/rebase
    successHaptic();
    playSound('correct');
    const unlockedState: GitGraphState = {
      ...cloneGitGraphState(repoState),
      activeConflict: null,
      conflictResolved: true,
    };
    const mergeStep =
      level.expectedSteps.find(
        (s) => s.action === 'merge' || s.action === 'rebase',
      ) ?? level.expectedSteps[0];

    const finalRes = executeGitCommandOnState(
      unlockedState,
      mergeStep?.action ?? 'merge',
      mergeStep?.target ?? null,
      level,
    );
    const nextMoves = movesUsed + 1;
    setMovesUsed(nextMoves);
    setRepoState(finalRes.nextState);
    setStatusFeedback({
      ok: true,
      text: `Resolved conflict in \`${conflict.file}\` and committed merge!`,
    });
    animateCommitPulse();

    if (isGitLevelSolved(finalRes.nextState, level)) {
      celebrateLevelWin(nextMoves);
    }
  };

  const handleTokenPress = (token: string, isAction: boolean) => {
    selectionHaptic();
    playSound('select');
    if (isAction) {
      setSelectedAction((prev) => (prev === token ? null : token));
      if (token === 'commit -m') {
        setSelectedTarget(null);
      }
    } else {
      setSelectedTarget((prev) => (prev === token ? null : token));
    }
  };

  const handleGraphLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 40 && height > 40) {
      setCanvasSize({ width, height });
    }
  };

  // Compute 2D coordinates for all commits & ghost nodes (bottom-up vertical tree)
  const graphLayout = useMemo(() => {
    const { width, height } = canvasSize;
    const laneX: Record<0 | 1 | 2, number> = {
      0: Math.round(width * 0.36),
      1: Math.round(width * 0.67),
      2: Math.round(width * 0.16),
    };

    const allRows = [
      ...repoState.commits.map((c) => c.row),
      ...level.ghostNodes.map((g) => g.row),
    ];
    const maxRow = Math.max(2.5, ...allRows);
    const bottomY = height - 32;
    const topY = 36;
    const spanY = Math.max(80, bottomY - topY);

    const coordFor = (lane: 0 | 1 | 2, row: number) => ({
      x: laneX[lane] ?? laneX[0],
      y: Math.round(bottomY - (row / maxRow) * spanY),
    });

    const commitMap = new Map<
      string,
      { x: number; y: number; commit: (typeof repoState.commits)[number] }
    >();
    for (const c of repoState.commits) {
      commitMap.set(c.id, { ...coordFor(c.lane, c.row), commit: c });
    }

    const ghostList = level.ghostNodes
      .filter((g) => !commitMap.has(g.id))
      .map((g) => ({
        ...coordFor(g.lane, g.row),
        ghost: g,
      }));

    return { commitMap, ghostList };
  }, [canvasSize, level.ghostNodes, repoState]);

  const headCommitId = resolveHeadCommitId(repoState);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(bottomInset, 12) }]}>
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
          GIT SIMULATOR • LVL {pad2(level.levelNumber)}/30
        </Text>

        <View style={styles.movesPill}>
          <Text style={styles.movesPillText}>
            MOVES: {movesUsed}/{level.parMoves} (★★★)
          </Text>
        </View>
      </View>

      {/* Mission Goal Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeaderRow}>
          <Text style={styles.goalLabel}>MISSION GOAL</Text>
          <Pressable
            onPress={() => {
              tapHaptic();
              resetLevel();
            }}
            style={styles.resetMiniPill}
          >
            <Ionicons name="refresh" size={11} color="#A78BFA" />
            <Text style={styles.resetMiniText}>Reset</Text>
          </Pressable>
        </View>
        <RichCodeText text={`Goal: ${level.goalText}`} style={styles.goalBody} />
      </View>

      {/* Live Animated SVG Git Commit Tree Canvas */}
      <Animated.View
        onLayout={handleGraphLayout}
        style={[
          styles.graphCard,
          { transform: [{ scale: nodePopScale }] },
        ]}
      >
        <Svg
          width={canvasSize.width}
          height={canvasSize.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <Pattern
              id="gitCadGrid"
              width={22}
              height={22}
              patternUnits="userSpaceOnUse"
            >
              <Line
                x1={0}
                y1={0}
                x2={22}
                y2={0}
                stroke="rgba(255,255,255,0.035)"
                strokeWidth={1}
              />
              <Line
                x1={0}
                y1={0}
                x2={0}
                y2={22}
                stroke="rgba(255,255,255,0.035)"
                strokeWidth={1}
              />
            </Pattern>
          </Defs>

          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill="#0D0C14"
          />
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill="url(#gitCadGrid)"
          />

          {/* Ghost Target Curves & Dashed Nodes */}
          {graphLayout.ghostList.map(({ x, y, ghost }) => (
            <G key={`ghost-${ghost.id}`}>
              {ghost.parents.map((pId) => {
                const parentCoord = graphLayout.commitMap.get(pId);
                if (!parentCoord) return null;
                const d = buildCubicCommitCurve(
                  parentCoord.x,
                  parentCoord.y,
                  x,
                  y,
                );
                return (
                  <Path
                    key={`gpath-${ghost.id}-${pId}`}
                    d={d}
                    stroke="rgba(167, 139, 250, 0.45)"
                    strokeWidth={2.5}
                    strokeDasharray="4 5"
                    fill="none"
                  />
                );
              })}
              <Circle
                cx={x}
                cy={y}
                r={15}
                fill="rgba(124, 92, 252, 0.10)"
                stroke="rgba(167, 139, 250, 0.65)"
                strokeWidth={1.6}
                strokeDasharray="4 3"
              />
              <Circle
                cx={x}
                cy={y}
                r={7}
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1.2}
              />
            </G>
          ))}

          {/* Commit-to-Parent Smooth Cubic Bezier Curves */}
          {Array.from(graphLayout.commitMap.values()).map(
            ({ x, y, commit }) => {
              const palette = colorForLane(commit.color);
              return (
                <G key={`edges-${commit.id}`}>
                  {commit.parents.map((pId, pIdx) => {
                    const parent = graphLayout.commitMap.get(pId);
                    if (!parent) return null;
                    const d = buildCubicCommitCurve(parent.x, parent.y, x, y);
                    const edgeStroke =
                      pIdx === 1 ? CYAN : palette.stroke;
                    return (
                      <G key={`edge-${commit.id}-${pId}`}>
                        <Path
                          d={d}
                          stroke={palette.halo}
                          strokeWidth={7}
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Path
                          d={d}
                          stroke={edgeStroke}
                          strokeWidth={3}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </G>
                    );
                  })}
                </G>
              );
            },
          )}

          {/* Commit Circles */}
          {Array.from(graphLayout.commitMap.values()).map(
            ({ x, y, commit }) => {
              const isHead = commit.id === headCommitId;
              const palette = colorForLane(commit.color);
              return (
                <G key={`node-${commit.id}`}>
                  {isHead ? (
                    <Circle
                      cx={x}
                      cy={y}
                      r={22}
                      fill={palette.halo}
                      stroke={palette.stroke}
                      strokeWidth={1.4}
                    />
                  ) : null}
                  <Circle
                    cx={x}
                    cy={y}
                    r={16}
                    fill={palette.fill}
                    stroke={palette.stroke}
                    strokeWidth={2.2}
                  />
                </G>
              );
            },
          )}
        </Svg>

        {/* Commit Labels & Floating Branch Pointer Tags */}
        {Array.from(graphLayout.commitMap.values()).map(({ x, y, commit }) => {
          const isHead = commit.id === headCommitId;
          const attachedBranches = Object.entries(repoState.branches)
            .filter(([, cId]) => cId === commit.id)
            .map(([bName]) => bName);

          return (
            <React.Fragment key={`overlay-${commit.id}`}>
              <View
                pointerEvents="none"
                style={[
                  styles.commitLabelBox,
                  { left: x - 18, top: y - 9 },
                ]}
              >
                <Text style={styles.commitLabelText}>{commit.id}</Text>
              </View>

              {/* Branch Pointer Tags */}
              {attachedBranches.map((bName, bIdx) => {
                const isFeature = bName.includes('feature');
                const isHotfix = bName.includes('hotfix');
                const placeRight = commit.lane > 0;
                return (
                  <View
                    key={`tag-${bName}`}
                    pointerEvents="none"
                    style={[
                      styles.branchTag,
                      isFeature
                        ? styles.branchTagCyan
                        : isHotfix
                          ? styles.branchTagAmber
                          : styles.branchTagViolet,
                      placeRight
                        ? { left: x - 34, top: y + 20 + bIdx * 20 }
                        : { left: Math.max(8, x - 74), top: y - 10 + bIdx * 20 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.branchTagText,
                        isFeature && { color: '#082F49' },
                        isHotfix && { color: '#451A03' },
                      ]}
                    >
                      {bName}
                    </Text>
                  </View>
                );
              })}

              {isHead ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.headTag,
                    { left: Math.max(8, x - 76), top: y - 30 },
                  ]}
                >
                  <Text style={styles.headTagText}>HEAD</Text>
                </View>
              ) : null}
            </React.Fragment>
          );
        })}

        {/* Interactive Merge Conflict Resolution Card Overlay */}
        {repoState.activeConflict ? (
          <View style={styles.conflictOverlay}>
            <View style={styles.conflictHeader}>
              <Ionicons name="warning" size={14} color={CORAL} />
              <Text style={styles.conflictTitle}>
                MERGE CONFLICT · {repoState.activeConflict.file}
              </Text>
            </View>

            <View style={styles.conflictDiffBox}>
              <Text style={styles.conflictMarkerHead}>
                {'<<<<<<< HEAD ('}
                {repoState.activeConflict.headBranch}
                {')'}
              </Text>
              <Text style={styles.conflictCodeLine}>
                {repoState.activeConflict.headCode}
              </Text>
              <Text style={styles.conflictDivider}>{'======='}</Text>
              <Text style={styles.conflictCodeLineIncoming}>
                {repoState.activeConflict.incomingCode}
              </Text>
              <Text style={styles.conflictMarkerIncoming}>
                {'>>>>>>> '}
                {repoState.activeConflict.incomingBranch}
              </Text>
            </View>

            <View style={styles.conflictActionsRow}>
              <Pressable
                onPress={() => handleResolveConflict('current')}
                style={styles.conflictChoiceBtn}
              >
                <Text style={styles.conflictChoiceText}>Keep Current</Text>
              </Pressable>
              <Pressable
                onPress={() => handleResolveConflict('incoming')}
                style={[styles.conflictChoiceBtn, styles.conflictChoicePrimary]}
              >
                <Text style={styles.conflictChoicePrimaryText}>
                  Keep Incoming
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleResolveConflict('both')}
                style={styles.conflictChoiceBtn}
              >
                <Text style={styles.conflictChoiceText}>Keep Both</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Animated.View>

      {/* Status Feedback Strip */}
      {statusFeedback ? (
        <View
          style={[
            styles.feedbackStrip,
            statusFeedback.ok ? styles.feedbackOk : styles.feedbackErr,
          ]}
        >
          <Ionicons
            name={statusFeedback.ok ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color={statusFeedback.ok ? EMERALD : CORAL}
          />
          <View style={{ flex: 1 }}>
            <RichCodeText
              text={statusFeedback.text}
              style={styles.feedbackText}
            />
          </View>
        </View>
      ) : null}

      {/* Terminal Command Builder */}
      <View style={styles.terminalCard}>
        <View style={styles.promptLineRow}>
          <Text style={styles.promptPrefix}>{'> git'}</Text>

          <Text style={styles.promptBracket}>[</Text>
          <Pressable
            onPress={() => {
              tapHaptic();
              setSelectedAction(null);
            }}
            style={[
              styles.slotPill,
              selectedAction && styles.slotPillFilled,
            ]}
          >
            <Text
              style={[
                styles.slotPillText,
                selectedAction && styles.slotPillTextFilled,
              ]}
            >
              {selectedAction ?? 'action'}
            </Text>
          </Pressable>
          <Text style={styles.promptBracket}>]</Text>

          {selectedAction !== 'commit -m' ? (
            <>
              <Text style={styles.promptBracket}>[</Text>
              <Pressable
                onPress={() => {
                  tapHaptic();
                  setSelectedTarget(null);
                }}
                style={[
                  styles.slotPill,
                  selectedTarget && styles.slotPillFilled,
                ]}
              >
                <Text
                  style={[
                    styles.slotPillText,
                    selectedTarget && styles.slotPillTextFilled,
                  ]}
                >
                  {selectedTarget ?? 'target'}
                </Text>
              </Pressable>
              <Text style={styles.promptBracket}>]</Text>
            </>
          ) : (
            <Text style={styles.commitMsgPreview}>{'"patch"'}</Text>
          )}
        </View>

        <View style={styles.tapHintBox}>
          <Text style={styles.tapHintText}>
            TAP TOKENS BELOW TO BUILD GIT COMMAND
          </Text>
        </View>
      </View>

      {/* Token Pill Bank */}
      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        style={styles.tokenBankScroll}
        contentContainerStyle={styles.tokenBankWrap}
      >
        {level.actionTokens.map((tok) => {
          const active = selectedAction === tok;
          return (
            <Pressable
              key={`act-${tok}`}
              onPress={() => handleTokenPress(tok, true)}
              style={[styles.tokenPill, active && styles.tokenPillActive]}
            >
              <Text
                style={[
                  styles.tokenPillText,
                  active && styles.tokenPillTextActive,
                ]}
              >
                {tok}
              </Text>
            </Pressable>
          );
        })}

        {level.targetTokens.map((tok) => {
          const active = selectedTarget === tok;
          return (
            <Pressable
              key={`tgt-${tok}`}
              onPress={() => handleTokenPress(tok, false)}
              style={[
                styles.tokenPillTarget,
                active && styles.tokenPillTargetActive,
              ]}
            >
              <Text
                style={[
                  styles.tokenPillText,
                  active && styles.tokenPillTextActive,
                ]}
              >
                {tok}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Execute Git Command CTA */}
      <Pressable
        onPress={handleExecuteCommand}
        disabled={phase !== 'playing'}
        style={({ pressed }) => [
          styles.executeBtn,
          pressed && styles.pressedScale,
        ]}
      >
        <Text style={styles.executeBtnText}>Execute Git Command ▶</Text>
      </Pressable>

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
          <Text style={styles.clearTitle}>GRAPH SYNCHRONIZED!</Text>

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
            MOVES: {movesUsed} (PAR {level.parMoves})
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
  movesPill: {
    backgroundColor: 'rgba(124, 92, 252, 0.20)',
    borderWidth: 1,
    borderColor: '#7C5CFC',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  movesPillText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  goalCard: {
    marginTop: 10,
    backgroundColor: '#12111A',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: VIOLET,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalLabel: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.6,
  },
  resetMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#191826',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  resetMiniText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  goalBody: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#F1F5F9',
  },
  graphCard: {
    flex: 1,
    minHeight: 200,
    marginTop: 10,
    backgroundColor: '#0D0C14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    overflow: 'hidden',
    position: 'relative',
  },
  commitLabelBox: {
    position: 'absolute',
    width: 36,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitLabelText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  branchTag: {
    position: 'absolute',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  branchTagViolet: {
    backgroundColor: '#6D28D9',
    borderColor: '#A78BFA',
  },
  branchTagCyan: {
    backgroundColor: '#38BDF8',
    borderColor: '#BAE6FD',
  },
  branchTagAmber: {
    backgroundColor: '#F59E0B',
    borderColor: '#FDE68A',
  },
  branchTagText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headTag: {
    position: 'absolute',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    backgroundColor: '#4C1D95',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  headTagText: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '900',
    color: '#EDE9FE',
  },
  conflictOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(18, 17, 26, 0.96)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    padding: 10,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  conflictTitle: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  conflictDiffBox: {
    backgroundColor: '#09080E',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  conflictMarkerHead: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#A78BFA',
  },
  conflictCodeLine: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#F8FAFC',
    marginVertical: 2,
  },
  conflictDivider: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#64748B',
  },
  conflictCodeLineIncoming: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#38BDF8',
    marginVertical: 2,
  },
  conflictMarkerIncoming: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#38BDF8',
  },
  conflictActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  conflictChoiceBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: '#1E1D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  conflictChoicePrimary: {
    backgroundColor: VIOLET,
    borderColor: '#A78BFA',
  },
  conflictChoiceText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  conflictChoicePrimaryText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  feedbackStrip: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  feedbackErr: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  feedbackText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#F1F5F9',
  },
  terminalCard: {
    marginTop: 9,
    backgroundColor: '#12111A',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 11,
  },
  promptLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  promptPrefix: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
  },
  promptBracket: {
    fontFamily: MONO,
    fontSize: 14,
    color: '#94A3B8',
  },
  slotPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#1B1A27',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  slotPillFilled: {
    backgroundColor: 'rgba(124, 92, 252, 0.25)',
    borderColor: '#8B5CF6',
  },
  slotPillText: {
    fontFamily: MONO,
    fontSize: 13,
    color: '#64748B',
  },
  slotPillTextFilled: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  commitMsgPreview: {
    fontFamily: MONO,
    fontSize: 12.5,
    color: '#34D399',
  },
  tapHintBox: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: '#0B0A10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tapHintText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  tokenBankScroll: {
    maxHeight: 82,
    marginTop: 9,
  },
  tokenBankWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tokenPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tokenPillActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.28)',
    borderColor: '#8B5CF6',
  },
  tokenPillTarget: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#131B26',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  tokenPillTargetActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderColor: CYAN,
  },
  tokenPillText: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  tokenPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  executeBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    backgroundColor: VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeBtnText: {
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
    fontSize: 21,
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
    transform: [{ scale: 0.985 }],
  },
});
