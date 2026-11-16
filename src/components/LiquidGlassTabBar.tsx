import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import Animated, {
  cancelAnimation,
  clamp,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import {
  GestureDetector,
  usePanGesture,
} from 'react-native-gesture-handler';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useSwipeTabsSync } from './SwipeTabsSync';

type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_ORDER = ['index', 'sandbox', 'leaderboard', 'profile'] as const;
const NUM_TABS = TAB_ORDER.length;
const MAX_TAB_INDEX = NUM_TABS - 1;

const DOCK_HORIZONTAL_MARGIN = 20;
const DOCK_HEIGHT = 64;
const DOCK_RADIUS = 32;
const INNER_PADDING = 5;
const PILL_HEIGHT = 54;
const PILL_RADIUS = 27;

const LENS_INFLATE_SPRING = {
  damping: 18,
  stiffness: 320,
} as const;

const FINGER_TRACK_SPRING = {
  damping: 35,
  stiffness: 600,
} as const;

const MAGNETIC_SNAP_SPRING = {
  damping: 20,
  stiffness: 280,
  mass: 0.7,
} as const;

const SCALE_SETTLE_SPRING = {
  damping: 15,
  stiffness: 260,
} as const;

const ICON_POP_SPRING = {
  damping: 16,
  stiffness: 320,
  mass: 0.65,
  restDisplacementThreshold: 0.008,
  restSpeedThreshold: 0.05,
} as const;

