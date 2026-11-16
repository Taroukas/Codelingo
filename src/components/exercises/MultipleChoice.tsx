import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MultipleChoiceExercise } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { OptionGrid } from './OptionGrid';
import { ExerciseSelectionState } from './CodeBlocks';

interface Props {
  exercise: MultipleChoiceExercise;
  locked: boolean;
  onSelectionChange: (state: ExerciseSelectionState) => void;
}

export function MultipleChoice({ exercise, locked, onSelectionChange }: Props) {
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
      <Text style={styles.kicker}>SELECT THE CORRECT ANSWER</Text>
      <RichCodeText text={exercise.question} style={styles.question} />

      <OptionGrid
        options={exercise.options}
        selectedIndex={selectedIndex}
        correctIndex={exercise.answer}
        locked={locked}
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
  question: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
});
