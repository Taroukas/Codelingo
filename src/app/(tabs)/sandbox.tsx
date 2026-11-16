import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Pressable,
  View,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import {
  LANGUAGES,
  LangId,
  PLAYGROUND_SNIPPETS,
  getLanguage,
} from '@/data/courses';
import {
  BUG_CAMPAIGN_BUGS_PER_LEVEL,
  BUG_CAMPAIGN_MAX_STARS,
  BUG_CAMPAIGN_TOTAL_LEVELS,
  BugCampaignLevel,
  getBugCampaignLevel,
} from '@/data/bugCampaign';
import {
  SYNTAX_SPRINT_MAX_STARS,
  SYNTAX_SPRINT_TOTAL_LEVELS,
  SyntaxSprintLevel,
  getSyntaxSprintLevel,
} from '@/data/syntaxSprintCampaign';
import {
  GIT_CAMPAIGN_MAX_STARS,
  GIT_CAMPAIGN_TOTAL_LEVELS,
  GitCampaignLevel,
  getGitCampaignLevel,
} from '@/data/gitCampaign';
import {
  ROBOT_MAZE_MAX_STARS,
  ROBOT_MAZE_TOTAL_LEVELS,
  RobotMazeLevel,
  getRobotMazeLevel,
} from '@/data/robotMazeCampaign';
import {
  BLITZ_HEART_REWARD,
  RecordBugLevelResult,
  RecordGitSimLevelResult,
  RecordRobotMazeLevelResult,
  getBugLanguageStars,
  getBugLevelStatus,
  getGitSimLevelStatus,
  getGitSimTotalStars,
  getRobotMazeLevelStatus,
  getRobotMazeTotalStars,
  getSyntaxSprintLanguageStars,
  getSyntaxSprintLevelStatus,
  useGame,
} from '@/store/GameStore';
import { formatLocalDateKey } from '@/store/useUserStore';
import { TabHeader } from '@/components/TabHeader';
import { LanguageLogo } from '@/components/LanguageLogo';
import { SpringPressable } from '@/components/CyberButton';
import { HeroAmbientGlow } from '@/components/ui/AmbientSurface';
import { BlitzArena } from '@/components/BlitzArena';
import {
  CampaignKind,
  CampaignMapModal,
} from '@/components/BugCampaignMap';
import { SyntaxSprintArena } from '@/components/games/SyntaxSprintArena';
import { GitSimulatorArena } from '@/components/games/GitSimulatorArena';
import { RobotMazeArena } from '@/components/games/RobotMazeArena';
import { InteractiveIdeView } from '@/components/ide/InteractiveIdeView';
import { selectionHaptic, tapHaptic } from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import { GemIcon } from '@/components/ui/CurrencyIcons';
import { CurrencyPillButton } from '@/components/ui/CurrencyPillButton';
import { StaggerCascadeItem } from '@/components/ui/StaggerCascadeItem';
import { GemShopModal } from '@/components/shop/GemShopModal';
import { MistakeVaultModal } from '@/components/MistakeVaultModal';
import { CodeDuelArena } from '@/components/games/CodeDuelArena';
import { GUIDED_PROJECTS, type GuidedProject } from '@/data/guidedProjects';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type PracticeModal = 'playground' | 'campaign' | null;
type PracticeSegment = 'all' | 'campaigns' | 'playground';

const HEADER_BORDER = 'rgba(255, 255, 255, 0.07)';

/* ------------------------------------------------------------------ */
/*  Hero Artwork & Quick Challenge Registry                            */
/* ------------------------------------------------------------------ */

interface FlatToken {
  w: number;
  bg: string;
}

const HERO_SYNTAX_ROWS: readonly FlatToken[][] = [
  [
    { w: 40, bg: '#2B2B3F' },
    { w: 18, bg: '#5B45B8' },
  ],
  [
    { w: 28, bg: '#32304A' },
    { w: 46, bg: '#7C5CFC' },
  ],
  [
    { w: 36, bg: '#4E3EA8' },
    { w: 28, bg: '#A78BFA' },
    { w: 14, bg: '#232236' },
  ],
  [
    { w: 32, bg: '#27263A' },
    { w: 52, bg: '#8B5CF6' },
  ],
  [
    { w: 26, bg: '#5D48C7' },
    { w: 42, bg: '#A78BFA' },
  ],
  [
    { w: 22, bg: '#27273A' },
    { w: 38, bg: '#4F46E5' },
  ],
];

interface QuickChallengeItem {
  id: string;
  rank: number;
  lang: LangId;
  snippetIndex: number;
  title: string;
  subtitle: string;
  xpLabel: string;
}

const QUICK_CHALLENGES: readonly QuickChallengeItem[] = [
  {
    id: 'asm-stack-frame',
    rank: 1,
    lang: 'asm',
    snippetIndex: 0,
    title: 'x86 Stack Frame',
    subtitle: 'Assembly · Registers · 2m',
    xpLabel: '+25 XP',
  },
  {
    id: 'py-fibonacci-unpack',
    rank: 2,
    lang: 'python',
    snippetIndex: 0,
    title: 'Fibonacci Unpack',
    subtitle: 'Python · Tuples · 1m',
    xpLabel: '+20 XP',
  },
  {
    id: 'cpp-pointer-deref',
    rank: 3,
    lang: 'cpp',
    snippetIndex: 0,
    title: 'Pointer Deref',
    subtitle: 'C++ · Memory · 3m',
    xpLabel: '+30 XP',
  },
  {
    id: 'go-goroutine-channel',
    rank: 4,
    lang: 'go',
    snippetIndex: 0,
    title: 'Goroutine Channel',
    subtitle: 'Go · Concurrency · 2m',
    xpLabel: '+25 XP',
  },
];

