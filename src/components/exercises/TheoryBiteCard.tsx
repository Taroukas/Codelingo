import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TheoryBiteExercise } from '@/data/courses';
import { MONO, UI_FONT } from '@/theme';
import { CodeLine, SyntaxPalette } from '@/components/CodeLine';
import { RichCodeText } from '@/components/ui/RichCodeText';

const EDITOR_SYNTAX: SyntaxPalette = {
  keyword: '#C084FC',
  string: '#A78BFA',
  number: '#C4B5FD',
  operator: '#8B5CF6',
  comment: '#64748B',
  plain: '#F1F5F9',
};

interface Props {
  exercise: TheoryBiteExercise;
  fileName: string;
}

export function TheoryBiteCard({ exercise, fileName }: Props) {
  const outputLines = exercise.output
    ? Array.isArray(exercise.output)
      ? exercise.output
      : [exercise.output]
    : [];

  return (
    <View style={styles.container}>
      {/* Matte Carbon Concept Card (Uniform 1px border, zero accent strip) */}
      <View style={styles.conceptCard}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="book-outline" size={12} color="#C4B5FD" />
            <Text style={styles.badgeText}>THEORY BITE</Text>
          </View>
        </View>
        <RichCodeText text={exercise.title} style={styles.title} />
        <RichCodeText text={exercise.explanation} style={styles.explanation} />
      </View>

      {/* Highlighted Code Example Card with Attached OUTPUT Strip */}
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.codeBody}>
          {exercise.code.map((line, idx) => (
            <View key={idx} style={styles.codeRow}>
              <Text style={styles.lineNo}>{idx + 1}</Text>
              <View style={styles.codeLineWrap}>
                <CodeLine
                  code={line}
                  fontSize={13.5}
                  lineHeight={21}
                  syntax={EDITOR_SYNTAX}
                />
              </View>
            </View>
          ))}
        </View>

        {outputLines.length > 0 ? (
          <View style={styles.outputFooter}>
            <Text style={styles.outputKicker}>OUTPUT</Text>
            <View style={styles.outputLinesWrap}>
              {outputLines.map((outLine, i) => (
                <Text key={i} style={styles.outputLineText}>
                  <Text style={styles.outputPrompt}>&gt; </Text>
                  {outLine}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Optional Pro Note */}
      {exercise.highlightNote ? (
        <View style={styles.noteCard}>
          <View style={styles.noteIconWrap}>
            <Ionicons name="bulb-outline" size={16} color="#A78BFA" />
          </View>
          <RichCodeText text={exercise.highlightNote} style={styles.noteText} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  conceptCard: {
    backgroundColor: '#12111A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.20)',
    padding: 20,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
  },
  badgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.7,
  },
  title: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  explanation: {
    fontFamily: UI_FONT,
    fontSize: 14,
    lineHeight: 21,
    color: '#CBD5E1',
  },
  editorCard: {
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#161622',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    width: 40,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    opacity: 0.85,
  },
  fileName: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },
  codeBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  lineNo: {
    width: 16,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 11.5,
    lineHeight: 21,
    color: '#475569',
  },
  codeLineWrap: {
    flex: 1,
  },
  outputFooter: {
    backgroundColor: '#0D0D14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 4,
  },
  outputKicker: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  outputLinesWrap: {
    gap: 2,
  },
  outputLineText: {
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: 19,
    color: '#ECFDF5',
  },
  outputPrompt: {
    color: '#34D399',
    fontWeight: '700',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#161622',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  noteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#94A3B8',
  },
});
