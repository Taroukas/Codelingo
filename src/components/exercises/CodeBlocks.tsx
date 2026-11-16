import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CodeBlocksExercise, LangId } from '@/data/courses';
import { Colors, UI_FONT, MONO } from '@/theme';
import { shuffle } from '@/utils/haptics';
import { playSound, playTokenPlaceSound } from '@/utils/sounds';
import { SyntaxTokenKind, tokenizeCodeLine } from '@/utils/syntaxLexer';
import { SpringPressable } from '@/components/CyberButton';
import { JellyPopView } from '@/components/ui/JellyPopView';
import { RichCodeText } from '@/components/ui/RichCodeText';

export interface ExerciseSelectionState {
  canCheck: boolean;
  isCorrect: boolean;
  correctAnswerText: string;
}

interface Props {
  exercise: CodeBlocksExercise;
  language?: LangId;
  locked: boolean;
  onSelectionChange: (state: ExerciseSelectionState) => void;
}

function tokenColorForKind(kind: SyntaxTokenKind): string {
  switch (kind) {
    case 'keyword':
      return '#C084FC';
    case 'string':
      return '#34D399';
    case 'builtin':
    case 'function':
      return '#38BDF8';
    case 'number':
      return '#FBBF24';
    case 'operator':
      return '#94A3B8';
    case 'comment':
      return '#64748B';
    default:
      return '#F8FAFC';
  }
}

function renderSyntaxColoredBlockToken(
  tokLabel: string,
  lang: LangId,
  hidden = false,
): React.ReactNode {
  const tokens = tokenizeCodeLine(tokLabel, lang);
  return (
    <Text style={[styles.tokenText, hidden && styles.ghostText]}>
      {tokens.map((tok, i) => (
        <Text
          key={i}
          style={{
            color: hidden ? 'transparent' : tokenColorForKind(tok.kind),
            fontWeight: tok.bold ? '700' : '600',
          }}
        >
          {tok.text}
        </Text>
      ))}
    </Text>
  );
}

export function CodeBlocks({
  exercise,
  language = 'python',
  locked,
  onSelectionChange,
}: Props) {
  const pool = useMemo(
    () => shuffle([...exercise.tokens, ...exercise.distractors]),
    [exercise],
  );

  const [picked, setPicked] = useState<number[]>([]);
  const [activeExercise, setActiveExercise] = useState(exercise);

  // Reset the assembled statement when the parent swaps exercises.
  if (activeExercise !== exercise) {
    setActiveExercise(exercise);
    setPicked([]);
  }

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
    Haptics.selectionAsync().catch(() => undefined);
    playSound('token_snap');
    playTokenPlaceSound(picked.length);
    setPicked((prev) => [...prev, poolIdx]);
  };

  const handleRemoveFromAnswer = (posInPicked: number) => {
    if (locked) return;
    Haptics.selectionAsync().catch(() => undefined);
    playSound('token_out');
    setPicked((prev) => prev.filter((_, i) => i !== posInPicked));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>BUILD THE STATEMENT</Text>
      <RichCodeText text={exercise.prompt} style={styles.prompt} />

      {/* Target output preview */}
      <View style={styles.outputHintCard}>
        <Text style={styles.outputHintLabel}>EXPECTED OUTPUT</Text>
        <Text style={styles.outputHintValue}>{exercise.output}</Text>
      </View>

      {/* Answer slot line */}
      <View style={styles.answerArea}>
        <View style={styles.slotRow}>
          {picked.length === 0 ? (
            <Text style={styles.placeholderText}>
              Tap code blocks below to assemble the statement
            </Text>
          ) : (
            picked.map((poolIdx, pos) => (
              <JellyPopView key={poolIdx}>
                <SpringPressable
                  disabled={locked}
                  haptic="none"
                  sound="none"
                  pressScale={0.95}
                  onPress={() => handleRemoveFromAnswer(pos)}
                  style={[styles.token, styles.tokenSelected]}
                >
                  {renderSyntaxColoredBlockToken(pool[poolIdx], language)}
                </SpringPressable>
              </JellyPopView>
            ))
          )}
        </View>
        <View style={styles.secondSlotGuide} />
      </View>

      {/* Token bank with exact-dimension ghost slots */}
      <View style={styles.bankArea}>
        {pool.map((tok, idx) => {
          const isUsed = picked.includes(idx);

          if (isUsed) {
            return (
              <View
                key={idx}
                style={[styles.token, styles.ghostSlotFace]}
              >
                {renderSyntaxColoredBlockToken(tok, language, true)}
              </View>
            );
          }

          return (
            <SpringPressable
              key={idx}
              disabled={locked}
              haptic="none"
              sound="none"
              pressScale={0.95}
              onPress={() => handlePickFromBank(idx)}
              style={[styles.token, styles.tokenBank]}
            >
              {renderSyntaxColoredBlockToken(tok, language)}
            </SpringPressable>
          );
        })}
      </View>
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
  outputHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#151421',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#252338',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  outputHintLabel: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  outputHintValue: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    letterSpacing: -0.1,
  },
  answerArea: {
    marginTop: 2,
  },
  slotRow: {
    minHeight: 54,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(124, 92, 252, 0.35)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  secondSlotGuide: {
    height: 22,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  placeholderText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  bankArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    paddingTop: 6,
  },
  token: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBank: {
    backgroundColor: '#1C1A2B',
    borderColor: '#2E2B44',
    borderBottomWidth: 4,
    borderBottomColor: '#0E0D16',
  },
  tokenSelected: {
    backgroundColor: '#1C1A2B',
    borderColor: '#7C5CFC',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
  },
  ghostSlotFace: {
    backgroundColor: '#111019',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 0,
    marginTop: 4,
  },
  tokenText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  ghostText: {
    color: 'transparent',
  },
});
