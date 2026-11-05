import React from 'react';
import {
  Image,
  Pressable,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/theme';
import { tapHaptic } from '@/utils/haptics';

export interface Tactile3DBoxProps {
  children: React.ReactNode;
  /** Top surface background color */
  faceColor?: string;
  /** Outer base 3D lip color */
  lipColor?: string;
  /** 2px border color around the top face (defaults to lipColor) */
  borderColor?: string;
  /** Border width on the inner face (default 2) */
  borderWidth?: number;
  /** 3D extrusion depth in px (default 5) */
  depth?: number;
  /** Corner radius for both outer base and inner face (default 16) */
  borderRadius?: number;
  /** Optional press handler; if provided, pressing depresses the inner face into the base */
  onPress?: () => void;
  disabled?: boolean;
  /** Outer container style (flex, width, margin, etc.) */
  style?: StyleProp<ViewStyle>;
  /** Inner face style (padding, flexDirection, alignItems, etc.) */
  faceStyle?: StyleProp<ViewStyle>;
}

/**
 * True 2-layer Duolingo 3D extrusion component for iOS & Android.
 * Outer Base View renders the solid 3D lip (`lipColor` + `paddingBottom: depth`).
 * Inner Face View renders the top surface (`faceColor` + `2px` border) and translates
 * down by `depth` px when pressed while the outer base reduces its bottom padding.
 */
export function Tactile3DBox({
  children,
  faceColor = Colors.card,
  lipColor = Colors.cardLip,
  borderColor,
  borderWidth = 2,
  depth = 5,
  borderRadius = 16,
  onPress,
  disabled = false,
  style,
  faceStyle,
}: Tactile3DBoxProps) {
  const resolvedBorderColor = borderColor ?? lipColor;

  if (!onPress) {
    return (
      <View
        style={[
          {
            backgroundColor: lipColor,
            borderRadius,
            paddingBottom: depth,
          },
          style,
        ]}
      >
        <View
          style={[
            {
              backgroundColor: faceColor,
              borderRadius,
              borderWidth,
              borderColor: resolvedBorderColor,
            },
            faceStyle,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={style}
    >
      {({ pressed }) => {
        const isDown = pressed && !disabled && depth > 0;
        return (
          <View
            style={{
              backgroundColor: lipColor,
              borderRadius,
              paddingBottom: isDown ? 0 : depth,
              marginBottom: isDown ? depth : 0,
            }}
          >
            <View
              style={[
                {
                  backgroundColor: faceColor,
                  borderRadius,
                  borderWidth,
                  borderColor: resolvedBorderColor,
                  transform: [{ translateY: isDown ? depth : 0 }],
                },
                faceStyle,
              ]}
            >
              {children}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

export interface Tactile3DNodeProps {
  children: React.ReactNode;
  faceColor: string;
  lipColor: string;
  showGloss?: boolean;
  onPress: () => void;
}

/**
 * 1:1 pixel-extracted alpha mask of the official Duolingo node highlight
 * sampled directly from the reference node without arbitrary shifts or distortion.
 */
const DUOLINGO_SHINE_URI =
  'data:image/png;base64,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';

export function DuolingoNodeSpecular() {
  return (
    <View style={specularStyles.container} pointerEvents="none">
      <Image
        source={{ uri: DUOLINGO_SHINE_URI }}
        style={specularStyles.shineImage}
        resizeMode="stretch"
      />
    </View>
  );
}

export const DUO_NODE_WIDTH = 68;
export const DUO_NODE_HEIGHT = 64;
export const DUO_FACE_HEIGHT = 56;
export const DUO_FACE_SCALE_Y = DUO_FACE_HEIGHT / DUO_NODE_WIDTH; // 0.823529

/**
 * Authentic Duolingo 3D Path Node:
 * - True mathematical ellipse top face (width: 68, visual height: 56, aspect ratio 1.21).
 * - Exact Duolingo reflection pattern extracted 1:1 directly from the official reference.
 * - 3D base lip extrusion of 8px (total puck height: 64px, width: 68px, aspect ratio 1.06).
 * - Seamless side connector joining face and lip equators with zero seams or flat edges.
 * - Children (icons) centered without vertical squashing or distortion.
 */
export function Tactile3DNode({
  children,
  faceColor,
  lipColor,
  showGloss = true,
  onPress,
}: Tactile3DNodeProps) {
  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={styles.puckContainer}
    >
      {({ pressed }) => {
        const translateY = pressed ? 5 : 0;
        return (
          <>
            {/* 3D Base Lip Ellipse (Shifted down by 8px, visual bounds y=8..64) */}
            <View
              style={[
                styles.lipOval,
                { backgroundColor: lipColor },
              ]}
            />

            {/* Seamless side connector joining top face and base lip equators */}
            <View
              style={[
                styles.lipConnector,
                { backgroundColor: lipColor },
              ]}
            />

            {/* Top Oval Face with Exact Duolingo Reflection Pattern (visual bounds y=0..56) */}
            <View
              style={[
                styles.faceOval,
                {
                  backgroundColor: faceColor,
                  transform: [
                    { scaleY: DUO_FACE_SCALE_Y },
                    { translateY: translateY / DUO_FACE_SCALE_Y },
                  ],
                },
              ]}
            >
              {showGloss ? <DuolingoNodeSpecular /> : null}
            </View>

            {/* Centered Unscaled Children / Icons */}
            <View
              style={[
                styles.iconLayer,
                {
                  transform: [{ translateY }],
                },
              ]}
              pointerEvents="none"
            >
              {children}
            </View>
          </>
        );
      }}
    </Pressable>
  );
}

const specularStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.38,
  },
  shineImage: {
    width: '100%',
    height: '100%',
  },
});

const styles = StyleSheet.create({
  puckContainer: {
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  lipOval: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_WIDTH,
    borderRadius: DUO_NODE_WIDTH / 2,
    transform: [{ scaleY: DUO_FACE_SCALE_Y }],
  },
  lipConnector: {
    position: 'absolute',
    top: 24,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: 8,
  },
  faceOval: {
    position: 'absolute',
    top: -6,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_WIDTH,
    borderRadius: DUO_NODE_WIDTH / 2,
    overflow: 'hidden',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_FACE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
