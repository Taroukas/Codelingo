import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  MazeDir,
  MazeInstructionKind,
  MazeProgramLine,
  RobotMazeLevel,
  computeRobotMazeStars,
  coordKey,
  simulateRobotProgram,
} from '@/data/robotMazeCampaign';
import { RoboMascot, RoboMood } from '@/components/ide/RoboMascot';
import { JellyPopView } from '@/components/ui/JellyPopView';
import { JigglePressable } from '@/components/ui/JigglePressable';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { RecordRobotMazeLevelResult } from '@/store/GameStore';
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
const GOLD = '#FBBF24';
const STAR_DIM = '#27273A';
const CORAL = '#EF4444';

export interface RobotMazeArenaProps {
  level: RobotMazeLevel;
  hasNextLevel: boolean;
  bottomInset?: number;
  onBackToMap: () => void;
  onCompleteLevel: (payload: {
    level: RobotMazeLevel;
    stars: 1 | 2 | 3;
    blocksUsed: number;
  }) => {
    reward: RecordRobotMazeLevelResult;
  };
  onNextLevel: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function dirArrowLabel(dir: MazeDir): string {
  switch (dir) {
    case 'N':
      return '▲';
    case 'E':
      return '▶';
    case 'S':
      return '▼';
    case 'W':
      return '◀';
  }
}

function PcbTileCircuitBackground({ size }: { size: number }) {
  const m = Math.round(size * 0.5);
  return (
    <Svg
      width={size}
      height={size}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Path
        d={`M 6 ${m} L ${m - 6} ${m} L ${m} ${m - 6} L ${m} 6`}
        stroke="rgba(255,255,255,0.035)"
        strokeWidth={1}
        fill="none"
      />
      <Path
        d={`M ${size - 6} ${m + 5} L ${m + 5} ${m + 5} L ${m + 2} ${size - 6}`}
        stroke="rgba(124, 92, 252, 0.06)"
        strokeWidth={1}
        fill="none"
      />
      <Circle cx={m - 6} cy={m} r={1.4} fill="rgba(255,255,255,0.06)" />
    </Svg>
  );
}

function CyanDataDiamond() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Polygon
        points="13,2 23,10 13,24 3,10"
        fill="#0284C7"
        stroke="#7DD3FC"
        strokeWidth={1.3}
      />
      <Polygon points="13,2 19,10 13,24 7,10" fill="#38BDF8" opacity={0.65} />
      <Polygon points="8,6 18,6 21,10 5,10" fill="#BAE6FD" opacity={0.85} />
    </Svg>
  );
}

function ExitPortalVortex() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Circle
        cx={18}
        cy={18}
        r={15}
        fill="rgba(16, 185, 129, 0.14)"
        stroke="#10B981"
        strokeWidth={1.6}
        strokeDasharray="5 3"
      />
      <Circle
        cx={18}
        cy={18}
        r={10}
        fill="rgba(56, 189, 248, 0.18)"
        stroke="#34D399"
        strokeWidth={1.6}
      />
      <Circle cx={18} cy={18} r={4.5} fill="#A7F3D0" />
    </Svg>
  );
}

function LaserBeamGraphic({ size }: { size: number }) {
  const mid = size / 2;
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <G>
        <Line
          x1={4}
          y1={mid}
          x2={size - 4}
          y2={mid}
          stroke="rgba(239, 68, 68, 0.35)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <Line
          x1={4}
          y1={mid}
          x2={size - 4}
          y2={mid}
          stroke="#F87171"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <Circle cx={6} cy={mid} r={2.6} fill="#FCA5A5" />
        <Circle cx={size - 6} cy={mid} r={2.6} fill="#FCA5A5" />
      </G>
    </Svg>
  );
}

