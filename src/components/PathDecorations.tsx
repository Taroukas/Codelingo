import React, { useRef } from 'react';
import { Animated, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONO, Colors } from '@/theme';
import { successHaptic, tapHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import {
  DuolingoNodeSpecular,
  DUO_NODE_WIDTH,
  DUO_NODE_HEIGHT,
  DUO_FACE_HEIGHT,
  DUO_FACE_SCALE_Y,
} from './Tactile3D';

interface BonusChestNodeProps {
  claimed: boolean;
  offsetX: number;
  onClaim: () => void;
}

/**
 * Milestone / Checkpoint Node (formerly the gift box):
 * Deep Violet 3D puck (Top Face #4C1D95, Lip #2E1065, Border #8B5CF6, Icon #F5F3FF).
 */
export function BonusChestNode({ claimed, offsetX, onClaim }: BonusChestNodeProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    pressAnim.stopAnimation();
    scaleAnim.stopAnimation();
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 4.5,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    pressAnim.stopAnimation();
    scaleAnim.stopAnimation();
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0,
        friction: 6,
        tension: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.chestRow, { transform: [{ translateX: offsetX }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (!claimed) {
            successHaptic();
            playSound('coin');
            onClaim();
          } else {
            tapHaptic();
            playSound('tap');
          }
        }}
        style={styles.nodeContainer}
      >
        <Animated.View
          style={[
            styles.nodeContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* 3D Base Lip Ellipse */}
          <View style={styles.nodeBase} />

          {/* Seamless side connector */}
          <View style={styles.nodeConnector} />

          {/* Movable Top Layer */}
          <Animated.View
            style={[
              styles.movableTop,
              { transform: [{ translateY: pressAnim }] },
            ]}
          >
            {/* Top Oval Face */}
            <View
              style={[
                styles.nodeFace,
                {
                  transform: [{ scaleY: DUO_FACE_SCALE_Y }],
                },
              ]}
            >
              <DuolingoNodeSpecular />
            </View>

            {/* Unscaled Centered Developer Milestone Icon */}
            <View style={styles.iconLayer} pointerEvents="none">
              <Ionicons
                name="cube"
                size={28}
                color={Colors.milestoneIcon}
              />
            </View>
          </Animated.View>

          {claimed ? (
            <View style={styles.claimedPill}>
              <Text style={styles.claimedPillText}>+25 XP</Text>
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chestRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  nodeContainer: {
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  movableTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_HEIGHT,
  },
  nodeBase: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_WIDTH,
    borderRadius: DUO_NODE_WIDTH / 2,
    backgroundColor: '#12131A',
    transform: [{ scaleY: DUO_FACE_SCALE_Y }],
  },
  nodeConnector: {
    position: 'absolute',
    top: 24,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: 8,
    backgroundColor: '#12131A',
  },
  nodeFace: {
    position: 'absolute',
    top: -6,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_WIDTH,
    borderRadius: DUO_NODE_WIDTH / 2,
    backgroundColor: '#222430',
    borderWidth: 0,
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
  claimedPill: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  claimedPillText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
