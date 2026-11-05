import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FindBugExercise } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { CodeLine } from '@/components/CodeLine';
import { tapHaptic } from '@/utils/haptics';
import { ExerciseSelectionState } from './CodeBlocks';

interface Props {
  exercise: FindBugExercise;
  fileExt?: string;
  locked: boolean;
  onSelectionChange?: (state: ExerciseSelectionState) => void;
  /** Optional immediate callback used by 60s Bug Hunt Blitz in the Practice tab */
  onImmediateLineTap?: (lineIndex: number, isCorrect: boolean) => void;
}

export function FindBug({
  exercise,
  fileExt = 'py',
  locked,
  onSelectionChange,
  onImmediateLineTap,
}: Props) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  useEffect(() => {
    setSelectedLine(null);
  }, [exercise]);

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange({
      canCheck: selectedLine !== null,
      isCorrect: selectedLine === exercise.bugLine,
      correctAnswerText: `Line ${exercise.bugLine + 1}: ${exercise.fixed}`,
    });
  }, [selectedLine, exercise, onSelectionChange]);

  const handleSelectLine = (idx: number) => {
    if (locked) return;
    tapHaptic();
    setSelectedLine(idx);
    if (onImmediateLineTap) {
      onImmediateLineTap(idx, idx === exercise.bugLine);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>SPOT THE BUG</Text>
      <Text style={styles.prompt}>{exercise.prompt}</Text>

      <View style={styles.ideWindow}>
        <View style={styles.ideTitleBar}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: Colors.red }]} />
            <View style={[styles.dot, { backgroundColor: Colors.gold }]} />
            <View style={[styles.dot, { backgroundColor: Colors.green }]} />
          </View>
          <Text style={styles.filename}>{`snippet.${fileExt}`}</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.linesContainer}>
          {exercise.lines.map((line, idx) => {
            const isSelected = selectedLine === idx;
            const isBugLine = idx === exercise.bugLine;

            let borderColor: string = 'transparent';
            let bgColor: string = 'transparent';

            if (locked) {
              if (isBugLine) {
                borderColor = Colors.green;
                bgColor = Colors.greenBannerBg;
              } else if (isSelected && !isBugLine) {
                borderColor = Colors.red;
                bgColor = Colors.redBannerBg;
              }
            } else if (isSelected) {
              borderColor = Colors.violet;
              bgColor = Colors.violetTint;
            }

            return (
              <Pressable
                key={idx}
                disabled={locked}
                onPress={() => handleSelectLine(idx)}
                style={({ pressed }) => [
                  styles.codeRow,
                  { borderColor, backgroundColor: bgColor },
                  pressed && !locked && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.lineBadge,
                    isSelected && !locked && { backgroundColor: Colors.violet },
                    locked && isBugLine && { backgroundColor: Colors.green },
                    locked && isSelected && !isBugLine && { backgroundColor: Colors.red },
                  ]}
                >
                  <Text
                    style={[
                      styles.lineNumber,
                      (isSelected || (locked && isBugLine)) && { color: Colors.white },
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>

                <View style={styles.codeContent}>
                  <CodeLine code={line} fontSize={14} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.helperText}>Tap the exact line of code that contains the bug.</Text>
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
  ideWindow: {
    backgroundColor: Colors.ideBg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  ideTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    width: 48,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filename: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  spacer: {
    width: 48,
  },
  linesContainer: {
    padding: 10,
    gap: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  lineBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineNumber: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  codeContent: {
    flex: 1,
  },
  helperText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
