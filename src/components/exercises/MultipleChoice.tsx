import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MultipleChoiceExercise } from '@/data/courses';
import { Colors, UI_FONT } from '@/theme';
import { OptionGrid } from './OptionGrid';
import { ExerciseSelectionState } from './CodeBlocks';

interface Props {
  exercise: MultipleChoiceExercise;
  locked: boolean;
  onSelectionChange: (state: ExerciseSelectionState) => void;
}

export function MultipleChoice({ exercise, locked, onSelectionChange }: Props) {
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
      <Text style={styles.kicker}>SELECT THE CORRECT ANSWER</Text>
      <Text style={styles.question}>{exercise.question}</Text>

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
    gap: 16,
  },
  kicker: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  question: {
    fontFamily: UI_FONT,
    fontSize: 21,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 28,
  },
});
