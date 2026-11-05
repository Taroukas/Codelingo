import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Animated,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { getLanguage, Unit, LessonNode } from '@/data/courses';
import { useGame } from '@/store/GameStore';
import { StatsHeader } from '@/components/StatsHeader';
import { IDEWindow } from '@/components/IDEWindow';
import { Tactile3DBox, Tactile3DNode } from '@/components/Tactile3D';
import { BonusChestNode } from '@/components/PathDecorations';
import { tapHaptic } from '@/utils/haptics';

const S_CURVE_OFFSETS = [0, -48, -68, -48, 0, 48, 68, 48] as const;

function renderNodeIcon(
  nodeIndex: number,
  isCompleted: boolean,
  isLocked: boolean,
) {
  if (isCompleted) {
    return <FontAwesome5 name="check" size={27} color={Colors.white} solid />;
  }
  if (isLocked) {
    const lockedIcon = nodeIndex === 3 ? 'trophy' : 'lock';
    return (
      <FontAwesome5
        name={lockedIcon}
        size={24}
        color={Colors.textDisabled}
        solid
      />
    );
  }
  if (nodeIndex === 0) {
    return <FontAwesome5 name="star" size={25} color={Colors.white} solid />;
  }
  if (nodeIndex === 1) {
    return <FontAwesome5 name="code" size={23} color={Colors.white} solid />;
  }
  if (nodeIndex === 2) {
    return <FontAwesome5 name="dumbbell" size={23} color={Colors.white} solid />;
  }
  return <FontAwesome5 name="trophy" size={24} color={Colors.white} solid />;
}

