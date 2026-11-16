import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import Svg, { Path, Polygon } from 'react-native-svg';
import { Colors, UI_FONT, MONO } from '@/theme';
import {
  getLanguage,
  Unit,
  LessonNode,
  LangId,
  ConceptGraphicType,
} from '@/data/courses';
import { useGame, computeNodeStatus } from '@/store/GameStore';
import { StatsHeader } from '@/components/StatsHeader';
import { UnitGuidebookModal } from '@/components/UnitGuidebookModal';
import { Tactile3DNode } from '@/components/Tactile3D';
import { SpringPressable } from '@/components/CyberButton';
import { HeroAmbientGlow } from '@/components/ui/AmbientSurface';
import { LessonSessionModal } from '@/components/LessonSessionModal';
import { GemIcon } from '@/components/ui/CurrencyIcons';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { playSound } from '@/utils/sounds';

const SCREEN_HEIGHT = Dimensions.get('window').height;

/* ------------------------------------------------------------------ */
/*  Mimo-Style S-Curve Board Coordinates & Dashed Path Sampler        */
/* ------------------------------------------------------------------ */

const BOARD_W = 320;
const BOARD_H = 296;

const X_LEFT = 46;
const X_CENTER = 160;
const X_RIGHT = 274;

const Y_ROW1 = 44;
const Y_ROW2 = 148;
const Y_ROW3 = 252;

function buildSCurveSegments(
  hasTopCenter: boolean,
  hasBottomRight = true,
): string[] {
  const segments: string[] = [];

  if (hasTopCenter) {
    segments.push(`M ${X_LEFT} ${Y_ROW1} L ${X_CENTER} ${Y_ROW1}`);
    segments.push(`M ${X_CENTER} ${Y_ROW1} L ${X_RIGHT} ${Y_ROW1}`);
  } else {
    segments.push(`M ${X_LEFT} ${Y_ROW1} L ${X_RIGHT} ${Y_ROW1}`);
  }

  // Smooth cubic Bezier sweep from Top-Right down through the Center Cube
  segments.push(
    `M ${X_RIGHT} ${Y_ROW1} C ${X_RIGHT + 36} ${Y_ROW1 + 8}, ${X_RIGHT + 32} ${Y_ROW2}, ${X_RIGHT - 24} ${Y_ROW2} L ${X_CENTER} ${Y_ROW2}`,
  );

  // Smooth cubic Bezier sweep around the left edge down to Bottom-Center
  segments.push(
    `M ${X_CENTER} ${Y_ROW2} L 76 ${Y_ROW2} C 22 ${Y_ROW2}, 22 ${Y_ROW3}, 76 ${Y_ROW3} L ${X_CENTER} ${Y_ROW3}`,
  );

  if (hasBottomRight) {
    segments.push(`M ${X_CENTER} ${Y_ROW3} L ${X_RIGHT} ${Y_ROW3}`);
  }

  return segments;
}

