import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
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
import type { LangId } from '@/data/courses';
import { playComboChime, playTactileSound } from '@/services/soundEngine';
import { type LeaderboardEntry, useUserStore } from '@/store/useUserStore';
import { MONO, UI_FONT } from '@/theme';

export interface CodeDuelArenaProps {
  visible: boolean;
  language?: LangId;
  onClose: () => void;
}

type DuelRoundKind =
  | 'Syntax Sprint'
  | 'Bug Spot'
  | 'Predict Output'
  | 'Token Fill'
  | 'Boss Sprint';

interface DuelChallenge {
  id: string;
  kind: DuelRoundKind;
  prompt: string;
  code: string;
  options: readonly string[];
  correctIndex: number;
}

const DUEL_POOL: readonly DuelChallenge[] = [
  {
    id: 'duel-syntax-py',
    kind: 'Syntax Sprint',
    prompt: 'Classify this Python slice statement:',
    code: 'vals = [10, 20, 30, 40]\nprint(vals[::-1])',
    options: ['Valid Syntax', 'Syntax Error (double colon)'],
    correctIndex: 0,
  },
  {
    id: 'duel-bug-loop',
    kind: 'Bug Spot',
    prompt: 'Which line causes the off-by-one crash?',
    code: '1  items = [4, 8, 15]\n2  for i in range(len(items) + 1):\n3      total += items[i]\n4  return total',
    options: [
      'Line 1 · items = [4, 8, 15]',
      'Line 2 · range(len(items) + 1)',
      'Line 3 · total += items[i]',
      'Line 4 · return total',
    ],
    correctIndex: 1,
  },
  {
    id: 'duel-output-js',
    kind: 'Predict Output',
    prompt: 'What exact stdout does this JS pipeline print?',
    code: 'const nums = [1, 2, 3, 4];\nconst sum = nums.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);\nconsole.log(sum);',
    options: ['4', '6', '10', 'NaN'],
    correctIndex: 1,
  },
  {
    id: 'duel-token-cpp',
    kind: 'Token Fill',
    prompt: 'Fill `______` to take a constant reference without copying:',
    code: 'void logBadge(______ std::string& tag) {\n    std::cout << tag;\n}',
    options: ['const', 'static', 'volatile', 'mutable'],
    correctIndex: 0,
  },
  {
    id: 'duel-boss-go',
    kind: 'Boss Sprint',
    prompt: 'What happens if you read 2 values after sending 1 onto an unclosed channel `ch`?',
    code: 'ch := make(chan int, 1)\nch <- 42\nfmt.Println(<-ch, <-ch)',
    options: [
      'Prints 42 42',
      'Prints 42 0',
      'Deadlock panic on 2nd receive',
      'Compile error on buffer size',
    ],
    correctIndex: 2,
  },
  {
    id: 'duel-syntax-rs',
    kind: 'Syntax Sprint',
    prompt: 'Does this Rust match arm compile cleanly?',
    code: 'let code = match status {\n    200 => "OK",\n    _ => "ERR",\n};',
    options: ['Valid Syntax', 'Syntax Error (missing break)'],
    correctIndex: 0,
  },
  {
    id: 'duel-output-py',
    kind: 'Predict Output',
    prompt: 'What does this Python dictionary lookup print?',
    code: 'scores = {"ada": 98}\nprint(scores.get("grace", 0) + 12)',
    options: ['KeyError', '12', '110', 'None'],
    correctIndex: 1,
  },
];

const FALLBACK_RIVAL: LeaderboardEntry = {
  id: 'ghost-rival-aria',
  rank: 3,
  username: 'aria_sys',
  handle: '@aria_sys',
  lang: 'cpp',
  xp: 1620,
  weeklyXp: 380,
  streak: 9,
  bugsCrushed: 14,
  league: 'Obsidian',
  avatarBg: '#E2E8F0',
  hairColor: '#312E81',
  shirtColor: '#38BDF8',
};

function elapsedSinceMs(startMs: number): number {
  return startMs > 0 ? Math.max(0, Date.now() - startMs) : 0;
}

