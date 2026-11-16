import { createContext, useContext } from 'react';
import type { ScrollView } from 'react-native';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

export interface SwipeTabsSyncValue {
  pagerRef: AnimatedRef<ScrollView>;
  pagerProgress: SharedValue<number>;
  isSwiping: SharedValue<boolean>;
  pageWidthSV: SharedValue<number>;
  commitTabFromBar: (targetIndex: number) => void;
}

export const SwipeTabsSyncContext = createContext<SwipeTabsSyncValue | null>(
  null,
);

export function useSwipeTabsSync(): SwipeTabsSyncValue | null {
  return useContext(SwipeTabsSyncContext);
}