function SplitUnitBanner({
  unit,
  onOpenGuide,
}: {
  unit: Unit;
  onOpenGuide: (unit: Unit) => void;
}) {
  return (
    <View
      style={[
        styles.unitBannerOuterLip,
        { backgroundColor: unit.lipColor },
      ]}
    >
      <View
        style={[
          styles.unitBannerFace,
          { backgroundColor: unit.color },
        ]}
      >
        <View style={styles.unitBannerLeftCol}>
          <Text style={styles.unitSectionSubtitle}>{unit.sectionLabel}</Text>
          <Text style={styles.unitTitleText}>{unit.title}</Text>
        </View>

        <View style={styles.unitBannerDivider} />

        <Pressable
          onPress={() => {
            tapHaptic();
            onOpenGuide(unit);
          }}
          style={({ pressed }) => [
            styles.unitBannerRightCol,
            pressed && { backgroundColor: 'rgba(0, 0, 0, 0.14)' },
          ]}
        >
          <Ionicons name="book" size={28} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { activeLang, completedNodes, claimedChests, claimChest } = useGame();
  const course = getLanguage(activeLang);
  const doneSet = new Set(completedNodes[activeLang] ?? []);

  // Determine the first uncompleted node across all units in this language
  const allNodes = course.units.flatMap((u) => u.nodes);
  const firstUncompletedNode =
    allNodes.find((n) => !doneSet.has(n.id)) ?? allNodes[allNodes.length - 1];

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<Unit | null>(null);
  const [stickyUnitIdx, setStickyUnitIdx] = useState(0);
  const unitOffsetsRef = useRef<number[]>([0, 620, 1240]);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Smooth bobbing animation for the floating "START" speech bubble
  const bobAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bobAnim]);

  useEffect(() => {
    setSelectedNodeId(null);
    setStickyUnitIdx(0);
  }, [activeLang]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + 40;
    const offsets = unitOffsetsRef.current;
    let nextIdx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (y >= offsets[i]) {
        nextIdx = i;
      }
    }
    if (nextIdx !== stickyUnitIdx) {
      setStickyUnitIdx(nextIdx);
    }
  };

  const handleNodePress = (node: LessonNode) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  };

  const handleStartLesson = (node: LessonNode) => {
    setSelectedNodeId(null);
    router.push(`/lesson/${node.id}`);
  };

  const handleJumpToActive = () => {
    tapHaptic();
    const activeIdx = firstUncompletedNode?.globalIndex ?? 0;
    const approxY = Math.max(0, activeIdx * 105 - 80);
    scrollRef.current?.scrollTo({ y: approxY, animated: true });
  };

  const activeBannerUnit = course.units[stickyUnitIdx] ?? course.units[0];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatsHeader />

      {/* Pinned Top Unit Banner — outside ScrollView so scrolling nodes clip cleanly underneath */}
      <View style={styles.pinnedBannerContainer}>
        <SplitUnitBanner
          unit={activeBannerUnit}
          onOpenGuide={setGuidebookUnit}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {course.units.map((unit, uIdx) => {
          const chestId = `${unit.id}-chest`;
          const isChestClaimed = claimedChests.includes(chestId);
          const unitHasOpenPopover = unit.nodes.some(
            (n) => n.id === selectedNodeId,
          );

          return (
            <View
              key={unit.id}
              onLayout={(e) => {
                unitOffsetsRef.current[uIdx] = e.nativeEvent.layout.y;
              }}
              style={[
                styles.unitSectionWrap,
                { zIndex: unitHasOpenPopover ? 100 : 1 },
              ]}
            >
              {/* Inline Unit Banner for Unit 2 & Unit 3 */}
              {uIdx > 0 ? (
                <View style={styles.inlineUnitBannerWrap}>
                  <SplitUnitBanner
                    unit={unit}
                    onOpenGuide={setGuidebookUnit}
                  />
                </View>
              ) : null}

              <View style={styles.unitPathSection}>
                {unit.nodes.map((node) => {
                  const isCompleted = doneSet.has(node.id);
                  const isActive =
                    firstUncompletedNode?.id === node.id && !isCompleted;
                  const isLocked = !isCompleted && !isActive;
                  const isPopoverOpen = selectedNodeId === node.id;

                  const offsetX =
                    S_CURVE_OFFSETS[node.globalIndex % S_CURVE_OFFSETS.length];

                  const puckBg = isCompleted
                    ? Colors.gold
                    : isActive
                    ? unit.color
                    : Colors.card;
                  const puckLip = isCompleted
                    ? Colors.goldLip
                    : isActive
                    ? unit.lipColor
                    : Colors.cardLip;

                  const popoverBg = isCompleted
                    ? Colors.gold
                    : isActive
                    ? unit.color
                    : Colors.card;
                  const popoverLip = isCompleted
                    ? Colors.goldLip
                    : isActive
                    ? unit.lipColor
                    : Colors.cardLip;
                  const actionColor = isCompleted ? Colors.goldLip : unit.color;

                  // Clamp popover horizontal position so it never clips off screen edges
                  const clampedPopoverShift = Math.max(
                    -42,
                    Math.min(42, offsetX * 0.45),
                  );
                  const arrowShift = offsetX - clampedPopoverShift;

                  return (
                    <React.Fragment key={node.id}>
                      <View
                        style={[
                          styles.nodeRowWrapper,
                          { zIndex: isPopoverOpen ? 100 : isActive ? 20 : 1 },
                        ]}
                      >
                        <View
                          style={[
                            styles.nodeOffsetBox,
                            { transform: [{ translateX: offsetX }] },
                          ]}
                        >
                          {/* Crisp 3D "START" Speech Bubble above the Active Node */}
                          {isActive ? (
                            <Animated.View
                              style={[
                                styles.startBubbleWrapper,
                                { transform: [{ translateY: bobAnim }] },
                              ]}
                            >
                              <View style={styles.startBubbleBox}>
                                <Text style={styles.startBubbleText}>START</Text>
                              </View>
                              <View style={styles.startBubbleTriangle} />
                            </Animated.View>
                          ) : null}

                          {/* Centered Slightly-Oval Progress Ring around the Active Node */}
                          {isActive ? (
                            <View style={styles.activeOvalRing}>
                              <Tactile3DNode
                                faceColor={puckBg}
                                lipColor={puckLip}
                                showGloss={!isLocked}
                                onPress={() => handleNodePress(node)}
                              >
                                {renderNodeIcon(
                                  node.nodeIndex,
                                  isCompleted,
                                  isLocked,
                                )}
                              </Tactile3DNode>
                            </View>
                          ) : (
                            <Tactile3DNode
                              faceColor={puckBg}
                              lipColor={puckLip}
                              showGloss={!isLocked}
                              onPress={() => handleNodePress(node)}
                            >
                              {renderNodeIcon(
                                node.nodeIndex,
                                isCompleted,
                                isLocked,
                              )}
                            </Tactile3DNode>
                          )}
                        </View>

                        {/* Absolute Floating Popover Overlay Positioned 10px Below the Node/Ring */}
                        {isPopoverOpen ? (
                          <View
                            style={[
                              styles.popoverAbsoluteAnchor,
                              {
                                transform: [{ translateX: clampedPopoverShift }],
                              },
                            ]}
                          >
                            {/* 14x14 Rotated Diamond Arrow Pointing at the Tapped Node */}
                            <View
                              style={[
                                styles.popoverDiamondArrow,
                                {
                                  backgroundColor: popoverBg,
                                  borderColor: isLocked
                                    ? Colors.border
                                    : popoverBg,
                                  transform: [
                                    { translateX: arrowShift },
                                    { rotate: '45deg' },
                                  ],
                                },
                              ]}
                            />

                            <View
                              style={[
                                styles.popoverOuterLip,
                                { backgroundColor: popoverLip },
                              ]}
                            >
                              <View
                                style={[
                                  styles.popoverFace,
                                  {
                                    backgroundColor: popoverBg,
                                    borderColor: isLocked
                                      ? Colors.border
                                      : popoverLip,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.popoverTitle,
                                    isLocked && { color: Colors.textSecondary },
                                  ]}
                                >
                                  {node.title}
                                </Text>
                                <Text
                                  style={[
                                    styles.popoverSubtitle,
                                    isLocked && { color: Colors.textDisabled },
                                  ]}
                                >
                                  {isLocked
                                    ? 'Complete all lessons above to unlock'
                                    : isCompleted
                                    ? 'Completed • Practice for +5 XP'
                                    : `Lesson ${node.nodeIndex + 1} of ${unit.nodes.length} • +15 XP`}
                                </Text>

                                {isLocked ? (
                                  <View style={styles.lockedActionBtn}>
                                    <FontAwesome5
                                      name="lock"
                                      size={14}
                                      color={Colors.textDisabled}
                                      solid
                                    />
                                    <Text style={styles.lockedActionText}>
                                      LOCKED
                                    </Text>
                                  </View>
                                ) : (
                                  <Tactile3DBox
                                    depth={4}
                                    borderRadius={14}
                                    faceColor={Colors.white}
                                    lipColor={Colors.whiteLip}
                                    borderColor={Colors.whiteLip}
                                    onPress={() => handleStartLesson(node)}
                                    faceStyle={styles.popoverStartBtnFace}
                                  >
                                    <Text
                                      style={[
                                        styles.popoverStartBtnText,
                                        { color: actionColor },
                                      ]}
                                    >
                                      {isCompleted
                                        ? 'PRACTICE +5 XP'
                                        : 'START +15 XP'}
                                    </Text>
                                  </Tactile3DBox>
                                )}
                              </View>
                            </View>
                          </View>
                        ) : null}
                      </View>

                      {/* Clean 3D Gold Bonus Node after the 2nd node of every Unit */}
                      {node.nodeIndex === 1 ? (
                        <BonusChestNode
                          claimed={isChestClaimed}
                          offsetX={offsetX * 0.85}
                          onClaim={() => claimChest(chestId)}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Jump-to-Current Button (Bottom-Right Corner) */}
      <Pressable
        onPress={handleJumpToActive}
        style={({ pressed }) => [
          styles.jumpBtn,
          pressed && {
            transform: [{ translateY: 3 }],
            borderBottomWidth: 2,
          },
        ]}
      >
        <Ionicons name="arrow-down" size={24} color={Colors.sky} />
      </Pressable>

      {/* Unit Guidebook Modal */}
      <Modal
        visible={guidebookUnit !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setGuidebookUnit(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.guideModal,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            {guidebookUnit ? (
              <>
                <View
                  style={[
                    styles.guideHeader,
                    {
                      backgroundColor: guidebookUnit.color,
                      borderBottomColor: guidebookUnit.lipColor,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideHeaderKicker}>
                      {course.name.toUpperCase()} GUIDEBOOK •{' '}
                      {guidebookUnit.sectionLabel}
                    </Text>
                    <Text style={styles.guideHeaderTitle}>
                      {guidebookUnit.title}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      tapHaptic();
                      setGuidebookUnit(null);
                    }}
                    style={styles.guideCloseBtn}
                  >
                    <Ionicons name="close" size={24} color={Colors.white} />
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.guideBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.guideIntro}>
                    {guidebookUnit.description}
                  </Text>

                  {guidebookUnit.guidebook.map((tip, idx) => (
                    <Tactile3DBox
                      key={idx}
                      depth={4}
                      borderRadius={16}
                      faceColor={Colors.card}
                      lipColor={Colors.cardLip}
                      borderColor={Colors.border}
                      faceStyle={styles.tipCardFace}
                    >
                      <View style={styles.tipHeaderRow}>
                        <View
                          style={[
                            styles.tipBadge,
                            { backgroundColor: guidebookUnit.color },
                          ]}
                        >
                          <Text style={styles.tipBadgeText}>
                            KEY TIP {idx + 1}
                          </Text>
                        </View>
                        <Text style={styles.tipHeading}>{tip.heading}</Text>
                      </View>
                      <Text style={styles.tipSummary}>{tip.summary}</Text>
                      <IDEWindow
                        title={`example_${idx + 1}.${course.fileExt}`}
                        lines={tip.code}
                      />
                    </Tactile3DBox>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  // Pinned Top Unit Banner above ScrollView so nodes clip cleanly underneath
  pinnedBannerContainer: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    zIndex: 200,
    elevation: 10,
  },
  inlineUnitBannerWrap: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  unitBannerOuterLip: {
    borderRadius: 16,
    paddingBottom: 5,
  },
  unitBannerFace: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: 78,
  },
  unitBannerLeftCol: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  unitSectionSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: 'rgba(255, 255, 255, 0.72)',
    marginBottom: 3,
  },
  unitTitleText: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '800',
    color: Colors.white,
  },
  unitBannerDivider: {
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  unitBannerRightCol: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ScrollView & Path
  scrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: 36,
    paddingBottom: 160,
  },
  unitSectionWrap: {
    width: '100%',
  },
  unitPathSection: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  nodeRowWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 11,
  },
  nodeOffsetBox: {
    alignItems: 'center',
  },
  // Crisp 3D "START" Speech Bubble
  startBubbleWrapper: {
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 30,
  },
  startBubbleBox: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  startBubbleText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '900',
    color: Colors.violet,
    letterSpacing: 0.8,
  },
  startBubbleTriangle: {
    width: 12,
    height: 12,
    backgroundColor: Colors.card,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.border,
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
  // Perfectly Centered Oval Ring around the 68x64 3D Puck (5px equal gap all around)
  activeOvalRing: {
    width: 88,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Absolute Floating Node Popover Overlay (Always 10px Below the Tapped Node/Ring)
  popoverAbsoluteAnchor: {
    position: 'absolute',
    top: '100%',
    marginTop: 10,
    width: 290,
    alignItems: 'center',
    zIndex: 100,
  },
  popoverDiamondArrow: {
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    marginBottom: -7,
    zIndex: 2,
  },
  popoverOuterLip: {
    width: 290,
    borderRadius: 18,
    paddingBottom: 5,
  },
  popoverFace: {
    width: 290,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
    gap: 8,
  },
  popoverTitle: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  popoverSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 6,
  },
  popoverStartBtnFace: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverStartBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  lockedActionBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedActionText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDisabled,
    letterSpacing: 0.8,
  },
  // Floating Jump-to-Current Button
  jumpBtn: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  // Guidebook Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  guideModal: {
    maxHeight: '88%',
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 4,
    gap: 12,
  },
  guideHeaderKicker: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.9,
  },
  guideHeaderTitle: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  guideCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBody: {
    padding: 20,
    gap: 18,
  },
  guideIntro: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  tipCardFace: {
    padding: 16,
    gap: 12,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  tipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tipBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  tipHeading: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  tipSummary: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
