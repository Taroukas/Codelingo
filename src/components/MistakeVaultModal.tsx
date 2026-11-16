import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CodeLine } from '@/components/CodeLine';
import { SpringPressable } from '@/components/CyberButton';
import { LanguageLogo } from '@/components/LanguageLogo';
import { GemIcon } from '@/components/ui/CurrencyIcons';
import { RichCodeText } from '@/components/ui/RichCodeText';
import { getLanguage } from '@/data/courses';
import { playTactileSound } from '@/services/soundEngine';
import { type MistakeVaultItem, useUserStore } from '@/store/useUserStore';
import { MONO, UI_FONT } from '@/theme';

export interface MistakeVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

function buildReplayOptions(item: MistakeVaultItem): string[] {
  const cleanCorrect = item.correctAnswer.trim();
  const base = (item.options ?? [])
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  const unique = Array.from(new Set([cleanCorrect, ...base])).slice(0, 4);

  if (unique.length < 2) {
    const fallbackPool = [
      'Syntax Error',
      'None / undefined',
      'Off-by-one bound',
      'return 0',
    ];
    for (const alt of fallbackPool) {
      if (unique.length >= 4) break;
      if (!unique.includes(alt)) unique.push(alt);
    }
  }

  // Deterministic rotation by item.id hash so correct answer isn't always first
  let hash = 0;
  for (let i = 0; i < item.id.length; i += 1) {
    hash = (hash * 31 + item.id.charCodeAt(i)) >>> 0;
  }
  const shift = hash % unique.length;
  return [...unique.slice(shift), ...unique.slice(0, shift)];
}

