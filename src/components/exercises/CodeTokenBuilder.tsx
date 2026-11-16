import React, { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LangId, TokenBuilderExercise } from '@/data/courses';
import { MONO, UI_FONT } from '@/theme';
import { CodeLine, SyntaxPalette } from '@/components/CodeLine';
import { SpringPressable } from '@/components/CyberButton';
import { JigglePressable } from '@/components/ui/JigglePressable';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { playSound, playTokenPlaceSound } from '@/utils/sounds';
import { SyntaxTokenKind, tokenizeCodeLine } from '@/utils/syntaxLexer';
import { ExerciseSelectionState } from './CodeBlocks';

const EDITOR_SYNTAX: SyntaxPalette = {
  keyword: '#C084FC',
  string: '#34D399',
  number: '#FBBF24',
  operator: '#94A3B8',
  comment: '#64748B',
  plain: '#F8FAFC',
};

function inferLangFromFileName(fileName: string): LangId {
  const lower = fileName.toLowerCase();
  const ext = lower.includes('.') ? lower.split('.').pop() ?? '' : lower;
  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
      return 'cpp';
    case 'c':
    case 'h':
      return 'c';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'js';
    case 'ts':
    case 'tsx':
      return 'ts';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'cs':
      return 'csharp';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'php':
      return 'php';
    case 'lua':
      return 'lua';
    case 'sql':
      return 'sql';
    case 'jl':
      return 'julia';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'asm':
    case 's':
      return 'asm';
    default:
      return 'python';
  }
}

function tokenColorForKind(kind: SyntaxTokenKind): string {
  switch (kind) {
    case 'keyword':
      return '#C084FC';
    case 'string':
      return '#34D399';
    case 'builtin':
    case 'function':
      return '#38BDF8';
    case 'number':
      return '#FBBF24';
    case 'operator':
      return '#94A3B8';
    case 'comment':
      return '#64748B';
    default:
      return '#F8FAFC';
  }
}

function renderSyntaxColoredToken(
  label: string,
  lang: LangId,
  hide = false,
): React.ReactNode {
  const tokens = tokenizeCodeLine(label, lang);
  return (
    <Text style={[styles.bankChipText, hide && styles.bankChipTextUsed]}>
      {tokens.map((tok, idx) => (
        <Text
          key={idx}
          style={{
            color: hide ? 'transparent' : tokenColorForKind(tok.kind),
            fontWeight: tok.bold ? '700' : '600',
          }}
        >
          {tok.text}
        </Text>
      ))}
    </Text>
  );
}

interface BankToken {
  uid: string;
  label: string;
}

function deterministicShuffle<T>(arr: T[], seedStr: string): T[] {
  const copy = [...arr];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

interface ParsedSegment {
  kind: 'text' | 'slot';
  text?: string;
  slotIndex?: number;
}

function parseCodeLine(line: string): ParsedSegment[] {
  const parts = line.split(/(\{\{\d+\}\})/g);
  const out: ParsedSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    const match = /^\{\{(\d+)\}\}$/.exec(part);
    if (match) {
      out.push({ kind: 'slot', slotIndex: Number(match[1]) });
    } else {
      out.push({ kind: 'text', text: part });
    }
  }
  return out;
}

interface Props {
  exercise: TokenBuilderExercise;
  fileName: string;
  language?: LangId;
  locked: boolean;
  noHints?: boolean;
  retryTrigger?: number;
  onSelectionChange: (state: ExerciseSelectionState) => void;
}

interface FlyingChip {
  id: number;
  label: string;
  width: number;
  height: number;
  translate: Animated.ValueXY;
  opacity: Animated.Value;
  scale: Animated.Value;
}

type ViewNode = ComponentRef<typeof View>;

interface AnimatedSlotProps {
  slotIdx: number;
  label: string;
  lang: LangId;
  isFilled: boolean;
  isFocused: boolean;
  isRight: boolean;
  isWrong: boolean;
  hideLabel: boolean;
  locked: boolean;
  pulseSeq: number;
  onRegisterRef: (slotIdx: number, node: ViewNode | null) => void;
  onPress: (slotIdx: number) => void;
}

