import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CodeBlocksExercise } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { Tactile3DBox } from '@/components/Tactile3D';
import { shuffle } from '@/utils/haptics';

export interface ExerciseSelectionState {
  canCheck: boolean;
  isCorrect: boolean;
  correctAnswerText: string;
}

interface Props {
  exercise: CodeBlocksExercise;
  locked: boolean;
  onSelectionChange: (state: ExerciseSelectionState) => void;
}

export function CodeBlocks({ exercise, locked, onSelectionChange }: Props) {
  const pool = useMemo(
    () => shuffle([...exercise.tokens, ...exercise.distractors]),
    [exercise],
  );

  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    setPicked([]);
  }, [exercise]);

  useEffect(() => {
    const built = picked.map((idx) => pool[idx]);
    const isCorrect =
      built.length === exercise.tokens.length &&
      built.every((tok, idx) => tok === exercise.tokens[idx]);

    onSelectionChange({
      canCheck: picked.length > 0,
      isCorrect,
      correctAnswerText: exercise.tokens.join(' '),
    });
  }, [picked, pool, exercise, onSelectionChange]);

  const handlePickFromBank = (poolIdx: number) => {
    if (locked || picked.includes(poolIdx)) return;
    setPicked((prev) => [...prev, poolIdx]);
  };

  const handleRemoveFromAnswer = (posInPicked: number) => {
    if (locked) return;
    setPicked((prev) => prev.filter((_, i) => i !== posInPicked));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>BUILD THE STATEMENT</Text>
      <Text style={styles.prompt}>{exercise.prompt}</Text>

      {/* Target output preview */}
      <View style={styles.outputHintCard}>
        <Text style={styles.outputHintLabel}>EXPECTED OUTPUT</Text>
        <Text style={styles.outputHintValue}>{exercise.output}</Text>
      </View>

      {/* Two horizontal Duolingo Answer Slot Lines */}
      <View style={styles.answerArea}>
        <View style={styles.slotRow}>
          {picked.length === 0 ? (
            <Text style={styles.placeholderText}>
              Tap code blocks below to assemble the statement
            </Text>
          ) : (
            picked.map((poolIdx, pos) => (
              <Tactile3DBox
                key={`${poolIdx}-${pos}`}
                depth={4}
                borderRadius={12}
                faceColor={Colors.card}
                lipColor={Colors.violetLip}
                borderColor={Colors.violet}
                disabled={locked}
                onPress={() => handleRemoveFromAnswer(pos)}
                faceStyle={styles.tokenFace}
              >
                <Text style={styles.tokenText}>{pool[poolIdx]}</Text>
              </Tactile3DBox>
            ))
          )}
        </View>
        <View style={styles.secondSlotGuide} />
      </View>

      {/* Centered Token Bank with exact-dimension Ghost Slots */}
      <View style={styles.bankArea}>
        {pool.map((tok, idx) => {
          const isUsed = picked.includes(idx);

          if (isUsed) {
            return (
              <View key={idx} style={styles.ghostSlotOuter}>
                <View style={[styles.tokenFace, styles.ghostSlotFace]}>
                  <Text style={[styles.tokenText, styles.ghostText]}>{tok}</Text>
                </View>
              </View>
            );
          }

          return (
            <Tactile3DBox
              key={idx}
              depth={4}
              borderRadius={12}
              faceColor={Colors.card}
              lipColor={Colors.cardLip}
              borderColor={Colors.border}
              disabled={locked}
              onPress={() => handlePickFromBank(idx)}
              faceStyle={styles.tokenFace}
            >
              <Text style={styles.tokenText}>{tok}</Text>
            </Tactile3DBox>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  kicker: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  prompt: {
    fontFamily: UI_FONT,
    fontSize: 21,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 28,
  },
  outputHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ideBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  outputHintLabel: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  outputHintValue: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.green,
  },
  answerArea: {
    marginTop: 4,
  },
  slotRow: {
    minHeight: 60,
    borderBottomWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  secondSlotGuide: {
    height: 44,
    borderBottomWidth: 2,
    borderColor: Colors.border,
  },
  placeholderText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDisabled,
  },
  bankArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 12,
  },
  tokenFace: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostSlotOuter: {
    paddingBottom: 4,
    borderRadius: 12,
  },
  ghostSlotFace: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.card,
    opacity: 0.55,
  },
  tokenText: {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  ghostText: {
    color: 'transparent',
  },
});
