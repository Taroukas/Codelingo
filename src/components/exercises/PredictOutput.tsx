import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PredictOutputExercise } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { IDEWindow } from '@/components/IDEWindow';
import { OptionGrid } from './OptionGrid';
import { ExerciseSelectionState } from './CodeBlocks';

interface Props {
  exercise: PredictOutputExercise;
  fileExt?: string;
  locked: boolean;
  onSelectionChange: (state: ExerciseSelectionState) => void;
}

export function PredictOutput({ exercise, fileExt = 'py', locked, onSelectionChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [exercise]);

  useEffect(() => {
    onSelectionChange({
      canCheck: selectedIndex !== null,
      isCorrect: selectedIndex === exercise.answer,
      correctAnswerText: exercise.options[exercise.answer],
    });
  }, [selectedIndex, exercise, onSelectionChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>PREDICT THE OUTPUT</Text>
      <Text style={styles.prompt}>{exercise.prompt}</Text>

      <IDEWindow title={`main.${fileExt}`} lines={exercise.code} />

      <View style={styles.terminalPreview}>
        <Text style={styles.terminalPrompt}>
          {`> Running script... `}
          <Text style={styles.terminalAnswer}>
            {selectedIndex !== null ? exercise.options[selectedIndex] : '?'}
          </Text>
        </Text>
      </View>

      <OptionGrid
        options={exercise.options}
        selectedIndex={selectedIndex}
        correctIndex={exercise.answer}
        locked={locked}
        monospace
        onSelect={setSelectedIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
  terminalPreview: {
    backgroundColor: Colors.ideBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  terminalPrompt: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  terminalAnswer: {
    color: Colors.green,
    fontWeight: '800',
  },
});