export function RobotMazeArena({
  level,
  hasNextLevel,
  bottomInset = 16,
  onBackToMap,
  onCompleteLevel,
  onNextLevel,
}: RobotMazeArenaProps) {
  const [program, setProgram] = useState<MazeProgramLine[]>([]);
  const [currentIndent, setCurrentIndent] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [crashLineIdx, setCrashLineIdx] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [roboDir, setRoboDir] = useState<MazeDir>(level.start.dir);
  const [roboMood, setRoboMood] = useState<RoboMood>('idle');
  const [collectedCores, setCollectedCores] = useState<string[]>([]);
  const [disabledLasers, setDisabledLasers] = useState<string[]>([]);

  const [phase, setPhase] = useState<'playing' | 'cleared'>('playing');
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(3);
  const [clearReward, setClearReward] =
    useState<RecordRobotMazeLevelResult | null>(null);
  const [gridWidth, setGridWidth] = useState(335);

  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lineIdCounterRef = useRef(1);

  // Animated robot tile coordinates (in grid units)
  const animCol = useRef(new Animated.Value(level.start.c)).current;
  const animRow = useRef(new Animated.Value(level.start.r)).current;
  const crashShakeX = useRef(new Animated.Value(0)).current;

  const drawerSlideY = useRef(new Animated.Value(320)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0.2)).current;
  const star2Scale = useRef(new Animated.Value(0.2)).current;
  const star3Scale = useRef(new Animated.Value(0.2)).current;

  const clearTimers = useCallback(() => {
    for (const t of stepTimersRef.current) {
      clearTimeout(t);
    }
    stepTimersRef.current = [];
  }, []);

  const resetRobotPosition = useCallback(() => {
    clearTimers();
    animCol.stopAnimation();
    animRow.stopAnimation();
    crashShakeX.stopAnimation();
    animCol.setValue(level.start.c);
    animRow.setValue(level.start.r);
    crashShakeX.setValue(0);
    setRoboDir(level.start.dir);
    setRoboMood('idle');
    setCollectedCores([]);
    setDisabledLasers([]);
    setActiveLineIdx(null);
    setCrashLineIdx(null);
    setIsRunning(false);
  }, [animCol, animRow, clearTimers, crashShakeX, level.start]);

  const resetFullLevel = useCallback(() => {
    resetRobotPosition();
    drawerSlideY.stopAnimation();
    drawerOpacity.stopAnimation();
    drawerSlideY.setValue(320);
    drawerOpacity.setValue(0);
    star1Scale.setValue(0.2);
    star2Scale.setValue(0.2);
    star3Scale.setValue(0.2);

    setProgram([]);
    setCurrentIndent(0);
    setStatusMessage(null);
    setClearReward(null);
    setPhase('playing');
  }, [
    drawerOpacity,
    drawerSlideY,
    resetRobotPosition,
    star1Scale,
    star2Scale,
    star3Scale,
  ]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      resetFullLevel();
    });
    return () => {
      cancelAnimationFrame(id);
      clearTimers();
    };
  }, [clearTimers, level.levelNumber, resetFullLevel]);

  const GAP = 5;
  const PAD = 6;
  const tileSize = useMemo(() => {
    const usable = gridWidth - PAD * 2 - GAP * (level.cols - 1);
    return Math.max(46, Math.floor(usable / level.cols));
  }, [gridWidth, level.cols]);

  const wallSet = useMemo(
    () => new Set(level.walls.map((w) => coordKey(w.r, w.c))),
    [level.walls],
  );
  const laserSet = useMemo(
    () => new Set(level.lasers.map((l) => coordKey(l.r, l.c))),
    [level.lasers],
  );
  const coreSet = useMemo(
    () => new Set(level.cores.map((d) => coordKey(d.r, d.c))),
    [level.cores],
  );

  const handleAddInstruction = (pill: MazeInstructionKind) => {
    if (isRunning || phase !== 'playing') return;
    selectionHaptic();
    playSound('token_in');
    setCrashLineIdx(null);
    setStatusMessage(null);

    if (pill === 'end_block') {
      setCurrentIndent((prev) => Math.max(0, prev - 1));
      return;
    }

    lineIdCounterRef.current += 1;
    const newLine: MazeProgramLine = {
      id: `line-${lineIdCounterRef.current}`,
      kind: pill,
      indent: currentIndent,
    };
    setProgram((prev) => [...prev, newLine]);

    if (
      pill.startsWith('repeat(') ||
      pill === 'if_laser_ahead():' ||
      pill === 'if_path_clear():'
    ) {
      setCurrentIndent((prev) => Math.min(2, prev + 1));
    }
  };

  const handleRemoveLine = (index: number) => {
    if (isRunning || phase !== 'playing') return;
    tapHaptic();
    playSound('token_out');
    setCrashLineIdx(null);
    setProgram((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        setCurrentIndent(0);
      } else {
        const last = next[next.length - 1];
        const opensBlock =
          last.kind.startsWith('repeat(') || last.kind.startsWith('if_');
        setCurrentIndent(opensBlock ? Math.min(2, last.indent + 1) : last.indent);
      }
      return next;
    });
  };

  const handleFillHint = () => {
    if (isRunning || phase !== 'playing') return;
    mediumHaptic();
    playSound('select');
    setStatusMessage(level.hintText);
    if (program.length < level.solution.length) {
      const nextStep = level.solution[program.length];
      if (nextStep) {
        setProgram((prev) => [
          ...prev,
          {
            id: `hint-${Date.now()}-${prev.length}`,
            kind: nextStep.kind,
            indent: nextStep.indent,
          },
        ]);
        const opensBlock =
          nextStep.kind.startsWith('repeat(') ||
          nextStep.kind.startsWith('if_');
        setCurrentIndent(
          opensBlock ? Math.min(2, nextStep.indent + 1) : nextStep.indent,
        );
      }
    }
  };

  const celebrateWin = useCallback(
    (blocksCount: number, allCores: boolean) => {
      const starsWon = computeRobotMazeStars(
        blocksCount,
        level.maxOptimalBlocks,
        allCores,
      );
      setEarnedStars(starsWon);
      setPhase('cleared');
      setRoboMood('happy');
      const { reward } = onCompleteLevel({
        level,
        stars: starsWon,
        blocksUsed: blocksCount,
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

  const handleRunSequence = () => {
    if (isRunning || phase !== 'playing') return;
    resetRobotPosition();

    if (program.length === 0) {
      errorHaptic();
      setStatusMessage('Tap instruction pills below to build your algorithm first!');
      return;
    }

    mediumHaptic();
    playSound('run_code');
    setIsRunning(true);
    setRoboMood('thinking');
    setStatusMessage(null);

    const sim = simulateRobotProgram(level, program);
    const STEP_MS = 270;

    sim.steps.forEach((frame, idx) => {
      const timer = setTimeout(() => {
        setActiveLineIdx(frame.lineIndex);
        setRoboDir(frame.dir);
        setCollectedCores(frame.collectedCoreKeys);
        setDisabledLasers(frame.disabledLaserKeys);

        Animated.parallel([
          Animated.timing(animCol, {
            toValue: frame.c,
            duration: STEP_MS - 30,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animRow, {
            toValue: frame.r,
            duration: STEP_MS - 30,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();

        if (frame.status === 'collect') {
          successHaptic();
          playSound('token_in');
        } else if (frame.status === 'laser_off') {
          mediumHaptic();
          playSound('select');
        } else if (frame.status === 'step') {
          tapHaptic();
        } else if (frame.status === 'crash') {
          errorHaptic();
          playSound('wrong');
          setRoboMood('worried');
          setCrashLineIdx(frame.lineIndex);
          setStatusMessage(frame.reason ?? 'Execution halted.');
          setIsRunning(false);
          Animated.sequence([
            Animated.timing(crashShakeX, {
              toValue: -7,
              duration: 45,
              useNativeDriver: true,
            }),
            Animated.timing(crashShakeX, {
              toValue: 7,
              duration: 45,
              useNativeDriver: true,
            }),
            Animated.timing(crashShakeX, {
              toValue: -5,
              duration: 45,
              useNativeDriver: true,
            }),
            Animated.timing(crashShakeX, {
              toValue: 0,
              duration: 45,
              useNativeDriver: true,
            }),
          ]).start();
        } else if (frame.status === 'win') {
          successHaptic();
          playSound('correct');
          setIsRunning(false);
          setActiveLineIdx(null);
          celebrateWin(program.length, sim.collectedAllCores);
        }
      }, idx * STEP_MS);

      stepTimersRef.current.push(timer);
    });

    // If program ended without reaching portal or crashing on a wall
    if (!sim.won && sim.steps.every((s) => s.status !== 'crash')) {
      const endTimer = setTimeout(() => {
        errorHaptic();
        playSound('wrong');
        setRoboMood('worried');
        setCrashLineIdx(sim.crashLineIndex);
        setStatusMessage(
          sim.crashReason ??
            'Robo stopped short of the exit portal! Adjust your steps and re-run.',
        );
        setIsRunning(false);
      }, sim.steps.length * STEP_MS + 60);
      stepTimersRef.current.push(endTimer);
    }
  };

  const handleGridLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 120 && Math.abs(w - gridWidth) > 2) {
      setGridWidth(w);
    }
  };

  const robotTranslateX = animCol.interpolate({
    inputRange: [0, Math.max(1, level.cols - 1)],
    outputRange: [
      PAD,
      PAD + Math.max(1, level.cols - 1) * (tileSize + GAP),
    ],
  });

  const robotTranslateY = animRow.interpolate({
    inputRange: [0, Math.max(1, level.rows - 1)],
    outputRange: [
      PAD,
      PAD + Math.max(1, level.rows - 1) * (tileSize + GAP),
    ],
  });

  const renderInstructionSyntax = (kind: Exclude<MazeInstructionKind, 'end_block'>) => {
    if (kind.startsWith('repeat(') || kind.startsWith('if_')) {
      const openIdx = kind.indexOf('(');
      const head = openIdx >= 0 ? kind.slice(0, openIdx) : kind;
      const rest = openIdx >= 0 ? kind.slice(openIdx) : '';
      return (
        <Text style={styles.codeSyntaxBase}>
          <Text style={styles.codeSyntaxKeyword}>{head}</Text>
          <Text style={styles.codeSyntaxNumber}>{rest}</Text>
        </Text>
      );
    }
    return (
      <Text style={styles.codeSyntaxBase}>
        <Text style={styles.codeSyntaxObj}>bot.</Text>
        <Text style={styles.codeSyntaxMethod}>{kind}</Text>
      </Text>
    );
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(bottomInset, 12) }]}>
      {/* Top HUD */}
      <View style={styles.topHud}>
        <JigglePressable
          onPress={() => {
            onBackToMap();
          }}
          style={styles.backBtn}
          haptic="light"
          pressScaleX={1.05}
          pressScaleY={0.91}
          pressTranslateY={2}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={16} color="#A78BFA" />
          <Text style={styles.backText}>Map</Text>
        </JigglePressable>

        <Text style={styles.hudTitle} numberOfLines={1}>
          ROBOT MAZE • LVL {pad2(level.levelNumber)}/30
        </Text>

        <View
          style={[
            styles.stepsPill,
            program.length > level.maxOptimalBlocks && styles.stepsPillWarn,
          ]}
        >
          <Text style={styles.stepsPillText}>
            STEPS: {program.length}/{level.maxOptimalBlocks}
          </Text>
          <Text style={styles.stepsPillSub}>MAX (★★★)</Text>
        </View>
      </View>

      {/* Interactive 2D Cyber-PCB Maze Grid */}
      <View style={styles.mazeBoardCard} onLayout={handleGridLayout}>
        <View
          style={[
            styles.gridInner,
            {
              height:
                PAD * 2 +
                level.rows * tileSize +
                (level.rows - 1) * GAP,
            },
          ]}
        >
          {Array.from({ length: level.rows }).map((_, rIdx) => (
            <View
              key={`row-${rIdx}`}
              style={[
                styles.gridRow,
                { marginBottom: rIdx < level.rows - 1 ? GAP : 0 },
              ]}
            >
              {Array.from({ length: level.cols }).map((__, cIdx) => {
                const key = coordKey(rIdx, cIdx);
                const isStart =
                  level.start.r === rIdx && level.start.c === cIdx;
                const isExit = level.exit.r === rIdx && level.exit.c === cIdx;
                const isWall = wallSet.has(key);
                const isLaser =
                  laserSet.has(key) && !disabledLasers.includes(key);
                const hasCore =
                  coreSet.has(key) && !collectedCores.includes(key);

                return (
                  <View
                    key={key}
                    style={[
                      styles.gridTile,
                      {
                        width: tileSize,
                        height: tileSize,
                        marginRight: cIdx < level.cols - 1 ? GAP : 0,
                      },
                      isStart && styles.gridTileStart,
                      isWall && styles.gridTileWall,
                      isLaser && styles.gridTileLaser,
                      isExit && styles.gridTileExit,
                    ]}
                  >
                    <PcbTileCircuitBackground size={tileSize} />

                    {isWall ? (
                      <View style={styles.wallInnerBlock}>
                        <Ionicons
                          name="hardware-chip-outline"
                          size={18}
                          color="#F87171"
                        />
                      </View>
                    ) : null}

                    {isLaser ? <LaserBeamGraphic size={tileSize} /> : null}

                    {hasCore ? <CyanDataDiamond /> : null}

                    {isExit ? <ExitPortalVortex /> : null}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Animated Sliding Robot Avatar Overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.robotOverlay,
              {
                width: tileSize,
                height: tileSize,
                transform: [
                  { translateX: robotTranslateX },
                  { translateY: robotTranslateY },
                  { translateX: crashShakeX },
                ],
              },
            ]}
          >
            <RoboMascot mood={roboMood} isTyping={isRunning} size={36} />
            <View style={styles.dirBadge}>
              <Text style={styles.dirBadgeText}>{dirArrowLabel(roboDir)}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Optional Crash / Hint Banner */}
      {statusMessage ? (
        <View
          style={[
            styles.statusBanner,
            crashLineIdx !== null
              ? styles.statusBannerErr
              : styles.statusBannerHint,
          ]}
        >
          <Ionicons
            name={crashLineIdx !== null ? 'alert-circle' : 'bulb'}
            size={14}
            color={crashLineIdx !== null ? CORAL : '#A78BFA'}
          />
          <View style={{ flex: 1 }}>
            <RichCodeText text={statusMessage} style={styles.statusBannerText} />
          </View>
        </View>
      ) : null}

      {/* Visual Code Sequence Builder Card */}
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <View style={styles.windowDots}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          </View>

          <Text style={styles.editorFilename}>algorithm.py</Text>

          <View style={styles.editorRightControls}>
            <Text style={styles.maxBlocksHint}>
              max {level.maxOptimalBlocks} blocks for ★★★
            </Text>
            <JigglePressable
              onPress={handleFillHint}
              style={styles.microBtn}
              haptic="light"
              pressScaleX={1.05}
              pressScaleY={0.9}
              pressTranslateY={2}
            >
              <Ionicons name="bulb-outline" size={11} color="#C4B5FD" />
              <Text style={styles.microBtnText}>Hint</Text>
            </JigglePressable>
            <JigglePressable
              onPress={() => {
                resetRobotPosition();
                setProgram([]);
                setCurrentIndent(0);
                setStatusMessage(null);
              }}
              style={styles.microBtn}
              haptic="light"
              pressScaleX={1.05}
              pressScaleY={0.9}
              pressTranslateY={2}
            >
              <Text style={styles.microBtnText}>Clear</Text>
            </JigglePressable>
          </View>
        </View>

        <ScrollView
          style={styles.editorBodyScroll}
          contentContainerStyle={styles.editorBodyContent}
          showsVerticalScrollIndicator={false}
        >
          {program.length === 0 ? (
            <Text style={styles.emptyProgramPlaceholder}>
              # Tap instruction pills below to queue Robo commands...
            </Text>
          ) : (
            program.map((line, idx) => {
              const isExecuting = activeLineIdx === idx;
              const isCrashed = crashLineIdx === idx;
              return (
                <JellyPopView key={line.id}>
                  <JigglePressable
                    onPress={() => handleRemoveLine(idx)}
                    haptic="light"
                    pressScaleX={1.03}
                    pressScaleY={0.92}
                    pressTranslateY={2}
                    style={[
                      styles.programLineRow,
                      isExecuting && styles.programLineExecuting,
                      isCrashed && styles.programLineCrashed,
                    ]}
                  >
                    <Text style={styles.programLineNum}>{idx + 1}</Text>
                    <View
                      style={[
                        styles.programCodeIndent,
                        { paddingLeft: line.indent * 18 },
                      ]}
                    >
                      {renderInstructionSyntax(line.kind)}
                    </View>
                    <Ionicons name="close-circle" size={14} color="#52525B" />
                  </JigglePressable>
                </JellyPopView>
              );
            })
          )}

          {/* Active Indent Cursor Slot */}
          <View style={styles.cursorPromptSlot}>
            <Text style={styles.cursorPromptText}>
              {currentIndent > 0
                ? `${'  '.repeat(currentIndent)}↳ inside block (indent ${currentIndent})`
                : '↳ top-level statement'}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Instruction Pill Bank */}
      <View style={styles.pillBankWrap}>
        {level.availablePills.map((pill) => {
          const isLoopOrIf =
            pill.startsWith('repeat(') || pill.startsWith('if_');
          const isEndBlock = pill === 'end_block';
          return (
            <JigglePressable
              key={pill}
              onPress={() => handleAddInstruction(pill)}
              haptic="selection"
              pressScaleX={1.05}
              pressScaleY={0.9}
              pressTranslateY={3}
              style={[
                styles.instructionPill,
                isLoopOrIf && styles.instructionPillLoop,
                isEndBlock && styles.instructionPillEnd,
              ]}
            >
              <Text
                style={[
                  styles.instructionPillText,
                  isLoopOrIf && { color: '#F472B6' },
                  isEndBlock && { color: '#A78BFA' },
                ]}
              >
                {isEndBlock ? 'End Block ↵' : pill}
              </Text>
            </JigglePressable>
          );
        })}
      </View>

      {/* ▶ Run Sequence Button */}
      <JigglePressable
        onPress={handleRunSequence}
        disabled={isRunning || phase !== 'playing'}
        haptic="medium"
        pressScaleX={1.04}
        pressScaleY={0.92}
        pressTranslateY={3}
        style={[
          styles.runBtn,
          isRunning && styles.runBtnDisabled,
        ]}
      >
        <Ionicons
          name={isRunning ? 'sync' : 'play'}
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.runBtnText}>
          {isRunning ? 'Executing Sequence...' : 'Run Sequence'}
        </Text>
      </JigglePressable>

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
          <Text style={styles.clearTitle}>PORTAL REACHED!</Text>

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
            BLOCKS USED: {program.length}/{level.maxOptimalBlocks}
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
            <JigglePressable
              onPress={() => {
                resetFullLevel();
              }}
              haptic="medium"
              pressScaleX={1.04}
              pressScaleY={0.92}
              pressTranslateY={3}
              style={styles.replayBtn}
            >
              <Ionicons name="refresh" size={15} color="#E2E8F0" />
              <Text style={styles.replayBtnText}>Replay</Text>
            </JigglePressable>

            <JigglePressable
              onPress={() => {
                if (hasNextLevel) {
                  onNextLevel();
                } else {
                  onBackToMap();
                }
              }}
              haptic="medium"
              pressScaleX={1.04}
              pressScaleY={0.92}
              pressTranslateY={3}
              style={styles.nextLevelBtn}
            >
              <Text style={styles.nextLevelBtnText}>
                {hasNextLevel
                  ? `Next Level ${pad2(level.levelNumber + 1)} →`
                  : 'Back to Map →'}
              </Text>
            </JigglePressable>
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
  stepsPill: {
    backgroundColor: 'rgba(124, 92, 252, 0.22)',
    borderWidth: 1,
    borderColor: '#7C5CFC',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignItems: 'center',
  },
  stepsPillWarn: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  stepsPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  stepsPillSub: {
    fontFamily: MONO,
    fontSize: 8.5,
    fontWeight: '700',
    color: '#DDD6FE',
    fontVariant: ['tabular-nums'],
  },
  mazeBoardCard: {
    marginTop: 10,
    backgroundColor: '#0E0D16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.28)',
    overflow: 'hidden',
  },
  gridInner: {
    padding: 6,
    position: 'relative',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridTile: {
    backgroundColor: '#13121C',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridTileStart: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
  },
  gridTileWall: {
    backgroundColor: '#1B1424',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  gridTileLaser: {
    borderColor: 'rgba(239, 68, 68, 0.65)',
  },
  gridTileExit: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  wallInnerBlock: {
    width: '72%',
    height: '72%',
    borderRadius: 6,
    backgroundColor: '#271729',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  dirBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: VIOLET,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirBadgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  statusBanner: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBannerErr: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusBannerHint: {
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  statusBannerText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#F1F5F9',
  },
  editorCard: {
    flex: 1,
    minHeight: 115,
    marginTop: 9,
    backgroundColor: '#12111A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    overflow: 'hidden',
  },
  editorHeader: {
    height: 34,
    backgroundColor: '#171622',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
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
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
  },
  editorFilename: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  editorRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maxBlocksHint: {
    fontFamily: MONO,
    fontSize: 9.5,
    color: '#94A3B8',
  },
  microBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: '#222032',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  microBtnText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  editorBodyScroll: {
    flex: 1,
  },
  editorBodyContent: {
    padding: 10,
    gap: 4,
  },
  emptyProgramPlaceholder: {
    fontFamily: MONO,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  programLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: '#171623',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  programLineExecuting: {
    backgroundColor: 'rgba(124, 92, 252, 0.24)',
    borderColor: '#8B5CF6',
  },
  programLineCrashed: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderColor: CORAL,
  },
  programLineNum: {
    width: 20,
    fontFamily: MONO,
    fontSize: 12,
    color: '#64748B',
  },
  programCodeIndent: {
    flex: 1,
  },
  codeSyntaxBase: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
  },
  codeSyntaxKeyword: {
    color: '#F472B6',
    fontWeight: '700',
  },
  codeSyntaxNumber: {
    color: '#FBBF24',
  },
  codeSyntaxObj: {
    color: '#E2E8F0',
  },
  codeSyntaxMethod: {
    color: '#34D399',
  },
  cursorPromptSlot: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#0C0B12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cursorPromptText: {
    fontFamily: MONO,
    fontSize: 10.5,
    color: '#64748B',
  },
  pillBankWrap: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  instructionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    borderRadius: 8,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  instructionPillLoop: {
    backgroundColor: '#1E1528',
    borderColor: 'rgba(244, 114, 182, 0.35)',
  },
  instructionPillEnd: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  instructionPillText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  runBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    backgroundColor: VIOLET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  runBtnDisabled: {
    opacity: 0.65,
  },
  runBtnText: {
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
});