function PracticeHeroSyntaxGraphic() {
  return (
    <View style={styles.heroGraphicWrap} pointerEvents="none">
      {HERO_SYNTAX_ROWS.map((row, rIdx) => (
        <View key={rIdx} style={styles.heroGraphicRow}>
          {row.map((token, tIdx) => (
            <View
              key={tIdx}
              style={[
                styles.heroSyntaxBar,
                { width: token.w, backgroundColor: token.bg },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    openBlitz?: string;
    openIde?: string;
    heartRecovery?: string;
    returnLesson?: string;
  }>();
  const {
    activeLang,
    activityBreakdown,
    bugCampaignProgress,
    syntaxSprintProgress,
    gitSimProgress,
    robotMazeProgress,
    executions,
    hearts,
    maxHearts,
    gems,
    isXpBoostActive,
    xpBoostRemainingSec,
    mistakeVault,
    completedProjects,
    duelsWon,
    pendingBlitzRecovery,
    clearBlitzRecovery,
    earnBlitzHearts,
    recordBugLevelCompletion,
    recordSyntaxSprintCompletion,
    recordGitSimCompletion,
    recordRobotMazeCompletion,
    recordExecution,
  } = useGame();

  const [shopOpen, setShopOpen] = useState(false);
  const [mistakeVaultOpen, setMistakeVaultOpen] = useState(false);
  const [duelArenaOpen, setDuelArenaOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<GuidedProject | null>(null);

  const [activeSegment, setActiveSegment] = useState<PracticeSegment>('all');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [cascadeKey, setCascadeKey] = useState(0);
  const [activeModal, setActiveModal] = useState<PracticeModal>(null);
  const [activeCampaignKind, setActiveCampaignKind] =
    useState<CampaignKind>('bug_hunt');
  const [recoveryLessonId, setRecoveryLessonId] = useState<string | null>(null);
  const isClosingModalRef = useRef(false);

  // Tab switch subtle fade + glide + 3-tab segmented bar spring
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;
  const segmentAnim = useRef(new Animated.Value(0)).current;
  const modeFadeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const raf = requestAnimationFrame(() => {
        setCascadeKey((k) => k + 1);
      });
      return () => cancelAnimationFrame(raf);
    }, []),
  );

  const handleSegmentChange = (next: PracticeSegment) => {
    if (next === activeSegment) return;
    selectionHaptic();
    playSound('select');
    setActiveSegment(next);
    setCascadeKey((k) => k + 1);
    const index = next === 'all' ? 0 : next === 'campaigns' ? 1 : 2;
    Animated.timing(segmentAnim, {
      toValue: index,
      duration: 130,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    modeFadeAnim.stopAnimation();
    modeFadeAnim.setValue(0.86);
    Animated.timing(modeFadeAnim, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleSegmentLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - segmentWidth) > 1) {
      setSegmentWidth(w);
    }
  };

  // Full-screen modal slide-up + backdrop fade (native driver)
  const modalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalBackdropOpacity = useRef(new Animated.Value(0)).current;

  const animateModalIn = useCallback(() => {
    isClosingModalRef.current = false;
    modalTranslateY.stopAnimation();
    modalBackdropOpacity.stopAnimation();
    modalTranslateY.setValue(SCREEN_HEIGHT);
    modalBackdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(modalBackdropOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalBackdropOpacity, modalTranslateY]);

  // --- Bug Hunt 30-Level PCB Campaign state ---
  const [campaignLang, setCampaignLang] = useState<LangId>(activeLang);
  const [campaignView, setCampaignView] = useState<'map' | 'play'>('map');
  const [selectedCampaignLevel, setSelectedCampaignLevel] = useState<number>(1);

  const findActiveLevelForLang = useCallback(
    (langId: LangId): number => {
      for (let lvl = 1; lvl <= BUG_CAMPAIGN_TOTAL_LEVELS; lvl += 1) {
        if (getBugLevelStatus(bugCampaignProgress, langId, lvl) === 'active') {
          return lvl;
        }
      }
      return BUG_CAMPAIGN_TOTAL_LEVELS;
    },
    [bugCampaignProgress],
  );

  const activeCampaignLevel = useMemo(
    () => getBugCampaignLevel(campaignLang, selectedCampaignLevel),
    [campaignLang, selectedCampaignLevel],
  );
  const activeSprintLevel = useMemo(
    () => getSyntaxSprintLevel(campaignLang, selectedCampaignLevel),
    [campaignLang, selectedCampaignLevel],
  );
  const activeGitLevel = useMemo(
    () => getGitCampaignLevel(selectedCampaignLevel),
    [selectedCampaignLevel],
  );
  const activeMazeLevel = useMemo(
    () => getRobotMazeLevel(selectedCampaignLevel),
    [selectedCampaignLevel],
  );

  // --- Interactive Code IDE state ---
  const [playgroundLang, setPlaygroundLang] = useState<LangId>(activeLang);
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [ideLoadMode, setIdeLoadMode] = useState<'starter' | 'challenge'>('starter');
  const [ideSessionKey, setIdeSessionKey] = useState(0);
  const [syncedLang, setSyncedLang] = useState<LangId>(activeLang);

  // Store-backed deep link handler from Out-of-Hearts Modal (`pendingBlitzRecovery`)
  useEffect(() => {
    if (!pendingBlitzRecovery) return;
    const lessonId = pendingBlitzRecovery;
    const frame = requestAnimationFrame(() => {
      setRecoveryLessonId(lessonId);
      clearBlitzRecovery();
      playSound('run_code');
      setActiveCampaignKind('bug_hunt');
      setCampaignLang(activeLang);
      setSelectedCampaignLevel(findActiveLevelForLang(activeLang));
      setCampaignView('play');
      setActiveModal('campaign');
      animateModalIn();
    });
    return () => cancelAnimationFrame(frame);
  }, [
    pendingBlitzRecovery,
    clearBlitzRecovery,
    activeLang,
    findActiveLevelForLang,
    animateModalIn,
  ]);

  // URL param deep link handler (`openBlitz=1`)
  const openBlitzParam = params.openBlitz;
  const returnLessonParam = params.returnLesson;
  useEffect(() => {
    if (openBlitzParam !== '1') return;
    const frame = requestAnimationFrame(() => {
      setRecoveryLessonId(
        typeof returnLessonParam === 'string' && returnLessonParam.length > 0
          ? returnLessonParam
          : null,
      );
      playSound('run_code');
      setActiveCampaignKind('bug_hunt');
      setCampaignLang(activeLang);
      setSelectedCampaignLevel(findActiveLevelForLang(activeLang));
      setCampaignView('play');
      setActiveModal('campaign');
      animateModalIn();
      router.setParams({
        openBlitz: undefined,
        heartRecovery: undefined,
        returnLesson: undefined,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    openBlitzParam,
    returnLessonParam,
    activeLang,
    findActiveLevelForLang,
    animateModalIn,
  ]);

  // URL param deep link handler (`openIde=1` from Unit Guidebook CTA)
  const openIdeParam = params.openIde;
  useEffect(() => {
    if (openIdeParam !== '1') return;
    const frame = requestAnimationFrame(() => {
      playSound('drawer_open');
      setActiveProject(null);
      setIdeLoadMode('starter');
      setIdeSessionKey((k) => k + 1);
      setActiveModal('playground');
      animateModalIn();
      router.setParams({ openIde: undefined });
    });
    return () => cancelAnimationFrame(frame);
  }, [openIdeParam, animateModalIn]);

  // Follow the global course switcher without an effect (derives during render).
  if (syncedLang !== activeLang) {
    setSyncedLang(activeLang);
    setPlaygroundLang(activeLang);
    setCampaignLang(activeLang);
    setSnippetIndex(0);
    setIdeLoadMode('starter');
    setIdeSessionKey((k) => k + 1);
  }

  const openCampaignMap = (kind: CampaignKind) => {
    playSound('drawer_open');
    setRecoveryLessonId(null);
    setActiveCampaignKind(kind);
    setCampaignLang(activeLang);
    setCampaignView('map');
    setActiveModal('campaign');
    animateModalIn();
  };

  const openPlayground = () => {
    playSound('drawer_open');
    setActiveProject(null);
    setIdeLoadMode('starter');
    setIdeSessionKey((k) => k + 1);
    setActiveModal('playground');
    animateModalIn();
  };

  const openNewPlayground = () => {
    playSound('drawer_open');
    setActiveProject(null);
    const count = PLAYGROUND_SNIPPETS[playgroundLang].length;
    const nextIdx = count > 0 ? (snippetIndex + 1) % count : 0;
    setSnippetIndex(nextIdx);
    setIdeLoadMode('challenge');
    setIdeSessionKey((k) => k + 1);
    setActiveModal('playground');
    animateModalIn();
  };

  const openChallengeInPlayground = (challenge: QuickChallengeItem) => {
    tapHaptic();
    playSound('drawer_open');
    setActiveProject(null);
    setPlaygroundLang(challenge.lang);
    setSnippetIndex(challenge.snippetIndex);
    setIdeLoadMode('challenge');
    setIdeSessionKey((k) => k + 1);
    setActiveModal('playground');
    animateModalIn();
  };

  const openGuidedProject = (project: GuidedProject) => {
    tapHaptic();
    playSound('drawer_open');
    setActiveProject(project);
    setPlaygroundLang(project.language);
    setIdeLoadMode('starter');
    setIdeSessionKey((k) => k + 1);
    setActiveModal('playground');
    animateModalIn();
  };

  const closeModal = () => {
    if (isClosingModalRef.current) return;
    isClosingModalRef.current = true;
    playSound('drawer_close');

    modalTranslateY.stopAnimation();
    modalBackdropOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(modalBackdropOpacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCampaignView('map');
      setActiveModal(null);
      setActiveProject(null);
      setRecoveryLessonId(null);
      isClosingModalRef.current = false;
    });
  };

  const handleReturnToLessonFromBlitz = () => {
    const targetLesson = recoveryLessonId;
    if (targetLesson) {
      playSound('drawer_close');
      modalTranslateY.stopAnimation();
      modalBackdropOpacity.stopAnimation();
      setCampaignView('map');
      setActiveModal(null);
      setRecoveryLessonId(null);
      isClosingModalRef.current = false;
      router.replace(`/lesson/${targetLesson}`);
      return;
    }
    closeModal();
  };

  const handleCompleteCampaignLevel = ({
    level,
    stars,
    elapsedMs,
  }: {
    level: BugCampaignLevel;
    stars: 1 | 2 | 3;
    elapsedMs: number;
  }): { reward: RecordBugLevelResult; heartsRecovered: number } => {
    const reward = recordBugLevelCompletion({
      lang: campaignLang,
      levelNumber: level.levelNumber,
      stars,
      elapsedMs,
      xpReward: level.xpReward,
      gemReward: level.gemReward,
      bugsFixed: BUG_CAMPAIGN_BUGS_PER_LEVEL,
    });
    let recovered = 0;
    if (hearts < maxHearts || Boolean(recoveryLessonId)) {
      recovered = earnBlitzHearts(BLITZ_HEART_REWARD);
    }
    return { reward, heartsRecovered: recovered };
  };

  const handleCompleteSyntaxSprintLevel = ({
    level,
    stars,
    elapsedMs,
  }: {
    level: SyntaxSprintLevel;
    stars: 1 | 2 | 3;
    elapsedMs: number;
  }): { reward: RecordBugLevelResult } => {
    const reward = recordSyntaxSprintCompletion({
      lang: campaignLang,
      levelNumber: level.levelNumber,
      stars,
      elapsedMs,
      xpReward: level.xpReward,
      gemReward: level.gemReward,
    });
    return { reward };
  };

  const handleCompleteGitSimLevel = ({
    level,
    stars,
    movesUsed,
  }: {
    level: GitCampaignLevel;
    stars: 1 | 2 | 3;
    movesUsed: number;
  }): { reward: RecordGitSimLevelResult } => {
    const reward = recordGitSimCompletion({
      levelNumber: level.levelNumber,
      stars,
      movesUsed,
      xpReward: level.xpReward,
      gemReward: level.gemReward,
    });
    return { reward };
  };

  const handleCompleteRobotMazeLevel = ({
    level,
    stars,
    blocksUsed,
  }: {
    level: RobotMazeLevel;
    stars: 1 | 2 | 3;
    blocksUsed: number;
  }): { reward: RecordRobotMazeLevelResult } => {
    const reward = recordRobotMazeCompletion({
      levelNumber: level.levelNumber,
      stars,
      blocksUsed,
      xpReward: level.xpReward,
      gemReward: level.gemReward,
    });
    return { reward };
  };

  const tabBarClearance = Math.max(115, insets.bottom + 84);
  const bugStars = useMemo(
    () => getBugLanguageStars(bugCampaignProgress, activeLang),
    [activeLang, bugCampaignProgress],
  );
  const sprintStars = useMemo(
    () => getSyntaxSprintLanguageStars(syntaxSprintProgress, activeLang),
    [activeLang, syntaxSprintProgress],
  );
  const gitStars = useMemo(
    () => getGitSimTotalStars(gitSimProgress),
    [gitSimProgress],
  );
  const mazeStars = useMemo(
    () => getRobotMazeTotalStars(robotMazeProgress),
    [robotMazeProgress],
  );

  const bugCurrentLvl = useMemo(() => {
    for (let i = 1; i <= 30; i += 1) {
      if (getBugLevelStatus(bugCampaignProgress, activeLang, i) === 'active')
        return i;
    }
    return 30;
  }, [activeLang, bugCampaignProgress]);

  const sprintCurrentLvl = useMemo(() => {
    for (let i = 1; i <= 30; i += 1) {
      if (
        getSyntaxSprintLevelStatus(syntaxSprintProgress, activeLang, i) ===
        'active'
      )
        return i;
    }
    return 30;
  }, [activeLang, syntaxSprintProgress]);

  const gitCurrentLvl = useMemo(() => {
    for (let i = 1; i <= 30; i += 1) {
      if (getGitSimLevelStatus(gitSimProgress, i) === 'active') return i;
    }
    return 30;
  }, [gitSimProgress]);

  const mazeCurrentLvl = useMemo(() => {
    for (let i = 1; i <= 30; i += 1) {
      if (getRobotMazeLevelStatus(robotMazeProgress, i) === 'active') return i;
    }
    return 30;
  }, [robotMazeProgress]);

  const activeLangMeta = getLanguage(activeLang);
  const todayKey = formatLocalDateKey();
  const todayActivity = activityBreakdown?.[todayKey];
  const rawDailySessions =
    (todayActivity?.runs ?? 0) + (todayActivity?.blitz ?? 0);
  const dailySessionsDone = Math.min(3, rawDailySessions);
  const dailyProgressPct = Math.round((dailySessionsDone / 3) * 100);

  const tabItemWidth = segmentWidth > 0 ? segmentWidth / 3 : 0;
  const indicatorTranslateX = segmentAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabItemWidth, tabItemWidth * 2],
  });

  const renderQuickChallenges = () => (
    <View style={styles.challengesSection}>
      <View style={styles.challengesHeader}>
        <Text style={styles.sectionTitle}>Quick Challenges</Text>
        <View style={styles.statusBadgePill}>
          <Ionicons name="flash" size={10} color="#C4B5FD" />
          <Text style={styles.statusBadgeText}>INSTANT RUN</Text>
        </View>
      </View>

      <View style={styles.challengesList}>
        {QUICK_CHALLENGES.map((challenge, idx) => (
          <StaggerCascadeItem key={challenge.id} index={idx} triggerKey={cascadeKey}>
            <SpringPressable
              onPress={() => openChallengeInPlayground(challenge)}
              haptic="light"
              sound="none"
              pressScale={0.985}
              accessibilityRole="button"
              style={styles.challengeRow}
            >
              <View style={styles.challengeLeft}>
                <Text style={styles.challengeIndex}>{challenge.rank}</Text>
                <View style={styles.challengeLogoCircle}>
                  <LanguageLogo language={challenge.lang} size={18} />
                </View>
                <View style={styles.challengeMeta}>
                  <Text style={styles.challengeTitle} numberOfLines={1}>
                    {challenge.title}
                  </Text>
                  <Text style={styles.challengeSub} numberOfLines={1}>
                    {challenge.subtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.challengeRight}>
                <View style={styles.challengeXpPill}>
                  <Text style={styles.challengeXp}>{challenge.xpLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </View>
            </SpringPressable>
          </StaggerCascadeItem>
        ))}
      </View>
    </View>
  );

  const renderTripleAExpansionCards = () => (
    <View style={styles.bentoRow}>
      {/* Mistake Vault Card */}
      <StaggerCascadeItem
        index={4}
        triggerKey={cascadeKey}
        style={styles.bentoCellWrap}
      >
        <SpringPressable
          onPress={() => {
            tapHaptic();
            playSound('drawer_open');
            setMistakeVaultOpen(true);
          }}
          haptic="medium"
          sound="none"
          pressScale={0.975}
          accessibilityRole="button"
          style={styles.bentoCard}
        >
        <View style={styles.bentoTopRow}>
          <View style={styles.bentoIconBox}>
            <Ionicons name="construct-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.bentoBadgeStack}>
            <View
              style={[
                styles.statusChipAmber,
                mistakeVault.length === 0 && styles.statusChipGreen,
              ]}
            >
              <Text
                style={[
                  styles.bentoStarGold,
                  mistakeVault.length === 0 && { color: '#34D399' },
                ]}
              >
                {mistakeVault.length > 0 ? `${mistakeVault.length} Due` : 'Clear'}
              </Text>
            </View>
            <Text style={styles.bentoLevelPill}>+15 XP</Text>
          </View>
        </View>

        <View style={styles.bentoCopy}>
          <Text style={styles.bentoTitle} numberOfLines={1}>
            Mistake Vault
          </Text>
          <Text style={styles.bentoSub} numberOfLines={1}>
            Drill missed code &amp; bugs
          </Text>
        </View>

        <View style={styles.bentoPillSecondary}>
          <Text style={styles.bentoPillAmberText}>Review →</Text>
        </View>
      </SpringPressable>
      </StaggerCascadeItem>

      {/* 1v1 Code Duel Card */}
      <StaggerCascadeItem
        index={5}
        triggerKey={cascadeKey}
        style={styles.bentoCellWrap}
      >
        <SpringPressable
          onPress={() => {
            tapHaptic();
            playSound('drawer_open');
            setDuelArenaOpen(true);
          }}
          haptic="medium"
          sound="none"
          pressScale={0.975}
          accessibilityRole="button"
          style={styles.bentoCard}
        >
          <View style={styles.bentoTopRow}>
            <View style={styles.bentoIconBox}>
              <Ionicons name="flash" size={20} color="#A78BFA" />
            </View>
            <View style={styles.bentoBadgeStack}>
              <View style={styles.statusChipViolet}>
                <Text style={styles.bentoStatViolet}>{duelsWon} Won</Text>
              </View>
              <Text style={styles.bentoLevelPill}>1v1 Live</Text>
            </View>
          </View>

          <View style={styles.bentoCopy}>
            <Text style={styles.bentoTitle} numberOfLines={1}>
              1v1 Code Duel
            </Text>
            <Text style={styles.bentoSub} numberOfLines={1}>
              5-round sprint vs Rivals
            </Text>
          </View>

          <View style={styles.bentoPillPrimary}>
            <Text style={styles.bentoPillPrimaryText}>Find Rival →</Text>
          </View>
        </SpringPressable>
      </StaggerCascadeItem>
    </View>
  );

  const renderGuidedProjectsSection = () => (
    <View style={styles.challengesSection}>
      <View style={styles.challengesHeader}>
        <Text style={styles.sectionTitle}>Guided Mini-Projects</Text>
        <View style={styles.statusBadgePill}>
          <Ionicons name="layers-outline" size={10} color="#C4B5FD" />
          <Text style={styles.statusBadgeText}>
            {completedProjects.length}/{GUIDED_PROJECTS.length} BUILT · +60 XP
          </Text>
        </View>
      </View>

      <View style={styles.challengesList}>
        {GUIDED_PROJECTS.map((project, pIdx) => {
          const isBuilt = completedProjects.includes(project.id);
          return (
            <StaggerCascadeItem
              key={project.id}
              index={6 + pIdx}
              triggerKey={cascadeKey}
            >
              <SpringPressable
                onPress={() => openGuidedProject(project)}
                haptic="light"
                sound="none"
                pressScale={0.985}
                accessibilityRole="button"
                style={styles.challengeRow}
              >
                <View style={styles.challengeLeft}>
                  <View style={styles.challengeLogoCircle}>
                    <LanguageLogo language={project.language} size={18} />
                  </View>
                  <View style={styles.challengeMeta}>
                    <Text style={styles.challengeTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.challengeSub} numberOfLines={1}>
                      {`${project.steps.length} Steps · ${project.estimatedMinutes}m · ${project.subtitle}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.challengeRight}>
                  {isBuilt ? (
                    <View style={styles.projectBuiltBadge}>
                      <Text style={styles.projectBuiltBadgeText}>BUILT ✓</Text>
                    </View>
                  ) : (
                    <View style={styles.challengeXpPill}>
                      <Text style={styles.challengeXp}>
                        {`+${project.xpReward} XP`}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={14} color="#64748B" />
                </View>
              </SpringPressable>
            </StaggerCascadeItem>
          );
        })}
      </View>
    </View>
  );

  const renderCampaignBentoGrid = () => (
    <View style={styles.bentoGridWrap}>
      {/* Row 1: Bug Hunt & Syntax Sprint */}
      <View style={styles.bentoRow}>
        {/* 1. Bug Hunt */}
        <StaggerCascadeItem
          index={0}
          triggerKey={cascadeKey}
          style={styles.bentoCellWrap}
        >
          <SpringPressable
            onPress={() => openCampaignMap('bug_hunt')}
            haptic="medium"
            sound="none"
            pressScale={0.975}
            accessibilityRole="button"
            style={styles.bentoCard}
          >
            <View style={styles.bentoTopRow}>
              <View style={styles.bentoIconBox}>
                <Ionicons name="bug" size={20} color="#EF4444" />
              </View>
              <View style={styles.bentoBadgeStack}>
                <View style={styles.starPillGold}>
                  <Text style={styles.bentoStarGold}>
                    ★ {bugStars}/{BUG_CAMPAIGN_MAX_STARS}
                  </Text>
                </View>
                <Text style={styles.bentoLevelPill}>Lvl {bugCurrentLvl}/30</Text>
              </View>
            </View>

            <View style={styles.bentoCopy}>
              <Text style={styles.bentoTitle} numberOfLines={1}>
                Bug Hunt
              </Text>
              <Text style={styles.bentoSub} numberOfLines={1}>
                Spot broken lines fast
              </Text>
            </View>

            <View style={styles.bentoPillPrimary}>
              <Text style={styles.bentoPillPrimaryText}>Play →</Text>
            </View>
          </SpringPressable>
        </StaggerCascadeItem>

        {/* 2. Syntax Sprint */}
        <StaggerCascadeItem
          index={1}
          triggerKey={cascadeKey}
          style={styles.bentoCellWrap}
        >
          <SpringPressable
            onPress={() => openCampaignMap('syntax_sprint')}
            haptic="medium"
            sound="none"
            pressScale={0.975}
            accessibilityRole="button"
            style={styles.bentoCard}
          >
            <View style={styles.bentoTopRow}>
              <View style={styles.bentoIconBox}>
                <Ionicons name="flash" size={20} color="#34D399" />
              </View>
              <View style={styles.bentoBadgeStack}>
                <View style={styles.starPillGold}>
                  <Text style={styles.bentoStarGold}>
                    ★ {sprintStars}/{SYNTAX_SPRINT_MAX_STARS}
                  </Text>
                </View>
                <Text style={styles.bentoLevelPill}>
                  Lvl {sprintCurrentLvl}/30
                </Text>
              </View>
            </View>

            <View style={styles.bentoCopy}>
              <Text style={styles.bentoTitle} numberOfLines={1}>
                Syntax Sprint
              </Text>
              <Text style={styles.bentoSub} numberOfLines={1}>
                Swipe valid vs broken syntax
              </Text>
            </View>

            <View
              style={
                sprintStars > 0 || sprintCurrentLvl > 1
                  ? styles.bentoPillPrimary
                  : styles.bentoPillSecondary
              }
            >
              <Text
                style={
                  sprintStars > 0 || sprintCurrentLvl > 1
                    ? styles.bentoPillPrimaryText
                    : styles.bentoPillSecondaryText
                }
              >
                Play →
              </Text>
            </View>
          </SpringPressable>
        </StaggerCascadeItem>
      </View>

      {/* Row 2: Git Simulator & Robot Maze */}
      <View style={styles.bentoRow}>
        {/* 3. Git Simulator */}
        <StaggerCascadeItem
          index={2}
          triggerKey={cascadeKey}
          style={styles.bentoCellWrap}
        >
          <SpringPressable
            onPress={() => openCampaignMap('git_sim')}
            haptic="medium"
            sound="none"
            pressScale={0.975}
            accessibilityRole="button"
            style={styles.bentoCard}
          >
            <View style={styles.bentoTopRow}>
              <View style={styles.bentoIconBox}>
                <Ionicons name="git-branch" size={20} color="#38BDF8" />
              </View>
              <View style={styles.bentoBadgeStack}>
                <View style={styles.starPillGold}>
                  <Text style={styles.bentoStarGold}>
                    ★ {gitStars}/{GIT_CAMPAIGN_MAX_STARS}
                  </Text>
                </View>
                <Text style={styles.bentoLevelPill}>Lvl {gitCurrentLvl}/30</Text>
              </View>
            </View>

            <View style={styles.bentoCopy}>
              <Text style={styles.bentoTitle} numberOfLines={1}>
                Git Simulator
              </Text>
              <Text style={styles.bentoSub} numberOfLines={1}>
                Branch, merge &amp; fix conflicts
              </Text>
            </View>

            <View
              style={
                gitStars > 0 || gitCurrentLvl > 1
                  ? styles.bentoPillPrimary
                  : styles.bentoPillSecondary
              }
            >
              <Text
                style={
                  gitStars > 0 || gitCurrentLvl > 1
                    ? styles.bentoPillPrimaryText
                    : styles.bentoPillSecondaryText
                }
              >
                Play →
              </Text>
            </View>
          </SpringPressable>
        </StaggerCascadeItem>

        {/* 4. Robot Maze */}
        <StaggerCascadeItem
          index={3}
          triggerKey={cascadeKey}
          style={styles.bentoCellWrap}
        >
          <SpringPressable
            onPress={() => openCampaignMap('robot_maze')}
            haptic="medium"
            sound="none"
            pressScale={0.975}
            accessibilityRole="button"
            style={styles.bentoCard}
          >
            <View style={styles.bentoTopRow}>
              <View style={styles.bentoIconBox}>
                <Ionicons name="hardware-chip" size={20} color="#A78BFA" />
              </View>
              <View style={styles.bentoBadgeStack}>
                <View style={styles.starPillGold}>
                  <Text style={styles.bentoStarGold}>
                    ★ {mazeStars}/{ROBOT_MAZE_MAX_STARS}
                  </Text>
                </View>
                <Text style={styles.bentoLevelPill}>Lvl {mazeCurrentLvl}/30</Text>
              </View>
            </View>

            <View style={styles.bentoCopy}>
              <Text style={styles.bentoTitle} numberOfLines={1}>
                Robot Maze
              </Text>
              <Text style={styles.bentoSub} numberOfLines={1}>
                Code loops to reach the portal
              </Text>
            </View>

            <View
              style={
                mazeStars > 0 || mazeCurrentLvl > 1
                  ? styles.bentoPillPrimary
                  : styles.bentoPillSecondary
              }
            >
              <Text
                style={
                  mazeStars > 0 || mazeCurrentLvl > 1
                    ? styles.bentoPillPrimaryText
                    : styles.bentoPillSecondaryText
                }
              >
                Play →
              </Text>
            </View>
          </SpringPressable>
        </StaggerCascadeItem>
      </View>

      {/* Interactive Code Sandbox Launcher Banner */}
      <SpringPressable
        onPress={openPlayground}
        haptic="medium"
        sound="none"
        pressScale={0.98}
        accessibilityRole="button"
        style={styles.sandboxLauncherCard}
      >
        <View style={styles.sandboxLauncherLeft}>
          <View style={styles.bentoIconBox}>
            <Ionicons name="code-slash" size={20} color="#A78BFA" />
          </View>
          <View style={styles.sandboxLauncherCopy}>
            <View style={styles.sandboxLauncherTitleRow}>
              <Text style={styles.bentoTitle} numberOfLines={1}>
                Code Sandbox IDE
              </Text>
              <View style={styles.statusChipViolet}>
                <Text style={styles.bentoStatViolet}>
                  {LANGUAGES.length} LANGS
                </Text>
              </View>
            </View>
            <Text style={styles.bentoSub} numberOfLines={1}>
              Live syntax highlighter, cloud compiler &amp; Robot Copilot
            </Text>
          </View>
        </View>
        <View style={styles.sandboxLauncherPill}>
          <Text style={styles.bentoPillNeutralText}>Open IDE →</Text>
        </View>
      </SpringPressable>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <TabHeader
        title="Practice"
        titleSize={18}
        borderColor={HEADER_BORDER}
        rightElement={
          <CurrencyPillButton
            value={gems}
            onPress={() => {
              tapHaptic();
              playSound('drawer_open');
              setShopOpen(true);
            }}
            haptic="light"
            sound="none"
            accessibilityRole="button"
            accessibilityLabel={`Open Gem Shop. Balance ${gems} gems`}
            style={styles.headerGemPill}
          >
            {isXpBoostActive ? (
              <View style={styles.headerBoostBadge}>
                <Text style={styles.headerBoostText}>
                  {`2x · ${Math.max(1, Math.ceil(xpBoostRemainingSec / 60))}m`}
                </Text>
              </View>
            ) : null}
            <GemIcon size={15} />
            <Text style={styles.headerGemText}>{gems}</Text>
          </CurrencyPillButton>
        }
      />

      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: tabFadeAnim,
            transform: [{ translateY: tabSlideAnim }],
          },
        ]}
        contentContainerStyle={[styles.hub, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Banner Card ("Practice Arena") */}
        <SpringPressable
          onPress={openPlayground}
          haptic="light"
          sound="none"
          pressScale={0.985}
          accessibilityRole="button"
          style={styles.heroCard}
        >
          <HeroAmbientGlow intensity={1.05} />
          <PracticeHeroSyntaxGraphic />

          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="flash" size={23} color="#A78BFA" />
            </View>

            <View style={styles.heroCenter}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                Practice Arena
              </Text>

              <View style={styles.heroBadgePill}>
                <Ionicons name="flash" size={11} color="#C4B5FD" />
                <Text style={styles.heroBadgeText} numberOfLines={1}>
                  2x XP Daily Bonus · {activeLangMeta.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.heroFooterRow}>
            <View style={styles.heroProgressWrap}>
              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgressFill,
                    { width: `${Math.max(8, dailyProgressPct)}%` },
                  ]}
                >
                  <View style={styles.heroProgressShine} />
                </View>
              </View>
              <Text style={styles.heroProgressText}>
                {dailySessionsDone}/3 Daily Sessions
              </Text>
            </View>

            <View style={styles.heroIdeCtaPill}>
              <Text style={styles.heroIdeCtaText}>Open Live IDE →</Text>
            </View>
          </View>
        </SpringPressable>

        {/* 2. 3-Tab Segmented Control Bar */}
        <View style={styles.segmentTrack}>
          <View style={styles.segmentInner} onLayout={handleSegmentLayout}>
            {tabItemWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.segmentIndicator,
                  {
                    width: tabItemWidth,
                    transform: [{ translateX: indicatorTranslateX }],
                  },
                ]}
              />
            )}
            {(
              [
                { key: 'all', label: 'All Modes' },
                { key: 'campaigns', label: 'Campaigns' },
                { key: 'playground', label: 'Live IDE' },
              ] as const
            ).map((tab) => {
              const active = activeSegment === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleSegmentChange(tab.key)}
                  style={styles.segmentTab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.segmentTabText,
                      active && styles.segmentTabTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Dynamic Bento & Challenge Body */}
        <Animated.View
          style={[styles.modeSectionWrap, { opacity: modeFadeAnim }]}
        >
          {activeSegment === 'all' && (
            <>
              {/* Training Modes 2x2 Bento Grid + Sandbox Launcher */}
              <Text style={[styles.sectionTitle, styles.sectionTitleBottom]}>
                Training Modes
              </Text>

              {renderCampaignBentoGrid()}

              {renderTripleAExpansionCards()}

              {renderGuidedProjectsSection()}

              {/* Quick Challenges Dense List */}
              {renderQuickChallenges()}
            </>
          )}

          {activeSegment === 'campaigns' && (
            <>
              <View style={styles.challengesHeader}>
                <Text style={[styles.sectionTitle, styles.sectionTitleBottom]}>
                  30-Level PCB Campaigns
                </Text>
                <View style={styles.statusBadgePill}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={11}
                    color="#A78BFA"
                  />
                  <Text style={styles.statusBadgeText}>
                    ★ {bugStars + sprintStars + gitStars + mazeStars}/360 STARS
                  </Text>
                </View>
              </View>

              {renderCampaignBentoGrid()}

              {renderTripleAExpansionCards()}
            </>
          )}

          {activeSegment === 'playground' && (
            <>
              <View style={styles.focusedCard}>
                <View style={styles.bentoTopRow}>
                  <View style={styles.bentoIconBox}>
                    <Ionicons name="code-slash" size={20} color="#A78BFA" />
                  </View>
                  <View style={styles.statusBadgePill}>
                    <Ionicons name="terminal" size={11} color="#C4B5FD" />
                    <Text style={styles.statusBadgeText}>
                      {LANGUAGES.length} LANGUAGES · {executions} RUNS
                    </Text>
                  </View>
                </View>

                <Text style={styles.focusedTitle}>Interactive Code IDE</Text>
                <Text style={styles.focusedSub}>
                  Write, compile, and run arbitrary code across all{' '}
                  {LANGUAGES.length} languages with live cloud compilers,
                  inline diff patches, and Robot Copilot assistance.
                </Text>

                <View style={styles.focusedActionsRow}>
                  <SpringPressable
                    onPress={openPlayground}
                    haptic="medium"
                    sound="none"
                    pressScale={0.98}
                    accessibilityRole="button"
                    style={[styles.focusedPrimaryBtn, styles.focusedBtnFlex]}
                  >
                    <Ionicons name="play" size={14} color="#FFFFFF" />
                    <Text style={styles.focusedPrimaryBtnText}>Open IDE →</Text>
                  </SpringPressable>

                  <SpringPressable
                    onPress={openNewPlayground}
                    haptic="selection"
                    sound="none"
                    pressScale={0.98}
                    accessibilityRole="button"
                    style={styles.focusedSecondaryBtn}
                  >
                    <Text style={styles.focusedSecondaryBtnText}>
                      + Next Template
                    </Text>
                  </SpringPressable>
                </View>
              </View>

              {renderGuidedProjectsSection()}

              {renderQuickChallenges()}
            </>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* Full-screen practice modals with fluid slide-up + backdrop fade */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlayRoot}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.modalBackdropOverlay,
              { opacity: modalBackdropOpacity },
            ]}
          />

          <Animated.View
            style={[
              styles.modalScreen,
              { transform: [{ translateY: modalTranslateY }] },
            ]}
          >
            {activeModal === 'playground' ? (
              <InteractiveIdeView
                key={`${playgroundLang}-${snippetIndex}-${ideLoadMode}-${activeProject?.id ?? 'free'}-${ideSessionKey}`}
                initialLang={playgroundLang}
                initialSnippetIndex={snippetIndex}
                initialMode={ideLoadMode}
                activeProject={activeProject}
                topInset={insets.top}
                bottomInset={insets.bottom}
                onClose={closeModal}
                onExecutionRecorded={recordExecution}
              />
            ) : activeModal === 'campaign' ? (
              <View
                style={[styles.campaignModalRoot, { paddingTop: insets.top }]}
              >
                {campaignView === 'map' ? (
                  <CampaignMapModal
                    campaignKind={activeCampaignKind}
                    lang={campaignLang}
                    onChangeLang={setCampaignLang}
                    progress={
                      activeCampaignKind === 'syntax_sprint'
                        ? syntaxSprintProgress
                        : bugCampaignProgress
                    }
                    gitProgress={gitSimProgress}
                    robotProgress={robotMazeProgress}
                    bottomInset={insets.bottom}
                    isRecoveryMode={
                      activeCampaignKind === 'bug_hunt' &&
                      Boolean(recoveryLessonId)
                    }
                    onBack={closeModal}
                    onSelectLevel={(lvlNum) => {
                      setSelectedCampaignLevel(lvlNum);
                      setCampaignView('play');
                    }}
                  />
                ) : activeCampaignKind === 'bug_hunt' ? (
                  <BlitzArena
                    lang={campaignLang}
                    level={activeCampaignLevel}
                    previousBestTimeMs={
                      bugCampaignProgress[campaignLang]?.[
                        activeCampaignLevel.levelNumber
                      ]?.bestTimeMs
                    }
                    hasNextLevel={
                      activeCampaignLevel.levelNumber <
                      BUG_CAMPAIGN_TOTAL_LEVELS
                    }
                    isRecoveryMode={Boolean(recoveryLessonId)}
                    bottomInset={insets.bottom}
                    onBackToMap={() => setCampaignView('map')}
                    onCompleteLevel={handleCompleteCampaignLevel}
                    onNextLevel={() => {
                      setSelectedCampaignLevel((n) =>
                        Math.min(BUG_CAMPAIGN_TOTAL_LEVELS, n + 1),
                      );
                    }}
                    onReturnToLesson={
                      recoveryLessonId
                        ? handleReturnToLessonFromBlitz
                        : undefined
                    }
                  />
                ) : activeCampaignKind === 'syntax_sprint' ? (
                  <SyntaxSprintArena
                    lang={campaignLang}
                    level={activeSprintLevel}
                    hasNextLevel={
                      activeSprintLevel.levelNumber < SYNTAX_SPRINT_TOTAL_LEVELS
                    }
                    bottomInset={insets.bottom}
                    onBackToMap={() => setCampaignView('map')}
                    onCompleteLevel={handleCompleteSyntaxSprintLevel}
                    onNextLevel={() => {
                      setSelectedCampaignLevel((n) =>
                        Math.min(SYNTAX_SPRINT_TOTAL_LEVELS, n + 1),
                      );
                    }}
                  />
                ) : activeCampaignKind === 'git_sim' ? (
                  <GitSimulatorArena
                    level={activeGitLevel}
                    hasNextLevel={
                      activeGitLevel.levelNumber < GIT_CAMPAIGN_TOTAL_LEVELS
                    }
                    bottomInset={insets.bottom}
                    onBackToMap={() => setCampaignView('map')}
                    onCompleteLevel={handleCompleteGitSimLevel}
                    onNextLevel={() => {
                      setSelectedCampaignLevel((n) =>
                        Math.min(GIT_CAMPAIGN_TOTAL_LEVELS, n + 1),
                      );
                    }}
                  />
                ) : (
                  <RobotMazeArena
                    level={activeMazeLevel}
                    hasNextLevel={
                      activeMazeLevel.levelNumber < ROBOT_MAZE_TOTAL_LEVELS
                    }
                    bottomInset={insets.bottom}
                    onBackToMap={() => setCampaignView('map')}
                    onCompleteLevel={handleCompleteRobotMazeLevel}
                    onNextLevel={() => {
                      setSelectedCampaignLevel((n) =>
                        Math.min(ROBOT_MAZE_TOTAL_LEVELS, n + 1),
                      );
                    }}
                  />
                )}
              </View>
            ) : null}
          </Animated.View>
        </View>
      </Modal>

      <GemShopModal visible={shopOpen} onClose={() => setShopOpen(false)} />
      <MistakeVaultModal
        visible={mistakeVaultOpen}
        onClose={() => setMistakeVaultOpen(false)}
      />
      <CodeDuelArena
        visible={duelArenaOpen}
        language={activeLang}
        onClose={() => setDuelArenaOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },

  /* Hub Layout -------------------------------------------------------- */
  scrollView: {
    flex: 1,
  },
  hub: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* Hero Banner Card ("Practice Arena") ------------------------------- */
  heroCard: {
    width: '100%',
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: {
    flex: 1,
    marginLeft: 13,
  },
  heroTitle: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.35,
    marginBottom: 5,
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  heroBadgeText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#DDD6FE',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    zIndex: 3,
    gap: 12,
  },
  heroProgressWrap: {
    flex: 1,
  },
  heroProgressTrack: {
    width: '100%',
    maxWidth: 148,
    height: 11,
    borderRadius: 999,
    backgroundColor: '#1F1D30',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
  },
  heroProgressShine: {
    height: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    marginTop: 2.5,
    marginHorizontal: 5,
  },
  heroProgressText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: -0.2,
    marginTop: 5,
    fontVariant: ['tabular-nums'],
  },
  heroIdeCtaPill: {
    backgroundColor: '#7C5CFC',
    borderRadius: 999,
    borderBottomWidth: 3,
    borderBottomColor: '#5639D6',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroIdeCtaText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroGraphicWrap: {
    position: 'absolute',
    right: 12,
    top: 16,
    width: 92,
    gap: 6.5,
    alignItems: 'flex-end',
    opacity: 0.22,
    zIndex: 1,
  },
  heroGraphicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  heroSyntaxBar: {
    height: 5.5,
    borderRadius: 3,
  },

  /* 3-Tab Segmented Control ------------------------------------------- */
  segmentTrack: {
    width: '100%',
    marginTop: 14,
    marginBottom: 16,
    backgroundColor: '#151421',
    borderRadius: 999,
    padding: 5,
    borderWidth: 1.5,
    borderColor: '#252338',
  },
  segmentInner: {
    flexDirection: 'row',
    position: 'relative',
    width: '100%',
  },
  segmentIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#7C5CFC',
    borderRadius: 999,
    borderBottomWidth: 2,
    borderBottomColor: '#5639D6',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: -0.1,
  },
  segmentTabTextActive: {
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Bento Section & 2x2 Grid Cards ------------------------------------ */
  modeSectionWrap: {
    width: '100%',
  },
  sectionTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  sectionTitleBottom: {
    marginBottom: 12,
  },
  bentoGridWrap: {
    width: '100%',
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  bentoCellWrap: {
    flex: 1,
  },
  bentoCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 16,
    justifyContent: 'space-between',
  },
  bentoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  bentoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoBadgeStack: {
    alignItems: 'flex-end',
    gap: 4,
  },
  starPillGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
  },
  statusChipViolet: {
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  bentoStarGold: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  bentoLevelPill: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
    paddingRight: 2,
  },
  bentoStatViolet: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DDD6FE',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  bentoCopy: {
    marginTop: 12,
    marginBottom: 13,
  },
  bentoTitle: {
    fontFamily: UI_FONT,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.25,
  },
  bentoSub: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2.5,
  },
  bentoPillPrimary: {
    height: 38,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 3,
    borderBottomColor: '#5639D6',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoPillPrimaryText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bentoPillSecondary: {
    height: 38,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoPillSecondaryText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  bentoPillNeutralText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sandboxLauncherCard: {
    width: '100%',
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sandboxLauncherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sandboxLauncherCopy: {
    flex: 1,
  },
  sandboxLauncherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sandboxLauncherPill: {
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  /* Quick Challenges & Guided Projects Capsule Cards ------------------- */
  challengesSection: {
    width: '100%',
    marginTop: 20,
  },
  challengesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#252338',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.4,
  },
  challengesList: {
    width: '100%',
  },
  challengeRow: {
    backgroundColor: '#151421',
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#252338',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  challengeIndex: {
    width: 22,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
    color: '#7C5CFC',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  challengeLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  challengeMeta: {
    flex: 1,
  },
  challengeTitle: {
    fontFamily: UI_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.15,
  },
  challengeSub: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1.5,
  },
  challengeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeXpPill: {
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  challengeXp: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },

  /* Focused Segment Card ("Live IDE") --------------------------------- */
  focusedCard: {
    width: '100%',
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    padding: 18,
  },
  focusedTitle: {
    fontFamily: UI_FONT,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 12,
  },
  focusedSub: {
    fontFamily: UI_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
    marginTop: 5,
    marginBottom: 16,
  },
  focusedActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  focusedPrimaryBtn: {
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 3,
    borderBottomColor: '#5639D6',
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  focusedBtnFlex: {
    flex: 1,
  },
  focusedPrimaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  focusedSecondaryBtn: {
    backgroundColor: '#1E1C2E',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedSecondaryBtnText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },

  /* Modal shell ------------------------------------------------------- */
  modalOverlayRoot: {
    flex: 1,
  },
  modalBackdropOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalScreen: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  campaignModalRoot: {
    flex: 1,
    backgroundColor: '#0B0A12',
  },
  headerGemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
  },
  headerGemText: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  headerBoostBadge: {
    backgroundColor: 'rgba(124, 92, 252, 0.24)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 2,
  },
  headerBoostText: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  bentoPillAmberText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FCD34D',
  },
  projectBuiltBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.40)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  projectBuiltBadgeText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
});
