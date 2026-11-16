import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  View,
  Text,
  PanResponder,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Href, router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { LANGUAGES, LangId, getLanguage } from '@/data/courses';
import {
  BLITZ_HEART_REWARD,
  REFILL_COST,
  SINGLE_HEART_COST,
  useGame,
} from '@/store/GameStore';
import { errorHaptic, tapHaptic, successHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import { GemShopModal } from './shop/GemShopModal';
import { GemIcon, HeartIcon } from './ui/CurrencyIcons';
import { CurrencyPillButton } from './ui/CurrencyPillButton';
import { LanguageLogo } from './LanguageLogo';
import { SpringPressable } from './CyberButton';

// Expo SDK 58 Windows typed-routes omits `/` for `(tabs)/index`; runtime requires `/`.
const LEARN_ROUTE = '/' as unknown as Href;

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Top telemetry & language bar for the Learn screen:
 * 1. Left Pill — Energy / Hearts (Vibrant Red Heart)
 * 2. Center Pill — Wide Language Selector (Colored Brand Logo + Full Language Name + Chevron)
 * 3. Right Pill — Gems / Shards (Faceted Cyan-Blue Diamond)
 */
export function StatsHeader() {
  const {
    activeLang,
    setActiveLang,
    gems,
    hearts,
    maxHearts,
    completedNodes,
    isXpBoostActive,
    refillHearts,
    buySingleHeart,
    requestBlitzRecovery,
  } = useGame();

  const [shopOpen, setShopOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<'hearts' | 'gems' | null>(null);
  const [popupFeedback, setPopupFeedback] = useState<{
    tone: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const popupScale = useRef(new Animated.Value(0.92)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const [sheetOpen, setSheetOpen] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const currentCourse = getLanguage(activeLang);

  const openSheet = () => {
    playSound('drawer_open');
    setSheetOpen(true);
    backdropOpacity.stopAnimation();
    sheetTranslateY.stopAnimation();
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(SCREEN_HEIGHT);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = (afterClose?: () => void, silent = false) => {
    if (!silent) playSound('drawer_close');
    backdropOpacity.stopAnimation();
    sheetTranslateY.stopAnimation();

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
      setSheetOpen(false);
      afterClose?.();
    });
  };

  const closeSheetRef = useRef(closeSheet);
  useEffect(() => {
    closeSheetRef.current = closeSheet;
  });

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.15,
        onPanResponderMove: (_, gs) => {
          const dy = Math.max(0, gs.dy);
          sheetTranslateY.setValue(dy);
          backdropOpacity.setValue(Math.max(0, 1 - dy / 340));
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > 90 || gs.vy > 0.55) {
            tapHaptic();
            closeSheetRef.current();
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

  const handleSelectCourse = (id: LangId) => {
    const changed = id !== activeLang;
    if (changed) {
      playSound('select');
    }
    setActiveLang(id);
    closeSheet(undefined, changed);
  };

  const openPopup = (kind: 'hearts' | 'gems') => {
    playSound('drawer_open');
    setPopupFeedback(null);
    setActivePopup(kind);
    popupScale.stopAnimation();
    popupOpacity.stopAnimation();
    popupScale.setValue(0.92);
    popupOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(popupScale, {
        toValue: 1,
        damping: 26,
        stiffness: 340,
        mass: 0.75,
        overshootClamping: true,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePopup = (afterClose?: () => void, silent = false) => {
    if (!silent) playSound('drawer_close');
    popupScale.stopAnimation();
    popupOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(popupScale, {
        toValue: 0.94,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActivePopup(null);
      setPopupFeedback(null);
      afterClose?.();
    });
  };

  const handleBuyFullHearts = () => {
    if (hearts >= maxHearts) {
      tapHaptic();
      playSound('tap');
      setPopupFeedback({
        tone: 'info',
        message: `All ${maxHearts}/${maxHearts} hearts are already full.`,
      });
      return;
    }
    if (refillHearts()) {
      successHaptic();
      playSound('coin');
      setPopupFeedback({
        tone: 'success',
        message: `Spent ${REFILL_COST} gems to restore ${maxHearts}/${maxHearts} hearts.`,
      });
    } else {
      errorHaptic();
      playSound('wrong');
      setPopupFeedback({
        tone: 'error',
        message: `Need ${REFILL_COST - gems} more gems for a full refill.`,
      });
    }
  };

  const handleBuySingleHeart = () => {
    if (hearts >= maxHearts) {
      tapHaptic();
      playSound('tap');
      setPopupFeedback({
        tone: 'info',
        message: `All ${maxHearts}/${maxHearts} hearts are already full.`,
      });
      return;
    }
    if (buySingleHeart()) {
      successHaptic();
      playSound('coin');
      setPopupFeedback({
        tone: 'success',
        message: `Bought +1 heart for ${SINGLE_HEART_COST} gems.`,
      });
    } else {
      errorHaptic();
      playSound('wrong');
      setPopupFeedback({
        tone: 'error',
        message: `Need ${SINGLE_HEART_COST - gems} more gems for +1 heart.`,
      });
    }
  };

  const handleLaunchBlitzFromPopup = () => {
    playSound('run_code');
    closePopup(() => {
      requestBlitzRecovery();
      router.navigate('/sandbox');
    }, true);
  };

  const handleGoToLearnFromPopup = () => {
    playSound('select');
    closePopup(() => {
      router.navigate(LEARN_ROUTE);
    }, true);
  };

  return (
    <>
      <View style={styles.bar}>
        {/* 1. Left Pill — Energy / Hearts */}
        <CurrencyPillButton
          value={hearts}
          onPress={() => openPopup('hearts')}
          hitSlop={6}
          haptic="light"
          sound="none"
          accessibilityRole="button"
          accessibilityLabel="Hearts status"
          style={styles.sidePill}
        >
          <HeartIcon size={18} depleted={hearts === 0} />
          <Text style={styles.pillValue}>{hearts}</Text>
        </CurrencyPillButton>

        {/* 2. Center Pill — Wide Language Selector */}
        <SpringPressable
          onPress={openSheet}
          hitSlop={6}
          haptic="selection"
          sound="none"
          pressScale={0.96}
          accessibilityRole="button"
          accessibilityLabel="Switch language"
          style={styles.centerLangPill}
        >
          <LanguageLogo language={activeLang} size={18} />
          <Text style={styles.langLabel} numberOfLines={1}>
            {currentCourse.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#94A3B8" />
        </SpringPressable>

        {/* 3. Right Pill — Interactive Gems / Armory Shop */}
        <CurrencyPillButton
          value={gems}
          onPress={() => {
            tapHaptic();
            playSound('drawer_open');
            setShopOpen(true);
          }}
          hitSlop={6}
          haptic="selection"
          sound="none"
          accessibilityRole="button"
          accessibilityLabel="Open Gem Shop"
          style={styles.sidePill}
        >
          <GemIcon size={18} />
          <Text style={styles.pillValue}>{gems}</Text>
          {isXpBoostActive ? (
            <View style={styles.headerBoostBadge}>
              <Text style={styles.headerBoostText}>2x</Text>
            </View>
          ) : null}
        </CurrencyPillButton>
      </View>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeSheet()}
      >
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.backdropOverlay,
              { opacity: backdropOpacity },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeSheet()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View {...sheetPanResponder.panHandlers}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>SELECT LANGUAGE</Text>
                <SpringPressable
                  onPress={() => closeSheet()}
                  hitSlop={8}
                  haptic="light"
                  sound="none"
                  pressScale={0.93}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={16} color={Colors.textSecondary} />
                </SpringPressable>
              </View>
            </View>

            <ScrollView
              style={styles.courseScroll}
              contentContainerStyle={styles.courseList}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((lang) => {
                const isSelected = lang.id === activeLang;
                const doneCount = (completedNodes[lang.id] ?? []).length;
                const totalNodes = lang.units.reduce(
                  (acc, u) => acc + u.nodes.length,
                  0,
                );
                const pct =
                  totalNodes > 0
                    ? Math.min(100, Math.round((doneCount / totalNodes) * 100))
                    : 0;

                return (
                  <SpringPressable
                    key={lang.id}
                    onPress={() => handleSelectCourse(lang.id)}
                    haptic="selection"
                    sound="none"
                    pressScale={0.98}
                    style={[
                      styles.courseRow,
                      isSelected && styles.courseRowActive,
                    ]}
                  >
                    <View style={styles.courseLogoBox}>
                      <LanguageLogo language={lang.id} size={20} />
                    </View>

                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{lang.name}</Text>
                      <Text style={styles.courseMeta}>
                        {`${doneCount}/${totalNodes} lessons · ${pct}%`}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.activeCheck}>
                        <Feather name="check" size={11} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </SpringPressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ─── Hearts Refill & How-to-Get-Gems Popups ────────────────────────── */}
      <Modal
        visible={activePopup !== null}
        transparent
        animationType="none"
        onRequestClose={() => closePopup()}
      >
        <View style={styles.vaultBackdrop}>
          <Animated.View
            style={[styles.vaultOverlay, { opacity: popupOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closePopup()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.vaultCard,
              {
                opacity: popupOpacity,
                transform: [{ scale: popupScale }],
              },
            ]}
          >
            {activePopup === 'hearts' ? (
              <>
                <View style={styles.vaultHeader}>
                  <View style={styles.vaultTitleGroup}>
                    <View
                      style={[
                        styles.vaultIconBadge,
                        {
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          borderColor: 'rgba(239, 68, 68, 0.28)',
                        },
                      ]}
                    >
                      <HeartIcon size={18} depleted={hearts === 0} />
                    </View>
                    <View style={styles.vaultHeaderCopy}>
                      <Text style={styles.vaultTitle}>Heart Vault</Text>
                      <Text style={styles.vaultSubtitle}>
                        {hearts >= maxHearts
                          ? 'Full hearts ready for lessons'
                          : 'Refill hearts using Gems or Bug Blitz'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vaultGemPill}>
                    <GemIcon size={13} />
                    <Text style={styles.vaultGemPillText}>{gems}</Text>
                  </View>
                </View>

                <View style={styles.heartMeterCard}>
                  <View style={styles.heartIconsRow}>
                    {Array.from({ length: maxHearts }).map((_, idx) => {
                      const active = idx < hearts;
                      return (
                        <HeartIcon
                          key={idx}
                          size={21}
                          depleted={!active}
                        />
                      );
                    })}
                  </View>
                  <Text style={styles.heartCountMono}>
                    {hearts}/{maxHearts}
                  </Text>
                </View>

                {popupFeedback ? (
                  <View
                    style={[
                      styles.vaultFeedback,
                      popupFeedback.tone === 'success' &&
                        styles.vaultFeedbackSuccess,
                      popupFeedback.tone === 'error' &&
                        styles.vaultFeedbackError,
                    ]}
                  >
                    <Ionicons
                      name={
                        popupFeedback.tone === 'success'
                          ? 'checkmark-circle'
                          : popupFeedback.tone === 'error'
                            ? 'alert-circle'
                            : 'information-circle'
                      }
                      size={15}
                      color={
                        popupFeedback.tone === 'success'
                          ? '#34D399'
                          : popupFeedback.tone === 'error'
                            ? '#EF4444'
                            : '#C4B5FD'
                      }
                    />
                    <Text style={styles.vaultFeedbackText}>
                      {popupFeedback.message}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.vaultActionStack}>
                  <SpringPressable
                    onPress={handleBuyFullHearts}
                    haptic="medium"
                    sound="none"
                    pressScale={0.98}
                    style={[
                      styles.vaultOptionRow,
                      hearts >= maxHearts && styles.vaultOptionRowMuted,
                    ]}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View style={styles.vaultOptionIcon}>
                        <HeartIcon size={16} />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          Refill All {maxHearts} Hearts
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          Restore to {maxHearts}/{maxHearts} capacity
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.vaultCostPill,
                        hearts < maxHearts &&
                          gems >= REFILL_COST &&
                          styles.vaultCostPillReady,
                      ]}
                    >
                      <GemIcon size={12} />
                      <Text style={styles.vaultCostText}>{REFILL_COST}</Text>
                    </View>
                  </SpringPressable>

                  <SpringPressable
                    onPress={handleBuySingleHeart}
                    haptic="light"
                    sound="none"
                    pressScale={0.98}
                    style={[
                      styles.vaultOptionRow,
                      hearts >= maxHearts && styles.vaultOptionRowMuted,
                    ]}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View style={styles.vaultOptionIcon}>
                        <Feather name="plus" size={15} color="#EF4444" />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          Buy +1 Heart
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          Quick single-heart top up
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.vaultCostPill,
                        hearts < maxHearts &&
                          gems >= SINGLE_HEART_COST &&
                          styles.vaultCostPillReady,
                      ]}
                    >
                      <GemIcon size={12} />
                      <Text style={styles.vaultCostText}>
                        {SINGLE_HEART_COST}
                      </Text>
                    </View>
                  </SpringPressable>

                  <SpringPressable
                    onPress={handleLaunchBlitzFromPopup}
                    haptic="medium"
                    sound="none"
                    pressScale={0.98}
                    style={styles.vaultOptionRow}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View
                        style={[
                          styles.vaultOptionIcon,
                          { backgroundColor: 'rgba(124, 92, 252, 0.16)' },
                        ]}
                      >
                        <Ionicons name="flash" size={16} color="#C4B5FD" />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          Play 60s Bug Blitz
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          Spot bugs to recover hearts free
                        </Text>
                      </View>
                    </View>
                    <View style={styles.vaultFreePill}>
                      <Text style={styles.vaultFreeText}>
                        +{BLITZ_HEART_REWARD} FREE
                      </Text>
                    </View>
                  </SpringPressable>
                </View>

                <View style={styles.vaultFooter}>
                  <SpringPressable
                    onPress={() => {
                      tapHaptic();
                      setPopupFeedback(null);
                      setActivePopup('gems');
                    }}
                    haptic="selection"
                    pressScale={0.97}
                    style={styles.vaultSecondaryBtn}
                  >
                    <Ionicons name="diamond" size={13} color="#38BDF8" />
                    <Text style={styles.vaultSecondaryBtnText}>
                      How to Get Gems
                    </Text>
                  </SpringPressable>

                  <SpringPressable
                    onPress={() => closePopup()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.vaultPrimaryBtn}
                  >
                    <Text style={styles.vaultPrimaryBtnText}>Done</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activePopup === 'gems' ? (
              <>
                <View style={styles.vaultHeader}>
                  <View style={styles.vaultTitleGroup}>
                    <View
                      style={[
                        styles.vaultIconBadge,
                        {
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          borderColor: 'rgba(56, 189, 248, 0.28)',
                        },
                      ]}
                    >
                      <GemIcon size={18} />
                    </View>
                    <View style={styles.vaultHeaderCopy}>
                      <Text style={styles.vaultTitle}>How to Get Gems</Text>
                      <Text style={styles.vaultSubtitle}>
                        Earn gems across paths &amp; Bug Blitz
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vaultGemPill}>
                    <GemIcon size={13} />
                    <Text style={styles.vaultGemPillText}>{gems}</Text>
                  </View>
                </View>

                <View style={styles.vaultActionStack}>
                  <SpringPressable
                    onPress={handleGoToLearnFromPopup}
                    haptic="selection"
                    sound="none"
                    pressScale={0.98}
                    style={styles.vaultOptionRow}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View
                        style={[
                          styles.vaultOptionIcon,
                          { backgroundColor: 'rgba(124, 92, 252, 0.16)' },
                        ]}
                      >
                        <Ionicons name="code-slash" size={15} color="#C4B5FD" />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          Complete Lessons
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          Finish any standard coding node
                        </Text>
                      </View>
                    </View>
                    <View style={styles.vaultRewardPill}>
                      <GemIcon size={12} />
                      <Text style={styles.vaultRewardText}>+10</Text>
                    </View>
                  </SpringPressable>

                  <SpringPressable
                    onPress={handleGoToLearnFromPopup}
                    haptic="selection"
                    sound="none"
                    pressScale={0.98}
                    style={styles.vaultOptionRow}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View
                        style={[
                          styles.vaultOptionIcon,
                          { backgroundColor: 'rgba(56, 189, 248, 0.14)' },
                        ]}
                      >
                        <Ionicons name="cube" size={15} color="#38BDF8" />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          Crack Checkpoint Cubes
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          Mid-unit mixed code challenges
                        </Text>
                      </View>
                    </View>
                    <View style={styles.vaultRewardPill}>
                      <GemIcon size={12} />
                      <Text style={styles.vaultRewardText}>+25</Text>
                    </View>
                  </SpringPressable>

                  <SpringPressable
                    onPress={handleGoToLearnFromPopup}
                    haptic="selection"
                    sound="none"
                    pressScale={0.98}
                    style={styles.vaultOptionRow}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View
                        style={[
                          styles.vaultOptionIcon,
                          { backgroundColor: 'rgba(251, 191, 36, 0.14)' },
                        ]}
                      >
                        <Ionicons name="trophy" size={15} color="#FBBF24" />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          Defeat Unit Bosses
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          Clear end-of-unit mastery trials
                        </Text>
                      </View>
                    </View>
                    <View style={styles.vaultRewardPill}>
                      <GemIcon size={12} />
                      <Text style={styles.vaultRewardText}>+25</Text>
                    </View>
                  </SpringPressable>

                  <SpringPressable
                    onPress={handleLaunchBlitzFromPopup}
                    haptic="selection"
                    sound="none"
                    pressScale={0.98}
                    style={styles.vaultOptionRow}
                  >
                    <View style={styles.vaultOptionLeft}>
                      <View
                        style={[
                          styles.vaultOptionIcon,
                          { backgroundColor: 'rgba(52, 211, 153, 0.14)' },
                        ]}
                      >
                        <Ionicons name="bug" size={15} color="#34D399" />
                      </View>
                      <View style={styles.vaultOptionCopy}>
                        <Text style={styles.vaultOptionTitle}>
                          60s Bug Blitz
                        </Text>
                        <Text style={styles.vaultOptionSub}>
                          +2 gems per bug spotted (up to +16)
                        </Text>
                      </View>
                    </View>
                    <View style={styles.vaultRewardPill}>
                      <GemIcon size={12} />
                      <Text style={styles.vaultRewardText}>+2/bug</Text>
                    </View>
                  </SpringPressable>
                </View>

                <View style={styles.vaultHintStrip}>
                  <HeartIcon size={13} />
                  <Text style={styles.vaultHintText}>
                    Spend {SINGLE_HEART_COST} gems for +1 heart or {REFILL_COST}{' '}
                    for a full 5-heart refill anytime.
                  </Text>
                </View>

                <View style={styles.vaultFooter}>
                  <SpringPressable
                    onPress={() => {
                      setPopupFeedback(null);
                      setActivePopup('hearts');
                    }}
                    haptic="selection"
                    sound="none"
                    pressScale={0.97}
                    style={styles.vaultSecondaryBtn}
                  >
                    <HeartIcon size={13} />
                    <Text style={styles.vaultSecondaryBtnText}>
                      Buy Hearts
                    </Text>
                  </SpringPressable>

                  <SpringPressable
                    onPress={() => {
                      tapHaptic();
                      playSound('drawer_open');
                      closePopup(() => setShopOpen(true), true);
                    }}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    pressTranslateY={2}
                    style={styles.vaultPrimaryBtn}
                  >
                    <Text style={styles.vaultPrimaryBtnText}>Open Armory →</Text>
                  </SpringPressable>
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>

      <GemShopModal visible={shopOpen} onClose={() => setShopOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.canvas,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sidePill: {
    backgroundColor: '#151421',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
    paddingHorizontal: 14,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  centerLangPill: {
    flexShrink: 1,
    backgroundColor: '#151421',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
    paddingHorizontal: 14,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: 108,
  },
  pillValue: {
    fontFamily: MONO,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#FAFAFA',
    fontVariant: ['tabular-nums'],
  },
  headerBoostBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.25)',
    borderWidth: 1,
    borderColor: '#7C5CFC',
  },
  headerBoostText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  langLabel: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#FAFAFA',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    maxHeight: '84%',
    backgroundColor: '#12111A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#252338',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 34,
  },
  courseScroll: {
    maxHeight: 440,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1.1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.control,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseList: {
    gap: 9,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#252338',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
    backgroundColor: '#151421',
  },
  courseRowActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderColor: '#7C5CFC',
    borderBottomColor: '#4C35B5',
  },
  courseLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#1E1C2D',
    borderWidth: 1,
    borderColor: '#2E2B44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    flex: 1,
    gap: 2,
  },
  courseTitle: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  courseMeta: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  activeCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  vaultOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4, 4, 8, 0.78)',
  },
  vaultCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 18,
    gap: 12,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  vaultTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  vaultIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultHeaderCopy: {
    flex: 1,
  },
  vaultTitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  vaultSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  vaultGemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.24)',
  },
  vaultGemPillText: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  heartMeterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  heartIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartCountMono: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  vaultFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.28)',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  vaultFeedbackSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.28)',
  },
  vaultFeedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  vaultFeedbackText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  vaultActionStack: {
    gap: 8,
  },
  vaultOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#0E0E15',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#242236',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  vaultOptionRowMuted: {
    opacity: 0.55,
  },
  vaultOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vaultOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultOptionCopy: {
    flex: 1,
  },
  vaultOptionTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  vaultOptionSub: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  vaultCostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vaultCostPillReady: {
    borderColor: 'rgba(56, 189, 248, 0.32)',
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
  },
  vaultCostText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  vaultFreePill: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultFreeText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: -0.2,
  },
  vaultRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.24)',
  },
  vaultRewardText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#BAE6FD',
    letterSpacing: -0.2,
  },
  vaultHintStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161522',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  vaultHintText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  vaultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  vaultSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
  },
  vaultSecondaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  vaultPrimaryBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 3,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultPrimaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
