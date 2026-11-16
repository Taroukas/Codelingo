import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  createBaseTabProps,
  createStandardRouterNavigator,
  TabRouter,
  Tabs,
  type Href,
  type NavigatorContentProps,
  type TabNavigationState,
  type TabRouterOptions,
} from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  clamp,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { selectionHaptic } from '@/utils/haptics';
import { SwipeTabsSyncContext } from './SwipeTabsSync';

type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];
type BottomTabBarOptions = BottomTabBarProps['descriptors'][string]['options'];

export type SwipeTabOptions = BottomTabBarOptions & {
  href?: Href | null;
};

type SwipeTabsEventMap = {
  tabPress: { data: undefined; canPreventDefault: true };
  tabLongPress: { data: undefined; canPreventDefault: false };
};

type SwipeTabsNavigatorProps = {
  tabBar?: (props: BottomTabBarProps) => React.ReactNode;
};

type SwipeTabsCreateProps = {
  isPreloaded: (key: string) => boolean;
  isRemovalPrevented: (key: string) => boolean;
  routeNames: string[];
  preload: (name: string) => void;
};

const TAB_ORDER = ['index', 'sandbox', 'leaderboard', 'profile'] as const;
const MAX_TAB_INDEX = TAB_ORDER.length - 1;
const APP_BG = '#0B0B11';

type SwipeTabsContentProps = NavigatorContentProps<
  SwipeTabOptions,
  SwipeTabsEventMap,
  SwipeTabsNavigatorProps,
  SwipeTabsCreateProps
>;

