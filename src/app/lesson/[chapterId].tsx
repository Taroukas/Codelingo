import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT } from '@/theme';
import { getNodeById, LANGUAGES } from '@/data/courses';
import { useGame } from '@/store/GameStore';
import { DuolingoButton } from '@/components/CyberButton';
import { Tactile3DBox } from '@/components/Tactile3D';
import { CodeBlocks, ExerciseSelectionState } from '@/components/exercises/CodeBlocks';
import { FindBug } from '@/components/exercises/FindBug';
import { PredictOutput } from '@/components/exercises/PredictOutput';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { tapHaptic, successHaptic, errorHaptic } from '@/utils/haptics';

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { hearts, gems, combo, completedNodes, recordAnswer, completeNode, refillHearts } =
    useGame();

  const resolved =
    getNodeById(chapterId ?? '') ?? {
      lang: LANGUAGES[0],
      unit: LANGUAGES[0].units[0],
      node: LANGUAGES[0].units[0].nodes[0],
    };

  const { lang, node } = resolved;
  const exercises = node.exercises;
  const alreadyCompleted = (completedNodes[lang.id] ?? []).includes(node.id);

  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState<ExerciseSelectionState>({
    canCheck: false,
    isCorrect: false,
    correctAnswerText: '',
  });
  const [checkedState, setCheckedState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [maxSessionCombo, setMaxSessionCombo] = useState(1);
  const [victory, setVictory] = useState(false);

  const currentExercise = exercises[stepIndex];
  const progressPct = victory
    ? 100
    : Math.max(8, Math.round(((stepIndex + (checkedState !== 'idle' ? 1 : 0)) / exercises.length) * 100));

  const handleSelectionChange = useCallback((next: ExerciseSelectionState) => {
    setSelection(next);
  }, []);

  const handleCheck = () => {
    if (!selection.canCheck || checkedState !== 'idle') return;
    if (selection.isCorrect) {
      successHaptic();
      const gained = recordAnswer(true, 10);
      setSessionXp((x) => x + gained);
      setSessionCorrect((c) => c + 1);
      setMaxSessionCombo((m) => Math.max(m, combo + 1));
      setCheckedState('correct');
    } else {
      errorHaptic();
      recordAnswer(false, 10);
      setCheckedState('wrong');
    }
  };

  const handleContinue = () => {
    tapHaptic();
    if (stepIndex + 1 < exercises.length) {
      setStepIndex((i) => i + 1);
      setCheckedState('idle');
      setSelection({ canCheck: false, isCorrect: false, correctAnswerText: '' });
    } else {
      const finishBonus = alreadyCompleted ? 5 : 15;
      completeNode(lang.id, node.id, finishBonus);
      setSessionXp((x) => x + finishBonus);
      setVictory(true);
    }
  };

  // Out of Hearts modal state inside lesson
  if (hearts <= 0 && !victory && checkedState === 'idle') {
    return (
      <View
        style={[
          styles.screen,
          styles.centeredScreen,
          { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.emptyHeartsBadge}>
          <Ionicons name="heart-dislike" size={56} color={Colors.red} />
        </View>
        <Text style={styles.victoryTitle}>You ran out of hearts!</Text>
        <Text style={styles.victorySubtitle}>
          Refill your hearts now to keep your lesson progress going.
        </Text>

        <View style={styles.outOfHeartsActions}>
          <DuolingoButton
            label={gems >= 50 ? 'REFILL HEARTS (50 GEMS)' : 'FREE PRACTICE REFILL'}
            variant="violet"
            onPress={() => {
              refillHearts();
            }}
          />
          <DuolingoButton
            label="QUIT LESSON"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  // Lesson Complete Victory Summary Screen
  if (victory) {
    const accuracy = Math.round((sessionCorrect / exercises.length) * 100);

    return (
      <View
        style={[
          styles.screen,
          styles.victoryContainer,
          { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.victoryTop}>
          <View style={styles.trophyPuckBase}>
            <View style={styles.trophyPuckFace}>
              <View style={styles.trophyHighlight} />
              <Ionicons name="trophy" size={54} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.victoryTitle}>Lesson Complete!</Text>
          <Text style={styles.victorySubtitle}>
            You mastered {node.title} in {lang.name}.
          </Text>

          {/* 3 Tactile 2-Layer 3D Stat Boxes Side-by-Side */}
          <View style={styles.statBoxesRow}>
            {/* TOTAL XP (#FFC800) */}
            <Tactile3DBox
              depth={5}
              borderRadius={16}
              faceColor={Colors.bg}
              lipColor={Colors.goldLip}
              borderColor={Colors.gold}
              style={{ flex: 1 }}
              faceStyle={styles.statBoxFace}
            >
              <View style={[styles.statBoxHeader, { backgroundColor: Colors.gold }]}>
                <Text style={[styles.statBoxHeaderText, { color: Colors.bg }]}>TOTAL XP</Text>
              </View>
              <View style={styles.statBoxBody}>
                <Ionicons name="flash" size={18} color={Colors.gold} />
                <Text style={[styles.statBoxValue, { color: Colors.gold }]}>+{sessionXp}</Text>
              </View>
            </Tactile3DBox>

            {/* COMBO BONUS (#8B5CF6) */}
            <Tactile3DBox
              depth={5}
              borderRadius={16}
              faceColor={Colors.bg}
              lipColor={Colors.violetLip}
              borderColor={Colors.violet}
              style={{ flex: 1 }}
              faceStyle={styles.statBoxFace}
            >
              <View style={[styles.statBoxHeader, { backgroundColor: Colors.violet }]}>
                <Text style={styles.statBoxHeaderText}>COMBO BONUS</Text>
              </View>
              <View style={styles.statBoxBody}>
                <Ionicons name="flame" size={18} color={Colors.violet} />
                <Text style={[styles.statBoxValue, { color: Colors.violet }]}>
                  x{maxSessionCombo}
                </Text>
              </View>
            </Tactile3DBox>

            {/* ACCURACY % (#58CC02) */}
            <Tactile3DBox
              depth={5}
              borderRadius={16}
              faceColor={Colors.bg}
              lipColor={Colors.greenLip}
              borderColor={Colors.green}
              style={{ flex: 1 }}
              faceStyle={styles.statBoxFace}
            >
              <View style={[styles.statBoxHeader, { backgroundColor: Colors.green }]}>
                <Text style={styles.statBoxHeaderText}>ACCURACY</Text>
              </View>
              <View style={styles.statBoxBody}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                <Text style={[styles.statBoxValue, { color: Colors.green }]}>{accuracy}%</Text>
              </View>
            </Tactile3DBox>
          </View>
        </View>

        <DuolingoButton
          label="CONTINUE"
          variant="green"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Lesson Header */}
      <View style={styles.lessonHeader}>
        <Pressable
          onPress={() => {
            tapHaptic();
            router.back();
          }}
          hitSlop={10}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={Colors.textSecondary} />
        </Pressable>

        {/* Duolingo 3D Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]}>
            <View style={styles.progressHighlight} />
          </View>
        </View>

        {/* Combo Pill */}
        {combo >= 2 ? (
          <View style={styles.comboPill}>
            <Text style={styles.comboText}>🔥 x{combo}</Text>
          </View>
        ) : null}

        {/* Hearts Counter */}
        <View style={styles.heartBadge}>
          <Ionicons name="heart" size={22} color={Colors.hearts} />
          <Text style={styles.heartCountText}>{hearts}</Text>
        </View>
      </View>

      {/* Scrollable Exercise Content */}
      <ScrollView
        contentContainerStyle={styles.exerciseScroll}
        showsVerticalScrollIndicator={false}
      >
        {currentExercise.type === 'code_blocks' ? (
          <CodeBlocks
            key={currentExercise.id}
            exercise={currentExercise}
            locked={checkedState !== 'idle'}
            onSelectionChange={handleSelectionChange}
          />
        ) : null}

        {currentExercise.type === 'find_bug' ? (
          <FindBug
            key={currentExercise.id}
            exercise={currentExercise}
            fileExt={lang.fileExt}
            locked={checkedState !== 'idle'}
            onSelectionChange={handleSelectionChange}
          />
        ) : null}

        {currentExercise.type === 'predict_output' ? (
          <PredictOutput
            key={currentExercise.id}
            exercise={currentExercise}
            fileExt={lang.fileExt}
            locked={checkedState !== 'idle'}
            onSelectionChange={handleSelectionChange}
          />
        ) : null}

        {currentExercise.type === 'multiple_choice' ? (
          <MultipleChoice
            key={currentExercise.id}
            exercise={currentExercise}
            locked={checkedState !== 'idle'}
            onSelectionChange={handleSelectionChange}
          />
        ) : null}
      </ScrollView>

      {/* Bottom Check Bar OR Slide-Up Feedback Banner */}
      {checkedState === 'idle' ? (
        <View
          style={[
            styles.bottomCheckBar,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <DuolingoButton
            label="CHECK"
            variant="green"
            disabled={!selection.canCheck}
            onPress={handleCheck}
          />
        </View>
      ) : (
        <View
          style={[
            styles.feedbackBanner,
            checkedState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
            { paddingBottom: Math.max(insets.bottom, 22) },
          ]}
        >
          <View style={styles.feedbackTopRow}>
            <View
              style={[
                styles.feedbackStatusCircle,
                {
                  backgroundColor: checkedState === 'correct' ? Colors.green : Colors.red,
                },
              ]}
            >
              <Ionicons
                name={checkedState === 'correct' ? 'checkmark-sharp' : 'close-sharp'}
                size={22}
                color={Colors.bg}
              />
            </View>
            <View style={styles.feedbackTextCol}>
              <Text
                style={[
                  styles.feedbackHeading,
                  { color: checkedState === 'correct' ? Colors.green : Colors.red },
                ]}
              >
                {checkedState === 'correct' ? 'Awesome!' : 'Correct solution:'}
              </Text>
              {checkedState === 'wrong' ? (
                <Text style={styles.correctSolutionText}>{selection.correctAnswerText}</Text>
              ) : null}
              <Text style={styles.explanationText}>{currentExercise.explanation}</Text>
            </View>
          </View>

          <DuolingoButton
            label={checkedState === 'correct' ? 'CONTINUE' : 'GOT IT'}
            variant={checkedState === 'correct' ? 'green' : 'red'}
            onPress={handleContinue}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centeredScreen: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  emptyHeartsBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.redBannerBg,
    borderWidth: 3,
    borderColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfHeartsActions: {
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    padding: 2,
  },
  progressTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: Colors.violet,
    paddingHorizontal: 6,
    paddingTop: 3,
  },
  progressHighlight: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  comboPill: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.flame,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comboText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.flame,
  },
  heartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartCountText: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.hearts,
  },
  exerciseScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  bottomCheckBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  feedbackBanner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    gap: 18,
  },
  feedbackCorrect: {
    backgroundColor: Colors.greenBannerBg,
    borderTopColor: Colors.greenBannerBorder,
  },
  feedbackWrong: {
    backgroundColor: Colors.redBannerBg,
    borderTopColor: Colors.redBannerBorder,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  feedbackStatusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  feedbackTextCol: {
    flex: 1,
    gap: 4,
  },
  feedbackHeading: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
  },
  correctSolutionText: {
    fontFamily: UI_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  explanationText: {
    fontFamily: UI_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  victoryContainer: {
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  victoryTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  trophyPuckBase: {
    width: 112,
    borderRadius: 56,
    backgroundColor: Colors.goldLip,
    paddingBottom: 8,
    marginBottom: 8,
  },
  trophyPuckFace: {
    width: 112,
    height: 100,
    borderRadius: 56,
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.goldLip,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trophyHighlight: {
    position: 'absolute',
    top: 12,
    left: 18,
    width: 28,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    transform: [{ rotate: '-25deg' }],
  },
  victoryTitle: {
    fontFamily: UI_FONT,
    fontSize: 30,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
  },
  victorySubtitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statBoxesRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  statBoxFace: {
    overflow: 'hidden',
  },
  statBoxHeader: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxHeaderText: {
    fontFamily: UI_FONT,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.6,
  },
  statBoxBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  statBoxValue: {
    fontFamily: UI_FONT,
    fontSize: 20,
    fontWeight: '800',
  },
});
