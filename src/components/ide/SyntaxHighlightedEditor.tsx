import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LangId } from '@/data/types';
import type { CopilotDiffProposal } from '@/services/roboCopilot';
import { UI_FONT } from '@/theme';
import { tokenizeCodeLine } from '@/utils/syntaxLexer';

export const EDITOR_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const EDITOR_FONT_SIZE = 13.5;
export const EDITOR_LINE_HEIGHT = 21;
export const EDITOR_PAD_VERTICAL = 14;
export const EDITOR_PAD_HORIZONTAL = 12;

export interface SyntaxHighlightedEditorProps {
  code: string;
  lang: LangId;
  placeholder?: string;
  errorLine: number | null;
  activeLine: number;
  expanded?: boolean;
  controlledSelection?: { start: number; end: number };
  pendingProposal: CopilotDiffProposal | null;
  inputRef?: React.RefObject<React.ComponentRef<typeof TextInput> | null>;
  onChangeCode: (nextCode: string) => void;
  onSelectionChange: (selection: { start: number; end: number }) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
}

interface MemoizedLineTokensProps {
  line: string;
  lang: LangId;
  isLast: boolean;
}

const MemoizedLineTokens = React.memo(function MemoizedLineTokens({
  line,
  lang,
  isLast,
}: MemoizedLineTokensProps) {
  const tokens = useMemo(() => tokenizeCodeLine(line, lang), [line, lang]);

  return (
    <>
      {tokens.map((tok, idx) => (
        <Text
          key={idx}
          style={[
            { color: tok.color },
            tok.bold ? styles.tokenBold : null,
            tok.italic ? styles.tokenItalic : null,
          ]}
        >
          {tok.text}
        </Text>
      ))}
      {!isLast ? '\n' : null}
    </>
  );
});