export function MistakeVaultModal({
  visible,
  onClose,
}: MistakeVaultModalProps) {
  const insets = useSafeAreaInsets();
  const {
    mistakeVault,
    isXpBoostActive,
    resolveMistakeFromVault,
  } = useUserStore();

  const [sessionQueue, setSessionQueue] = useState<MistakeVaultItem[]>([]);
  const [queueKey, setQueueKey] = useState<string>('');
  const [cursor, setCursor] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [gradeState, setGradeState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [clearedCount, setClearedCount] = useState(0);
  const [earnedXpTotal, setEarnedXpTotal] = useState(0);

  // Latch the active batch when opened so removing an item keeps step indexing rock-solid
  const targetKey = visible ? `open_${mistakeVault[0]?.id ?? 'empty'}` : 'closed';
  if (visible && queueKey !== targetKey && sessionQueue.length === 0) {
    setQueueKey(targetKey);
    setSessionQueue([...mistakeVault]);
    setCursor(0);
    setSelectedOption(null);
    setGradeState('idle');
    setClearedCount(0);
    setEarnedXpTotal(0);
  }
  if (!visible && queueKey !== '') {
    setQueueKey('');
    setSessionQueue([]);
  }

  const currentItem = sessionQueue[cursor];
  const isFinished =
    !visible ||
    !currentItem ||
    sessionQueue.length === 0 ||
    cursor >= sessionQueue.length;

  const options = useMemo(
    () => (currentItem ? buildReplayOptions(currentItem) : []),
    [currentItem],
  );

  const langMeta = useMemo(
    () => (currentItem ? getLanguage(currentItem.language) : null),
    [currentItem],
  );

  const xpPerItem = isXpBoostActive ? 30 : 15;

  const handleSelectOption = (option: string) => {
    if (!currentItem || gradeState !== 'idle') return;
    playTactileSound('token_snap');
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!currentItem || !selectedOption || gradeState !== 'idle') return;
    const isCorrect =
      selectedOption.trim().toLowerCase() ===
      currentItem.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      playTactileSound('correct');
      const res = resolveMistakeFromVault(currentItem.id);
      setClearedCount((c) => c + 1);
      setEarnedXpTotal((x) => x + res.xpEarned);
      setGradeState('correct');
    } else {
      playTactileSound('error');
      setGradeState('wrong');
    }
  };

  const handleNext = () => {
    playTactileSound('token_snap');
    if (gradeState === 'wrong') {
      // Allow immediate retry of this concept until mastered
      setSelectedOption(null);
      setGradeState('idle');
      return;
    }

    const nextIdx = cursor + 1;
    setSelectedOption(null);
    setGradeState('idle');
    setCursor(nextIdx);
    if (nextIdx >= sessionQueue.length) {
      playTactileSound('level_complete');
    }
  };

  const progressPct =
    sessionQueue.length > 0
      ? Math.min(100, Math.round((cursor / sessionQueue.length) * 100))
      : 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          { paddingTop: Math.max(insets.top, 14), paddingBottom: insets.bottom },
        ]}
      >
        {/* Top Review HUD */}
        <View style={styles.hudBar}>
          <SpringPressable
            onPress={() => {
              playTactileSound('token_snap');
              onClose();
            }}
            hitSlop={10}
            haptic="none"
            pressScale={0.94}
            style={styles.closeBtn}
            accessibilityLabel="Close Mistake Vault"
          >
            <Ionicons name="close" size={19} color="#E2E8F0" />
          </SpringPressable>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${isFinished ? 100 : progressPct}%` },
              ]}
            />
          </View>

          <View style={styles.rewardHudPill}>
            <Ionicons name="flash" size={12} color="#C4B5FD" />
            <Text style={styles.rewardHudText}>+{xpPerItem} XP</Text>
          </View>
        </View>

        {isFinished ? (
          <View style={styles.emptyWrap}>
            <View style={styles.vaultCompleteCard}>
              <View style={styles.vaultCheckCircle}>
                <Ionicons
                  name={clearedCount > 0 ? 'trophy' : 'shield-checkmark'}
                  size={30}
                  color="#34D399"
                />
              </View>
              <Text style={styles.completeTitle}>
                {clearedCount > 0 ? 'Mistakes Mastered!' : 'Mistake Vault Clear'}
              </Text>
              <Text style={styles.completeSub}>
                {clearedCount > 0
                  ? `You resolved ${clearedCount} tricky concept${clearedCount > 1 ? 's' : ''} and unlocked spaced-repetition XP.`
                  : 'Zero unreviewed mistakes waiting. Keep sharpening skills in lessons or 60s campaigns!'}
              </Text>

              {clearedCount > 0 ? (
                <View style={styles.summaryRow}>
                  <View style={styles.summaryChip}>
                    <Ionicons name="flash" size={14} color="#C4B5FD" />
                    <Text style={styles.summaryChipVal}>+{earnedXpTotal} XP</Text>
                  </View>
                  <View style={styles.summaryChip}>
                    <GemIcon size={14} />
                    <Text style={styles.summaryChipSub}>
                      {mistakeVault.length} Remaining
                    </Text>
                  </View>
                </View>
              ) : null}

              <SpringPressable
                onPress={() => {
                  playTactileSound('token_snap');
                  onClose();
                }}
                haptic="none"
                pressScale={0.97}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>Back to Practice</Text>
              </SpringPressable>
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Unit + Concept Header */}
              <View style={styles.metaRow}>
                <View style={styles.langPill}>
                  <LanguageLogo language={currentItem.language} size={15} />
                  <Text style={styles.langText}>
                    {langMeta?.name ?? currentItem.language.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.counterText}>
                  {cursor + 1} / {sessionQueue.length} CONCEPTS
                </Text>
              </View>

              <Text style={styles.unitTitle}>{currentItem.unitTitle}</Text>

              {/* Prompt */}
              <View style={styles.promptBox}>
                <RichCodeText
                  text={currentItem.prompt}
                  style={styles.promptText}
                />
              </View>

              {/* Syntax Code Card */}
              {currentItem.codeSnippet.trim().length > 0 ? (
                <View style={styles.codeWindow}>
                  <View style={styles.codeHeader}>
                    <View style={styles.dotsRow}>
                      <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                      <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                      <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                    </View>
                    <Text style={styles.codeSourceTag}>
                      {(currentItem.source ?? 'lesson').replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.codeBody}>
                    {currentItem.codeSnippet.split('\n').map((line, idx) => (
                      <View key={idx} style={styles.codeLineRow}>
                        <Text style={styles.codeLineNum}>{idx + 1}</Text>
                        <View style={styles.codeLineContent}>
                          <CodeLine code={line.length > 0 ? line : ' '} fontSize={13} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Interactive Answer Options */}
              <Text style={styles.pickLabel}>SELECT THE CORRECT SOLUTION</Text>
              <View style={styles.optionsList}>
                {options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectOption =
                    opt.trim().toLowerCase() ===
                    currentItem.correctAnswer.trim().toLowerCase();
                  const showCorrectHighlight =
                    gradeState === 'correct' && isSelected && isCorrectOption;
                  const showWrongHighlight = gradeState === 'wrong' && isSelected;

                  return (
                    <Pressable
                      key={`${idx}_${opt}`}
                      disabled={gradeState !== 'idle'}
                      onPress={() => handleSelectOption(opt)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                        showCorrectHighlight && styles.optionCardCorrect,
                        showWrongHighlight && styles.optionCardWrong,
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIndexBox,
                          isSelected && styles.optionIndexBoxSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionIndexText,
                            isSelected && styles.optionIndexTextSelected,
                          ]}
                        >
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <Text style={styles.optionCodeText}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Action / Feedback Drawer */}
            <View
              style={[
                styles.bottomDock,
                gradeState === 'correct' && styles.bottomDockCorrect,
                gradeState === 'wrong' && styles.bottomDockWrong,
              ]}
            >
              {gradeState !== 'idle' ? (
                <View style={styles.feedbackRow}>
                  <Ionicons
                    name={
                      gradeState === 'correct'
                        ? 'checkmark-circle'
                        : 'close-circle'
                    }
                    size={20}
                    color={gradeState === 'correct' ? '#34D399' : '#FCA5A5'}
                  />
                  <View style={styles.feedbackCopy}>
                    <Text
                      style={[
                        styles.feedbackHeading,
                        { color: gradeState === 'correct' ? '#34D399' : '#FCA5A5' },
                      ]}
                    >
                      {gradeState === 'correct'
                        ? `Resolved! +${xpPerItem} XP`
                        : 'Not quite — review and retry'}
                    </Text>
                    <RichCodeText
                      text={currentItem.explanation}
                      style={styles.feedbackExplain}
                    />
                  </View>
                </View>
              ) : null}

              {gradeState === 'idle' ? (
                <SpringPressable
                  disabled={!selectedOption}
                  onPress={handleCheck}
                  haptic="none"
                  pressScale={0.97}
                  style={[
                    styles.checkBtn,
                    !selectedOption && styles.checkBtnDisabled,
                  ]}
                >
                  <Text style={styles.checkBtnText}>Verify Concept</Text>
                </SpringPressable>
              ) : (
                <SpringPressable
                  onPress={handleNext}
                  haptic="none"
                  pressScale={0.97}
                  style={[
                    styles.checkBtn,
                    gradeState === 'correct'
                      ? styles.continueBtnCorrect
                      : styles.continueBtnWrong,
                  ]}
                >
                  <Text style={styles.checkBtnText}>
                    {gradeState === 'wrong'
                      ? 'Retry Concept'
                      : cursor + 1 >= sessionQueue.length
                      ? 'Finish Review →'
                      : 'Next Concept →'}
                  </Text>
                </SpringPressable>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0A10',
  },
  hudBar: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#181825',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
  },
  rewardHudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.34)',
  },
  rewardHudText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  counterText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  unitTitle: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  promptBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  promptText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  codeWindow: {
    borderRadius: 14,
    backgroundColor: '#0E0E15',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  codeHeader: {
    height: 34,
    paddingHorizontal: 12,
    backgroundColor: '#141320',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeSourceTag: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  codeBody: {
    padding: 12,
    gap: 4,
  },
  codeLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  codeLineNum: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#52526B',
    width: 18,
    textAlign: 'right',
    lineHeight: 19,
  },
  codeLineContent: {
    flex: 1,
  },
  pickLabel: {
    marginTop: 4,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.7,
  },
  optionsList: {
    gap: 9,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionCardSelected: {
    backgroundColor: '#1A172D',
    borderColor: '#7C5CFC',
  },
  optionCardCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#34D399',
  },
  optionCardWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: '#EF4444',
  },
  optionIndexBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#1B1A28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndexBoxSelected: {
    backgroundColor: '#7C5CFC',
    borderColor: '#A78BFA',
  },
  optionIndexText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  optionIndexTextSelected: {
    color: '#FFFFFF',
  },
  optionCodeText: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bottomDock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12111A',
    gap: 12,
  },
  bottomDockCorrect: {
    backgroundColor: '#0F1B17',
    borderTopColor: 'rgba(52, 211, 153, 0.35)',
  },
  bottomDockWrong: {
    backgroundColor: '#1D1114',
    borderTopColor: 'rgba(239, 68, 68, 0.35)',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  feedbackCopy: {
    flex: 1,
    gap: 3,
  },
  feedbackHeading: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackExplain: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#CBD5E1',
  },
  checkBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: {
    backgroundColor: '#252338',
    opacity: 0.65,
  },
  continueBtnCorrect: {
    backgroundColor: '#10B981',
  },
  continueBtnWrong: {
    backgroundColor: '#EF4444',
  },
  checkBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  vaultCompleteCard: {
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.25)',
    alignItems: 'center',
    gap: 12,
  },
  vaultCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
    textAlign: 'center',
  },
  completeSub: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#181826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryChipVal: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  summaryChipSub: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  doneBtn: {
    marginTop: 6,
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
