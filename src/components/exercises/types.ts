import type { Exercise } from '@/data/courses';

export type CheckResult = 'correct' | 'wrong' | null;

export interface AnswerState {
  ready: boolean;
  correct: boolean;
  /** Human readable correct answer, shown on mistakes. */
  solution: string;
}

export interface ExerciseProps<T extends Exercise> {
  exercise: T;
  accent: string;
  fileName: string;
  result: CheckResult;
  onChange: (state: AnswerState) => void;
}
