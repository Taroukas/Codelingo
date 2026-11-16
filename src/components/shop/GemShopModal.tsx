import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpringPressable } from '@/components/CyberButton';
import { JigglePressable } from '@/components/ui/JigglePressable';
import {
  getRoboSkinSpec,
  ROBO_SKINS,
  RoboMascot,
  type RoboSkinId,
} from '@/components/ide/RoboMascot';
import { GemIcon, HeartIcon } from '@/components/ui/CurrencyIcons';
import { playTactileSound } from '@/services/soundEngine';
import {
  HEART_REFILL_COST,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_COST,
  useUserStore,
  XP_OVERCLOCK_COST,
} from '@/store/useUserStore';
import { MONO, UI_FONT } from '@/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface GemShopModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatCountdown(totalSec: number): string {
  const safe = Math.max(0, totalSec);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function GemShopModal({ visible, onClose }: GemShopModalProps) {
  const insets = useSafeAreaInsets();
  const {
    gems,
    hearts,
    maxHearts,
    streakFreezes,
    isXpBoostActive,
    xpBoostRemainingSec,
    unlockedRoboSkins,
    equippedRoboSkin,
    refillHeartsWithGems,
    buyStreakFreeze,
    activateXpOverclock,
    purchaseRoboSkin,
    equipRoboSkin,
  } = useUserStore();

  const [previewSkin, setPreviewSkin] = useState<RoboSkinId>(equippedRoboSkin);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (prevVisible !== visible) {
    setPrevVisible(visible);
    if (visible) {
      setPreviewSkin(equippedRoboSkin);
      setFeedback(null);
    }
  }

  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const previewPopScale = useRef(new Animated.Value(1)).current;
  const isDismissingRef = useRef(false);

  const pulsePreviewStage = useCallback(() => {
    previewPopScale.stopAnimation();
    previewPopScale.setValue(0.95);
    Animated.spring(previewPopScale, {
      toValue: 1,
      damping: 20,
      stiffness: 340,
      mass: 0.7,
      overshootClamping: true,
      useNativeDriver: true,
    }).start();
  }, [previewPopScale]);

  useEffect(() => {
    if (!visible) return;
    isDismissingRef.current = false;
    sheetTranslateY.stopAnimation();
    backdropOpacity.stopAnimation();
    sheetTranslateY.setValue(SCREEN_HEIGHT);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdropOpacity, sheetTranslateY]);

  const dismissSheet = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    playTactileSound('token_snap');
    sheetTranslateY.stopAnimation();
    backdropOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      isDismissingRef.current = false;
      onClose();
    });
  }, [backdropOpacity, onClose, sheetTranslateY]);

  const dismissSheetRef = useRef(dismissSheet);
  useEffect(() => {
    dismissSheetRef.current = dismissSheet;
  }, [dismissSheet]);

  const shopPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.15,
        onPanResponderMove: (_, gs) => {
          const dy = Math.max(0, gs.dy);
          sheetTranslateY.setValue(dy);
          backdropOpacity.setValue(Math.max(0, 1 - dy / 360));
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > 95 || gs.vy > 0.55) {
            dismissSheetRef.current();
            return;
          }
          Animated.parallel([
            Animated.spring(sheetTranslateY, {
              toValue: 0,
              damping: 30,
              stiffness: 340,
              mass: 0.8,
              overshootClamping: true,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(sheetTranslateY, {
              toValue: 0,
              damping: 30,
              stiffness: 340,
              mass: 0.8,
              overshootClamping: true,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [backdropOpacity, sheetTranslateY],
  );

  const activePreviewSpec = useMemo(
    () => getRoboSkinSpec(previewSkin),
    [previewSkin],
  );

  const handleHeartRefill = () => {
    if (hearts >= maxHearts) {
      setFeedback({
        tone: 'error',
        text: `Your hearts are already full (${hearts}/${maxHearts}).`,
      });
      return;
    }
    const ok = refillHeartsWithGems();
    if (ok) {
      playTactileSound('correct');
      setFeedback({
        tone: 'success',
        text: `Restored to ${maxHearts}/${maxHearts} Hearts!`,
      });
    } else {
      playTactileSound('error');
      setFeedback({
        tone: 'error',
        text: `Need ${HEART_REFILL_COST - gems} more gems for a full heart refill.`,
      });
    }
  };

  const handleStreakFreeze = () => {
    if (streakFreezes >= MAX_STREAK_FREEZES) {
      setFeedback({
        tone: 'error',
        text: `Maximum ${MAX_STREAK_FREEZES} Streak Freezes equipped.`,
      });
      return;
    }
    const ok = buyStreakFreeze();
    if (ok) {
      playTactileSound('correct');
      setFeedback({
        tone: 'success',
        text: 'Cryogenic Streak Freeze equipped!',
      });
    } else {
      playTactileSound('error');
      setFeedback({
        tone: 'error',
        text: `Need ${STREAK_FREEZE_COST - gems} more gems for a Streak Freeze.`,
      });
    }
  };

  const handleXpOverclock = () => {
    const ok = activateXpOverclock();
    if (ok) {
      playTactileSound('combo_up', { comboCount: 4 });
      setFeedback({
        tone: 'success',
        text: '2x XP Overclock online for 15 minutes!',
      });
    } else {
      playTactileSound('error');
      setFeedback({
        tone: 'error',
        text: `Need ${XP_OVERCLOCK_COST - gems} more gems for 2x XP Overclock.`,
      });
    }
  };

  const handleSkinAction = (skinId: RoboSkinId, cost: number) => {
    setPreviewSkin(skinId);
    const unlocked = unlockedRoboSkins.includes(skinId);
    if (unlocked) {
      if (equippedRoboSkin !== skinId) {
        equipRoboSkin(skinId);
        playTactileSound('token_snap');
        setFeedback({
          tone: 'success',
          text: `${getRoboSkinSpec(skinId).name} chassis equipped!`,
        });
      }
      return;
    }

    const ok = purchaseRoboSkin(skinId, cost);
    if (ok) {
      playTactileSound('level_complete');
      setFeedback({
        tone: 'success',
        text: `Unlocked & equipped ${getRoboSkinSpec(skinId).name}!`,
      });
    } else {
      playTactileSound('error');
      setFeedback({
        tone: 'error',
        text: `Need ${cost - gems} more gems to unlock ${getRoboSkinSpec(skinId).name}.`,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissSheet}
    >
      <View style={styles.sheetBackdrop}>
        <Animated.View
          style={[styles.sheetOverlay, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissSheet} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View {...shopPanResponder.panHandlers}>
            <View style={styles.dragHandleWrap}>
              <View style={styles.dragHandle} />
            </View>

            {/* Top Bar */}
            <View style={styles.headerBar}>
              <SpringPressable
                onPress={dismissSheet}
                hitSlop={10}
                haptic="light"
                sound="none"
                pressScale={0.94}
                style={styles.closeBtn}
                accessibilityLabel="Close Gem Shop"
              >
                <Ionicons name="close" size={18} color="#E2E8F0" />
              </SpringPressable>

              <Text style={styles.headerTitle}>Gem Armory &amp; Shop</Text>

              <View style={styles.balancePill}>
                <GemIcon size={16} />
                <Text style={styles.balanceText}>{gems}</Text>
              </View>
            </View>
          </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {feedback ? (
            <View
              style={[
                styles.feedbackBanner,
                feedback.tone === 'success'
                  ? styles.feedbackSuccess
                  : styles.feedbackError,
              ]}
            >
              <Ionicons
                name={
                  feedback.tone === 'success'
                    ? 'checkmark-circle'
                    : 'alert-circle'
                }
                size={16}
                color={feedback.tone === 'success' ? '#34D399' : '#FCA5A5'}
              />
              <Text style={styles.feedbackText}>{feedback.text}</Text>
            </View>
          ) : null}

          {/* SECTION 1: Power-Ups & Refills */}
          <Text style={styles.sectionTitle}>Power-Ups &amp; Refills</Text>

          <View style={styles.stackCard}>
            {/* Full Heart Refill (100 Gems) */}
            <View style={styles.shopRow}>
              <View style={styles.shopIconBoxHeart}>
                <HeartIcon size={22} depleted={hearts === 0} />
              </View>
              <View style={styles.shopCopy}>
                <Text style={styles.shopItemTitle}>Full Heart Refill</Text>
                <Text style={styles.shopItemSub}>
                  Restore Hearts to {maxHearts}/{maxHearts} · Currently {hearts}/
                  {maxHearts}
                </Text>
              </View>
              <SpringPressable
                onPress={handleHeartRefill}
                haptic="medium"
                sound="none"
                pressScale={0.95}
                pressTranslateY={2}
                style={[
                  styles.pricePillBtn,
                  hearts >= maxHearts
                    ? styles.pricePillMuted
                    : gems >= HEART_REFILL_COST
                    ? styles.pricePillReady
                    : styles.pricePillLocked,
                ]}
              >
                {hearts >= maxHearts ? (
                  <Text style={styles.priceTextMuted}>FULL</Text>
                ) : (
                  <>
                    <GemIcon size={13} />
                    <Text style={styles.priceText}>{HEART_REFILL_COST}</Text>
                  </>
                )}
              </SpringPressable>
            </View>

            <View style={styles.rowDivider} />

            {/* Streak Freeze (200 Gems) */}
            <View style={styles.shopRow}>
              <View style={styles.shopIconBoxFreeze}>
                <Ionicons name="snow" size={20} color="#38BDF8" />
              </View>
              <View style={styles.shopCopy}>
                <Text style={styles.shopItemTitle}>Streak Freeze</Text>
                <Text style={styles.shopItemSub}>
                  Cryogenic shield · {streakFreezes}/{MAX_STREAK_FREEZES} Equipped
                </Text>
              </View>
              <SpringPressable
                onPress={handleStreakFreeze}
                haptic="medium"
                sound="none"
                pressScale={0.95}
                pressTranslateY={2}
                style={[
                  styles.pricePillBtn,
                  streakFreezes >= MAX_STREAK_FREEZES
                    ? styles.pricePillMuted
                    : gems >= STREAK_FREEZE_COST
                    ? styles.pricePillReady
                    : styles.pricePillLocked,
                ]}
              >
                {streakFreezes >= MAX_STREAK_FREEZES ? (
                  <Text style={styles.priceTextMuted}>MAXED</Text>
                ) : (
                  <>
                    <GemIcon size={13} />
                    <Text style={styles.priceText}>{STREAK_FREEZE_COST}</Text>
                  </>
                )}
              </SpringPressable>
            </View>

            <View style={styles.rowDivider} />

            {/* 2x XP Overclock (150 Gems) */}
            <View style={styles.shopRow}>
              <View style={styles.shopIconBoxBoost}>
                <Ionicons name="flash" size={20} color="#A78BFA" />
              </View>
              <View style={styles.shopCopy}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.shopItemTitle}>2x XP Overclock</Text>
                  {isXpBoostActive ? (
                    <View style={styles.liveBoostBadge}>
                      <Text style={styles.liveBoostText}>
                        LIVE {formatCountdown(xpBoostRemainingSec)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.shopItemSub}>
                  Double all XP earned for 15 minutes
                </Text>
              </View>
              <SpringPressable
                onPress={handleXpOverclock}
                haptic="medium"
                sound="none"
                pressScale={0.95}
                pressTranslateY={2}
                style={[
                  styles.pricePillBtn,
                  gems >= XP_OVERCLOCK_COST
                    ? styles.pricePillReady
                    : styles.pricePillLocked,
                ]}
              >
                <GemIcon size={13} />
                <Text style={styles.priceText}>{XP_OVERCLOCK_COST}</Text>
              </SpringPressable>
            </View>
          </View>

          {/* SECTION 2: Unlockable RoboMascot Chassis Skins */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>RoboCopilot Chassis Skins</Text>
            <Text style={styles.sectionMeta}>
              {unlockedRoboSkins.length}/{ROBO_SKINS.length} UNLOCKED
            </Text>
          </View>

          {/* Interactive Live Preview Stage */}
          <Animated.View
            style={[
              styles.previewStage,
              { transform: [{ scale: previewPopScale }] },
            ]}
          >
            <RoboMascot size={74} mood="happy" skin={previewSkin} />
            <View style={styles.previewCopy}>
              <View style={styles.previewEyebrowRow}>
                <Text style={styles.previewEyebrow}>LIVE CHASSIS PREVIEW</Text>
                {equippedRoboSkin === previewSkin ? (
                  <View style={styles.equippedTag}>
                    <Text style={styles.equippedTagText}>EQUIPPED</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.previewTitle}>{activePreviewSpec.name}</Text>
              <Text style={styles.previewDesc} numberOfLines={2}>
                {activePreviewSpec.tagline}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.skinList}>
            {ROBO_SKINS.map((skin) => {
              const unlocked = unlockedRoboSkins.includes(skin.id);
              const equipped = equippedRoboSkin === skin.id;
              const isSelectedPreview = previewSkin === skin.id;
              const canAfford = gems >= skin.cost;

              return (
                <View
                  key={skin.id}
                  style={[
                    styles.skinCard,
                    isSelectedPreview && styles.skinCardFocused,
                  ]}
                >
                  <JigglePressable
                    onPress={() => {
                      playTactileSound('token_snap');
                      setPreviewSkin(skin.id);
                      pulsePreviewStage();
                    }}
                    pressScaleX={1.03}
                    pressScaleY={0.94}
                    pressTranslateY={2}
                    haptic="selection"
                    style={styles.skinPreviewTap}
                  >
                    <RoboMascot
                      size={46}
                      mood="idle"
                      skin={skin.id}
                      interactive={false}
                    />

                    <View style={styles.skinInfo}>
                      <View style={styles.skinNameRow}>
                        <Text style={styles.skinName}>{skin.name}</Text>
                        <View
                          style={[
                            styles.skinSwatch,
                            { backgroundColor: skin.eyeColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.skinTagline} numberOfLines={1}>
                        {skin.tagline}
                      </Text>
                    </View>
                  </JigglePressable>

                  <SpringPressable
                    onPress={() => {
                      handleSkinAction(skin.id, skin.cost);
                      pulsePreviewStage();
                    }}
                    haptic="medium"
                    pressScale={0.95}
                    pressTranslateY={2}
                    style={[
                      styles.skinActionBtn,
                      equipped
                        ? styles.skinBtnEquipped
                        : unlocked
                        ? styles.skinBtnEquip
                        : canAfford
                        ? styles.skinBtnBuy
                        : styles.skinBtnLocked,
                    ]}
                  >
                    {equipped ? (
                      <Text style={styles.skinBtnEquippedText}>EQUIPPED ✓</Text>
                    ) : unlocked ? (
                      <Text style={styles.skinBtnEquipText}>Equip</Text>
                    ) : (
                      <View style={styles.skinBuyInner}>
                        <GemIcon size={13} />
                        <Text style={styles.skinBtnBuyText}>{skin.cost}</Text>
                      </View>
                    )}
                  </SpringPressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheetContainer: {
    height: Math.round(SCREEN_HEIGHT * 0.86),
    maxHeight: '92%',
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
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#12111A',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12111A',
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
  headerTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#171525',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
  },
  balanceText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.34)',
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.34)',
  },
  feedbackText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.7,
  },
  stackCard: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    overflow: 'hidden',
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  shopIconBoxHeart: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopIconBoxFreeze: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopIconBoxBoost: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 92, 252, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCopy: {
    flex: 1,
    gap: 3,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopItemTitle: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  shopItemSub: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  liveBoostBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.22)',
    borderWidth: 1,
    borderColor: '#7C5CFC',
  },
  liveBoostText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#DDD6FE',
    fontVariant: ['tabular-nums'],
  },
  pricePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 76,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  pricePillReady: {
    backgroundColor: '#1E1B30',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    borderBottomColor: '#0E1726',
  },
  pricePillLocked: {
    backgroundColor: '#181822',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: '#0E0D16',
    opacity: 0.65,
  },
  pricePillMuted: {
    backgroundColor: '#16161F',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: '#0E0D16',
  },
  priceText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
  },
  priceTextMuted: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  previewStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#151421',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.36)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
  },
  previewCopy: {
    flex: 1,
    gap: 3,
  },
  previewEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewEyebrow: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.7,
  },
  equippedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  equippedTagText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
  },
  previewTitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  previewDesc: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 17,
  },
  skinList: {
    gap: 10,
  },
  skinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#252338',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
  },
  skinPreviewTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skinCardFocused: {
    borderColor: 'rgba(124, 92, 252, 0.55)',
    borderBottomColor: '#4C35B5',
    backgroundColor: '#181628',
  },
  skinInfo: {
    flex: 1,
    gap: 3,
  },
  skinNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  skinName: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  skinSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skinTagline: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  skinActionBtn: {
    minWidth: 92,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinBtnEquipped: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(52, 211, 153, 0.40)',
    borderBottomColor: '#065F46',
  },
  skinBtnEquippedText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  skinBtnEquip: {
    backgroundColor: '#1E1B2E',
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomColor: '#100F1A',
  },
  skinBtnEquipText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  skinBtnBuy: {
    backgroundColor: '#7C5CFC',
    borderColor: '#957BFF',
    borderBottomColor: '#5639D6',
  },
  skinBtnLocked: {
    backgroundColor: '#181822',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: '#0E0D16',
    opacity: 0.65,
  },
  skinBuyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skinBtnBuyText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
});
