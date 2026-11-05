import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import {
  LANGUAGES,
  LangId,
  PLAYGROUND_SNIPPETS,
  getAllBugExercises,
} from '@/data/courses';
import { useGame } from '@/store/GameStore';
import { StatsHeader } from '@/components/StatsHeader';
import { IDEWindow } from '@/components/IDEWindow';
import { MiniTerminal } from '@/components/MiniTerminal';
import { DuolingoButton } from '@/components/CyberButton';
import { Tactile3DBox } from '@/components/Tactile3D';
import { FindBug } from '@/components/exercises/FindBug';
import { shuffle, tapHaptic, successHaptic, errorHaptic } from '@/utils/haptics';

const BLITZ_SECONDS = 60;

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { activeLang, blitzBest, bugsCrushed, recordBlitzScore } = useGame();

  // --- 60s Bug Hunt Blitz state ---
  const allBugs = useMemo(() => getAllBugExercises(), []);
  const [deck, setDeck] = useState(() => shuffle(allBugs));
  const [blitzActive, setBlitzActive] = useState(false);
  const [blitzDone, setBlitzDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(BLITZ_SECONDS);
  const [blitzIndex, setBlitzIndex] = useState(0);
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzBugsFixed, setBlitzBugsFixed] = useState(0);
  const [lineLocked, setLineLocked] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // --- Interactive Code Playground state ---
  const [playgroundLang, setPlaygroundLang] = useState<LangId>(activeLang);
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [runCounter, setRunCounter] = useState(0);

  useEffect(() => {
    setPlaygroundLang(activeLang);
    setSnippetIndex(0);
  }, [activeLang]);

  useEffect(() => {
    if (!blitzActive) return;
    if (secondsLeft <= 0) {
      setBlitzActive(false);
      setBlitzDone(true);
      recordBlitzScore(blitzScore, blitzBugsFixed);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [blitzActive, secondsLeft, blitzScore, blitzBugsFixed, recordBlitzScore]);

  const startBlitz = () => {
    tapHaptic();
    setDeck(shuffle(allBugs));
    setBlitzIndex(0);
    setBlitzScore(0);
    setBlitzBugsFixed(0);
    setSecondsLeft(BLITZ_SECONDS);
    setLineLocked(false);
    setLastFeedback(null);
    setBlitzDone(false);
    setBlitzActive(true);
  };

  const handleBlitzLineTap = (_lineIdx: number, isCorrect: boolean) => {
    if (lineLocked) return;
    setLineLocked(true);
    const currentBug = deck[blitzIndex % deck.length];

    if (isCorrect) {
      successHaptic();
      setBlitzScore((s) => s + 1);
      setBlitzBugsFixed((b) => b + 1);
      setLastFeedback({ ok: true, text: `Nice catch! Fixed: ${currentBug.fixed}` });
    } else {
      errorHaptic();
      setLastFeedback({
        ok: false,
        text: `Bug was on line ${currentBug.bugLine + 1}: ${currentBug.fixed}`,
      });
    }

    setTimeout(() => {
      setLineLocked(false);
      setLastFeedback(null);
      setBlitzIndex((i) => i + 1);
    }, 900);
  };

  const currentBug = deck[blitzIndex % deck.length];
  const snippets = PLAYGROUND_SNIPPETS[playgroundLang];
  const currentSnippet = snippets[snippetIndex] ?? snippets[0];
  const selectedLangMeta = LANGUAGES.find((l) => l.id === playgroundLang) ?? LANGUAGES[0];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatsHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD 1: 60s Bug Hunt Blitz */}
        <Tactile3DBox
          depth={5}
          borderRadius={18}
          faceColor={Colors.card}
          lipColor={Colors.cardLip}
          borderColor={Colors.border}
          faceStyle={styles.heroCardFace}
        >
          <View style={styles.heroBannerRow}>
            <View style={[styles.iconBadgeBase, { backgroundColor: Colors.violetLip }]}>
              <View
                style={[
                  styles.iconBadgeFace,
                  { backgroundColor: Colors.violet, borderColor: Colors.violetLip },
                ]}
              >
                <Ionicons name="bug" size={25} color={Colors.white} />
              </View>
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.heroTitle}>60s Bug Hunt Blitz</Text>
                {blitzActive ? (
                  <View style={styles.timerPillBase}>
                    <View style={styles.timerPillFace}>
                      <Ionicons name="time" size={14} color={Colors.white} />
                      <Text style={styles.timerPillText}>{secondsLeft}s</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroDesc}>
                Spot as many syntax and logic bugs as you can before the 60-second timer runs out.
              </Text>
            </View>
          </View>

          {/* Best score & total bugs crushed pills */}
          <View style={styles.statsStrip}>
            <View style={styles.statChip}>
              <Ionicons name="trophy" size={16} color={Colors.gold} />
              <Text style={styles.statChipLabel}>BEST SCORE:</Text>
              <Text style={[styles.statChipValue, { color: Colors.gold }]}>{blitzBest}</Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="flash" size={16} color={Colors.green} />
              <Text style={styles.statChipLabel}>BUGS CRUSHED:</Text>
              <Text style={[styles.statChipValue, { color: Colors.green }]}>{bugsCrushed}</Text>
            </View>
          </View>

          {blitzActive && currentBug ? (
            <View style={styles.blitzArena}>
              <View style={styles.blitzTopRow}>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>SCORE: {blitzScore}</Text>
                </View>
                <Text style={styles.langTagText}>
                  LANGUAGE: {currentBug.lang.toUpperCase()}
                </Text>
              </View>

              <FindBug
                key={`${currentBug.id}-${blitzIndex}`}
                exercise={currentBug}
                fileExt={currentBug.fileExt}
                locked={lineLocked}
                onImmediateLineTap={handleBlitzLineTap}
              />

              {lastFeedback ? (
                <View
                  style={[
                    styles.blitzToast,
                    {
                      backgroundColor: lastFeedback.ok
                        ? Colors.greenBannerBg
                        : Colors.redBannerBg,
                      borderColor: lastFeedback.ok
                        ? Colors.greenBannerBorder
                        : Colors.redBannerBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={lastFeedback.ok ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={lastFeedback.ok ? Colors.green : Colors.red}
                  />
                  <Text style={styles.blitzToastText}>{lastFeedback.text}</Text>
                </View>
              ) : null}
            </View>
          ) : blitzDone ? (
            <View style={styles.blitzSummaryBox}>
              <Text style={styles.blitzSummaryHeading}>Time’s Up!</Text>
              <Text style={styles.blitzSummaryScore}>
                You crushed {blitzScore} {blitzScore === 1 ? 'bug' : 'bugs'} (+{blitzScore * 15} XP)
              </Text>
              <DuolingoButton
                label="PLAY AGAIN"
                variant="violet"
                onPress={startBlitz}
                style={{ width: '100%' }}
              />
            </View>
          ) : (
            <DuolingoButton
              label="START 60s BLITZ (+15 XP / BUG)"
              variant="violet"
              onPress={startBlitz}
            />
          )}
        </Tactile3DBox>

        {/* HERO CARD 2: Interactive Code Playground */}
        <Tactile3DBox
          depth={5}
          borderRadius={18}
          faceColor={Colors.card}
          lipColor={Colors.cardLip}
          borderColor={Colors.border}
          faceStyle={styles.heroCardFace}
        >
          <View style={styles.heroBannerRow}>
            <View style={[styles.iconBadgeBase, { backgroundColor: Colors.skyLip }]}>
              <View
                style={[
                  styles.iconBadgeFace,
                  { backgroundColor: Colors.sky, borderColor: Colors.skyLip },
                ]}
              >
                <Ionicons name="code-slash" size={25} color={Colors.white} />
              </View>
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.heroTitle}>Interactive Code Playground</Text>
              <Text style={styles.heroDesc}>
                Pick a language and template below, then run the code to inspect the live console output.
              </Text>
            </View>
          </View>

          {/* 4 Language Selector Pills with 2-Layer 3D Extrusion & Single-Line Fit for "JavaScript" */}
          <View style={styles.langTabsRow}>
            {LANGUAGES.map((l) => {
              const active = l.id === playgroundLang;
              const flexWeight = l.id === 'js' ? 1.38 : l.id === 'python' ? 1.05 : 0.78;
              return (
                <Tactile3DBox
                  key={l.id}
                  depth={4}
                  borderRadius={12}
                  faceColor={active ? Colors.violet : Colors.bg}
                  lipColor={active ? Colors.violetLip : Colors.cardLip}
                  borderColor={active ? Colors.violetLip : Colors.border}
                  onPress={() => {
                    setPlaygroundLang(l.id);
                    setSnippetIndex(0);
                    setRunCounter((c) => c + 1);
                  }}
                  style={{ flex: flexWeight }}
                  faceStyle={styles.langPillFace}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[styles.langPillText, active && { color: Colors.white }]}
                  >
                    {l.name}
                  </Text>
                </Tactile3DBox>
              );
            })}
          </View>

          {/* Snippet Template Switcher Buttons with 2-Layer 3D Extrusion */}
          <View style={styles.templateRow}>
            {snippets.map((snip, idx) => {
              const selected = idx === snippetIndex;
              return (
                <Tactile3DBox
                  key={snip.title}
                  depth={4}
                  borderRadius={12}
                  faceColor={selected ? Colors.skyTint : Colors.bg}
                  lipColor={selected ? Colors.skyLip : Colors.cardLip}
                  borderColor={selected ? Colors.sky : Colors.border}
                  onPress={() => {
                    setSnippetIndex(idx);
                    setRunCounter((c) => c + 1);
                  }}
                  style={{ flex: 1 }}
                  faceStyle={styles.templateChipFace}
                >
                  <Text
                    style={[
                      styles.templateChipText,
                      selected && { color: Colors.sky },
                    ]}
                  >
                    {snip.title}
                  </Text>
                </Tactile3DBox>
              );
            })}
          </View>

          <Text style={styles.snippetDescription}>{currentSnippet.description}</Text>

          <IDEWindow
            title={`playground.${selectedLangMeta.fileExt}`}
            lines={currentSnippet.code}
          />

          <DuolingoButton
            label="RUN CODE ▶"
            variant="green"
            onPress={() => setRunCounter((c) => c + 1)}
          />

          <MiniTerminal
            lines={currentSnippet.output}
            typewriter={runCounter > 0}
            runKey={runCounter}
          />
        </Tactile3DBox>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 44,
    gap: 22,
  },
  heroCardFace: {
    padding: 18,
    gap: 16,
  },
  heroBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBadgeBase: {
    borderRadius: 14,
    paddingBottom: 4,
  },
  iconBadgeFace: {
    width: 50,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTitle: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '800',
    color: Colors.white,
    flexShrink: 1,
  },
  heroDesc: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 2,
  },
  timerPillBase: {
    backgroundColor: Colors.redLip,
    borderRadius: 10,
    paddingBottom: 3,
  },
  timerPillFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timerPillText: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statChipLabel: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  statChipValue: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '800',
  },
  blitzArena: {
    gap: 12,
  },
  blitzTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBadge: {
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreBadgeText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
  },
  langTagText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  blitzToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  blitzToastText: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  blitzSummaryBox: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  blitzSummaryHeading: {
    fontFamily: UI_FONT,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.gold,
  },
  blitzSummaryScore: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  langTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langPillFace: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  templateChipFace: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  templateChipText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  snippetDescription: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
