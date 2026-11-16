import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { Colors, UI_FONT } from '@/theme';
import { getNodeById } from '@/data/courses';
import { SpringPressable } from '@/components/CyberButton';
import { LessonSessionModal } from '@/components/LessonSessionModal';

// Expo SDK 58 Windows typed-routes omits `/` for `(tabs)/index`; runtime requires `/`.
const LEARN_ROUTE = '/' as unknown as Href;

export default function LessonRouteScreen() {
  const insets = useSafeAreaInsets();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const resolvedId = Array.isArray(chapterId) ? chapterId[0] : chapterId ?? '';
  const found = useMemo(() => getNodeById(resolvedId), [resolvedId]);

  if (!found) {
    return (
      <View
        style={[
          styles.centerBox,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={styles.notFoundTitle}>Lesson not found</Text>
        <SpringPressable
          onPress={() => router.replace(LEARN_ROUTE)}
          style={styles.backBtn}
          haptic="light"
        >
          <Text style={styles.backBtnText}>Back to Learn</Text>
        </SpringPressable>
      </View>
    );
  }

  return (
    <LessonSessionModal
      visible
      standaloneScreen
      node={found.node}
      language={found.lang.id}
      onClose={() => router.replace(LEARN_ROUTE)}
      onComplete={() => router.replace(LEARN_ROUTE)}
    />
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  notFoundTitle: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  backBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 4,
    borderBottomColor: '#5639D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