function MimoDashedSCurve({
  hasTopCenter = true,
  hasBottomRight = true,
  litEdges = 0,
}: {
  hasTopCenter?: boolean;
  hasBottomRight?: boolean;
  litEdges?: number;
}) {
  const segments = buildSCurveSegments(hasTopCenter, hasBottomRight);
  const clampedLit = Math.max(0, Math.min(segments.length, litEdges));
  const litD = segments.slice(0, clampedLit).join(' ');
  const mutedD = segments.slice(clampedLit).join(' ');

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]} pointerEvents="none">
      <Svg width={BOARD_W} height={BOARD_H}>
        {mutedD ? (
          <Path
            d={mutedD}
            stroke="rgba(255, 255, 255, 0.14)"
            strokeWidth={2.5}
            strokeDasharray="6, 8"
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        {litD ? (
          <Path
            d={litD}
            stroke="rgba(167, 139, 250, 0.45)"
            strokeWidth={2.5}
            strokeDasharray="6, 8"
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const POPOVER_W = 280;

interface AnchoredNodePopoverProps {
  node: LessonNode;
  anchorX: number;
  anchorY: number;
  lessonNumber: number;
  totalInUnit: number;
  variant: 'active' | 'completed' | 'locked';
  visible: boolean;
  onStart: () => void;
  onDismiss: () => void;
  onExited: () => void;
}

function AnchoredNodePopover({
  node,
  anchorX,
  anchorY,
  lessonNumber,
  totalInUnit,
  variant,
  visible,
  onStart,
  onDismiss,
  onExited,
}: AnchoredNodePopoverProps) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const onExitedRef = useRef(onExited);

  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);

  useEffect(() => {
    enterAnim.stopAnimation();
    if (visible) {
      Animated.spring(enterAnim, {
        toValue: 1,
        damping: 13,
        stiffness: 350,
        mass: 0.65,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(enterAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onExitedRef.current();
        }
      });
    }
  }, [enterAnim, visible]);

  const popoverLeft = Math.max(
    -14,
    Math.min(BOARD_W - POPOVER_W + 14, anchorX - POPOVER_W / 2),
  );
  const arrowLeft = Math.max(
    22,
    Math.min(POPOVER_W - 38, anchorX - popoverLeft - 8),
  );
  const anchorOffsetX = arrowLeft + 8 - POPOVER_W / 2;
  const anchorOffsetY = -68;

  const xpReward =
    node.kind === 'checkpoint_cube' || node.kind === 'boss_challenge'
      ? 50
      : node.xpReward || 25;

  const triangleFill =
    variant === 'active'
      ? '#7C5CFC'
      : variant === 'completed'
        ? '#1E1836'
        : '#1C1D26';

  const triangleStroke =
    variant === 'locked' ? 'rgba(255, 255, 255, 0.08)' : null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.nodePopoverWrap,
        {
          left: popoverLeft,
          top: anchorY + 42,
          width: POPOVER_W,
          opacity: enterAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateX: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9 * anchorOffsetX, 0],
              }),
            },
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9 * anchorOffsetY, 0],
              }),
            },
            {
              scale: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.nodePopoverArrow, { left: arrowLeft }]} pointerEvents="none">
        <Svg width={16} height={9} viewBox="0 0 16 9">
          <Polygon points="0,9 8,0.5 16,9" fill={triangleFill} />
          {triangleStroke ? (
            <Path
              d="M 0.5 8.5 L 8 1 L 15.5 8.5"
              stroke={triangleStroke}
              strokeWidth={1.5}
              fill="none"
            />
          ) : null}
        </Svg>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
        }}
        style={[
          styles.nodePopoverCard,
          variant === 'active' && styles.nodePopoverActive,
          variant === 'completed' && styles.nodePopoverCompleted,
          variant === 'locked' && styles.nodePopoverLocked,
        ]}
      >
        {variant === 'active' ? (
          <>
            <Text style={styles.popoverTitleActive} numberOfLines={2}>
              {node.title}
            </Text>
            <Text style={styles.popoverMetaActive}>
              {`Lesson ${lessonNumber} of ${totalInUnit}`}
            </Text>
            <SpringPressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                  () => undefined,
                );
                onStart();
              }}
              haptic="none"
              pressScale={0.97}
              style={styles.popoverCtaActive}
            >
              <Text style={styles.popoverCtaActiveText}>
                {`START +${xpReward} XP`}
              </Text>
            </SpringPressable>
          </>
        ) : variant === 'completed' ? (
          <>
            <View style={styles.popoverCompletedTopRow}>
              <Text style={styles.popoverTitleCompleted} numberOfLines={2}>
                {node.title}
              </Text>
              <View style={styles.popoverCompletedBadge}>
                <Text style={styles.popoverCompletedBadgeText}>
                  COMPLETED ✓
                </Text>
              </View>
            </View>
            <Text style={styles.popoverMetaCompleted}>
              Practice this lesson again to sharpen your skills
            </Text>
            <SpringPressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                  () => undefined,
                );
                onStart();
              }}
              haptic="none"
              pressScale={0.97}
              style={styles.popoverCtaReview}
            >
              <Text style={styles.popoverCtaReviewText}>REVIEW +5 XP</Text>
            </SpringPressable>
          </>
        ) : (
          <Pressable onPress={onDismiss} style={styles.popoverLockedBody}>
            <View style={styles.popoverLockedHeader}>
              <FontAwesome5 name="lock" size={12} color="#64748B" solid />
              <Text style={styles.popoverLockedTitle} numberOfLines={1}>
                {node.title}
              </Text>
            </View>
            <Text style={styles.popoverLockedCopy}>
              Complete all levels above to unlock this!
            </Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  3D Cylinder / Puck Path Node Icon                                 */
/* ------------------------------------------------------------------ */

function renderNodeIcon(
  node: LessonNode,
  isCompleted: boolean,
  isLocked: boolean,
) {
  if (node.kind === 'checkpoint_cube') {
    return (
      <Ionicons
        name="cube"
        size={25}
        color={isCompleted ? '#EDE9FE' : isLocked ? '#475569' : '#FAFAFA'}
      />
    );
  }
  if (isCompleted) {
    return <FontAwesome5 name="check" size={22} color="#EDE9FE" solid />;
  }
  if (isLocked) {
    return <FontAwesome5 name="lock" size={18} color="#475569" solid />;
  }
  if (node.kind === 'boss_challenge') {
    return <Ionicons name="trophy" size={22} color="#FAFAFA" />;
  }
  if (node.nodeIndex === 0) {
    return <FontAwesome5 name="terminal" size={20} color="#FAFAFA" solid />;
  }
  if (node.nodeIndex === 1) {
    return <FontAwesome5 name="code" size={20} color="#FAFAFA" solid />;
  }
  if (node.nodeIndex === 2) {
    return <FontAwesome5 name="code-branch" size={22} color="#FAFAFA" solid />;
  }
  return <Ionicons name="bug" size={22} color="#FAFAFA" />;
}

/* ------------------------------------------------------------------ */
/*  Dynamic Language + Unit Specific Flat 2D Concept Graphics         */
/* ------------------------------------------------------------------ */

type ConceptAccent = 'sky' | 'yellow' | 'violet' | 'muted' | 'slate';

type ConceptSpec =
  | {
      kind: 'pair';
      top: string;
      split?: boolean;
      badges: { text: string; accent: ConceptAccent }[];
    }
  | {
      kind: 'single';
      top: string;
      bottom: string;
      accent: ConceptAccent;
    }
  | {
      kind: 'array';
      top: string;
      cells: [string, string, string];
    }
  | {
      kind: 'loop_indent';
      top: string;
      body: string;
    }
  | {
      kind: 'dual_top';
      tops: [string, string];
      bottom: string;
    };

const CONCEPT_SPECS: Record<ConceptGraphicType, ConceptSpec> = {
  // Python (Units 1-6)
  variables: {
    kind: 'pair',
    top: 'x, y = 10, "Py"',
    split: true,
    badges: [
      { text: 'int', accent: 'sky' },
      { text: 'str', accent: 'yellow' },
    ],
  },
  control_flow: {
    kind: 'loop_indent',
    top: 'for i in range(3):',
    body: 'step(i)',
  },
  collections: {
    kind: 'single',
    top: '[x*2 for x]',
    bottom: '[2, 4, 6]',
    accent: 'violet',
  },
  dicts_sets: {
    kind: 'pair',
    top: 'user["role"]',
    split: true,
    badges: [
      { text: 'O(1)', accent: 'sky' },
      { text: 'set{}', accent: 'violet' },
    ],
  },
  functions: {
    kind: 'pair',
    top: 'def fn(*args):',
    split: true,
    badges: [
      { text: '*args', accent: 'violet' },
      { text: 'return', accent: 'sky' },
    ],
  },
  classes_oop: {
    kind: 'pair',
    top: 'class Node:',
    split: true,
    badges: [
      { text: 'self', accent: 'violet' },
      { text: '__init__', accent: 'yellow' },
    ],
  },

  // C++ (Units 1-7)
  cpp_stack: {
    kind: 'pair',
    top: 'int n = 42;',
    split: true,
    badges: [
      { text: '4B', accent: 'sky' },
      { text: 'stack', accent: 'slate' },
    ],
  },
  cpp_loops: {
    kind: 'pair',
    top: 'for (int i=0; ++i)',
    split: true,
    badges: [
      { text: 'i < n', accent: 'violet' },
      { text: 'break', accent: 'muted' },
    ],
  },
  cpp_refs: {
    kind: 'pair',
    top: 'int& r = val;',
    split: true,
    badges: [
      { text: 'alias', accent: 'sky' },
      { text: '&val', accent: 'violet' },
    ],
  },
  cpp_pointers: {
    kind: 'pair',
    top: '*ptr = &val',
    badges: [
      { text: '[ 0x7FF0 ]', accent: 'slate' },
      { text: '4B', accent: 'sky' },
    ],
  },
  cpp_vectors: {
    kind: 'array',
    top: 'std::vector<int>',
    cells: ['12', '24', '48'],
  },
  cpp_classes: {
    kind: 'pair',
    top: 'class Widget {',
    split: true,
    badges: [
      { text: 'public:', accent: 'violet' },
      { text: '~RAII()', accent: 'sky' },
    ],
  },
  cpp_smart_ptr: {
    kind: 'pair',
    top: 'unique_ptr<T>',
    split: true,
    badges: [
      { text: 'move()', accent: 'violet' },
      { text: '0 leak', accent: 'sky' },
    ],
  },

  // JavaScript (Units 1-5)
  js_vars: {
    kind: 'pair',
    top: 'const app = 42',
    split: true,
    badges: [
      { text: 'const', accent: 'yellow' },
      { text: '===', accent: 'sky' },
    ],
  },
  js_arrows: {
    kind: 'pair',
    top: '() => ok ? A : B',
    split: true,
    badges: [
      { text: 'A()', accent: 'violet' },
      { text: 'B()', accent: 'muted' },
    ],
  },
  js_objects: {
    kind: 'single',
    top: 'const {id} = u',
    bottom: '{ key: val }',
    accent: 'yellow',
  },
  js_arrays: {
    kind: 'single',
    top: '.map(x => x * 2)',
    bottom: '[2, 4, 6]',
    accent: 'violet',
  },
  js_async: {
    kind: 'single',
    top: 'await fetch(url)',
    bottom: 'Promise<ok>',
    accent: 'sky',
  },

  // Go (Units 1-5)
  go_vars: {
    kind: 'pair',
    top: 'n, err := load()',
    split: true,
    badges: [
      { text: ':=', accent: 'sky' },
      { text: 'err', accent: 'violet' },
    ],
  },
  go_range: {
    kind: 'pair',
    top: 'for i, v := range',
    split: true,
    badges: [
      { text: 'idx: i', accent: 'sky' },
      { text: 'val: v', accent: 'violet' },
    ],
  },
  go_slices: {
    kind: 'array',
    top: 'append(s, 42)',
    cells: ['len', 'cap', 'ptr'],
  },
  go_structs: {
    kind: 'single',
    top: 'type Node struct',
    bottom: 'func (n *Node)',
    accent: 'sky',
  },
  go_channels: {
    kind: 'dual_top',
    tops: ['go fn()', 'go fn()'],
    bottom: 'ch <- data',
  },

  // Java (Units 1-6)
  java_vars: {
    kind: 'pair',
    top: 'final int xp',
    split: true,
    badges: [
      { text: 'String', accent: 'sky' },
      { text: 'JVM', accent: 'violet' },
    ],
  },
  java_flow: {
    kind: 'pair',
    top: 's.equals(ok)',
    split: true,
    badges: [
      { text: 'switch', accent: 'violet' },
      { text: '->', accent: 'sky' },
    ],
  },
  java_arrays: {
    kind: 'array',
    top: 'int[] nums =',
    cells: ['10', '20', '30'],
  },
  java_oop: {
    kind: 'pair',
    top: 'class Hero {',
    split: true,
    badges: [
      { text: 'private', accent: 'muted' },
      { text: 'this.hp', accent: 'violet' },
    ],
  },
  java_collections: {
    kind: 'pair',
    top: 'Map<String,V>',
    split: true,
    badges: [
      { text: 'put()', accent: 'sky' },
      { text: 'getOr()', accent: 'violet' },
    ],
  },
  java_streams: {
    kind: 'pair',
    top: '.stream()',
    split: true,
    badges: [
      { text: '.filter()', accent: 'sky' },
      { text: '.map()', accent: 'violet' },
    ],
  },

  // Rust (Units 1-6)
  rust_vars: {
    kind: 'pair',
    top: 'let mut xp',
    split: true,
    badges: [
      { text: 'let', accent: 'muted' },
      { text: 'mut', accent: 'yellow' },
    ],
  },
  rust_ownership: {
    kind: 'pair',
    top: 'move vs &T',
    split: true,
    badges: [
      { text: '&s', accent: 'sky' },
      { text: '&mut s', accent: 'violet' },
    ],
  },
  rust_control: {
    kind: 'pair',
    top: 'match score {',
    split: true,
    badges: [
      { text: '0..=9', accent: 'sky' },
      { text: '_', accent: 'violet' },
    ],
  },
  rust_structs: {
    kind: 'single',
    top: 'impl Trait for T',
    bottom: 'fn self(&self)',
    accent: 'violet',
  },
  rust_errors: {
    kind: 'pair',
    top: 'Result<T, E>',
    split: true,
    badges: [
      { text: 'Ok(v)', accent: 'sky' },
      { text: 'Err?', accent: 'yellow' },
    ],
  },
  rust_collections: {
    kind: 'array',
    top: 'vec![1, 2, 3]',
    cells: ['1', '2', '3'],
  },

  // SQL (Units 1-5)
  sql_select: {
    kind: 'pair',
    top: 'SELECT col',
    split: true,
    badges: [
      { text: 'ORDER BY', accent: 'sky' },
      { text: 'LIMIT', accent: 'violet' },
    ],
  },
  sql_filter: {
    kind: 'pair',
    top: 'WHERE x IN ()',
    split: true,
    badges: [
      { text: 'IS NULL', accent: 'yellow' },
      { text: 'LIKE', accent: 'sky' },
    ],
  },
  sql_aggregates: {
    kind: 'pair',
    top: 'GROUP BY k',
    split: true,
    badges: [
      { text: 'COUNT(*)', accent: 'sky' },
      { text: 'HAVING', accent: 'violet' },
    ],
  },
  sql_joins: {
    kind: 'dual_top',
    tops: ['users u', 'orders o'],
    bottom: 'JOIN ON u.id',
  },
  sql_mutations: {
    kind: 'pair',
    top: 'BEGIN; WRITE',
    split: true,
    badges: [
      { text: 'WHERE', accent: 'yellow' },
      { text: 'COMMIT', accent: 'sky' },
    ],
  },

  // C (Units 1-6)
  c_basics: {
    kind: 'pair',
    top: 'printf("%d", x)',
    split: true,
    badges: [
      { text: 'stdio.h', accent: 'sky' },
      { text: 'sizeof', accent: 'violet' },
    ],
  },
  c_flow: {
    kind: 'pair',
    top: 'int fn(int x);',
    split: true,
    badges: [
      { text: 'switch', accent: 'violet' },
      { text: 'break;', accent: 'muted' },
    ],
  },
  c_arrays: {
    kind: 'array',
    top: 'char s[5] = "Go"',
    cells: ["'G'", "'o'", "'\\0'"],
  },
  c_pointers: {
    kind: 'pair',
    top: 'int *p = &x',
    split: true,
    badges: [
      { text: '0x7FF', accent: 'slate' },
      { text: '*p', accent: 'sky' },
    ],
  },
  c_structs: {
    kind: 'single',
    top: 'typedef struct',
    bottom: 'ptr->field',
    accent: 'sky',
  },
  c_memory: {
    kind: 'pair',
    top: 'malloc / free',
    split: true,
    badges: [
      { text: 'calloc', accent: 'sky' },
      { text: 'NULL', accent: 'yellow' },
    ],
  },

  // TypeScript (Units 1-5)
  ts_types: {
    kind: 'pair',
    top: 'const xp: number',
    split: true,
    badges: [
      { text: 'number', accent: 'sky' },
      { text: 'unknown', accent: 'violet' },
    ],
  },
  ts_unions: {
    kind: 'pair',
    top: 'type Res = Ok | Err',
    split: true,
    badges: [
      { text: 'ok:true', accent: 'sky' },
      { text: 'narrow', accent: 'yellow' },
    ],
  },
  ts_interfaces: {
    kind: 'single',
    top: 'interface User {',
    bottom: 'readonly id: string',
    accent: 'violet',
  },
  ts_generics: {
    kind: 'pair',
    top: 'fn<T extends K>',
    split: true,
    badges: [
      { text: 'T', accent: 'sky' },
      { text: 'keyof T', accent: 'violet' },
    ],
  },
  ts_utils: {
    kind: 'single',
    top: 'Partial<Pick<T>>',
    bottom: 'satisfies Config',
    accent: 'sky',
  },

  // CSS (Units 1-5)
  css_cascade: {
    kind: 'array',
    top: '#id .cls element',
    cells: ['1', '1', '1'],
  },
  css_box: {
    kind: 'single',
    top: 'box-sizing: border',
    bottom: 'pad + border',
    accent: 'sky',
  },
  css_flex: {
    kind: 'pair',
    top: 'display: flex;',
    split: true,
    badges: [
      { text: 'gap: 8', accent: 'violet' },
      { text: 'center', accent: 'sky' },
    ],
  },
  css_grid: {
    kind: 'array',
    top: 'repeat(3, 1fr)',
    cells: ['1fr', '1fr', '1fr'],
  },
  css_vars: {
    kind: 'single',
    top: '--accent: #6E56CF',
    bottom: 'var(--accent)',
    accent: 'violet',
  },

  // HTML (Units 1-5)
  html_dom: {
    kind: 'single',
    top: '<article>',
    bottom: '<header> <main>',
    accent: 'yellow',
  },
  html_semantic: {
    kind: 'array',
    top: '<main> <nav>',
    cells: ['<header>', '<section>', '<footer>'],
  },
  html_media: {
    kind: 'pair',
    top: '<a href="...">',
    split: true,
    badges: [
      { text: 'alt=".."', accent: 'sky' },
      { text: '<img>', accent: 'violet' },
    ],
  },
  html_forms: {
    kind: 'single',
    top: '<label for="id">',
    bottom: '<input required />',
    accent: 'violet',
  },
  html_a11y: {
    kind: 'pair',
    top: '<button aria>',
    split: true,
    badges: [
      { text: 'focus', accent: 'sky' },
      { text: 'role', accent: 'yellow' },
    ],
  },

  // PHP (Units 1-5)
  php_vars: {
    kind: 'pair',
    top: '$xp = 100 ?? 0',
    split: true,
    badges: [
      { text: '$var', accent: 'violet' },
      { text: '. concat', accent: 'sky' },
    ],
  },
  php_arrays: {
    kind: 'single',
    top: '["id" => 1, "ok"]',
    bottom: 'foreach ($a as $v)',
    accent: 'violet',
  },
  php_funcs: {
    kind: 'pair',
    top: 'fn($x): int =>',
    split: true,
    badges: [
      { text: '?string', accent: 'sky' },
      { text: 'strict=1', accent: 'yellow' },
    ],
  },
  php_oop: {
    kind: 'single',
    top: 'public readonly',
    bottom: '$this->id',
    accent: 'sky',
  },
  php_modern: {
    kind: 'pair',
    top: 'match ($code) {',
    split: true,
    badges: [
      { text: 'enum', accent: 'violet' },
      { text: 'default', accent: 'muted' },
    ],
  },

  // Assembly (Units 1-5)
  asm_regs: {
    kind: 'array',
    top: 'mov rax, 0x2A',
    cells: ['RAX', 'RBX', 'RCX'],
  },
  asm_flags: {
    kind: 'pair',
    top: 'cmp rax, rbx',
    split: true,
    badges: [
      { text: 'ZF=1', accent: 'sky' },
      { text: 'SF=0', accent: 'muted' },
    ],
  },
  asm_stack: {
    kind: 'pair',
    top: 'push / pop rbp',
    split: true,
    badges: [
      { text: 'RSP -8', accent: 'violet' },
      { text: '[rsp]', accent: 'sky' },
    ],
  },
  asm_mem: {
    kind: 'single',
    top: 'lea rsi, [rax+8]',
    bottom: 'dec rcx / jnz',
    accent: 'yellow',
  },
  asm_syscall: {
    kind: 'single',
    top: 'mov rax, 60; syscall',
    bottom: 'rdi -> exit(0)',
    accent: 'sky',
  },

  // Swift (Units 1-5)
  swift_vars: {
    kind: 'pair',
    top: 'let app = "Swift"',
    split: true,
    badges: [
      { text: 'let', accent: 'violet' },
      { text: '\\(val)', accent: 'sky' },
    ],
  },
  swift_opt: {
    kind: 'pair',
    top: 'guard let x else',
    split: true,
    badges: [
      { text: 'Int?', accent: 'sky' },
      { text: '?? 0', accent: 'yellow' },
    ],
  },
  swift_struct: {
    kind: 'single',
    top: 'struct Hero {',
    bottom: 'mutating func hit()',
    accent: 'violet',
  },
  swift_proto: {
    kind: 'single',
    top: 'protocol Named {',
    bottom: 'some Sequence',
    accent: 'sky',
  },
  swift_async: {
    kind: 'pair',
    top: 'actor Wallet {',
    split: true,
    badges: [
      { text: 'async', accent: 'violet' },
      { text: 'await', accent: 'sky' },
    ],
  },

  // Kotlin (Units 1-5)
  kt_vars: {
    kind: 'pair',
    top: 'val s = when (x)',
    split: true,
    badges: [
      { text: 'val', accent: 'violet' },
      { text: '${expr}', accent: 'sky' },
    ],
  },
  kt_null: {
    kind: 'pair',
    top: 'user?.name ?: ""',
    split: true,
    badges: [
      { text: '?.let', accent: 'sky' },
      { text: 'is str', accent: 'yellow' },
    ],
  },
  kt_data: {
    kind: 'single',
    top: 'data class Hero',
    bottom: '.copy(hp = 99)',
    accent: 'violet',
  },
  kt_lambda: {
    kind: 'single',
    top: '.filter { it > 0 }',
    bottom: 'apply / also',
    accent: 'sky',
  },
  kt_coro: {
    kind: 'pair',
    top: 'coroutineScope {',
    split: true,
    badges: [
      { text: 'suspend', accent: 'violet' },
      { text: 'Flow<T>', accent: 'sky' },
    ],
  },

  // Julia (Units 1-5)
  jl_one: {
    kind: 'array',
    top: 'arr[1:end]',
    cells: ['1st', '2nd', 'end'],
  },
  jl_broadcast: {
    kind: 'single',
    top: 'y .= @. 2x + 1',
    bottom: '0 extra alloc',
    accent: 'violet',
  },
  jl_dispatch: {
    kind: 'pair',
    top: 'hit(A, B) methods',
    split: true,
    badges: [
      { text: 'x::Int', accent: 'sky' },
      { text: '<: Real', accent: 'violet' },
    ],
  },
  jl_structs: {
    kind: 'single',
    top: 'struct Box{T<:Real}',
    bottom: 'val::T (inline)',
    accent: 'sky',
  },
  jl_perf: {
    kind: 'pair',
    top: '@view xs[1:10]',
    split: true,
    badges: [
      { text: 'zero(x)', accent: 'sky' },
      { text: 'const', accent: 'yellow' },
    ],
  },

  // Lua (Units 1-5)
  lua_local: {
    kind: 'pair',
    top: 'local s = "a".."b"',
    split: true,
    badges: [
      { text: '~=', accent: 'yellow' },
      { text: '#str', accent: 'sky' },
    ],
  },
  lua_funcs: {
    kind: 'pair',
    top: 'return min, max',
    split: true,
    badges: [
      { text: 'local fn', accent: 'violet' },
      { text: 'upvalue', accent: 'sky' },
    ],
  },
  lua_tables: {
    kind: 'array',
    top: 'tbl = {10, 20, 30}',
    cells: ['[1]', '[2]', '[3]'],
  },
  lua_meta: {
    kind: 'single',
    top: 'mt.__index = Dog',
    bottom: 'dog:bark() -> self',
    accent: 'violet',
  },
  lua_coro: {
    kind: 'pair',
    top: 'coroutine.yield',
    split: true,
    badges: [
      { text: 'resume', accent: 'sky' },
      { text: 'pcall', accent: 'yellow' },
    ],
  },

  // C# (Units 1-5)
  cs_vars: {
    kind: 'pair',
    top: 'var s = $"{x} XP"',
    split: true,
    badges: [
      { text: 'var', accent: 'violet' },
      { text: 'foreach', accent: 'sky' },
    ],
  },
  cs_pattern: {
    kind: 'pair',
    top: 'x switch { >= 90 }',
    split: true,
    badges: [
      { text: '??=', accent: 'sky' },
      { text: '_ =>', accent: 'violet' },
    ],
  },
  cs_record: {
    kind: 'single',
    top: 'record Score(int X)',
    bottom: 's1 with { X = 99 }',
    accent: 'violet',
  },
  cs_linq: {
    kind: 'single',
    top: '.Where().Select()',
    bottom: 'deferred -> .ToList()',
    accent: 'sky',
  },
  cs_async: {
    kind: 'pair',
    top: 'await Task.WhenAll',
    split: true,
    badges: [
      { text: 'Task<T>', accent: 'violet' },
      { text: 'Cancel', accent: 'yellow' },
    ],
  },
};

function renderAccentBadge(text: string, accent: ConceptAccent, key: number) {
  if (accent === 'sky') {
    return (
      <View
        key={key}
        style={[styles.tagPill, { borderColor: 'rgba(56, 189, 248, 0.38)' }]}
      >
        <Text style={[styles.tagText, { color: '#38BDF8' }]}>{text}</Text>
      </View>
    );
  }
  if (accent === 'yellow') {
    return (
      <View
        key={key}
        style={[styles.tagPill, { borderColor: 'rgba(250, 204, 21, 0.38)' }]}
      >
        <Text style={[styles.tagText, { color: '#FACC15' }]}>{text}</Text>
      </View>
    );
  }
  if (accent === 'slate') {
    return (
      <View key={key} style={styles.subCodePill}>
        <Text style={styles.codeTextSlate}>{text}</Text>
      </View>
    );
  }
  if (accent === 'muted') {
    return (
      <View key={key} style={styles.mutedPill}>
        <Text style={styles.codeTextMuted}>{text}</Text>
      </View>
    );
  }
  return (
    <View key={key} style={styles.subCodePill}>
      <Text style={styles.codeTextViolet}>{text}</Text>
    </View>
  );
}

const FALLBACK_CONCEPT_BY_LANG: Record<string, ConceptGraphicType[]> = {
  python: ['variables', 'control_flow', 'collections', 'dicts_sets', 'functions', 'classes_oop'],
  cpp: ['cpp_stack', 'cpp_loops', 'cpp_refs', 'cpp_pointers', 'cpp_vectors', 'cpp_classes', 'cpp_smart_ptr'],
  js: ['js_vars', 'js_arrows', 'js_objects', 'js_arrays', 'js_async'],
  go: ['go_vars', 'go_range', 'go_slices', 'go_structs', 'go_channels'],
  java: ['java_vars', 'java_flow', 'java_arrays', 'java_oop', 'java_collections', 'java_streams'],
  rust: ['rust_vars', 'rust_ownership', 'rust_control', 'rust_structs', 'rust_errors', 'rust_collections'],
  sql: ['sql_select', 'sql_filter', 'sql_aggregates', 'sql_joins', 'sql_mutations'],
  c: ['c_basics', 'c_flow', 'c_arrays', 'c_pointers', 'c_structs', 'c_memory'],
  ts: ['ts_types', 'ts_interfaces', 'ts_unions', 'ts_generics', 'ts_utils'],
  css: ['css_cascade', 'css_box', 'css_flex', 'css_grid', 'css_vars'],
  html: ['html_dom', 'html_semantic', 'html_media', 'html_forms', 'html_a11y'],
  php: ['php_vars', 'php_arrays', 'php_funcs', 'php_oop', 'php_modern'],
  asm: ['asm_regs', 'asm_flags', 'asm_stack', 'asm_mem', 'asm_syscall'],
  swift: ['swift_vars', 'swift_opt', 'swift_struct', 'swift_proto', 'swift_async'],
  kotlin: ['kt_vars', 'kt_null', 'kt_data', 'kt_lambda', 'kt_coro'],
  julia: ['jl_one', 'jl_broadcast', 'jl_dispatch', 'jl_structs', 'jl_perf'],
  lua: ['lua_local', 'lua_funcs', 'lua_tables', 'lua_meta', 'lua_coro'],
  csharp: ['cs_vars', 'cs_pattern', 'cs_record', 'cs_linq', 'cs_async'],
};

function resolveConceptType(
  language: LangId | string,
  unitNumber: number,
  explicitType?: ConceptGraphicType,
): ConceptGraphicType {
  if (explicitType && CONCEPT_SPECS[explicitType]) return explicitType;
  const langKey = language === 'javascript' ? 'js' : language;
  const list = FALLBACK_CONCEPT_BY_LANG[langKey] ?? FALLBACK_CONCEPT_BY_LANG.python;
  return list[Math.max(0, Math.min(list.length - 1, unitNumber - 1))] ?? list[0];
}

export function UnitConceptGraphic({
  language,
  unitIndex,
  unitNumber,
  conceptGraphicType,
}: {
  language: LangId | string;
  unitIndex: string | number;
  unitNumber: number;
  conceptGraphicType?: ConceptGraphicType;
}) {
  const uNum = typeof unitIndex === 'number' ? unitIndex + 1 : unitNumber;
  const specKey = resolveConceptType(language, uNum, conceptGraphicType);
  const spec = CONCEPT_SPECS[specKey];

  if (spec.kind === 'loop_indent') {
    return (
      <View style={styles.conceptCol} pointerEvents="none">
        <View style={styles.codePill}>
          <Text style={styles.codeTextLavender}>{spec.top}</Text>
        </View>
        <View style={styles.indentLoopRow}>
          <View style={styles.indentGuide} />
          <View style={styles.subCodePill}>
            <Text style={styles.codeTextViolet}>{spec.body}</Text>
          </View>
          <View style={styles.loopBadge}>
            <Text style={styles.loopGlyph}>↻</Text>
          </View>
        </View>
      </View>
    );
  }

  if (spec.kind === 'array') {
    return (
      <View style={styles.conceptCol} pointerEvents="none">
        <View style={styles.codePill}>
          <Text style={styles.codeTextLavender}>{spec.top}</Text>
        </View>
        <Text style={styles.arrowGlyph}>↓</Text>
        <View style={styles.arrayBlockRow}>
          <View style={styles.arrayCell}>
            <Text style={styles.arrayCellText}>{spec.cells[0]}</Text>
          </View>
          <View style={styles.arrayCellDivider} />
          <View style={styles.arrayCell}>
            <Text style={styles.arrayCellText}>{spec.cells[1]}</Text>
          </View>
          <View style={styles.arrayCellDivider} />
          <View style={styles.arrayCell}>
            <Text style={styles.arrayCellText}>{spec.cells[2]}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (spec.kind === 'dual_top') {
    return (
      <View style={styles.conceptCol} pointerEvents="none">
        <View style={styles.badgePairRow}>
          <View style={styles.miniGoPill}>
            <Text style={styles.miniGoText}>{spec.tops[0]}</Text>
          </View>
          <View style={styles.miniGoPill}>
            <Text style={styles.miniGoText}>{spec.tops[1]}</Text>
          </View>
        </View>
        <Text style={styles.arrowGlyph}>↓</Text>
        <View
          style={[
            styles.subCodePill,
            { borderColor: 'rgba(56, 189, 248, 0.38)' },
          ]}
        >
          <Text style={[styles.tagText, { color: '#38BDF8' }]}>
            {spec.bottom}
          </Text>
        </View>
      </View>
    );
  }

  if (spec.kind === 'single') {
    return (
      <View style={styles.conceptCol} pointerEvents="none">
        <View style={styles.codePill}>
          <Text style={styles.codeTextLavender}>{spec.top}</Text>
        </View>
        <Text style={styles.arrowGlyph}>↓</Text>
        {renderAccentBadge(spec.bottom, spec.accent, 0)}
      </View>
    );
  }

  return (
    <View style={styles.conceptCol} pointerEvents="none">
      <View style={styles.codePill}>
        <Text style={styles.codeTextLavender}>{spec.top}</Text>
      </View>
      {spec.split ? (
        <View style={styles.branchRow}>
          <Text style={styles.arrowGlyph}>↙</Text>
          <Text style={styles.arrowGlyph}>↘</Text>
        </View>
      ) : (
        <Text style={styles.arrowGlyph}>↓</Text>
      )}
      <View style={styles.badgePairRow}>
        {spec.badges.map((b, idx) => renderAccentBadge(b.text, b.accent, idx))}
      </View>
    </View>
  );
}

function UnitHeaderCard({
  unit,
  language,
  onOpenGuide,
  cardOpacity,
  onCardLayout,
}: {
  unit: Unit;
  language: LangId;
  onOpenGuide: (unit: Unit) => void;
  /** Native-driven opacity: fades to 0 over the last 3px before docking. */
  cardOpacity?: Animated.AnimatedInterpolation<number> | number;
  /** Reports the card's y offset relative to the unit section. */
  onCardLayout?: (yInSection: number) => void;
}) {
  const unitLabel = `UNIT 0${unit.unitNumber}`;
  const wrapYRef = useRef(0);

  return (
    <View
      pointerEvents="box-none"
      style={styles.unitCardWrap}
      onLayout={(e) => {
        wrapYRef.current = e.nativeEvent.layout.y;
      }}
    >
      <Text style={styles.unitKickerLabel}>{unitLabel}</Text>

      <Animated.View
        pointerEvents="box-none"
        style={{ opacity: cardOpacity ?? 1 }}
        onLayout={(e) => onCardLayout?.(wrapYRef.current + e.nativeEvent.layout.y)}
      >
        <UnitCardBody unit={unit} language={language} onOpenGuide={onOpenGuide} />
      </Animated.View>
    </View>
  );
}

/** The card surface itself — shared by the inline card and the docked sticky clone. */
function UnitCardBody({
  unit,
  language,
  onOpenGuide,
}: {
  unit: Unit;
  language: LangId;
  onOpenGuide: (unit: Unit) => void;
}) {
  return (
    <View style={styles.unitCard} pointerEvents="box-none">
      <HeroAmbientGlow intensity={0.8} />
      <View style={styles.unitCardLeft} pointerEvents="box-none">
        <Text style={styles.unitCardTitle} numberOfLines={1}>
          {unit.title}
        </Text>
        <RichCodeText
          text={unit.description}
          style={styles.unitCardSubtitle}
          numberOfLines={2}
        />

        <SpringPressable
          onPress={() => onOpenGuide(unit)}
          haptic="light"
          sound="none"
          pressScale={0.96}
          style={styles.unitStartPillBtn}
        >
          <Feather name="book-open" size={13} color="#C4B5FD" />
          <Text style={styles.unitStartPillText}>Guidebook</Text>
        </SpringPressable>
      </View>

      <UnitConceptGraphic
        language={language}
        unitIndex={unit.id}
        unitNumber={unit.unitNumber}
        conceptGraphicType={unit.conceptGraphicType}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Learn Screen                                                       */
/* ------------------------------------------------------------------ */

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeLang,
    completedNodes,
    isHydrated,
    hasCompletedOnboarding,
    pendingFirstLessonLaunch,
    clearPendingFirstLessonLaunch,
  } = useGame();
  const course = getLanguage(activeLang);
  const doneSet = new Set(completedNodes[activeLang] ?? []);

  // Determine the first uncompleted node across all units in this language
  const allNodes = course.units.flatMap((u) => u.nodes);
  const firstUncompletedNode =
    allNodes.find((n) => !doneSet.has(n.id)) ?? allNodes[allNodes.length - 1];

  const [activeLessonNode, setActiveLessonNode] = useState<LessonNode | null>(
    null,
  );
  const [lessonReviewMode, setLessonReviewMode] = useState(false);

  // Auto-launch Unit 1 Node 1 immediately after finishing the express Onboarding flow
  useEffect(() => {
    if (
      !isHydrated ||
      !hasCompletedOnboarding ||
      !pendingFirstLessonLaunch ||
      !firstUncompletedNode
    ) {
      return;
    }
    const timer = setTimeout(() => {
      clearPendingFirstLessonLaunch();
      setLessonReviewMode(false);
      setActiveLessonNode(firstUncompletedNode);
    }, 0);
    return () => clearTimeout(timer);
  }, [
    isHydrated,
    hasCompletedOnboarding,
    pendingFirstLessonLaunch,
    firstUncompletedNode,
    clearPendingFirstLessonLaunch,
  ]);
  const [targetPopoverId, setTargetPopoverId] = useState<string | null>(null);
  const [renderedPopoverId, setRenderedPopoverId] = useState<string | null>(
    null,
  );
  const targetPopoverIdRef = useRef<string | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<Unit | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    targetPopoverIdRef.current = targetPopoverId;
  }, [targetPopoverId]);

  const dismissPopover = useCallback(() => {
    setTargetPopoverId(null);
  }, []);

  const handlePopoverExited = useCallback(() => {
    setRenderedPopoverId(targetPopoverIdRef.current);
  }, []);

  // Smooth bobbing animation for the floating "START" speech bubble
  const [bobAnim] = useState(() => new Animated.Value(0));

  // Tab & course switch fade (0.6 -> 1.0 over 150ms, native driver)
  const pathFadeAnim = useRef(new Animated.Value(1)).current;
  const pathSlideAnim = useRef(new Animated.Value(0)).current;

  const triggerPathFade = useCallback(() => {
    pathFadeAnim.stopAnimation();
    pathSlideAnim.stopAnimation();
    pathFadeAnim.setValue(0.6);
    pathSlideAnim.setValue(4);
    Animated.parallel([
      Animated.timing(pathFadeAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pathSlideAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [pathFadeAnim, pathSlideAnim]);

  // Guidebook modal slide-up + backdrop fade (native driver)
  const guideTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const guideBackdropOpacity = useRef(new Animated.Value(0)).current;

  const openGuidebook = (unit: Unit) => {
    playSound('drawer_open');
    setGuidebookUnit(unit);
    guideTranslateY.stopAnimation();
    guideBackdropOpacity.stopAnimation();
    guideTranslateY.setValue(SCREEN_HEIGHT);
    guideBackdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(guideBackdropOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(guideTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeGuidebook = () => {
    playSound('drawer_close');
    guideTranslateY.stopAnimation();
    guideBackdropOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(guideBackdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(guideTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGuidebookUnit(null);
    });
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bobAnim]);

  const [syncedLang, setSyncedLang] = useState(activeLang);
  if (syncedLang !== activeLang) {
    setSyncedLang(activeLang);
    setActiveLessonNode(null);
    setLessonReviewMode(false);
    setTargetPopoverId(null);
    setRenderedPopoverId(null);
  }

  useEffect(() => {
    triggerPathFade();
  }, [activeLang, triggerPathFade]);

  /* -------- Pixel-perfect sticky unit header handoff -------- */
  const scrollY = useRef(new Animated.Value(0)).current;
  const [sectionYs, setSectionYs] = useState<Record<string, number>>({});
  const [cardYs, setCardYs] = useState<Record<string, number>>({});
  const [dockedIdx, setDockedIdx] = useState(-1);
  const dockedIdxRef = useRef(-1);
  const lastAutoScrolledKeyRef = useRef('');

  const activeNodeUnit = firstUncompletedNode
    ? course.units.find((u) =>
        u.nodes.some((n) => n.id === firstUncompletedNode.id),
      ) ?? null
    : null;
  const activeUnitSectionY = activeNodeUnit
    ? sectionYs[activeNodeUnit.id]
    : undefined;
  const activeUnitScrollKey = activeNodeUnit
    ? `${activeLang}:${activeNodeUnit.id}:${firstUncompletedNode?.id ?? ''}`
    : '';

  useEffect(() => {
    if (!activeUnitScrollKey || activeUnitSectionY === undefined) return;
    if (lastAutoScrolledKeyRef.current === activeUnitScrollKey) return;
    lastAutoScrolledKeyRef.current = activeUnitScrollKey;

    const unitRowNodes =
      activeNodeUnit?.nodes.filter((n) => n.kind !== 'checkpoint_cube') ?? [];
    const nodeIdx = unitRowNodes.findIndex(
      (n) => n.id === firstUncompletedNode?.id,
    );
    const hasTopCenter = unitRowNodes.length >= 5;
    const rowY =
      firstUncompletedNode?.kind === 'checkpoint_cube'
        ? Y_ROW2
        : nodeIdx >= (hasTopCenter ? 3 : 2)
          ? Y_ROW3
          : Y_ROW1;
    const targetY = Math.max(0, activeUnitSectionY + rowY - 120);
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [
    activeNodeUnit,
    activeUnitScrollKey,
    activeUnitSectionY,
    firstUncompletedNode,
  ]);

  // Content-space y of each unit card's top edge (collision point with the docked banner).
  const dockStops: number[] | null = course.units.every(
    (u) => sectionYs[u.id] !== undefined && cardYs[u.id] !== undefined,
  )
    ? course.units.map((u) => sectionYs[u.id] + cardYs[u.id])
    : null;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
        if (!dockStops) return;
        const y = e.nativeEvent.contentOffset.y;
        let idx = -1;
        for (let i = 0; i < dockStops.length; i++) {
          if (y >= dockStops[i]) idx = i;
        }
        if (idx !== dockedIdxRef.current) {
          dockedIdxRef.current = idx;
          setDockedIdx(idx);
        }
      },
    },
  );

  // Inline card fades out over the final 3px before it reaches the docked banner.
  const inlineCardOpacity = (i: number) =>
    dockStops
      ? scrollY.interpolate({
          inputRange: [dockStops[i] - 3, dockStops[i]],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        })
      : 1;

  // Docked clone i is visible exactly while dockStops[i] <= scrollY < dockStops[i + 1].
  const dockedCloneOpacity = (i: number) => {
    if (!dockStops) return 0;
    const start = dockStops[i];
    const next = dockStops[i + 1];
    return next === undefined
      ? scrollY.interpolate({
          inputRange: [start - 0.5, start],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : scrollY.interpolate({
          inputRange: [start - 0.5, start, next - 0.5, next],
          outputRange: [0, 1, 1, 0],
          extrapolate: 'clamp',
        });
  };

  const handleNodePress = (node: LessonNode) => {
    Haptics.selectionAsync().catch(() => undefined);
    if (targetPopoverId === node.id) {
      playSound('drawer_close');
      setTargetPopoverId(null);
    } else {
      playSound('drawer_open');
      setTargetPopoverId(node.id);
      if (renderedPopoverId === null) {
        setRenderedPopoverId(node.id);
      }
    }
  };

  const handleLaunchFromPopover = (
    node: LessonNode,
    isCompleted: boolean,
  ) => {
    playSound('run_code');
    setTargetPopoverId(null);
    setRenderedPopoverId(null);
    setLessonReviewMode(isCompleted);
    setActiveLessonNode(node);
  };

  const launchLessonFromGuidebook = (node: LessonNode) => {
    const status = computeNodeStatus(
      completedNodes[activeLang] ?? [],
      node.id,
      allNodes,
    );
    if (status === 'locked') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => undefined,
      );
      playSound('wrong');
      return;
    }

    guideTranslateY.stopAnimation();
    guideBackdropOpacity.stopAnimation();
    setGuidebookUnit(null);
    setTargetPopoverId(null);
    setRenderedPopoverId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    playSound('run_code');
    setLessonReviewMode(status === 'completed');
    setActiveLessonNode(node);
  };

  const handleStartFromGuidebook = () => {
    if (!guidebookUnit) return;
    const nextInUnit =
      guidebookUnit.nodes.find((n) => !doneSet.has(n.id)) ??
      guidebookUnit.nodes[0];
    if (!nextInUnit) return;
    launchLessonFromGuidebook(nextInUnit);
  };

  const handleOpenUnitInIde = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    playSound('run_code');
    guideTranslateY.stopAnimation();
    guideBackdropOpacity.stopAnimation();
    setGuidebookUnit(null);
    setTargetPopoverId(null);
    setRenderedPopoverId(null);
    router.navigate({ pathname: '/sandbox', params: { openIde: '1' } });
  };

  const tabBarClearance = Math.max(148, insets.bottom + 124);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatsHeader />
      <View style={styles.headerDivider} />

      <Animated.View
        style={[
          styles.scrollView,
          {
            opacity: pathFadeAnim,
            transform: [{ translateY: pathSlideAnim }],
          },
        ]}
      >
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarClearance },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={dismissPopover}
        scrollEventThrottle={16}
      >
        {targetPopoverId ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissPopover}
          />
        ) : null}
        {course.units.map((unit, unitIdx) => {
          const cubeNode = unit.nodes.find((n) => n.kind === 'checkpoint_cube');
          const rowNodes = unit.nodes.filter(
            (n) => n.kind !== 'checkpoint_cube',
          );
          const hasTopCenter = rowNodes.length >= 5;

          const topLeft = rowNodes[0];
          const topCenter = hasTopCenter ? rowNodes[1] : undefined;
          const topRight = hasTopCenter ? rowNodes[2] : rowNodes[1];
          const bottomCenter = hasTopCenter ? rowNodes[3] : rowNodes[2];
          const bottomRight = hasTopCenter ? rowNodes[4] : rowNodes[3];

          const rawSlots: {
            slotKey: string;
            node: LessonNode | undefined;
            x: number;
            y: number;
          }[] = [
            { slotKey: `${unit.id}-row1-left`, node: topLeft, x: X_LEFT, y: Y_ROW1 },
            {
              slotKey: `${unit.id}-row1-center`,
              node: topCenter,
              x: X_CENTER,
              y: Y_ROW1,
            },
            {
              slotKey: `${unit.id}-row1-right`,
              node: topRight,
              x: X_RIGHT,
              y: Y_ROW1,
            },
            {
              slotKey: `${unit.id}-row2-cube`,
              node: cubeNode,
              x: X_CENTER,
              y: Y_ROW2,
            },
            {
              slotKey: `${unit.id}-row3-center`,
              node: bottomCenter,
              x: X_CENTER,
              y: Y_ROW3,
            },
            {
              slotKey: `${unit.id}-row3-right`,
              node: bottomRight,
              x: X_RIGHT,
              y: Y_ROW3,
            },
          ];

          const lessonSlots = rawSlots
            .filter((s): s is { slotKey: string; node: LessonNode; x: number; y: number } => Boolean(s.node))
            .map((s) => {
              const isCompleted = doneSet.has(s.node.id);
              const isActive =
                firstUncompletedNode?.id === s.node.id && !isCompleted;
              return {
                ...s,
                isCompleted,
                isActive,
              };
            });

          let litEdges = 0;
          for (let idx = 0; idx < lessonSlots.length - 1; idx += 1) {
            if (lessonSlots[idx].isCompleted) {
              litEdges += 1;
            } else {
              break;
            }
          }

          const renderedSlotInUnit =
            lessonSlots.find((s) => s.node.id === renderedPopoverId) ?? null;
          const renderedVariant: 'active' | 'completed' | 'locked' | null =
            renderedSlotInUnit
              ? renderedSlotInUnit.isActive
                ? 'active'
                : renderedSlotInUnit.isCompleted
                  ? 'completed'
                  : 'locked'
              : null;
          const renderedNodeOrder = renderedSlotInUnit
            ? Math.max(
                1,
                unit.nodes.findIndex(
                  (n) => n.id === renderedSlotInUnit.node.id,
                ) + 1,
              )
            : 1;

          return (
            <View
              key={unit.id}
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setSectionYs((prev) =>
                  prev[unit.id] === y ? prev : { ...prev, [unit.id]: y },
                );
              }}
              style={[
                styles.unitSectionWrap,
                renderedSlotInUnit ? styles.unitSectionElevated : null,
              ]}
            >
              {/* Compact Unit Header Card with Dynamic Language + Unit 2D Graphic */}
              <UnitHeaderCard
                unit={unit}
                language={activeLang}
                onOpenGuide={(u) => {
                  dismissPopover();
                  openGuidebook(u);
                }}
                cardOpacity={inlineCardOpacity(unitIdx)}
                onCardLayout={(y) =>
                  setCardYs((prev) =>
                    prev[unit.id] === y ? prev : { ...prev, [unit.id]: y },
                  )
                }
              />

              {/* Mimo-Style S-Curve Board with 3D Cylinder / Puck Nodes */}
              <View style={[styles.sCurveBoard, { overflow: 'visible' }]}>
                {renderedSlotInUnit ? (
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={dismissPopover}
                  />
                ) : null}

                <MimoDashedSCurve
                  hasTopCenter={hasTopCenter}
                  hasBottomRight={Boolean(bottomRight)}
                  litEdges={litEdges}
                />

                {/* Lesson, Checkpoint Cube, & Unit Boss 3D Puck Node Slots */}
                {lessonSlots.map((slot) => {
                  const isCube = slot.node.kind === 'checkpoint_cube';
                  const isLocked = !slot.isCompleted && !slot.isActive;
                  const isSelected = targetPopoverId === slot.node.id;

                  // 3D Cylinder / Puck Surface & Base Extrusion Palette
                  const puckFace = slot.isCompleted
                    ? '#35256B'
                    : slot.isActive
                    ? '#7C5CFC'
                    : '#161720';
                  const puckLip = slot.isCompleted
                    ? '#211547'
                    : slot.isActive
                    ? '#4C32B8'
                    : '#0D0E14';

                  return (
                    <View
                      key={slot.slotKey}
                      style={[
                        styles.boardNodeSlot,
                        {
                          left: slot.x - 42,
                          top: slot.y - 40,
                          zIndex:
                            renderedPopoverId === slot.node.id
                              ? 60
                              : slot.isActive
                                ? 30
                                : 10,
                        },
                      ]}
                    >
                      {/* Floating "START" Speech Bubble above Active Node */}
                      {slot.isActive && !isSelected ? (
                        <Animated.View
                          pointerEvents="none"
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

                      {/* Concentric ring ONLY around current Active node; Completed pucks match standard 68px puck size cleanly */}
                      {slot.isActive ? (
                        <View style={styles.activeConcentricRing}>
                          <Tactile3DNode
                            faceColor={puckFace}
                            lipColor={puckLip}
                            borderWidth={0}
                            showGloss
                            onPress={() => handleNodePress(slot.node)}
                          >
                            {renderNodeIcon(
                              slot.node,
                              slot.isCompleted,
                              isLocked,
                            )}
                          </Tactile3DNode>
                        </View>
                      ) : (
                        <Tactile3DNode
                          faceColor={puckFace}
                          lipColor={puckLip}
                          borderWidth={0}
                          showGloss={!isLocked}
                          glossOpacity={slot.isCompleted ? 0.14 : 0.11}
                          onPress={() => handleNodePress(slot.node)}
                        >
                          {renderNodeIcon(
                            slot.node,
                            slot.isCompleted,
                            isLocked,
                          )}
                        </Tactile3DNode>
                      )}

                      {isCube && slot.isCompleted ? (
                        <View style={styles.claimedBadge}>
                          <Text style={styles.claimedBadgeText}>
                            +{slot.node.gemReward}
                          </Text>
                          <GemIcon size={10} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                {renderedSlotInUnit && renderedVariant ? (
                  <AnchoredNodePopover
                    key={renderedSlotInUnit.node.id}
                    node={renderedSlotInUnit.node}
                    anchorX={renderedSlotInUnit.x}
                    anchorY={renderedSlotInUnit.y}
                    lessonNumber={renderedNodeOrder}
                    totalInUnit={unit.nodes.length}
                    variant={renderedVariant}
                    visible={targetPopoverId === renderedPopoverId}
                    onDismiss={dismissPopover}
                    onExited={handlePopoverExited}
                    onStart={() =>
                      handleLaunchFromPopover(
                        renderedSlotInUnit.node,
                        renderedSlotInUnit.isCompleted,
                      )
                    }
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

        {/* Docked unit banner: switches only at the exact collision pixel */}
        <View style={styles.dockedOverlay} pointerEvents="box-none">
          {course.units.map((unit, i) => (
            <Animated.View
              key={`docked-${unit.id}`}
              pointerEvents={i === dockedIdx ? 'box-none' : 'none'}
              style={[styles.dockedClone, { opacity: dockedCloneOpacity(i) }]}
            >
              <View style={styles.dockedBacking} pointerEvents="none" />
              <UnitCardBody
                unit={unit}
                language={activeLang}
                onOpenGuide={(u) => {
                  dismissPopover();
                  openGuidebook(u);
                }}
              />
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <UnitGuidebookModal
        unit={guidebookUnit}
        course={course}
        completedIds={completedNodes[activeLang] ?? []}
        allNodes={allNodes}
        translateY={guideTranslateY}
        backdropOpacity={guideBackdropOpacity}
        bottomInset={insets.bottom}
        onClose={closeGuidebook}
        onStartNext={handleStartFromGuidebook}
        onSelectNode={(node) => launchLessonFromGuidebook(node)}
        onOpenInIde={handleOpenUnitInIde}
      />

      <LessonSessionModal
        visible={activeLessonNode !== null}
        node={activeLessonNode}
        language={activeLang}
        reviewMode={lessonReviewMode}
        onClose={() => {
          setActiveLessonNode(null);
          setLessonReviewMode(false);
        }}
        onComplete={() => {
          setActiveLessonNode(null);
          setLessonReviewMode(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    gap: 10,
  },
  unitSectionWrap: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  unitSectionElevated: {
    zIndex: 100,
    elevation: 16,
    overflow: 'visible',
  },
  dockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  dockedClone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
  },
  dockedBacking: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.canvas,
  },

  /* Compact Unit Header Card ------------------------------------------ */
  unitCardWrap: {
    width: '100%',
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  unitKickerLabel: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8B5CF6',
    marginBottom: 6,
    marginLeft: 2,
  },
  unitCard: {
    width: '100%',
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  unitCardLeft: {
    flex: 1,
    maxWidth: '62%',
  },
  unitCardTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  unitCardSubtitle: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#94A3B8',
    marginBottom: 12,
  },
  unitStartPillBtn: {
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  unitStartPillText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F8FAFC',
  },

  /* Language + Unit Specific 2D Concept Graphics ---------------------- */
  conceptCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  codePill: {
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.30)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCodePill: {
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.32)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedPill: {
    backgroundColor: '#161621',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.40)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPill: {
    backgroundColor: '#191826',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeTextLavender: {
    fontFamily: MONO,
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  codeTextViolet: {
    fontFamily: MONO,
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  codeTextSlate: {
    fontFamily: MONO,
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  codeTextMuted: {
    fontFamily: MONO,
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  arrowGlyph: {
    fontFamily: MONO,
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 13,
    marginVertical: 2,
  },
  branchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 44,
    marginVertical: 1,
  },
  badgePairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indentLoopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  indentGuide: {
    width: 6,
    height: 14,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#64748B',
    borderBottomLeftRadius: 3,
  },
  loopBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.38)',
    borderRadius: 6,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopGlyph: {
    fontFamily: MONO,
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  arrayBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  arrayCell: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  arrayCellDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.28)',
  },
  arrayCellText: {
    fontFamily: MONO,
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '700',
  },
  miniGoPill: {
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.30)',
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  miniGoText: {
    fontFamily: MONO,
    color: '#C4B5FD',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  /* Mimo S-Curve Board & 3D Cylinder Pucks ---------------------------- */
  sCurveBoard: {
    width: BOARD_W,
    height: BOARD_H,
    position: 'relative',
    marginTop: 2,
    marginBottom: 4,
  },
  boardNodeSlot: {
    position: 'absolute',
    width: 84,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeConcentricRing: {
    padding: 7,
    borderRadius: 48,
    backgroundColor: '#12131C',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 92, 252, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimedBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#191826',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  claimedBadgeText: {
    fontFamily: MONO,
    fontSize: 8.5,
    fontWeight: '700',
    color: '#C4B5FD',
  },

  /* Floating "START" Speech Bubble ------------------------------------ */
  startBubbleWrapper: {
    position: 'absolute',
    bottom: 78,
    alignItems: 'center',
    zIndex: 40,
  },
  startBubbleBox: {
    backgroundColor: '#7C5CFC',
    borderWidth: 1.5,
    borderColor: '#A78BFA',
    borderBottomWidth: 3,
    borderBottomColor: '#4C35B5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  startBubbleText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.7,
  },
  startBubbleTriangle: {
    width: 8,
    height: 8,
    backgroundColor: '#7C5CFC',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#4C35B5',
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },

  /* Anchored Node Popovers -------------------------------------------- */
  nodePopoverWrap: {
    position: 'absolute',
    zIndex: 80,
    elevation: 18,
  },
  nodePopoverArrow: {
    position: 'absolute',
    top: -8.5,
    width: 16,
    height: 9,
    zIndex: 3,
  },
  nodePopoverCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  nodePopoverActive: {
    backgroundColor: '#7C5CFC',
  },
  nodePopoverCompleted: {
    backgroundColor: '#1E1836',
    borderWidth: 0,
  },
  nodePopoverLocked: {
    backgroundColor: '#1C1D26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  popoverTitleActive: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  popoverMetaActive: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: -4,
  },
  popoverCtaActive: {
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  popoverCtaActiveText: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#7C5CFC',
    letterSpacing: 0.3,
  },
  popoverCompletedTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  popoverTitleCompleted: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.25,
  },
  popoverCompletedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 92, 252, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  popoverCompletedBadgeText: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#EDE9FE',
    letterSpacing: 0.4,
  },
  popoverMetaCompleted: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 17.5,
    color: '#CBD5E1',
  },
  popoverCtaReview: {
    height: 44,
    borderRadius: 13,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 4,
    borderBottomColor: '#4C32B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  popoverCtaReviewText: {
    fontFamily: MONO,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  popoverLockedBody: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  popoverLockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  popoverLockedTitle: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  popoverLockedCopy: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 17.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