function AnimatedSlotPill({
  slotIdx,
  label,
  lang,
  isFilled,
  isFocused,
  isRight,
  isWrong,
  hideLabel,
  locked,
  pulseSeq,
  onRegisterRef,
  onPress,
}: AnimatedSlotProps) {
  const popScaleX = useRef(new Animated.Value(1)).current;
  const popScaleY = useRef(new Animated.Value(1)).current;
  const popRotate = useRef(new Animated.Value(0)).current;
  const focusPulse = useRef(new Animated.Value(0)).current;
  const wasFilledRef = useRef(isFilled);
  const prevPulseSeqRef = useRef(pulseSeq);

  useEffect(() => {
    const justFilled = !wasFilledRef.current && isFilled;
    const pulsed = pulseSeq > 0 && prevPulseSeqRef.current !== pulseSeq;
    wasFilledRef.current = isFilled;
    prevPulseSeqRef.current = pulseSeq;

    if (!justFilled && !pulsed) return;

    popScaleX.stopAnimation();
    popScaleY.stopAnimation();
    popRotate.stopAnimation();

    popScaleX.setValue(0.7);
    popScaleY.setValue(1.25);
    popRotate.setValue(-1);

    const jellySpring = {
      damping: 10,
      stiffness: 420,
      mass: 0.55,
      useNativeDriver: true,
    } as const;

    Animated.parallel([
      Animated.spring(popScaleX, {
        toValue: 1,
        ...jellySpring,
      }),
      Animated.spring(popScaleY, {
        toValue: 1,
        ...jellySpring,
      }),
      Animated.spring(popRotate, {
        toValue: 0,
        ...jellySpring,
      }),
    ]).start();
  }, [isFilled, pulseSeq, popScaleX, popScaleY, popRotate]);

  useEffect(() => {
    if (!isFocused || isFilled || locked) {
      focusPulse.stopAnimation();
      focusPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(focusPulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(focusPulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [focusPulse, isFilled, isFocused, locked]);

  const pulseScale = focusPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const pulseOpacity = focusPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const popRotateDeg = popRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  const shouldPulse = isFocused && !isFilled && !locked;

  return (
    <Animated.View
      style={{
        opacity: shouldPulse ? pulseOpacity : 1,
        transform: [
          { scaleX: shouldPulse ? pulseScale : popScaleX },
          { scaleY: shouldPulse ? pulseScale : popScaleY },
          { rotate: popRotateDeg },
        ],
      }}
    >
      <View
        ref={(node) => onRegisterRef(slotIdx, node)}
        collapsable={false}
      >
        <JigglePressable
          disabled={locked}
          onPress={() => onPress(slotIdx)}
          haptic="light"
          pressScaleX={1.06}
          pressScaleY={0.9}
          pressTranslateY={2}
          accessibilityRole="button"
          accessibilityLabel={
            isFilled ? `Slot ${slotIdx + 1}: ${label}` : `Empty slot ${slotIdx + 1}`
          }
          style={[
            styles.slotPill,
            isFilled && !hideLabel && styles.slotPillFilled,
            (isFocused || hideLabel) && !isRight && !isWrong && styles.slotPillActive,
            isRight && styles.slotPillCorrect,
            isWrong && styles.slotPillWrong,
          ]}
        >
          {isFilled ? (
            renderSyntaxColoredToken(label, lang, hideLabel)
          ) : (
            <Text
              style={[
                styles.slotText,
                styles.slotPlaceholderText,
                isFocused && styles.slotPlaceholderActiveText,
                hideLabel && { opacity: 0 },
              ]}
            >
              {' ___ '}
            </Text>
          )}
        </JigglePressable>
      </View>
    </Animated.View>
  );
}

export function CodeTokenBuilder({
  exercise,
  fileName,
  language,
  locked,
  noHints = false,
  retryTrigger = 0,
  onSelectionChange,
}: Props) {
  const resolvedLang = useMemo(
    () => language ?? inferLangFromFileName(fileName),
    [language, fileName],
  );
  const slotCount = exercise.expectedTokens.length;

  const bank: BankToken[] = useMemo(() => {
    const raw = [...exercise.expectedTokens, ...exercise.distractors].map(
      (label, idx) => ({
        uid: `${exercise.id}-tok-${idx}`,
        label,
      }),
    );
    return deterministicShuffle(raw, exercise.id);
  }, [exercise]);

  const [slots, setSlots] = useState<(BankToken | null)[]>(() =>
    Array.from({ length: slotCount }, () => null),
  );
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [trackedId, setTrackedId] = useState<string>(exercise.id);
  const [handledRetry, setHandledRetry] = useState<number>(retryTrigger);
  const [inFlightSlots, setInFlightSlots] = useState<Record<number, number>>({});
  const [slotPulseSeq, setSlotPulseSeq] = useState<Record<number, number>>({});
  const [flyingChips, setFlyingChips] = useState<FlyingChip[]>([]);

  const containerRef = useRef<ViewNode | null>(null);
  const bankRefs = useRef<Record<string, ViewNode | null>>({});
  const slotRefs = useRef<Record<number, ViewNode | null>>({});
  const flightCounterRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset internal slot state cleanly whenever step changes (derived during render)
  if (trackedId !== exercise.id) {
    setTrackedId(exercise.id);
    setHandledRetry(retryTrigger);
    setSlots(Array.from({ length: slotCount }, () => null));
    setActiveSlot(0);
    setInFlightSlots({});
    setSlotPulseSeq({});
    setFlyingChips([]);
  } else if (handledRetry !== retryTrigger) {
    // When "Try Again" is tapped after a mistake, clear incorrect tokens back to the bank
    setHandledRetry(retryTrigger);
    const nextSlots = slots.map((tok, idx) =>
      tok && tok.label === exercise.expectedTokens[idx] ? tok : null,
    );
    const firstEmpty = nextSlots.findIndex((item) => item === null);
    setSlots(nextSlots);
    setActiveSlot(firstEmpty >= 0 ? firstEmpty : 0);
    setInFlightSlots({});
    setFlyingChips([]);
  }

  const usedUids = useMemo(() => {
    const set = new Set<string>();
    for (const tok of slots) {
      if (tok) set.add(tok.uid);
    }
    return set;
  }, [slots]);

  useEffect(() => {
    const allFilled = slots.length === slotCount && slots.every((s) => s !== null);
    const isCorrect =
      allFilled &&
      slots.every((s, idx) => s !== null && s.label === exercise.expectedTokens[idx]);

    const reconstructed = exercise.codeLines
      .map((line) =>
        line.replace(/\{\{(\d+)\}\}/g, (_, i) => {
          const idx = Number(i);
          return exercise.expectedTokens[idx] ?? '';
        }),
      )
      .join('\n');

    onSelectionChange({
      canCheck: allFilled,
      isCorrect,
      correctAnswerText: reconstructed,
    });
  }, [slots, slotCount, exercise, onSelectionChange]);

  const registerSlotRef = useCallback((slotIdx: number, node: ViewNode | null) => {
    slotRefs.current[slotIdx] = node;
  }, []);

  const triggerSlotPulse = useCallback((slotIdx: number) => {
    setSlotPulseSeq((prev) => ({
      ...prev,
      [slotIdx]: (prev[slotIdx] ?? 0) + 1,
    }));
  }, []);

  const launchFlightAnimation = useCallback(
    (token: BankToken, targetIdx: number) => {
      const containerNode = containerRef.current;
      const fromNode = bankRefs.current[token.uid];
      const toNode = slotRefs.current[targetIdx];

      if (!containerNode || !fromNode || !toNode) {
        triggerSlotPulse(targetIdx);
        return;
      }

      const fid = ++flightCounterRef.current;
      containerNode.measureInWindow((cx, cy) => {
        fromNode.measureInWindow((fx, fy, fw, fh) => {
          if (!mountedRef.current || fw === 0 || fh === 0) {
            triggerSlotPulse(targetIdx);
            return;
          }

          setInFlightSlots((prev) => ({ ...prev, [targetIdx]: fid }));

          requestAnimationFrame(() => {
            if (!mountedRef.current) return;
            const latestTo = slotRefs.current[targetIdx];
            if (!latestTo) {
              setInFlightSlots((prev) => {
                const copy = { ...prev };
                if (copy[targetIdx] === fid) delete copy[targetIdx];
                return copy;
              });
              triggerSlotPulse(targetIdx);
              return;
            }

            latestTo.measureInWindow((tx, ty, tw, th) => {
              if (!mountedRef.current || tw === 0 || th === 0) {
                setInFlightSlots((prev) => {
                  const copy = { ...prev };
                  if (copy[targetIdx] === fid) delete copy[targetIdx];
                  return copy;
                });
                triggerSlotPulse(targetIdx);
                return;
              }

              const startX = fx - cx;
              const startY = fy - cy;
              const endX = tx - cx + (tw - fw) / 2;
              const endY = ty - cy + (th - fh) / 2;

              const translate = new Animated.ValueXY({ x: startX, y: startY });
              const opacity = new Animated.Value(1);
              const scale = new Animated.Value(1);

              const chip: FlyingChip = {
                id: fid,
                label: token.label,
                width: fw,
                height: fh,
                translate,
                opacity,
                scale,
              };

              setFlyingChips((prev) => [...prev, chip]);

              Animated.parallel([
                Animated.timing(translate, {
                  toValue: { x: endX, y: endY },
                  duration: 145,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.timing(scale, {
                  toValue: 1,
                  duration: 145,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
              ]).start(() => {
                if (!mountedRef.current) return;
                setInFlightSlots((prev) => {
                  if (prev[targetIdx] !== fid) return prev;
                  const copy = { ...prev };
                  delete copy[targetIdx];
                  return copy;
                });
                setFlyingChips((prev) => prev.filter((item) => item.id !== fid));
                triggerSlotPulse(targetIdx);
              });
            });
          });
        });
      });
    },
    [triggerSlotPulse],
  );

  const handleBankTap = (token: BankToken) => {
    if (locked || usedUids.has(token.uid)) return;

    const targetIdx =
      slots[activeSlot] === null
        ? activeSlot
        : slots.findIndex((item) => item === null);

    if (targetIdx === -1) return;

    Haptics.selectionAsync().catch(() => undefined);
    playSound('token_snap');
    playTokenPlaceSound(targetIdx);

    const next = [...slots];
    next[targetIdx] = token;
    setSlots(next);

    const nextEmpty = next.findIndex((item) => item === null);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    }

    launchFlightAnimation(token, targetIdx);
  };

  const handleSlotTap = (slotIdx: number) => {
    if (locked) return;
    Haptics.selectionAsync().catch(() => undefined);

    if (slots[slotIdx] !== null) {
      playSound('token_out');
      setSlots((prev) => {
        const next = [...prev];
        next[slotIdx] = null;
        return next;
      });
      setInFlightSlots((prev) => {
        if (!(slotIdx in prev)) return prev;
        const copy = { ...prev };
        delete copy[slotIdx];
        return copy;
      });
    } else {
      playSound('select');
    }
    setActiveSlot(slotIdx);
  };

  return (
    <View ref={containerRef} style={styles.container}>
      {/* Matte Carbon Prompt Card (Uniform 1px border, zero accent strip) */}
      <View style={styles.promptCard}>
        <View style={styles.promptTopRow}>
          <Text style={styles.kicker}>COMPLETE THE CODE</Text>
          {noHints ? (
            <View style={styles.noHintBadge}>
              <Text style={styles.noHintText}>NO HINTS</Text>
            </View>
          ) : null}
        </View>
        <RichCodeText text={exercise.prompt} style={styles.promptText} />
      </View>

      {/* Matte Carbon Interactive IDE Code Card */}
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.codeBody}>
          {exercise.codeLines.map((line, lineIdx) => {
            const segments = parseCodeLine(line);
            const hasLeadingSpaces = /^(\s+)/.exec(line)?.[1] ?? '';
            const trimmedSegments =
              hasLeadingSpaces.length > 0 &&
              segments[0]?.kind === 'text' &&
              segments[0].text
                ? [
                    {
                      kind: 'text' as const,
                      text: segments[0].text.slice(hasLeadingSpaces.length),
                    },
                    ...segments.slice(1),
                  ]
                : segments;

            return (
              <View key={lineIdx} style={styles.codeRow}>
                <Text style={styles.lineNo}>{lineIdx + 1}</Text>
                <View style={styles.inlineFlow}>
                  {hasLeadingSpaces.length > 0 ? (
                    <Text style={styles.indentSpaces}>{hasLeadingSpaces}</Text>
                  ) : null}

                  {trimmedSegments.map((seg, segIdx) => {
                    if (seg.kind === 'text') {
                      if (!seg.text) return null;
                      return (
                        <CodeLine
                          key={segIdx}
                          code={seg.text}
                          fontSize={14}
                          lineHeight={26}
                          syntax={EDITOR_SYNTAX}
                        />
                      );
                    }

                    const slotIdx = seg.slotIndex ?? 0;
                    const placed = slots[slotIdx] ?? null;
                    const isFocused = !locked && placed === null && activeSlot === slotIdx;
                    const isRight =
                      locked && placed?.label === exercise.expectedTokens[slotIdx];
                    const isWrong = locked && !isRight;

                    return (
                      <AnimatedSlotPill
                        key={`slot-${slotIdx}-${segIdx}`}
                        slotIdx={slotIdx}
                        label={placed ? placed.label : ''}
                        lang={resolvedLang}
                        isFilled={placed !== null}
                        isFocused={isFocused}
                        isRight={isRight}
                        isWrong={isWrong}
                        hideLabel={Boolean(inFlightSlots[slotIdx])}
                        locked={locked}
                        pulseSeq={slotPulseSeq[slotIdx] ?? 0}
                        onRegisterRef={registerSlotRef}
                        onPress={handleSlotTap}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Unboxed Airy Floating Tactile Token Pills */}
      <View style={styles.bankWrap}>
        {bank.map((tok) => {
          const isUsed = usedUids.has(tok.uid);
          return (
            <View
              key={tok.uid}
              ref={(node) => {
                bankRefs.current[tok.uid] = node;
              }}
              collapsable={false}
            >
              <SpringPressable
                disabled={locked || isUsed}
                haptic="none"
                sound="none"
                pressScale={0.94}
                onPress={() => handleBankTap(tok)}
                accessibilityRole="button"
                accessibilityState={{ disabled: locked || isUsed }}
                style={[styles.bankChip, isUsed && styles.bankChipUsed]}
              >
                {renderSyntaxColoredToken(tok.label, resolvedLang, isUsed)}
              </SpringPressable>
            </View>
          );
        })}
      </View>

      {/* Upward Flying Clone Overlay */}
      {flyingChips.map((chip) => (
        <Animated.View
          key={chip.id}
          pointerEvents="none"
          style={[
            styles.flyingChipOverlay,
            {
              width: chip.width,
              height: chip.height,
              opacity: chip.opacity,
              transform: [
                { translateX: chip.translate.x },
                { translateY: chip.translate.y },
                { scale: chip.scale },
              ],
            },
          ]}
        >
          {renderSyntaxColoredToken(chip.label, resolvedLang)}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: 14,
  },
  promptCard: {
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 18,
    gap: 6,
  },
  promptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.8,
  },
  noHintBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  noHintText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.6,
  },
  promptText: {
    fontFamily: UI_FONT,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#FAFAFA',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  editorCard: {
    backgroundColor: '#12111A',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#161622',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    width: 40,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    opacity: 0.85,
  },
  fileName: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },
  codeBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lineNo: {
    width: 16,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 11.5,
    lineHeight: 28,
    color: '#475569',
  },
  inlineFlow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 6,
  },
  indentSpaces: {
    fontFamily: MONO,
    fontSize: 14,
    lineHeight: 26,
  },
  slotPill: {
    minWidth: 52,
    height: 32,
    marginHorizontal: 3,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: '#191826',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPillActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
    borderRadius: 10,
  },
  slotPillFilled: {
    backgroundColor: '#1C1A2B',
    borderStyle: 'solid',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
    borderBottomWidth: 3,
    borderBottomColor: '#4C35B5',
    borderRadius: 10,
  },
  slotPillCorrect: {
    backgroundColor: '#0F241D',
    borderStyle: 'solid',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderBottomWidth: 3,
    borderBottomColor: '#059669',
    borderRadius: 10,
  },
  slotPillWrong: {
    backgroundColor: '#281319',
    borderStyle: 'solid',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderBottomWidth: 3,
    borderBottomColor: '#B91C1C',
    borderRadius: 10,
  },
  slotText: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  slotPlaceholderText: {
    color: '#64748B',
    fontWeight: '500',
  },
  slotPlaceholderActiveText: {
    color: '#C4B5FD',
    fontWeight: '700',
  },
  bankWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 10,
  },
  bankChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#1C1A2B',
    borderWidth: 1.5,
    borderColor: '#2E2B44',
    borderBottomWidth: 4,
    borderBottomColor: '#0E0D16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankChipUsed: {
    backgroundColor: '#111019',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderBottomWidth: 0,
    marginTop: 4,
    borderStyle: 'solid',
  },
  bankChipText: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  bankChipTextUsed: {
    opacity: 0,
  },
  flyingChipOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 40,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#1C1A2B',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