const TAB_CONFIGS: readonly TabConfig[] = [
  {
    name: 'index',
    label: 'Learn',
    activeIcon: 'terminal',
    inactiveIcon: 'terminal-outline',
  },
  {
    name: 'sandbox',
    label: 'Practice',
    activeIcon: 'code-slash',
    inactiveIcon: 'code-slash-outline',
  },
  {
    name: 'leaderboard',
    label: 'Leaderboard',
    activeIcon: 'trophy',
    inactiveIcon: 'trophy-outline',
  },
  {
    name: 'profile',
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

function triggerSelectionHaptic(): void {
  Haptics.selectionAsync().catch(() => {});
}

interface LiquidTabColumnProps {
  config: TabConfig;
  index: number;
  hoveredSlotSV: SharedValue<number>;
}

const LiquidTabColumn = React.memo(function LiquidTabColumn({
  config,
  index,
  hoveredSlotSV,
}: LiquidTabColumnProps) {
  const iconScale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);

  useAnimatedReaction(
    () => hoveredSlotSV.get() === index,
    (nowActive, wasActive) => {
      if (nowActive && !wasActive) {
        cancelAnimation(iconScale);
        cancelAnimation(iconTranslateY);
        if (wasActive === null) {
          iconScale.set(1);
          iconTranslateY.set(-1.5);
        } else {
          iconScale.set(0.92);
          iconScale.set(withSpring(1, ICON_POP_SPRING));
          iconTranslateY.set(withSpring(-1.5, ICON_POP_SPRING));
        }
      } else if (!nowActive && wasActive) {
        cancelAnimation(iconScale);
        cancelAnimation(iconTranslateY);
        iconScale.set(1);
        iconTranslateY.set(0);
      }
    },
  );

  const microPopStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: iconTranslateY.get() },
      { scale: iconScale.get() },
    ],
  }));

  const activeLayerStyle = useAnimatedStyle(() => ({
    opacity: hoveredSlotSV.get() === index ? 1 : 0,
  }));

  const inactiveLayerStyle = useAnimatedStyle(() => ({
    opacity: hoveredSlotSV.get() === index ? 0 : 1,
  }));

  return (
    <View style={styles.tabColumn} pointerEvents="none">
      <Animated.View style={[styles.tabContentWrap, microPopStyle]}>
        <Animated.View style={[styles.tabStateLayer, inactiveLayerStyle]}>
          <Ionicons
            name={config.inactiveIcon}
            size={21}
            color="#8E92A4"
            allowFontScaling={false}
          />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={[styles.tabLabel, styles.labelInactive]}
          >
            {config.label}
          </Text>
        </Animated.View>

        <Animated.View
          style={[styles.tabStateLayerOverlay, activeLayerStyle]}
        >
          <Ionicons
            name={config.activeIcon}
            size={21}
            color="#FFFFFF"
            allowFontScaling={false}
          />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={[styles.tabLabel, styles.labelActive]}
          >
            {config.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

export function LiquidGlassTabBar({
  state,
  descriptors,
  navigateToTab,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const swipeSync = useSwipeTabsSync();
  const { width: windowWidth } = useWindowDimensions();

  const initialDockWidth = Math.max(240, windowWidth - DOCK_HORIZONTAL_MARGIN * 2);
  const initialTabWidth = (initialDockWidth - INNER_PADDING * 2) / NUM_TABS;

  const visibleRoutes = useMemo(() => {
    return TAB_ORDER.map((name) =>
      state.routes.find(
        (r) => r.name === name || (name === 'sandbox' && r.name === 'practice'),
      ),
    ).filter((r): r is NonNullable<typeof r> => r !== undefined);
  }, [state.routes]);

  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute?.name ?? '';
  const normalizedRouteName =
    currentRouteName === 'practice' ? 'sandbox' : currentRouteName;
  const isPrimaryTabRoute = (TAB_ORDER as readonly string[]).includes(
    normalizedRouteName,
  );
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((r) => r.name === currentRouteName),
  );

  const currentOptions = (descriptors[currentRoute?.key]?.options ?? {}) as Record<
    string,
    unknown
  >;
  const tabBarStyle = currentOptions.tabBarStyle as
    | { display?: string }
    | undefined;
  const isTabBarHidden =
    tabBarStyle?.display === 'none' || !isPrimaryTabRoute;

  // Fallbacks when rendered outside SwipeTabs
  const fallbackPagerRef = useAnimatedRef<ScrollView>();
  const fallbackProgress = useSharedValue(activeVisibleIndex);
  const fallbackSwiping = useSharedValue(false);
  const fallbackPageWidth = useSharedValue(windowWidth);

  const pagerRef = swipeSync?.pagerRef ?? fallbackPagerRef;
  const pagerProgress = swipeSync?.pagerProgress ?? fallbackProgress;
  const isSwiping = swipeSync?.isSwiping ?? fallbackSwiping;
  const pageWidthSV = swipeSync?.pageWidthSV ?? fallbackPageWidth;
  const hasSwipePagerSV = useSharedValue(Boolean(swipeSync));

  // Pure UI-thread SharedValues — zero React state updates during gestures or animations
  const tabWidthSV = useSharedValue(initialTabWidth);
  const activeIndexSV = useSharedValue(activeVisibleIndex);
  const hoveredSlotSV = useSharedValue(activeVisibleIndex);
  const lastHoveredIndex = useSharedValue(activeVisibleIndex);

  const pillTranslateX = useSharedValue(activeVisibleIndex * initialTabWidth);
  const pillScaleX = useSharedValue(1);
  const pillScaleY = useSharedValue(1);
  const specularBoost = useSharedValue(0);

  const isTouchingDock = useSharedValue(false);
  const touchFinished = useSharedValue(true);
  const lastTouchX = useSharedValue(0);

  const visibleRoutesRef = useRef(visibleRoutes);
  const activeIndexRef = useRef(activeVisibleIndex);
  const committedByDockRef = useRef<number | null>(null);
  const swipeSyncRef = useRef(swipeSync);
  const navigateToTabRef = useRef(navigateToTab);

  useEffect(() => {
    visibleRoutesRef.current = visibleRoutes;
    activeIndexRef.current = activeVisibleIndex;
    swipeSyncRef.current = swipeSync;
    navigateToTabRef.current = navigateToTab;
    hasSwipePagerSV.set(Boolean(swipeSync));
    activeIndexSV.set(activeVisibleIndex);
  }, [
    visibleRoutes,
    activeVisibleIndex,
    swipeSync,
    navigateToTab,
    hasSwipePagerSV,
    activeIndexSV,
  ]);

  useEffect(() => {
    tabWidthSV.set(initialTabWidth);
    if (!isTouchingDock.get() && !isSwiping.get()) {
      pillTranslateX.set(activeIndexRef.current * initialTabWidth);
    }
  }, [tabWidthSV, initialTabWidth, isTouchingDock, isSwiping, pillTranslateX]);

  const handleDockLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const measuredDockW = e.nativeEvent.layout.width;
      if (measuredDockW > 0) {
        const nextTabW = (measuredDockW - INNER_PADDING * 2) / NUM_TABS;
        tabWidthSV.set(nextTabW);
        if (!isTouchingDock.get() && !isSwiping.get()) {
          pillTranslateX.set(activeIndexRef.current * nextTabW);
        }
      }
    },
    [tabWidthSV, isTouchingDock, isSwiping, pillTranslateX],
  );

  // Commit final tab route cleanly on finger release (or boundary crossing if needed)
  const commitTabOnRelease = useCallback((finalIdx: number) => {
    const clampedIdx = clamp(finalIdx, 0, MAX_TAB_INDEX);
    if (clampedIdx !== activeIndexRef.current) {
      committedByDockRef.current = clampedIdx;
      if (swipeSyncRef.current) {
        swipeSyncRef.current.commitTabFromBar(clampedIdx);
        return;
      }
      const route = visibleRoutesRef.current[clampedIdx];
      if (route) {
        navigateToTabRef.current(route.key);
      }
    }
  }, []);

  // Follow SwipeTabs screen horizontal drags at 120fps when dock isn't being touched
  useAnimatedReaction(
    () => (isSwiping.get() && !isTouchingDock.get() ? pagerProgress.get() : -1),
    (progress) => {
      if (progress >= 0) {
        const clamped = clamp(progress, 0, MAX_TAB_INDEX);
        const tabW = tabWidthSV.get();
        pillTranslateX.set(clamped * tabW);
        const rounded = Math.round(clamped);
        if (hoveredSlotSV.get() !== rounded) {
          hoveredSlotSV.set(rounded);
        }
      }
    },
  );

  // Sync external router jumps or completed screen swipes
  useEffect(() => {
    if (isTouchingDock.get()) {
      return;
    }

    if (committedByDockRef.current === activeVisibleIndex) {
      committedByDockRef.current = null;
      return;
    }
    committedByDockRef.current = null;

    const tabW = tabWidthSV.get();
    const targetX = activeVisibleIndex * tabW;
    hoveredSlotSV.set(activeVisibleIndex);
    lastHoveredIndex.set(activeVisibleIndex);

    if (Math.abs(pillTranslateX.get() - targetX) > 1) {
      cancelAnimation(pillTranslateX);
      pillTranslateX.set(withSpring(targetX, MAGNETIC_SNAP_SPRING));
    }
  }, [
    activeVisibleIndex,
    isTouchingDock,
    tabWidthSV,
    hoveredSlotSV,
    lastHoveredIndex,
    pillTranslateX,
  ]);

  const finishDockTouch = useCallback(
    (releaseX: number, initialDownIndex: number) => {
      'worklet';
      if (touchFinished.get()) return;
      touchFinished.set(true);
      isTouchingDock.set(false);

      const tabW = Math.max(1, tabWidthSV.get());
      const finalTabIndex = clamp(
        Math.floor((releaseX - INNER_PADDING) / tabW),
        0,
        MAX_TAB_INDEX,
      );

      if (finalTabIndex !== initialDownIndex) {
        scheduleOnRN(triggerSelectionHaptic);
      }

      cancelAnimation(pillTranslateX);
      cancelAnimation(pillScaleX);
      cancelAnimation(pillScaleY);
      cancelAnimation(specularBoost);

      pillTranslateX.set(withSpring(finalTabIndex * tabW, MAGNETIC_SNAP_SPRING));
      pillScaleX.set(withSpring(1, SCALE_SETTLE_SPRING));
      pillScaleY.set(withSpring(1, SCALE_SETTLE_SPRING));
      specularBoost.set(withSpring(0, SCALE_SETTLE_SPRING));

      hoveredSlotSV.set(finalTabIndex);
      lastHoveredIndex.set(finalTabIndex);

      const pw = pageWidthSV.get();
      if (hasSwipePagerSV.get() && pw > 0) {
        pagerProgress.set(finalTabIndex);
        scrollTo(pagerRef, finalTabIndex * pw, 0, false);
      }

      scheduleOnRN(commitTabOnRelease, finalTabIndex);
    },
    [
      touchFinished,
      isTouchingDock,
      tabWidthSV,
      pillTranslateX,
      pillScaleX,
      pillScaleY,
      specularBoost,
      hoveredSlotSV,
      lastHoveredIndex,
      pageWidthSV,
      hasSwipePagerSV,
      pagerProgress,
      pagerRef,
      commitTabOnRelease,
    ],
  );

  // Track which slot had haptic feedback inside the current touch lifecycle
  const touchDownHoveredIndex = useSharedValue(activeVisibleIndex);

  const trackFingerAtX = useCallback(
    (x: number) => {
      'worklet';
      lastTouchX.set(x);
      const tabW = Math.max(1, tabWidthSV.get());
      const rawX = x - INNER_PADDING - tabW * 0.5;
      const clampedX = clamp(rawX, 0, tabW * MAX_TAB_INDEX);
      pillTranslateX.set(withSpring(clampedX, FINGER_TRACK_SPRING));

      const hovered = clamp(
        Math.floor((x - INNER_PADDING) / tabW),
        0,
        MAX_TAB_INDEX,
      );
      if (hovered !== lastHoveredIndex.get()) {
        lastHoveredIndex.set(hovered);
        touchDownHoveredIndex.set(hovered);
        hoveredSlotSV.set(hovered);
        scheduleOnRN(triggerSelectionHaptic);

        const pw = pageWidthSV.get();
        if (hasSwipePagerSV.get() && pw > 0) {
          pagerProgress.set(hovered);
          scrollTo(pagerRef, hovered * pw, 0, false);
        }
      }
    },
    [
      lastTouchX,
      tabWidthSV,
      pillTranslateX,
      lastHoveredIndex,
      touchDownHoveredIndex,
      hoveredSlotSV,
      pageWidthSV,
      hasSwipePagerSV,
      pagerProgress,
      pagerRef,
    ],
  );

  const dockPanGesture = usePanGesture({
    minDistance: 0,
    shouldCancelWhenOutside: false,
    onBegin: (e) => {
      'worklet';
      touchFinished.set(false);
      isTouchingDock.set(true);
      isSwiping.set(false);
      lastTouchX.set(e.x);

      const currentActive = hoveredSlotSV.get();
      lastHoveredIndex.set(currentActive);
      touchDownHoveredIndex.set(currentActive);

      cancelAnimation(pillScaleX);
      cancelAnimation(pillScaleY);
      cancelAnimation(specularBoost);

      pillScaleX.set(withSpring(1.1, LENS_INFLATE_SPRING));
      pillScaleY.set(withSpring(1.06, LENS_INFLATE_SPRING));
      specularBoost.set(withSpring(1, LENS_INFLATE_SPRING));
    },
    onActivate: (e) => {
      'worklet';
      trackFingerAtX(e.x);
    },
    onUpdate: (e) => {
      'worklet';
      trackFingerAtX(e.x);
      const speedX = Math.abs(e.velocityX);
      pillScaleX.set(1.08 + Math.min(speedX * 0.00015, 0.14));
      pillScaleY.set(1.04 - Math.min(speedX * 0.00008, 0.08));
    },
    onDeactivate: (e) => {
      'worklet';
      const releaseX = Number.isFinite(e.x) ? e.x : lastTouchX.get();
      finishDockTouch(releaseX, touchDownHoveredIndex.get());
    },
    onFinalize: (e) => {
      'worklet';
      const releaseX = Number.isFinite(e.x) ? e.x : lastTouchX.get();
      finishDockTouch(releaseX, touchDownHoveredIndex.get());
    },
  });

  // Pure transform-only UI-thread animated style: translateX, scaleX, scaleY
  const slidingPillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pillTranslateX.get() },
      { scaleX: pillScaleX.get() },
      { scaleY: pillScaleY.get() },
    ],
  }));

  const specularRimStyle = useAnimatedStyle(() => ({
    opacity: specularBoost.get(),
  }));

  // Clean up any stale touch lock if route changes out from under dock
  useEffect(() => {
    return () => {
      isTouchingDock.set(false);
    };
  }, [isTouchingDock]);

  // Snap back cleanly only when returning from a hidden overlay route (e.g. lesson/[chapterId])
  const wasHiddenRef = useRef(isTabBarHidden);
  useEffect(() => {
    const wasHidden = wasHiddenRef.current;
    wasHiddenRef.current = isTabBarHidden;
    if (wasHidden && !isTabBarHidden && !isTouchingDock.get() && !isSwiping.get()) {
      const idx = activeVisibleIndex;
      const tabW = tabWidthSV.get();
      scheduleOnUI(() => {
        'worklet';
        pillTranslateX.set(idx * tabW);
        hoveredSlotSV.set(idx);
        lastHoveredIndex.set(idx);
      });
    }
  }, [
    isTabBarHidden,
    activeVisibleIndex,
    isTouchingDock,
    isSwiping,
    tabWidthSV,
    pillTranslateX,
    hoveredSlotSV,
    lastHoveredIndex,
  ]);

  if (isTabBarHidden) {
    return null;
  }

  const bottomOffset = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.shadowWrapper, { bottom: bottomOffset }]}>
      <GestureDetector gesture={dockPanGesture}>
        <View style={styles.outerGlassContainer} onLayout={handleDockLayout}>
          {/* Single Static Backdrop Blur Layer */}
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Sliding Electric Violet Liquid Glass Droplet */}
          <Animated.View
            pointerEvents="none"
            style={[styles.slidingPill, { width: initialTabWidth }, slidingPillStyle]}
          >
            <View style={styles.pillCoreGlow} />
            <Animated.View style={[styles.pillSpecularBoost, specularRimStyle]} />
          </Animated.View>

          {/* 4 Tab Columns (pointerEvents="none" so parent Pan captures every touch & slide) */}
          <View style={styles.tabRow} pointerEvents="none">
            {TAB_CONFIGS.map((config, idx) => (
              <LiquidTabColumn
                key={config.name}
                config={config}
                index={idx}
                hoveredSlotSV={hoveredSlotSV}
              />
            ))}
          </View>

          {/* Crisp neutral outer glass rim */}
          <View pointerEvents="none" style={styles.outerGlassRim} />
          <View pointerEvents="none" style={styles.topSpecularLine} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    position: 'absolute',
    left: DOCK_HORIZONTAL_MARGIN,
    right: DOCK_HORIZONTAL_MARGIN,
    height: DOCK_HEIGHT,
    borderRadius: DOCK_RADIUS,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 9999,
  },
  outerGlassContainer: {
    flex: 1,
    borderRadius: DOCK_RADIUS,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 17, 26, 0.75)',
  },
  outerGlassRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: DOCK_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  slidingPill: {
    position: 'absolute',
    top: INNER_PADDING,
    left: INNER_PADDING,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    backgroundColor: 'rgba(124, 92, 252, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.50)',
  },
  pillCoreGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: PILL_RADIUS,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
  pillSpecularBoost: {
    ...StyleSheet.absoluteFill,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.85)',
    backgroundColor: 'rgba(167, 139, 250, 0.10)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    padding: INNER_PADDING,
  },
  tabColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabContentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabStateLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabStateLayerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  labelActive: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  labelInactive: {
    fontWeight: '500',
    color: '#8E92A4',
  },
});
