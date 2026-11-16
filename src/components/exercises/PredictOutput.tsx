import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PredictOutputExercise } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { IDEWindow } from '@/components/IDEWindow';
import { RichCodeText } from '@/components/ui/RichCodeText';
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
  const [activeExercise, setActiveExercise] = useState(exercise);

  // Reset selection when the parent swaps exercises (derived during render).
  if (activeExercise !== exercise) {
    setActiveExercise(exercise);
    setSelectedIndex(null);
  }

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
      <RichCodeText text={exercise.prompt} style={styles.prompt} />

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
  terminalPreview: {
    backgroundColor: Colors.terminal,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  terminalPrompt: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: -0.1,
  },
  terminalAnswer: {
    color: Colors.success,
    fontWeight: '600',
  },
});
