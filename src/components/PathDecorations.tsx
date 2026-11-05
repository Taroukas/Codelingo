import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, MONO } from '@/theme';
import { successHaptic, tapHaptic } from '@/utils/haptics';
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
 * Clean 3D Gold Bonus Node on the S-Curve Path matching the authentic Duolingo puck shape.
 */
export function BonusChestNode({ claimed, offsetX, onClaim }: BonusChestNodeProps) {
  return (
    <View style={[styles.chestRow, { transform: [{ translateX: offsetX }] }]}>
      <Pressable
        onPress={() => {
          if (!claimed) {
            successHaptic();
            onClaim();
          } else {
            tapHaptic();
          }
        }}
        style={styles.nodeContainer}
      >
        {({ pressed }) => {
          const translateY = pressed ? 5 : 0;
          return (
            <>
              {/* 3D Base Lip Ellipse */}
              <View style={styles.nodeBase} />

              {/* Seamless side connector */}
              <View style={styles.nodeConnector} />

              {/* Top Oval Face */}
              <View
                style={[
                  styles.nodeFace,
                  {
                    transform: [
                      { scaleY: DUO_FACE_SCALE_Y },
                      { translateY: translateY / DUO_FACE_SCALE_Y },
                    ],
                  },
                ]}
              >
                <DuolingoNodeSpecular />
              </View>

              {/* Unscaled Centered Icon */}
              <View
                style={[
                  styles.iconLayer,
                  { transform: [{ translateY }] },
                ]}
                pointerEvents="none"
              >
                <FontAwesome5
                  name={claimed ? 'gem' : 'gift'}
                  size={26}
                  color={Colors.white}
                  solid
                />
              </View>

              {claimed ? (
                <View style={styles.claimedPill}>
                  <Text style={styles.claimedPillText}>+25</Text>
                </View>
              ) : null}
            </>
          );
        }}
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
  nodeBase: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_WIDTH,
    borderRadius: DUO_NODE_WIDTH / 2,
    backgroundColor: '#CA8A04',
    transform: [{ scaleY: DUO_FACE_SCALE_Y }],
  },
  nodeConnector: {
    position: 'absolute',
    top: 24,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: 8,
    backgroundColor: '#CA8A04',
  },
  nodeFace: {
    position: 'absolute',
    top: -6,
    left: 0,
    width: DUO_NODE_WIDTH,
    height: DUO_NODE_WIDTH,
    borderRadius: DUO_NODE_WIDTH / 2,
    backgroundColor: Colors.gold,
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
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  claimedPillText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.gold,
  },
});