function SwipeTabsContent({
  state,
  descriptors,
  actions,
  emitter,
  preload,
  tabBar,
}: SwipeTabsContentProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowWidth);
  const pageWidth = containerWidth > 0 ? containerWidth : windowWidth;

  const focusedRoute = state.routes[state.index];
  const focusedTabIndex = focusedRoute
    ? (TAB_ORDER as readonly string[]).indexOf(focusedRoute.name)
    : 0;
  const isOverlayActive = Boolean(focusedRoute && focusedTabIndex < 0);
  const safeInitialIndex = focusedTabIndex >= 0 ? focusedTabIndex : 0;

  const pagerRef = useAnimatedRef<ScrollView>();
  const pagerProgress = useSharedValue(safeInitialIndex);
  const isSwiping = useSharedValue(false);
  const pageWidthSV = useSharedValue(pageWidth);

  const activeTabIndexRef = useRef(safeInitialIndex);
  const prevWidthRef = useRef(pageWidth);
  const initialOffsetRef = useRef(safeInitialIndex * pageWidth);
  const routesRef = useRef(state.routes);
  const actionsRef = useRef(actions);

  useEffect(() => {
    routesRef.current = state.routes;
    actionsRef.current = actions;
  }, [state.routes, actions]);

  useEffect(() => {
    pageWidthSV.set(pageWidth);
  }, [pageWidthSV, pageWidth]);

  // Preload all 4 primary tab screens immediately so sliding is instant.
  useEffect(() => {
    for (const name of TAB_ORDER) {
      const exists = state.routes.some((route) => route.name === name);
      if (!exists) {
        preload(name);
      }
    }
  }, [preload, state.routes]);

  const commitTabIndex = useCallback((targetIndex: number) => {
    const clampedIdx = Math.max(0, Math.min(MAX_TAB_INDEX, targetIndex));
    if (clampedIdx === activeTabIndexRef.current) return;

    activeTabIndexRef.current = clampedIdx;
    const targetName = TAB_ORDER[clampedIdx];
    const existing = routesRef.current.find(
      (route) => route.name === targetName,
    );
    actionsRef.current.navigate(targetName, existing?.params);
  }, []);

  const commitSettledOffset = useCallback(
    (offsetX: number) => {
      if (pageWidth <= 0) return;
      const targetIndex = Math.max(
        0,
        Math.min(MAX_TAB_INDEX, Math.round(offsetX / pageWidth)),
      );
      if (targetIndex !== activeTabIndexRef.current) {
        selectionHaptic();
      }
      commitTabIndex(targetIndex);
    },
    [pageWidth, commitTabIndex],
  );

  // Sync external/router navigation or screen size change without competing animations.
  useEffect(() => {
    if (focusedTabIndex < 0) return;

    const widthChanged = prevWidthRef.current !== pageWidth;
    prevWidthRef.current = pageWidth;

    if (widthChanged || focusedTabIndex !== activeTabIndexRef.current) {
      activeTabIndexRef.current = focusedTabIndex;
      const targetOffset = focusedTabIndex * pageWidth;
      scheduleOnUI(() => {
        'worklet';
        isSwiping.set(false);
        pagerProgress.set(focusedTabIndex);
        scrollTo(pagerRef, targetOffset, 0, false);
      });
    }
  }, [focusedTabIndex, pageWidth, pagerRef, pagerProgress, isSwiping]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.width);
    if (measured > 0) {
      setContainerWidth((prev) => (prev !== measured ? measured : prev));
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      isSwiping.set(true);
    },
    onScroll: (event) => {
      if (!isSwiping.get()) return;
      const w = Math.max(1, pageWidthSV.get());
      pagerProgress.set(clamp(event.contentOffset.x / w, 0, MAX_TAB_INDEX));
    },
    onEndDrag: (event) => {
      const velX = Math.abs(event.velocity?.x ?? 0);
      const targetX = event.targetContentOffset?.x;
      const settledWithoutMomentum =
        velX < 0.05 ||
        (targetX !== undefined &&
          Math.abs(targetX - event.contentOffset.x) < 1);

      if (settledWithoutMomentum) {
        isSwiping.set(false);
        scheduleOnRN(commitSettledOffset, targetX ?? event.contentOffset.x);
      }
    },
    onMomentumEnd: (event) => {
      isSwiping.set(false);
      const w = Math.max(1, pageWidthSV.get());
      const settledIdx = clamp(
        Math.round(event.contentOffset.x / w),
        0,
        MAX_TAB_INDEX,
      );
      pagerProgress.set(settledIdx);
      scheduleOnRN(commitSettledOffset, event.contentOffset.x);
    },
  });

  const navigateToTab = useCallback(
    (routeKey: string) => {
      const route = state.routes.find(
        (item) => item.key === routeKey || item.name === routeKey,
      );
      if (route) {
        const idx = (TAB_ORDER as readonly string[]).indexOf(route.name);
        if (idx >= 0) {
          activeTabIndexRef.current = idx;
        }
        actions.navigate(route.name, route.params);
        return;
      }
      if ((TAB_ORDER as readonly string[]).includes(routeKey)) {
        const idx = (TAB_ORDER as readonly string[]).indexOf(routeKey);
        if (idx >= 0) {
          activeTabIndexRef.current = idx;
        }
        actions.navigate(routeKey);
      }
    },
    [state.routes, actions],
  );

  const syncContextValue = useMemo(
    () => ({
      pagerRef,
      pagerProgress,
      isSwiping,
      pageWidthSV,
      commitTabFromBar: commitTabIndex,
    }),
    [pagerRef, pagerProgress, isSwiping, pageWidthSV, commitTabIndex],
  );

  const { tabBarState, tabBarDescriptors } = useMemo(() => {
    const mergedRoutes = TAB_ORDER.map((name) => {
      const existing = state.routes.find((route) => route.name === name);
      if (existing) return existing;
      return {
        key: name,
        name,
        params: undefined,
        href: undefined,
      };
    });

    if (
      focusedRoute &&
      !(TAB_ORDER as readonly string[]).includes(focusedRoute.name)
    ) {
      mergedRoutes.push(focusedRoute);
    }

    const nextIndex = focusedRoute
      ? Math.max(
          0,
          mergedRoutes.findIndex((route) => route.key === focusedRoute.key),
        )
      : 0;

    const nextDescriptors: BottomTabBarProps['descriptors'] = {
      ...(descriptors as unknown as BottomTabBarProps['descriptors']),
    };
    for (const route of mergedRoutes) {
      if (!nextDescriptors[route.key]) {
        nextDescriptors[route.key] = {
          options: {},
          render: () => null,
        } as unknown as BottomTabBarProps['descriptors'][string];
      }
    }

    return {
      tabBarState: {
        index: nextIndex,
        routes: mergedRoutes,
      },
      tabBarDescriptors: nextDescriptors,
    };
  }, [state.routes, focusedRoute, descriptors]);

  return (
    <SwipeTabsSyncContext.Provider value={syncContextValue}>
      <View style={styles.root} onLayout={handleContainerLayout}>
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          directionalLockEnabled
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={1}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          nestedScrollEnabled
          scrollEnabled={!isOverlayActive}
          contentOffset={{ x: initialOffsetRef.current, y: 0 }}
          onScroll={scrollHandler}
          style={styles.pager}
        >
          {TAB_ORDER.map((name) => {
            const route = state.routes.find((item) => item.name === name);
            const descriptor = route ? descriptors[route.key] : undefined;
            return (
              <View key={name} style={[styles.page, { width: pageWidth }]}>
                {descriptor ? (
                  descriptor.render()
                ) : (
                  <View style={styles.fallbackPage} />
                )}
              </View>
            );
          })}
        </Animated.ScrollView>

        {isOverlayActive && focusedRoute ? (
          <View style={styles.overlayContainer}>
            {descriptors[focusedRoute.key]?.render() ?? null}
          </View>
        ) : null}

        {tabBar
          ? tabBar({
              state: tabBarState,
              descriptors: tabBarDescriptors,
              emitter,
              navigateToTab,
              insets,
            })
          : null}
      </View>
    </SwipeTabsSyncContext.Provider>
  );
}

export const SwipeTabs = createStandardRouterNavigator<
  SwipeTabOptions,
  TabNavigationState<Record<string, object | undefined>>,
  SwipeTabsEventMap,
  SwipeTabsNavigatorProps,
  TabRouterOptions,
  SwipeTabsCreateProps
>(SwipeTabsContent, TabRouter, {
  activityDefaultThreshold: 1,
  createProps: createBaseTabProps,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    overflow: 'hidden',
  },
  fallbackPage: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    backgroundColor: APP_BG,
  },
});
