import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CodeLine, SyntaxPalette } from '@/components/CodeLine';
import { SpringPressable } from '@/components/CyberButton';
import { LanguageLogo } from '@/components/LanguageLogo';
import { HeroAmbientGlow } from '@/components/ui/AmbientSurface';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { LangId, Language, LessonNode, Unit } from '@/data/courses';
import { computeNodeStatus } from '@/store/GameStore';
import { Colors, MONO, UI_FONT } from '@/theme';
import { playSound } from '@/utils/sounds';

const EDITOR_SYNTAX: SyntaxPalette = {
  keyword: '#C084FC',
  string: '#A78BFA',
  number: '#C4B5FD',
  operator: '#8B5CF6',
  comment: '#64748B',
  plain: '#F1F5F9',
};

type GuideTab = 'concepts' | 'pitfalls' | 'cheatsheet';

const GUIDE_TABS: readonly { id: GuideTab; label: string }[] = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'pitfalls', label: 'Bug Pitfalls' },
  { id: 'cheatsheet', label: 'Cheat Sheet' },
];

function buildMemoryTrace(
  code: string,
  outputLines: string[],
  langId: LangId,
): string {
  const firstOut = outputLines[0]?.trim() ?? '';
  if (langId === 'asm') {
    const regMatch = code.match(/\b(rax|eax|rbx|ebx|rcx|ecx|rdx|edx|rdi|rsi|rsp|rbp)\b/i);
    const regLabel = regMatch ? regMatch[1].toUpperCase() : 'RAX';
    return firstOut
      ? `REG[${regLabel}] active | FLAGS: ZF=0 | stdout="${firstOut.slice(0, 22)}"`
      : `REG[${regLabel}] updated | RIP -> next instruction`;
  }

  const assignMatch = code.match(
    /(?:^|\n)\s*(?:let|var|const|mut|int|float|double|string|auto)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::=|=)\s*([^\n;]+)/,
  );
  if (assignMatch) {
    const varName = assignMatch[1];
    const varVal = assignMatch[2].trim().slice(0, 18);
    return firstOut
      ? `MEM: ${varName} -> ${varVal} | stdout: ${firstOut.slice(0, 22)}`
      : `MEM: ${varName} -> ${varVal} | stack=frame[0]`;
  }

  if (/\b(for|while|loop|if|switch|match)\b/.test(code)) {
    return `FLOW: branch/loop trace -> ${firstOut ? firstOut.slice(0, 28) : 'exit(0)'}`;
  }

  return firstOut
    ? `TRACE: stack=main() | stdout="${firstOut.slice(0, 26)}"`
    : 'TRACE: stack=clean | exit code 0';
}

function SnippetOutputDrawer({
  outputLines,
  traceText,
  isFlashing,
}: {
  outputLines: string[];
  traceText: string;
  isFlashing: boolean;
}) {
  const revealFade = useRef(new Animated.Value(0)).current;
  const revealSlide = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(revealFade, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(revealSlide, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealFade, revealSlide]);

  return (
    <Animated.View
      style={[
        styles.outputConsole,
        isFlashing && styles.outputConsoleFlash,
        {
          opacity: revealFade,
          transform: [{ translateY: revealSlide }],
        },
      ]}
    >
      <Text style={styles.outputKicker}>TERMINAL OUTPUT</Text>
      <View style={styles.outputLinesWrap}>
        {outputLines.map((oLine, oIdx) => (
          <Text key={oIdx} style={styles.outputText}>
            <Text style={styles.outputPrompt}>&gt; </Text>
            {oLine}
          </Text>
        ))}
      </View>
      <View style={styles.tracePillRow}>
        <Text style={styles.traceKicker}>TRACE</Text>
        <Text style={styles.traceValueText} numberOfLines={2}>
          {traceText}
        </Text>
      </View>
    </Animated.View>
  );
}

export interface UnitGuidebookModalProps {
  unit: Unit | null;
  course: Language;
  completedIds: string[];
  allNodes: LessonNode[];
  translateY: Animated.Value;
  backdropOpacity: Animated.Value;
  bottomInset: number;
  onClose: () => void;
  onStartNext: () => void;
  onSelectNode: (node: LessonNode, isCompleted: boolean) => void;
  onOpenInIde?: (unit: Unit) => void;
  ctaLabel?: string;
}