export function SyntaxHighlightedEditor({
  code,
  lang,
  placeholder,
  errorLine,
  activeLine,
  expanded = false,
  controlledSelection,
  pendingProposal,
  inputRef,
  onChangeCode,
  onSelectionChange,
  onFocus,
  onBlur,
  onAcceptProposal,
  onRejectProposal,
}: SyntaxHighlightedEditorProps) {
  const codeLines = useMemo(() => {
    const split = code.replace(/\r\n/g, '\n').split('\n');
    return split.length > 0 ? split : [''];
  }, [code]);

  const minCanvasHeight = Math.max(
    158,
    codeLines.length * EDITOR_LINE_HEIGHT + EDITOR_PAD_VERTICAL * 2 + 4,
  );

  return (
    <View style={styles.recessContainer}>
      <ScrollView
        style={[
          styles.viewportScroll,
          expanded && styles.viewportScrollExpanded,
        ]}
        nestedScrollEnabled
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.canvasWrap, { minHeight: minCanvasHeight }]}>
          {/* 1. Active Cursor Row Highlight Bar */}
          {activeLine >= 1 &&
          activeLine <= codeLines.length &&
          activeLine !== errorLine ? (
            <View
              pointerEvents="none"
              style={[
                styles.activeLineHighlight,
                {
                  top:
                    EDITOR_PAD_VERTICAL +
                    (activeLine - 1) * EDITOR_LINE_HEIGHT,
                },
              ]}
            />
          ) : null}

          {/* 2. Compiler Error Row Highlight Band */}
          {errorLine !== null &&
          errorLine >= 1 &&
          errorLine <= codeLines.length ? (
            <View
              pointerEvents="none"
              style={[
                styles.errorLineHighlight,
                {
                  top:
                    EDITOR_PAD_VERTICAL +
                    (errorLine - 1) * EDITOR_LINE_HEIGHT,
                },
              ]}
            />
          ) : null}

          <View style={styles.editorRow}>
            {/* Left Line Number Gutter */}
            <View style={styles.gutterCol} pointerEvents="none">
              {codeLines.map((_, idx) => {
                const lineNum = idx + 1;
                const isErr = errorLine === lineNum;
                const isCurrent = activeLine === lineNum;
                return (
                  <View key={lineNum} style={styles.gutterRow}>
                    {isErr ? <View style={styles.gutterErrorDot} /> : null}
                    <Text
                      style={[
                        styles.gutterText,
                        isCurrent && styles.gutterTextActive,
                        isErr && styles.gutterTextError,
                      ]}
                    >
                      {lineNum}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Dual-Layer Code Box: Synchronized Tokenized Layer + Transparent TextInput */}
            <View
              style={[
                styles.dualLayerCodeArea,
                { minHeight: minCanvasHeight },
              ]}
            >
              {/* Bottom Layer: Live Multi-Language Syntax Highlighted Tokens */}
              <View
                pointerEvents="none"
                style={[
                  styles.syntaxOverlayWrap,
                  { minHeight: minCanvasHeight },
                ]}
              >
                {code.length === 0 && placeholder ? (
                  <Text style={styles.placeholderText}>{placeholder}</Text>
                ) : (
                  <Text style={styles.sharedCodeMetrics}>
                    {codeLines.map((lineText, idx) => (
                      <MemoizedLineTokens
                        key={idx}
                        line={lineText}
                        lang={lang}
                        isLast={idx === codeLines.length - 1}
                      />
                    ))}
                  </Text>
                )}
              </View>

              {/* Top Layer: Transparent Native TextInput for 120fps Selection & Caret */}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={onChangeCode}
                onSelectionChange={(e) =>
                  onSelectionChange(e.nativeEvent.selection)
                }
                selection={controlledSelection}
                onFocus={onFocus}
                onBlur={onBlur}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                {...({
                  smartQuotesType: 'no',
                  smartDashesType: 'no',
                } as Record<string, unknown>)}
                caretHidden={false}
                selectionColor="#7C5CFC"
                cursorColor="#A78BFA"
                keyboardAppearance="dark"
                style={[
                  styles.sharedCodeMetrics,
                  styles.transparentTextInput,
                  { minHeight: minCanvasHeight },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Cursor-Style Inline Ghost Diff Preview */}
      {pendingProposal ? (
        <View style={styles.ghostDiffWrap}>
          <View style={styles.ghostDiffHeader}>
            <View style={styles.ghostDiffTitleRow}>
              <Ionicons
                name="git-compare-outline"
                size={12}
                color="#C4B5FD"
              />
              <Text style={styles.ghostDiffTitleText}>
                {pendingProposal.title} · {pendingProposal.patchSummary}
              </Text>
            </View>
            <Text style={styles.ghostDiffModeBadge}>
              {pendingProposal.mode === 'replace' ? 'PATCH' : 'INSERT'}
            </Text>
          </View>

          {pendingProposal.addedLines.map((diffLine, idx) => {
            const tokens = tokenizeCodeLine(diffLine, lang);
            return (
              <View key={idx} style={styles.ghostDiffLineRow}>
                <Text style={styles.ghostDiffLineNo}>
                  {pendingProposal.insertStartLine + idx}
                </Text>
                <Text style={styles.ghostDiffPlus}>+</Text>
                <Text style={styles.ghostDiffCodeText} numberOfLines={2}>
                  {diffLine.length === 0
                    ? ' '
                    : tokens.map((tok, tIdx) => (
                        <Text
                          key={tIdx}
                          style={[
                            { color: tok.color },
                            tok.bold ? styles.tokenBold : null,
                            tok.italic ? styles.tokenItalic : null,
                          ]}
                        >
                          {tok.text}
                        </Text>
                      ))}
                </Text>
              </View>
            );
          })}

          <View style={styles.ghostDiffActions}>
            <Pressable
              onPress={onAcceptProposal}
              style={({ pressed }) => [
                styles.acceptPill,
                pressed && styles.pressedFade,
              ]}
            >
              <Ionicons name="checkmark" size={14} color="#34D399" />
              <Text style={styles.acceptPillText}>✓ Accept Code</Text>
            </Pressable>

            <Pressable
              onPress={onRejectProposal}
              style={({ pressed }) => [
                styles.rejectPill,
                pressed && styles.pressedFade,
              ]}
            >
              <Ionicons name="close" size={14} color="#F87171" />
              <Text style={styles.rejectPillText}>✕ Reject</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  recessContainer: {
    backgroundColor: '#0D0D14',
  },
  viewportScroll: {
    maxHeight: 238,
  },
  viewportScrollExpanded: {
    maxHeight: 320,
  },
  canvasWrap: {
    position: 'relative',
  },
  activeLineHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: EDITOR_LINE_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  errorLineHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: EDITOR_LINE_HEIGHT,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderLeftWidth: 2,
    borderLeftColor: '#EF4444',
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gutterCol: {
    width: 38,
    paddingTop: EDITOR_PAD_VERTICAL,
    paddingBottom: EDITOR_PAD_VERTICAL,
    paddingRight: 8,
    alignItems: 'flex-end',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  gutterRow: {
    height: EDITOR_LINE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  gutterErrorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  gutterText: {
    fontFamily: EDITOR_FONT,
    fontSize: 11.5,
    lineHeight: EDITOR_LINE_HEIGHT,
    color: '#52525B',
  },
  gutterTextActive: {
    color: '#A1A1AA',
    fontWeight: '700',
  },
  gutterTextError: {
    color: '#F87171',
    fontWeight: '700',
  },
  dualLayerCodeArea: {
    flex: 1,
    position: 'relative',
  },
  syntaxOverlayWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sharedCodeMetrics: {
    fontFamily: EDITOR_FONT,
    fontSize: EDITOR_FONT_SIZE,
    lineHeight: EDITOR_LINE_HEIGHT,
    letterSpacing: 0,
    paddingTop: EDITOR_PAD_VERTICAL,
    paddingBottom: EDITOR_PAD_VERTICAL,
    paddingHorizontal: EDITOR_PAD_HORIZONTAL,
    textAlignVertical: 'top',
  },
  transparentTextInput: {
    color: 'transparent',
    backgroundColor: 'transparent',
    margin: 0,
  },
  placeholderText: {
    fontFamily: EDITOR_FONT,
    fontSize: EDITOR_FONT_SIZE,
    lineHeight: EDITOR_LINE_HEIGHT,
    letterSpacing: 0,
    paddingTop: EDITOR_PAD_VERTICAL,
    paddingHorizontal: EDITOR_PAD_HORIZONTAL,
    color: '#52525B',
  },
  tokenBold: {
    fontWeight: '700',
  },
  tokenItalic: {
    fontStyle: 'italic',
  },
  ghostDiffWrap: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.36)',
    paddingTop: 6,
    paddingBottom: 8,
  },
  ghostDiffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  ghostDiffTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ghostDiffTitleText: {
    fontFamily: EDITOR_FONT,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  ghostDiffModeBadge: {
    fontFamily: EDITOR_FONT,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ghostDiffLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10,
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
  },
  ghostDiffLineNo: {
    width: 38,
    textAlign: 'right',
    paddingRight: 8,
    fontFamily: EDITOR_FONT,
    fontSize: 11.5,
    lineHeight: EDITOR_LINE_HEIGHT,
    color: '#6EE7B7',
  },
  ghostDiffPlus: {
    width: 16,
    textAlign: 'center',
    fontFamily: EDITOR_FONT,
    fontSize: 13,
    lineHeight: EDITOR_LINE_HEIGHT,
    fontWeight: '800',
    color: '#34D399',
  },
  ghostDiffCodeText: {
    flex: 1,
    fontFamily: EDITOR_FONT,
    fontSize: 13,
    lineHeight: EDITOR_LINE_HEIGHT,
    color: '#F8FAFC',
  },
  ghostDiffActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  acceptPill: {
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.58)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  acceptPillText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  rejectPill: {
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#161522',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rejectPillText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#F87171',
  },
  pressedFade: {
    opacity: 0.84,
  },
});
