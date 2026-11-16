import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FindBugExercise } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { CodeLine } from '@/components/CodeLine';
import { SpringPressable } from '@/components/CyberButton';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { tapHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
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
  const [activeExercise, setActiveExercise] = useState(exercise);

  // Reset selection when the parent swaps exercises (derived during render).
  if (activeExercise !== exercise) {
    setActiveExercise(exercise);
    setSelectedLine(null);
  }

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
    if (!onImmediateLineTap) {
      playSound('select');
    }
    setSelectedLine(idx);
    if (onImmediateLineTap) {
      onImmediateLineTap(idx, idx === exercise.bugLine);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>SPOT THE BUG</Text>
      <RichCodeText text={exercise.prompt} style={styles.prompt} />

      <View style={styles.ideWindow}>
        <View style={styles.ideTitleBar}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
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
                borderColor = Colors.greenBannerBorder;
                bgColor = Colors.greenBannerBg;
              } else if (isSelected && !isBugLine) {
                borderColor = Colors.redBannerBorder;
                bgColor = Colors.redBannerBg;
              }
            } else if (isSelected) {
              borderColor = Colors.hairlineStrong;
              bgColor = Colors.controlActive;
            }

            return (
              <SpringPressable
                key={idx}
                disabled={locked}
                haptic="none"
                pressScale={0.985}
                onPress={() => handleSelectLine(idx)}
                style={[
                  styles.codeRow,
                  { borderColor, backgroundColor: bgColor },
                ]}
              >
                <View style={styles.lineBadge}>
                  <Text style={styles.lineNumber}>{idx + 1}</Text>
                </View>

                <View style={styles.codeContent}>
                  <CodeLine code={line} fontSize={12.5} lineHeight={20} />
                </View>
              </SpringPressable>
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
    gap: 12,
  },
  kicker: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.9,
  },
  prompt: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  ideWindow: {
    backgroundColor: Colors.terminal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  ideTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    width: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3F3F46',
  },
  filename: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: -0.1,
  },
  spacer: {
    width: 32,
  },
  linesContainer: {
    padding: 6,
    gap: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  lineBadge: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineNumber: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '500',
    color: '#3F3F46',
    letterSpacing: -0.2,
  },
  codeContent: {
    flex: 1,
  },
  helperText: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textMuted,
  },
});