export function UnitGuidebookModal({
  unit,
  course,
  completedIds,
  allNodes,
  translateY,
  backdropOpacity,
  bottomInset,
  onClose,
  onStartNext,
  onSelectNode,
  onOpenInIde,
  ctaLabel: customCtaLabel,
}: UnitGuidebookModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('concepts');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [flashedExampleIdx, setFlashedExampleIdx] = useState<number | null>(null);
  const [revealedOutputs, setRevealedOutputs] = useState<
    Record<number, boolean>
  >({});
  const [revealedFixes, setRevealedFixes] = useState<Record<number, boolean>>({
    0: true,
  });

  const segmentAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.15,
        onPanResponderMove: (_, gs) => {
          const dy = Math.max(0, gs.dy);
          translateY.setValue(dy);
          backdropOpacity.setValue(Math.max(0, 1 - dy / 380));
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > 95 || gs.vy > 0.55) {
            Haptics.selectionAsync().catch(() => undefined);
            onCloseRef.current();
            return;
          }
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 30,
              stiffness: 340,
              mass: 0.8,
              overshootClamping: true,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 30,
              stiffness: 340,
              mass: 0.8,
              overshootClamping: true,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [translateY, backdropOpacity],
  );

  const unitId = unit?.id ?? '';
  const [prevUnitId, setPrevUnitId] = useState(unitId);

  if (prevUnitId !== unitId) {
    setPrevUnitId(unitId);
    if (unitId) {
      setActiveTab('concepts');
      setRevealedFixes({ 0: true });
      setRevealedOutputs({});
      setFlashedExampleIdx(null);
    }
  }

  // Sync imperative scroll & pill position when opening a unit.
  useEffect(() => {
    if (!unitId) return;
    segmentAnim.setValue(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [unitId, segmentAnim]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleSegmentLayout = (e: LayoutChangeEvent) => {
    const nextW = e.nativeEvent.layout.width;
    if (nextW > 0 && Math.abs(nextW - segmentWidth) > 0.5) {
      setSegmentWidth(nextW);
    }
  };

  const handleTabChange = (nextTab: GuideTab) => {
    if (nextTab === activeTab) return;
    Haptics.selectionAsync().catch(() => undefined);
    playSound('select');
    setActiveTab(nextTab);
    const tabIdx = GUIDE_TABS.findIndex((t) => t.id === nextTab);
    Animated.timing(segmentAnim, {
      toValue: tabIdx < 0 ? 0 : tabIdx,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleToggleOutput = (idx: number) => {
    const isNowRevealed = !revealedOutputs[idx];
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    if (isNowRevealed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
      playSound('run_code', { volumeMultiplier: 0.72 });
      setRevealedOutputs((prev) => ({ ...prev, [idx]: true }));
      setFlashedExampleIdx(idx);
      flashTimerRef.current = setTimeout(() => {
        playSound('reveal', { volumeMultiplier: 0.65 });
        setFlashedExampleIdx(null);
      }, 180);
    } else {
      Haptics.selectionAsync().catch(() => undefined);
      playSound('tap', { volumeMultiplier: 0.6 });
      setFlashedExampleIdx(null);
      setRevealedOutputs((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleToggleFix = (idx: number) => {
    const isNowRevealed = !revealedFixes[idx];
    Haptics.selectionAsync().catch(() => undefined);
    if (isNowRevealed) {
      playSound('reveal', { volumeMultiplier: 0.75 });
    } else {
      playSound('tap', { volumeMultiplier: 0.6 });
    }
    setRevealedFixes((prev) => ({ ...prev, [idx]: isNowRevealed }));
  };

  const doneSet = new Set(completedIds);
  const rawExt = course.fileExt.split('.').pop() || 'txt';

  const unitNodes = unit?.nodes ?? [];
  const completedCount = unitNodes.filter((n) => doneSet.has(n.id)).length;
  const totalCount = unitNodes.length;
  const nextNode =
    unitNodes.find((n) => !doneSet.has(n.id)) ?? unitNodes[0] ?? null;
  const nextStatus = nextNode
    ? computeNodeStatus(completedIds, nextNode.id, allNodes)
    : 'locked';

  const ctaLabel =
    nextStatus === 'locked'
      ? 'Finish Earlier Units to Unlock'
      : completedCount === 0
        ? `Start Unit 0${unit?.unitNumber ?? 1}`
        : completedCount >= totalCount
          ? `Review Unit (${completedCount}/${totalCount})`
          : `Continue Unit (${completedCount}/${totalCount})`;

  const tabItemWidth = segmentWidth > 6 ? (segmentWidth - 6) / 3 : 0;
  const indicatorTranslateX = segmentAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabItemWidth, tabItemWidth * 2],
  });

  const pitfalls = unit?.guidebook.commonMistakes ?? [];
  const takeaways = unit?.guidebook.keyTakeaways ?? [];

  return (
    <Modal
      visible={unit !== null}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View
          style={[styles.modalBackdropOverlay, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(bottomInset, 18),
              transform: [{ translateY }],
            },
          ]}
        >
          {unit ? (
            <>
              {/* Matte Carbon Sheet Header (swipe down to dismiss) */}
              <View style={styles.sheetHeader} {...sheetPanResponder.panHandlers}>
                <View style={styles.grabHandle} />

                <View style={styles.headerRow}>
                  <View style={styles.logoTile}>
                    <LanguageLogo language={course.id} size={22} />
                  </View>

                  <View style={styles.headerTextWrap}>
                    <View style={styles.kickerRow}>
                      <Text style={styles.headerKicker}>
                        UNIT {String(unit.unitNumber).padStart(2, '0')} •{' '}
                        {course.name.toUpperCase()} GUIDEBOOK
                      </Text>
                      <View style={styles.progressBadge}>
                        <Text style={styles.progressBadgeText}>
                          {completedCount}/{totalCount}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {unit.title}
                    </Text>
                  </View>

                  <SpringPressable
                    onPress={onClose}
                    haptic="light"
                    sound="none"
                    pressScale={0.92}
                    style={styles.closeBtn}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </SpringPressable>
                </View>

                {/* Flush 3-Tab Segmented Control */}
                <View
                  style={styles.segmentTrack}
                  onLayout={handleSegmentLayout}
                >
                  {tabItemWidth > 0 ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.segmentIndicator,
                        {
                          width: tabItemWidth,
                          transform: [{ translateX: indicatorTranslateX }],
                        },
                      ]}
                    />
                  ) : null}

                  {GUIDE_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => handleTabChange(tab.id)}
                        style={styles.segmentBtn}
                      >
                        <Text
                          style={[
                            styles.segmentLabel,
                            isActive && styles.segmentLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Scrollable Bento Content */}
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={false}
              >
                {activeTab === 'concepts' ? (
                  <>
                    {/* Hero Overview & Mental Model Card */}
                    <View style={styles.heroCard}>
                      <HeroAmbientGlow intensity={0.85} />
                      <View style={styles.pillRow}>
                        <View style={styles.violetBadge}>
                          <Ionicons
                            name="book-outline"
                            size={11}
                            color="#C4B5FD"
                          />
                          <Text style={styles.violetBadgeText}>
                            UNIT OVERVIEW
                          </Text>
                        </View>
                      </View>

                      <RichCodeText
                        text={unit.guidebook.summary}
                        style={styles.summaryText}
                      />

                      {unit.guidebook.mentalModel ? (
                        <View style={styles.mentalModelWell}>
                          <View style={styles.mentalModelHeader}>
                            <Ionicons
                              name="hardware-chip-outline"
                              size={13}
                              color="#A78BFA"
                            />
                            <Text style={styles.mentalModelKicker}>
                              MENTAL MODEL
                            </Text>
                          </View>
                          <RichCodeText
                            text={unit.guidebook.mentalModel}
                            style={styles.mentalModelText}
                          />
                        </View>
                      ) : null}
                    </View>

                    {/* Annotated Interactive IDE Pattern Cards */}
                    {unit.guidebook.keySyntax.map((item, idx) => {
                      const codeLines = item.code.split('\n');
                      const outputLines = item.output
                        ? item.output.split('\n')
                        : [];
                      const displayOutputs =
                        outputLines.length > 0
                          ? outputLines
                          : ['Process finished cleanly (exit code 0)'];
                      const traceText = buildMemoryTrace(
                        item.code,
                        outputLines,
                        course.id,
                      );
                      const isOutputVisible = !!revealedOutputs[idx];
                      const isFlashing = flashedExampleIdx === idx;
                      const fileLabel = `pattern_0${idx + 1}.${rawExt}`;

                      return (
                        <View key={idx} style={styles.patternCard}>
                          <View style={styles.patternTitleRow}>
                            <View style={styles.indexChip}>
                              <Text style={styles.indexChipText}>
                                0{idx + 1}
                              </Text>
                            </View>
                            {item.tag ? (
                              <View style={styles.tagChip}>
                                <Text style={styles.tagChipText}>
                                  {item.tag}
                                </Text>
                              </View>
                            ) : null}
                            <View style={styles.patternTitleFlex}>
                              <RichCodeText
                                text={item.title}
                                style={styles.patternTitle}
                              />
                            </View>
                          </View>

                          {/* Attached IDE + Interactive Output Drawer */}
                          <View style={styles.ideCard}>
                            <View style={styles.ideChrome}>
                              <View style={styles.dotsRow}>
                                <View
                                  style={[
                                    styles.dot,
                                    { backgroundColor: '#EF4444' },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.dot,
                                    { backgroundColor: '#F59E0B' },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.dot,
                                    { backgroundColor: '#10B981' },
                                  ]}
                                />
                              </View>
                              <Text style={styles.ideFilename} numberOfLines={1}>
                                {fileLabel}
                              </Text>
                              <SpringPressable
                                onPress={() => handleToggleOutput(idx)}
                                haptic="light"
                                sound="none"
                                pressScale={0.94}
                                style={[
                                  styles.runPillBtn,
                                  (isFlashing || isOutputVisible) &&
                                    styles.runPillBtnActive,
                                ]}
                              >
                                <Ionicons
                                  name={
                                    isFlashing
                                      ? 'flash'
                                      : isOutputVisible
                                        ? 'chevron-up'
                                        : 'play'
                                  }
                                  size={10}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.runPillText}>
                                  {isFlashing
                                    ? 'Running...'
                                    : isOutputVisible
                                      ? 'Hide Output'
                                      : 'Run Output'}
                                </Text>
                              </SpringPressable>
                            </View>

                            <View style={styles.codeBody}>
                              {codeLines.map((line, lIdx) => (
                                <View key={lIdx} style={styles.codeRow}>
                                  <Text style={styles.lineNo}>{lIdx + 1}</Text>
                                  <View style={styles.codeLineWrap}>
                                    <CodeLine
                                      code={line}
                                      fontSize={12.5}
                                      lineHeight={19}
                                      syntax={EDITOR_SYNTAX}
                                    />
                                  </View>
                                </View>
                              ))}
                            </View>

                            {isOutputVisible ? (
                              <SnippetOutputDrawer
                                outputLines={displayOutputs}
                                traceText={traceText}
                                isFlashing={isFlashing}
                              />
                            ) : null}
                          </View>

                          <RichCodeText
                            text={item.explanation}
                            style={styles.patternExplanation}
                          />

                          {item.notes && item.notes.length > 0 ? (
                            <View style={styles.notesList}>
                              {item.notes.map((note, nIdx) => (
                                <View key={nIdx} style={styles.noteRow}>
                                  <View style={styles.noteBullet} />
                                  <View style={styles.noteTextWrap}>
                                    <RichCodeText
                                      text={note}
                                      style={styles.noteRowText}
                                    />
                                  </View>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}

                    {/* Pro Tip Card (Emerald 3D Squircle) */}
                    <View style={styles.proTipCard}>
                      <View style={styles.proTipIconTile}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10B981"
                        />
                      </View>
                      <View style={styles.proTipBodyWrap}>
                        <Text style={styles.proTipKicker}>✓ PRO TIP</Text>
                        <RichCodeText
                          text={unit.guidebook.proTip}
                          style={styles.proTipText}
                        />
                      </View>
                    </View>

                    {/* Watch Out Card (Coral 3D Squircle) */}
                    <View style={styles.watchOutCard}>
                      <View style={styles.watchOutIconTile}>
                        <Ionicons name="warning" size={17} color="#EF4444" />
                      </View>
                      <View style={styles.proTipBodyWrap}>
                        <Text style={styles.watchOutKicker}>
                          ⚠ WATCH OUT
                        </Text>
                        <RichCodeText
                          text={
                            pitfalls[0]
                              ? `${pitfalls[0].title}: ${pitfalls[0].reason}`
                              : `Double-check syntax delimiters and types in ${unit.title} before running.`
                          }
                          style={styles.watchOutText}
                        />
                      </View>
                    </View>
                  </>
                ) : activeTab === 'pitfalls' ? (
                  <>
                    <View style={styles.sectionIntroCard}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={16}
                        color="#C4B5FD"
                      />
                      <Text style={styles.sectionIntroText}>
                        Inspect real bugs before coding. Tap{' '}
                        <Text style={styles.sectionIntroStrong}>Show Fix</Text>{' '}
                        on any pitfall to test your intuition first.
                      </Text>
                    </View>

                    {pitfalls.length > 0 ? (
                      pitfalls.map((pitfall, idx) => {
                        const isFixVisible = !!revealedFixes[idx];
                        return (
                          <View key={idx} style={styles.pitfallCard}>
                            <View style={styles.pitfallHeader}>
                              <View style={styles.pitfallTitleWrap}>
                                <View style={styles.bugIconBox}>
                                  <Ionicons
                                    name="bug-outline"
                                    size={13}
                                    color="#F85149"
                                  />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.pitfallKicker}>
                                    TRAP 0{idx + 1}
                                  </Text>
                                  <RichCodeText
                                    text={pitfall.title}
                                    style={styles.pitfallTitle}
                                  />
                                </View>
                              </View>

                              <SpringPressable
                                onPress={() => handleToggleFix(idx)}
                                haptic="selection"
                                sound="none"
                                pressScale={0.95}
                                style={[
                                  styles.revealBtn,
                                  isFixVisible && styles.revealBtnActive,
                                ]}
                              >
                                <Ionicons
                                  name={
                                    isFixVisible
                                      ? 'checkmark-circle'
                                      : 'eye-outline'
                                  }
                                  size={12}
                                  color={isFixVisible ? '#3FB950' : '#C4B5FD'}
                                />
                                <Text
                                  style={[
                                    styles.revealBtnText,
                                    isFixVisible && styles.revealBtnTextActive,
                                  ]}
                                >
                                  {isFixVisible ? 'Fixed' : 'Show Fix'}
                                </Text>
                              </SpringPressable>
                            </View>

                            {/* Broken Snippet Well */}
                            <View style={styles.bugWell}>
                              <View style={styles.wellLabelRow}>
                                <View style={styles.bugBadgePill}>
                                  <Text style={styles.bugBadgePillText}>
                                    AVOID THIS
                                  </Text>
                                </View>
                              </View>
                              {pitfall.buggyCode.split('\n').map((line, lIdx) => (
                                <View key={lIdx} style={styles.codeRow}>
                                  <Text style={styles.bugLineNo}>
                                    {lIdx + 1}
                                  </Text>
                                  <View style={styles.codeLineWrap}>
                                    <CodeLine
                                      code={line}
                                      fontSize={12}
                                      lineHeight={18}
                                      syntax={EDITOR_SYNTAX}
                                    />
                                  </View>
                                </View>
                              ))}
                            </View>

                            {/* Fixed Snippet Well (Expandable) */}
                            {isFixVisible ? (
                              <View style={styles.fixWell}>
                                <View style={styles.wellLabelRow}>
                                  <View style={styles.fixBadgePill}>
                                    <Text style={styles.fixBadgePillText}>
                                      CLEAN FIX
                                    </Text>
                                  </View>
                                </View>
                                {pitfall.fixedCode
                                  .split('\n')
                                  .map((line, lIdx) => (
                                    <View key={lIdx} style={styles.codeRow}>
                                      <Text style={styles.fixLineNo}>
                                        {lIdx + 1}
                                      </Text>
                                      <View style={styles.codeLineWrap}>
                                        <CodeLine
                                          code={line}
                                          fontSize={12}
                                          lineHeight={18}
                                          syntax={EDITOR_SYNTAX}
                                        />
                                      </View>
                                    </View>
                                  ))}
                              </View>
                            ) : null}

                            <RichCodeText
                              text={pitfall.reason}
                              style={styles.pitfallReason}
                            />
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyCard}>
                        <Text style={styles.emptyCardText}>
                          Key pitfalls for this unit are covered inside Concepts
                          & Pro Tips.
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* Cheat Sheet Key Takeaways */}
                    {takeaways.length > 0 ? (
                      <View style={styles.bentoCard}>
                        <View style={styles.bentoCardHeader}>
                          <Ionicons
                            name="flash-outline"
                            size={14}
                            color="#C4B5FD"
                          />
                          <Text style={styles.bentoCardKicker}>
                            KEY RULES TO REMEMBER
                          </Text>
                        </View>
                        <View style={styles.takeawayList}>
                          {takeaways.map((rule, idx) => (
                            <View key={idx} style={styles.takeawayRow}>
                              <View style={styles.takeawayIndex}>
                                <Text style={styles.takeawayIndexText}>
                                  0{idx + 1}
                                </Text>
                              </View>
                              <View style={styles.takeawayTextWrap}>
                                <RichCodeText
                                  text={rule}
                                  style={styles.takeawayText}
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {/* Interactive Unit Lesson Roadmap */}
                    <View style={styles.bentoCard}>
                      <View style={styles.bentoCardHeader}>
                        <Ionicons
                          name="map-outline"
                          size={14}
                          color="#C4B5FD"
                        />
                        <Text style={styles.bentoCardKicker}>
                          UNIT ROADMAP ({completedCount}/{totalCount})
                        </Text>
                      </View>

                      <View style={styles.roadmapList}>
                        {unitNodes.map((node, idx) => {
                          const status = computeNodeStatus(
                            completedIds,
                            node.id,
                            allNodes,
                          );
                          const isCompleted = status === 'completed';
                          const isLocked = status === 'locked';
                          const kindLabel =
                            node.kind === 'checkpoint_cube'
                              ? 'CHECKPOINT'
                              : node.kind === 'boss_challenge'
                                ? 'UNIT BOSS'
                                : `LESSON 0${idx + 1}`;

                          return (
                            <SpringPressable
                              key={node.id}
                              onPress={() => onSelectNode(node, isCompleted)}
                              haptic={isLocked ? 'none' : 'medium'}
                              sound="none"
                              pressScale={0.985}
                              style={[
                                styles.roadmapRow,
                                isCompleted && styles.roadmapRowDone,
                                !isLocked &&
                                  !isCompleted &&
                                  styles.roadmapRowActive,
                                isLocked && styles.roadmapRowLocked,
                              ]}
                            >
                              <View
                                style={[
                                  styles.roadmapIconCircle,
                                  isCompleted && styles.roadmapIconDone,
                                  !isLocked &&
                                    !isCompleted &&
                                    styles.roadmapIconActive,
                                ]}
                              >
                                <Ionicons
                                  name={
                                    isCompleted
                                      ? 'checkmark'
                                      : isLocked
                                        ? 'lock-closed'
                                        : 'play'
                                  }
                                  size={13}
                                  color={
                                    isLocked ? Colors.textMuted : '#FFFFFF'
                                  }
                                />
                              </View>

                              <View style={styles.roadmapTextWrap}>
                                <View style={styles.roadmapMetaRow}>
                                  <Text style={styles.roadmapKind}>
                                    {kindLabel}
                                  </Text>
                                  <Text style={styles.roadmapReward}>
                                    +{node.xpReward} XP
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.roadmapTitle,
                                    isLocked && styles.roadmapTitleLocked,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {node.title}
                                </Text>
                              </View>

                              <Ionicons
                                name="chevron-forward"
                                size={15}
                                color={
                                  isLocked
                                    ? 'rgba(255, 255, 255, 0.16)'
                                    : Colors.textSecondary
                                }
                              />
                            </SpringPressable>
                          );
                        })}
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Plush 3D Capsule Footer CTAs */}
              <View style={styles.sheetFooter}>
                {onOpenInIde ? (
                  <>
                    <SpringPressable
                      onPress={() => onOpenInIde(unit)}
                      haptic="medium"
                      sound="none"
                      pressScale={0.97}
                      pressTranslateY={2}
                      style={styles.footerCtaBtn}
                    >
                      <Ionicons name="code-slash" size={16} color="#FFFFFF" />
                      <Text style={styles.footerCtaText}>
                        Open Unit Snippet in Live IDE →
                      </Text>
                    </SpringPressable>
                    <SpringPressable
                      onPress={onClose}
                      haptic="light"
                      sound="none"
                      pressScale={0.97}
                      pressTranslateY={2}
                      style={styles.footerSecondaryBtn}
                    >
                      <Text style={styles.footerSecondaryText}>
                        {customCtaLabel ?? 'Got It, Back to Path'}
                      </Text>
                    </SpringPressable>
                  </>
                ) : (
                  <SpringPressable
                    onPress={onStartNext}
                    haptic={nextStatus === 'locked' ? 'none' : 'medium'}
                    sound="none"
                    pressScale={0.98}
                    pressTranslateY={2}
                    style={[
                      styles.footerCtaBtn,
                      nextStatus === 'locked' && styles.footerCtaBtnLocked,
                    ]}
                  >
                    <Ionicons
                      name={
                        nextStatus === 'locked'
                          ? 'lock-closed'
                          : completedCount >= totalCount
                            ? 'refresh'
                            : 'play'
                      }
                      size={14}
                      color={
                        nextStatus === 'locked'
                          ? Colors.textSecondary
                          : '#FFFFFF'
                      }
                    />
                    <Text
                      style={[
                        styles.footerCtaText,
                        nextStatus === 'locked' && styles.footerCtaTextLocked,
                      ]}
                    >
                      {customCtaLabel ?? ctaLabel}
                    </Text>
                  </SpringPressable>
                )}
              </View>
            </>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#12111A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#252338',
    overflow: 'hidden',
  },
  sheetHeader: {
    backgroundColor: '#12111A',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  grabHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#1A1828',
    borderWidth: 1.5,
    borderColor: '#2D2A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 3,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerKicker: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.7,
  },
  progressBadge: {
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: '#2B2840',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: -0.2,
  },
  headerTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#1A1927',
    borderWidth: 1.5,
    borderColor: '#2C2A40',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Segmented Control ------------------------------------------------ */
  segmentTrack: {
    height: 40,
    backgroundColor: '#171624',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#262438',
    padding: 3,
    flexDirection: 'row',
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.48)',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: -0.1,
  },
  segmentLabelActive: {
    color: '#FAFAFA',
    fontWeight: '700',
  },

  /* Scroll Body & Cards ---------------------------------------------- */
  scrollBody: {
    padding: 16,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.32)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 16,
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  violetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.34)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  violetBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.7,
  },
  summaryText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#E4E4E7',
  },
  mentalModelWell: {
    backgroundColor: '#0F0E18',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#242236',
    padding: 12,
    gap: 5,
  },
  mentalModelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mentalModelKicker: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.7,
  },
  mentalModelText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: '#A1A1AA',
  },

  /* Pattern Card + IDE Well ------------------------------------------ */
  patternCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 15,
    gap: 12,
  },
  patternTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  indexChip: {
    backgroundColor: '#1C1A2B',
    borderWidth: 1,
    borderColor: '#2E2B44',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  indexChipText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  tagChip: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  tagChipText: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.5,
  },
  patternTitleFlex: {
    flex: 1,
  },
  patternTitle: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  ideCard: {
    backgroundColor: '#09090D',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#252338',
    overflow: 'hidden',
  },
  ideChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#161622',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    width: 44,
  },
  dot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    opacity: 0.9,
  },
  ideFilename: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  runPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 2.5,
    borderBottomColor: '#5639D6',
  },
  runPillBtnActive: {
    backgroundColor: '#10B981',
    borderBottomColor: '#059669',
  },
  runPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  codeBody: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lineNo: {
    width: 15,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 19,
    color: '#475569',
  },
  codeLineWrap: {
    flex: 1,
  },
  outputConsole: {
    backgroundColor: '#0D0D14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  outputConsoleFlash: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  outputKicker: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.7,
  },
  outputLinesWrap: {
    gap: 2,
  },
  outputText: {
    fontFamily: MONO,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#ECFDF5',
  },
  outputPrompt: {
    color: '#34D399',
    fontWeight: '700',
  },
  tracePillRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  traceKicker: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#C4B5FD',
    letterSpacing: 0.6,
  },
  traceValueText: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 15.5,
    color: '#DDD6FE',
  },
  patternExplanation: {
    fontFamily: UI_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: '#A1A1AA',
  },
  notesList: {
    backgroundColor: '#0F0E18',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#232135',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#7C5CFC',
    marginTop: 7,
  },
  noteTextWrap: {
    flex: 1,
  },
  noteRowText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    lineHeight: 17.5,
    color: '#D4D4D8',
  },

  /* Pro Tip & Watch Out Squircle Cards ------------------------------- */
  proTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#0F241D',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#10B981',
    borderBottomWidth: 4,
    borderBottomColor: '#065F46',
    padding: 14,
  },
  proTipIconTile: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTipBodyWrap: {
    flex: 1,
    gap: 3,
  },
  proTipKicker: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.7,
  },
  proTipText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: '#ECFDF5',
  },
  watchOutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#281319',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderBottomWidth: 4,
    borderBottomColor: '#991B1B',
    padding: 14,
  },
  watchOutIconTile: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchOutKicker: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FCA5A5',
    letterSpacing: 0.7,
  },
  watchOutText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: '#FEF2F2',
  },

  /* Pitfalls Tab ----------------------------------------------------- */
  sectionIntroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#151421',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#252338',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  sectionIntroText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 17.5,
    color: '#A1A1AA',
  },
  sectionIntroStrong: {
    color: '#FAFAFA',
    fontWeight: '700',
  },
  pitfallCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 15,
    gap: 10,
  },
  pitfallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pitfallTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  bugIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 81, 73, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitfallKicker: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F87171',
    letterSpacing: 0.6,
  },
  pitfallTitle: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  revealBtnActive: {
    backgroundColor: 'rgba(63, 185, 80, 0.14)',
    borderColor: 'rgba(63, 185, 80, 0.35)',
  },
  revealBtnText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  revealBtnTextActive: {
    color: '#3FB950',
  },
  bugWell: {
    backgroundColor: '#120A0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.26)',
    padding: 10,
    gap: 4,
  },
  fixWell: {
    backgroundColor: '#0A120E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(63, 185, 80, 0.30)',
    padding: 10,
    gap: 4,
  },
  wellLabelRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bugBadgePill: {
    backgroundColor: 'rgba(248, 81, 73, 0.18)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  bugBadgePillText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#F87171',
    letterSpacing: 0.6,
  },
  fixBadgePill: {
    backgroundColor: 'rgba(63, 185, 80, 0.18)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  fixBadgePillText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#3FB950',
    letterSpacing: 0.6,
  },
  bugLineNo: {
    width: 14,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 10.5,
    lineHeight: 18,
    color: 'rgba(248, 81, 73, 0.55)',
  },
  fixLineNo: {
    width: 14,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 10.5,
    lineHeight: 18,
    color: 'rgba(63, 185, 80, 0.55)',
  },
  pitfallReason: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: '#A1A1AA',
  },
  emptyCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 16,
  },
  emptyCardText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
  },

  /* Cheat Sheet & Roadmap Tab ---------------------------------------- */
  bentoCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 15,
    gap: 10,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bentoCardKicker: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.7,
  },
  takeawayList: {
    gap: 8,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
  },
  takeawayIndex: {
    width: 24,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  takeawayIndexText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  takeawayTextWrap: {
    flex: 1,
  },
  takeawayText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: '#E4E4E7',
  },
  roadmapList: {
    gap: 7,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0E0E15',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  roadmapRowDone: {
    borderColor: 'rgba(63, 185, 80, 0.25)',
  },
  roadmapRowActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  roadmapRowLocked: {
    opacity: 0.62,
  },
  roadmapIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#181824',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapIconDone: {
    backgroundColor: '#238636',
  },
  roadmapIconActive: {
    backgroundColor: '#7C5CFC',
  },
  roadmapTextWrap: {
    flex: 1,
    gap: 2,
  },
  roadmapMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roadmapKind: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  roadmapReward: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  roadmapTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  roadmapTitleLocked: {
    color: '#A1A1AA',
  },

  /* Footer CTA ------------------------------------------------------- */
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12111A',
    gap: 10,
  },
  footerCtaBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 4,
    borderBottomColor: '#5639D6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerCtaBtnLocked: {
    backgroundColor: '#181822',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D16',
  },
  footerCtaText: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  footerCtaTextLocked: {
    color: '#A1A1AA',
  },
  footerSecondaryBtn: {
    height: 46,
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#E4E4E7',
    letterSpacing: -0.2,
  },
});