function pickMatchRival(
  entries: LeaderboardEntry[],
  selfId: string,
  selfXp: number,
  seed: number,
): LeaderboardEntry {
  const candidates = entries.filter((e) => !e.isUser && e.id !== selfId);
  if (candidates.length === 0) return FALLBACK_RIVAL;

  // Prefer opponent close to user XP, deterministic rotation by match nonce
  const sorted = [...candidates].sort(
    (a, b) => Math.abs(a.xp - selfXp) - Math.abs(b.xp - selfXp),
  );
  const topSlice = sorted.slice(0, Math.min(4, sorted.length));
  return topSlice[seed % topSlice.length] ?? FALLBACK_RIVAL;
}

export function CodeDuelArena({
  visible,
  language = 'python',
  onClose,
}: CodeDuelArenaProps) {
  const insets = useSafeAreaInsets();
  const {
    userId,
    username,
    handle,
    xp,
    league,
    liveLeaderboard,
    isXpBoostActive,
    recordDuelVictory,
  } = useUserStore();

  const [phase, setPhase] = useState<'matchmaking' | 'playing' | 'result'>('matchmaking');
  const [matchNonce, setMatchNonce] = useState(0);
  const [prevResetKey, setPrevResetKey] = useState<string>('closed');
  const [rival, setRival] = useState<LeaderboardEntry>(FALLBACK_RIVAL);
  const [userRound, setUserRound] = useState(0);
  const [rivalRound, setRivalRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lockedWrongIdx, setLockedWrongIdx] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [outcome, setOutcome] = useState<{
    won: boolean;
    xpEarned: number;
    gemsEarned: number;
  } | null>(null);

  const resetKey = visible ? `open-${matchNonce}` : 'closed';
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    if (visible) {
      setPhase('matchmaking');
      setUserRound(0);
      setRivalRound(0);
      setCombo(0);
      setLockedWrongIdx(null);
      setElapsedMs(0);
      setOutcome(null);
      setRival(pickMatchRival(liveLeaderboard, userId, xp, matchNonce));
    }
  }

  const radarPulse = useRef(new Animated.Value(0)).current;
  const startMsRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const deck = useMemo(() => {
    const start = matchNonce % DUEL_POOL.length;
    const rotated = [...DUEL_POOL.slice(start), ...DUEL_POOL.slice(0, start)];
    return rotated.slice(0, 5);
  }, [matchNonce]);

  // Matchmaking lifecycle when visible or rematch starts
  useEffect(() => {
    if (!visible) return;
    finishedRef.current = false;

    radarPulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(radarPulse, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();

    const timer = setTimeout(() => {
      loop.stop();
      startMsRef.current = Date.now();
      playTactileSound('correct');
      setPhase('playing');
    }, 1500);

    return () => {
      loop.stop();
      clearTimeout(timer);
    };
  }, [visible, matchNonce, radarPulse]);

  // Real-time opponent progress pacing & elapsed clock during active duel
  useEffect(() => {
    if (!visible || phase !== 'playing') return;

    const clockId = setInterval(() => {
      setElapsedMs(elapsedSinceMs(startMsRef.current));
    }, 100);

    let stepTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRivalStep = (nextScore: number) => {
      const delayMs = 3600 + ((matchNonce * 673 + nextScore * 911) % 1900);
      stepTimer = setTimeout(() => {
        if (finishedRef.current) return;
        setRivalRound(nextScore);
        if (nextScore >= 5 && !finishedRef.current) {
          finishedRef.current = true;
          const totalMs = elapsedSinceMs(startMsRef.current);
          setElapsedMs(totalMs);
          playTactileSound('error');
          const reward = recordDuelVictory(false);
          setOutcome({ won: false, ...reward });
          setPhase('result');
        } else if (nextScore < 5) {
          scheduleRivalStep(nextScore + 1);
        }
      }, delayMs);
    };

    scheduleRivalStep(1);

    return () => {
      clearInterval(clockId);
      if (stepTimer) clearTimeout(stepTimer);
    };
  }, [visible, phase, matchNonce, recordDuelVictory]);

  const currentQuestion = deck[userRound] ?? deck[0];

  const handleSelectOption = (optIdx: number) => {
    if (phase !== 'playing' || lockedWrongIdx !== null || finishedRef.current) return;

    if (optIdx === currentQuestion.correctIndex) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      playComboChime(nextCombo);

      const nextRound = userRound + 1;
      setUserRound(nextRound);

      if (nextRound >= 5) {
        finishedRef.current = true;
        const totalMs = elapsedSinceMs(startMsRef.current);
        setElapsedMs(totalMs);
        playTactileSound('level_complete');
        const reward = recordDuelVictory(true);
        setOutcome({ won: true, ...reward });
        setPhase('result');
      }
    } else {
      setCombo(0);
      playTactileSound('error');
      setLockedWrongIdx(optIdx);
      setTimeout(() => {
        setLockedWrongIdx(null);
      }, 950);
    }
  };

  const ringScale = radarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1.5],
  });
  const ringOpacity = radarPulse.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.8, 0.35, 0],
  });

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
        {/* Top Arena Header */}
        <View style={styles.topHeader}>
          <SpringPressable
            onPress={() => {
              playTactileSound('token_snap');
              onClose();
            }}
            hitSlop={10}
            haptic="none"
            pressScale={0.94}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={19} color="#E2E8F0" />
          </SpringPressable>

          <Text style={styles.headerTitle}>1v1 CODE DUEL</Text>

          <View style={styles.clockPill}>
            <Ionicons name="timer-outline" size={13} color="#C4B5FD" />
            <Text style={styles.clockText}>
              {(elapsedMs / 1000).toFixed(1)}s
            </Text>
          </View>
        </View>

        {phase === 'matchmaking' ? (
          <View style={styles.centerStage}>
            <View style={styles.radarBox}>
              <Animated.View
                style={[
                  styles.radarRing,
                  { opacity: ringOpacity, transform: [{ scale: ringScale }] },
                ]}
              />
              <View style={styles.radarCore}>
                <Ionicons name="flash" size={28} color="#C4B5FD" />
              </View>
            </View>

            <Text style={styles.matchTitle}>Matching Opponent...</Text>
            <Text style={styles.matchSub}>
              Pairing with a coder near {xp} XP in {league} League
            </Text>

            <View style={styles.vsCard}>
              <View style={styles.playerCol}>
                <LanguageLogo language={language} size={22} />
                <Text style={styles.playerName} numberOfLines={1}>
                  {username}
                </Text>
                <Text style={styles.playerHandle}>{handle}</Text>
              </View>

              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.playerCol}>
                <LanguageLogo language={rival.lang} size={22} />
                <Text style={styles.playerName} numberOfLines={1}>
                  {rival.username}
                </Text>
                <Text style={styles.playerHandle}>{rival.league} League</Text>
              </View>
            </View>
          </View>
        ) : phase === 'result' && outcome ? (
          <View style={styles.centerStage}>
            <View style={styles.resultCard}>
              <View
                style={[
                  styles.resultBadgeCircle,
                  outcome.won ? styles.resultWinCircle : styles.resultLossCircle,
                ]}
              >
                <Ionicons
                  name={outcome.won ? 'trophy' : 'flash-outline'}
                  size={30}
                  color={outcome.won ? '#FBBF24' : '#38BDF8'}
                />
              </View>

              <Text style={styles.resultTitle}>
                {outcome.won ? 'Duel Victory!' : `${rival.username} Finished First`}
              </Text>
              <Text style={styles.resultSub}>
                {outcome.won
                  ? `You cleared all 5 sprints in ${(elapsedMs / 1000).toFixed(1)}s (${userRound} vs ${rivalRound}).`
                  : `Final score ${userRound}/5 vs ${rivalRound}/5 · Keep grinding speed rounds!`}
              </Text>

              <View style={styles.rewardRow}>
                <View style={styles.rewardChip}>
                  <Ionicons name="flash" size={14} color="#C4B5FD" />
                  <Text style={styles.rewardXpText}>
                    +{outcome.xpEarned} XP
                    {isXpBoostActive ? ' (2x)' : ''}
                  </Text>
                </View>

                {outcome.gemsEarned > 0 ? (
                  <View style={styles.rewardChip}>
                    <GemIcon size={14} />
                    <Text style={styles.rewardGemText}>
                      +{outcome.gemsEarned} Gems
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.resultActions}>
                <SpringPressable
                  onPress={() => {
                    playTactileSound('token_snap');
                    setMatchNonce((n) => n + 1);
                  }}
                  haptic="none"
                  pressScale={0.97}
                  style={styles.rematchBtn}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.rematchBtnText}>Rematch 1v1</Text>
                </SpringPressable>

                <SpringPressable
                  onPress={() => {
                    playTactileSound('token_snap');
                    onClose();
                  }}
                  haptic="none"
                  pressScale={0.97}
                  style={styles.exitBtn}
                >
                  <Text style={styles.exitBtnText}>Back to Arena</Text>
                </SpringPressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.duelBody}>
            {/* Dual Live Progress HUD */}
            <View style={styles.dualHudCard}>
              <View style={styles.racerRow}>
                <View style={styles.racerLabelCol}>
                  <Text style={styles.racerYouName} numberOfLines={1}>
                    You ({userRound}/5)
                  </Text>
                  <View style={styles.segmentsRow}>
                    {[0, 1, 2, 3, 4].map((seg) => (
                      <View
                        key={seg}
                        style={[
                          styles.segmentCell,
                          seg < userRound && styles.segmentYouFilled,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.racerLabelCol}>
                  <Text style={styles.racerOppName} numberOfLines={1}>
                    {rival.username} ({rivalRound}/5)
                  </Text>
                  <View style={styles.segmentsRow}>
                    {[0, 1, 2, 3, 4].map((seg) => (
                      <View
                        key={seg}
                        style={[
                          styles.segmentCell,
                          seg < rivalRound && styles.segmentOppFilled,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Active Challenge Card */}
            <View style={styles.challengeCard}>
              <View style={styles.challengeMeta}>
                <View style={styles.roundTypePill}>
                  <Text style={styles.roundTypeText}>
                    ROUND {userRound + 1}/5 · {currentQuestion.kind.toUpperCase()}
                  </Text>
                </View>
                {combo >= 2 ? (
                  <View style={styles.comboPill}>
                    <Ionicons name="flash" size={11} color="#FBBF24" />
                    <Text style={styles.comboText}>COMBO x{combo}</Text>
                  </View>
                ) : null}
              </View>

              <RichCodeText
                text={currentQuestion.prompt}
                style={styles.challengePrompt}
              />

              <View style={styles.snippetBox}>
                {currentQuestion.code.split('\n').map((line, idx) => (
                  <CodeLine
                    key={idx}
                    code={line.length > 0 ? line : ' '}
                    fontSize={12.5}
                    lineHeight={19}
                  />
                ))}
              </View>
            </View>

            {/* Rapid-Fire Option Buttons */}
            <View style={styles.optionsGrid}>
              {currentQuestion.options.map((opt, idx) => {
                const isWrong = lockedWrongIdx === idx;
                return (
                  <Pressable
                    key={`${currentQuestion.id}_${idx}`}
                    onPress={() => handleSelectOption(idx)}
                    style={({ pressed }) => [
                      styles.duelOptionBtn,
                      isWrong && styles.duelOptionWrong,
                      pressed && styles.duelOptionPressed,
                    ]}
                  >
                    <View style={styles.keyCap}>
                      <Text style={styles.keyCapText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.duelOptionText}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
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
  topHeader: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: 0.9,
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.34)',
  },
  clockText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#DDD6FE',
    fontVariant: ['tabular-nums'],
  },
  centerStage: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  radarBox: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: '#7C5CFC',
  },
  radarCore: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#161426',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchTitle: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  matchSub: {
    fontFamily: UI_FONT,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  vsCard: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  playerHandle: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#94A3B8',
  },
  vsBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  duelBody: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  dualHudCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  racerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  racerLabelCol: {
    flex: 1,
    gap: 6,
  },
  racerYouName: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  racerOppName: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#7DD3FC',
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segmentCell: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#1F1E2E',
  },
  segmentYouFilled: {
    backgroundColor: '#7C5CFC',
  },
  segmentOppFilled: {
    backgroundColor: '#38BDF8',
  },
  challengeCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  roundTypePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.3)',
  },
  roundTypeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.36)',
  },
  comboText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
  },
  challengePrompt: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  snippetBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0A0910',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 2,
  },
  optionsGrid: {
    gap: 9,
  },
  duelOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  duelOptionPressed: {
    backgroundColor: '#1B192A',
    borderColor: '#7C5CFC',
  },
  duelOptionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
  },
  keyCap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1B1A28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCapText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  duelOptionText: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  resultCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#12111A',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.28)',
    alignItems: 'center',
    gap: 12,
  },
  resultBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultWinCircle: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  resultLossCircle: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  resultTitle: {
    fontFamily: UI_FONT,
    fontSize: 21,
    fontWeight: '800',
    color: '#FAFAFA',
    textAlign: 'center',
  },
  resultSub: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
    textAlign: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#181826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rewardXpText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  rewardGemText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  resultActions: {
    width: '100%',
    gap: 9,
    marginTop: 4,
  },
  rematchBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7C5CFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rematchBtnText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exitBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#181826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
});
