import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href, router, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, UI_FONT, MONO } from '@/theme';
import { LANGUAGES, LangId } from '@/data/courses';
import {
  AvatarThemeId,
  DailyActivityBreakdown,
  formatLocalDateKey,
  getLeagueProgress,
  LEAGUE_TIERS,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_COST,
  useGame,
} from '@/store/GameStore';
import { TabHeader } from '@/components/TabHeader';
import { LanguageLogo } from '@/components/LanguageLogo';
import { SpringPressable } from '@/components/CyberButton';
import { HeroAmbientGlow, CarbonSpinnerDots } from '@/components/ui/AmbientSurface';
import {
  errorHaptic,
  selectionHaptic,
  successHaptic,
  tapHaptic,
} from '@/utils/haptics';
import { playSound } from '@/utils/sounds';
import { GemIcon } from '@/components/ui/CurrencyIcons';
import { CurrencyPillButton } from '@/components/ui/CurrencyPillButton';
import { StaggerCascadeItem } from '@/components/ui/StaggerCascadeItem';
import { GemShopModal } from '@/components/shop/GemShopModal';
import { AccountAuthModal } from '@/components/auth/AccountAuthModal';
import { LegalDocKind, LegalReaderModal } from '@/components/legal/LegalReaderModal';
import { requestNotificationPermissions } from '@/services/notifications';
import { GUIDED_PROJECTS } from '@/data/guidedProjects';

// Expo SDK 58 Windows typed-routes omits `/` for `(tabs)/index`; runtime requires `/`.
const LEARN_ROUTE = '/' as unknown as Href;

const HEADER_BORDER = 'rgba(255, 255, 255, 0.07)';
const LEVEL_XP = 500;

const AVATAR_THEMES: {
  id: AvatarThemeId;
  label: string;
  ring: string;
  bg: string;
  bar: string;
}[] = [
  { id: 'violet', label: 'Violet', ring: '#7C5CFC', bg: '#191826', bar: '#A78BFA' },
  { id: 'emerald', label: 'Emerald', ring: '#10B981', bg: '#0E1F1A', bar: '#34D399' },
  { id: 'sky', label: 'Sky', ring: '#38BDF8', bg: '#0F1B26', bar: '#7DD3FC' },
  { id: 'amber', label: 'Amber', ring: '#F59E0B', bg: '#211A0E', bar: '#FBBF24' },
];

type ProfileModalKind =
  | 'edit'
  | 'streak'
  | 'league'
  | 'mastery'
  | 'stats'
  | 'privacy'
  | 'about'
  | 'reset'
  | null;

interface HeatmapCellData {
  dateKey: string;
  dateLabel: string;
  weekdayShort: string;
  count: number;
  level: 0 | 1 | 2 | 3;
  breakdown: DailyActivityBreakdown;
  isToday: boolean;
  isFrozen: boolean;
}

function getMasteryRank(pct: number, done: number): string {
  if (done <= 0) return 'Unstarted';
  if (pct >= 100) return 'Master';
  if (pct >= 75) return 'Specialist';
  if (pct >= 45) return 'Builder';
  if (pct >= 15) return 'Apprentice';
  return 'Starter';
}

function formatDateShort(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function buildHeatmapColumns(
  activityHistory: Record<string, number>,
  activityBreakdown: Record<string, DailyActivityBreakdown>,
  lastStreakFreezeDate: string | null,
): HeatmapCellData[][] {
  const now = new Date();
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cols: HeatmapCellData[][] = [];

  for (let colIdx = 0; colIdx < 12; colIdx++) {
    const col: HeatmapCellData[] = [];
    for (let rowIdx = 0; rowIdx < 4; rowIdx++) {
      const slot = colIdx * 4 + rowIdx; // 0 = oldest (47 days ago), 47 = today
      const daysAgo = 47 - slot;
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
      const dateKey = formatLocalDateKey(d);
      const count = activityHistory[dateKey] ?? 0;
      const rawBreakdown = activityBreakdown[dateKey] ?? {
        lessons: 0,
        blitz: 0,
        runs: 0,
      };
      const breakdownSum =
        rawBreakdown.lessons + rawBreakdown.blitz + rawBreakdown.runs;
      const breakdown: DailyActivityBreakdown =
        count > 0 && breakdownSum === 0
          ? { lessons: count, blitz: 0, runs: 0 }
          : rawBreakdown;
      const level: 0 | 1 | 2 | 3 =
        count >= 4 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;

      col.push({
        dateKey,
        dateLabel: daysAgo === 0 ? 'Today' : formatDateShort(d),
        weekdayShort: weekdays[d.getDay()],
        count,
        level,
        breakdown,
        isToday: daysAgo === 0,
        isFrozen: lastStreakFreezeDate === dateKey && count === 0,
      });
    }
    cols.push(col);
  }

  return cols;
}

/* ------------------------------------------------------------------ */
/*  Hero Right Abstract Syntax Graphic (Matches Practice Tab Style)   */
/* ------------------------------------------------------------------ */

interface TokenSegment {
  w: number;
  bg: string;
}

const HERO_SYNTAX_ROWS: TokenSegment[][] = [
  [
    { w: 22, bg: '#27273A' },
    { w: 44, bg: '#7C5CFC' },
  ],
  [
    { w: 56, bg: '#A78BFA' },
  ],
  [
    { w: 30, bg: '#7C5CFC' },
    { w: 42, bg: '#27273A' },
  ],
  [
    { w: 68, bg: '#7C5CFC' },
  ],
  [
    { w: 26, bg: '#27273A' },
    { w: 48, bg: '#A78BFA' },
  ],
];

function HeroSyntaxGraphic() {
  return (
    <View style={styles.heroGraphicWrap} pointerEvents="none">
      {HERO_SYNTAX_ROWS.map((row, rIdx) => (
        <View key={rIdx} style={styles.heroGraphicRow}>
          {row.map((seg, sIdx) => (
            <View
              key={sIdx}
              style={[
                styles.heroTokenBar,
                { width: seg.w, backgroundColor: seg.bg },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  12x4 GitHub-Style Contribution Heatmap                            */
/* ------------------------------------------------------------------ */

// 0 = #1A1A26 (empty), 1 = #3B2870 (low), 2 = #6D28D9 (medium), 3 = #A78BFA (high)
const HEATMAP_LEVELS = ['#1A1A26', '#3B2870', '#6D28D9', '#A78BFA'] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    userId,
    xp,
    weeklyXp,
    streak,
    bestStreak,
    streakFreezes,
    lastStreakFreezeDate,
    gems,
    league,
    username,
    handle,
    avatarTheme,
    activeLang,
    bugsCrushed,
    blitzBest,
    executions,
    completedProjects,
    duelsWon,
    duelsPlayed,
    totalAnswers,
    correctAnswers,
    bestCombo,
    completedNodes,
    nodeAccuracies,
    activityHistory,
    activityBreakdown,
    liveLeaderboard,
    hapticsEnabled,
    soundEnabled,
    dailyReminderEnabled,
    cloudConfigured,
    pendingSync,
    lastSyncedAt,
    isGuest,
    authProvider,
    authEmail,
    setActiveLang,
    buyStreakFreeze,
    updateProfile,
    setPreferences,
    syncNow,
    signOutAccount,
    deleteAccountAndResetData,
    resetProgress,
  } = useGame();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind | null>(null);
  const [activeModal, setActiveModal] = useState<ProfileModalKind>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [selectedHeatDate, setSelectedHeatDate] = useState<string | null>(null);
  const [masteryLangId, setMasteryLangId] = useState<LangId>(activeLang);
  const [freezeFeedback, setFreezeFeedback] = useState<string | null>(null);

  // Edit Profile form state
  const [draftName, setDraftName] = useState(username);
  const [draftHandle, setDraftHandle] = useState(handle);
  const [draftTheme, setDraftTheme] = useState<AvatarThemeId>(avatarTheme);
  const [draftLang, setDraftLang] = useState<LangId>(activeLang);
  const [editError, setEditError] = useState<string | null>(null);

  // Cloud Sync button state
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal animations (shared smooth fade + scale + Settings bottom sheet)
  const screenHeight = Dimensions.get('window').height;
  const settingsBackdropOpacity = useRef(new Animated.Value(0)).current;
  const settingsTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.92)).current;

  const openModal = (kind: Exclude<ProfileModalKind, null>) => {
    playSound('drawer_open');
    if (kind === 'edit') {
      setDraftName(username);
      setDraftHandle(handle);
      setDraftTheme(avatarTheme);
      setDraftLang(activeLang);
      setEditError(null);
    }
    if (kind === 'privacy') {
      setSyncMessage(null);
    }
    if (kind === 'streak') {
      setFreezeFeedback(null);
    }
    setActiveModal(kind);
    modalOpacity.stopAnimation();
    modalScale.stopAnimation();
    modalOpacity.setValue(0);
    modalScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = (afterClose?: () => void, silent = false) => {
    if (!silent) playSound('drawer_close');
    modalOpacity.stopAnimation();
    modalScale.stopAnimation();
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.92,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveModal(null);
      afterClose?.();
    });
  };

  const openSettings = () => {
    selectionHaptic();
    playSound('drawer_open');
    setSettingsOpen(true);
    settingsBackdropOpacity.stopAnimation();
    settingsTranslateY.stopAnimation();
    settingsBackdropOpacity.setValue(0);
    settingsTranslateY.setValue(screenHeight);
    Animated.parallel([
      Animated.timing(settingsBackdropOpacity, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(settingsTranslateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSettings = (afterClose?: () => void, silent = false) => {
    tapHaptic();
    if (!silent) playSound('drawer_close');
    settingsBackdropOpacity.stopAnimation();
    settingsTranslateY.stopAnimation();
    Animated.parallel([
      Animated.timing(settingsBackdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(settingsTranslateY, {
        toValue: screenHeight,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSettingsOpen(false);
      afterClose?.();
    });
  };

  const closeSettingsRef = useRef(closeSettings);
  useEffect(() => {
    closeSettingsRef.current = closeSettings;
  });

  const settingsPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.15,
        onPanResponderMove: (_, gs) => {
          const dy = Math.max(0, gs.dy);
          settingsTranslateY.setValue(dy);
          settingsBackdropOpacity.setValue(Math.max(0, 1 - dy / 340));
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > 90 || gs.vy > 0.55) {
            tapHaptic();
            closeSettingsRef.current();
            return;
          }
          Animated.parallel([
            Animated.spring(settingsTranslateY, {
              toValue: 0,
              damping: 30,
              stiffness: 340,
              mass: 0.8,
              overshootClamping: true,
              useNativeDriver: true,
            }),
            Animated.timing(settingsBackdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(settingsTranslateY, {
              toValue: 0,
              damping: 30,
              stiffness: 340,
              mass: 0.8,
              overshootClamping: true,
              useNativeDriver: true,
            }),
            Animated.timing(settingsBackdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [settingsBackdropOpacity, settingsTranslateY],
  );

  const toggleHaptics = (value: boolean) => {
    setPreferences({ hapticsEnabled: value });
    if (value) tapHaptic();
    playSound(value ? 'switch_on' : 'switch_off');
  };

  const toggleSounds = (value: boolean) => {
    tapHaptic();
    setPreferences({ soundEnabled: value });
    if (value) {
      playSound('switch_on');
    }
  };

  const toggleReminders = async (value: boolean) => {
    tapHaptic();
    if (!value) {
      playSound('switch_off');
      setPreferences({ dailyReminderEnabled: false });
      return;
    }

    const granted = await requestNotificationPermissions();
    if (!granted) {
      errorHaptic();
      playSound('wrong');
      setPreferences({ dailyReminderEnabled: false });
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications for Codelingo in system settings to get daily 19:30 streak reminders and 5/5 heart alerts.',
      );
      return;
    }

    successHaptic();
    playSound('switch_on');
    setPreferences({ dailyReminderEnabled: true });
  };

  const handleSignOut = () => {
    tapHaptic();
    Alert.alert(
      'Sign Out?',
      'Your local progress will remain saved on this device in Guest Mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'default',
          onPress: async () => {
            await signOutAccount();
            successHaptic();
            playSound('switch_off');
          },
        },
      ],
    );
  };

  const handleDeleteAccountFlow = () => {
    if (deletingAccount) return;
    tapHaptic();
    closeSettings(() => {
      Alert.alert(
        'Delete Account & Reset Data?',
        'This permanently deletes all local XP, streaks, completed lessons, unlocked Robo skins, and linked cloud records.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Final Confirmation',
                'Are you absolutely sure? All local and cloud account data will be permanently erased and cannot be recovered.',
                [
                  { text: 'Keep Account', style: 'cancel' },
                  {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                      setDeletingAccount(true);
                      errorHaptic();
                      playSound('heart_lost');
                      await deleteAccountAndResetData();
                      setDeletingAccount(false);
                    },
                  },
                ],
              );
            },
          },
        ],
      );
    }, true);
  };

  const handleSaveProfile = () => {
    const cleanName = draftName.trim();
    if (cleanName.length < 2) {
      errorHaptic();
      playSound('wrong');
      setEditError('Display name must be at least 2 characters.');
      return;
    }
    const cleanHandle = draftHandle.trim().replace(/^@+/, '') || 'coder';
    successHaptic();
    playSound('correct');
    updateProfile({
      username: cleanName,
      handle: `@${cleanHandle}`,
      avatarTheme: draftTheme,
      activeLang: draftLang,
    });
    closeModal(undefined, true);
  };

  const handleManualSync = async () => {
    if (syncBusy) return;
    tapHaptic();
    playSound('tap');
    setSyncBusy(true);
    setSyncMessage(null);
    const result = await syncNow();
    setSyncBusy(false);
    if (result.synced) {
      successHaptic();
      playSound('run_success');
      setSyncMessage('Profile & progress synced to Supabase Cloud.');
    } else {
      tapHaptic();
      playSound('select');
      setSyncMessage(
        result.error ?? 'Saved locally (cloud sync not configured).',
      );
    }
  };

  const handleConfirmReset = () => {
    errorHaptic();
    playSound('heart_lost');
    resetProgress();
    closeModal(undefined, true);
  };

  const handleBuyFreeze = () => {
    if (streakFreezes >= MAX_STREAK_FREEZES) {
      errorHaptic();
      setFreezeFeedback(`Max ${MAX_STREAK_FREEZES} Streak Freezes equipped.`);
      return;
    }
    if (gems < STREAK_FREEZE_COST) {
      errorHaptic();
      playSound('wrong');
      setFreezeFeedback(`Need ${STREAK_FREEZE_COST - gems} more gems.`);
      return;
    }
    const ok = buyStreakFreeze();
    if (ok) {
      successHaptic();
      playSound('coin');
      setFreezeFeedback('Streak Freeze equipped.');
    }
  };

  // Compute real curriculum mastery percentages per language
  const getCourseStats = (langId: LangId) => {
    const course = LANGUAGES.find((l) => l.id === langId);
    if (!course) {
      return {
        done: 0,
        total: 0,
        pct: 0,
        avgAccuracy: null as number | null,
        rank: 'Unstarted',
        unitBreakdown: [] as {
          id: string;
          title: string;
          done: number;
          total: number;
          pct: number;
        }[],
      };
    }
    const doneSet = new Set(completedNodes[langId] ?? []);
    const total = course.units.reduce(
      (sum, unit) => sum + unit.nodes.length,
      0,
    );
    const unitBreakdown = course.units.map((unit) => {
      const unitDone = unit.nodes.filter((node) => doneSet.has(node.id)).length;
      const unitTotal = unit.nodes.length;
      return {
        id: unit.id,
        title: unit.title,
        done: unitDone,
        total: unitTotal,
        pct:
          unitTotal > 0 ? Math.min(100, Math.round((unitDone / unitTotal) * 100)) : 0,
      };
    });
    const done = unitBreakdown.reduce((sum, u) => sum + u.done, 0);
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const accSamples = course.units
      .flatMap((unit) => unit.nodes)
      .filter(
        (node) =>
          doneSet.has(node.id) && typeof nodeAccuracies[node.id] === 'number',
      )
      .map((node) => nodeAccuracies[node.id]);
    const avgAccuracy =
      accSamples.length > 0
        ? Math.round(accSamples.reduce((a, b) => a + b, 0) / accSamples.length)
        : null;
    return {
      done,
      total,
      pct,
      avgAccuracy,
      rank: getMasteryRank(pct, done),
      unitBreakdown,
    };
  };

  const totalCurriculumNodes = LANGUAGES.reduce(
    (sum, lang) =>
      sum + lang.units.reduce((uSum, unit) => uSum + unit.nodes.length, 0),
    0,
  );

  const heatmapCols = buildHeatmapColumns(
    activityHistory,
    activityBreakdown,
    lastStreakFreezeDate,
  );
  const allCells = heatmapCols.flat();
  const activeDaysCount = allCells.filter((cell) => cell.count > 0).length;
  const totalRecentActions = allCells.reduce(
    (sum, cell) => sum + cell.count,
    0,
  );
  const todayKey = formatLocalDateKey();
  const nowDate = new Date();
  const yesterdayKey = formatLocalDateKey(
    new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 1),
  );
  const codedTodayCount = activityHistory[todayKey] ?? 0;
  const savedByFreezeYesterday =
    lastStreakFreezeDate === yesterdayKey && codedTodayCount === 0 && streak > 0;
  const streakWeekCells = allCells.slice(-7);
  const todayCell = allCells[allCells.length - 1] ?? null;
  const selectedCell =
    selectedHeatDate !== null
      ? allCells.find((cell) => cell.dateKey === selectedHeatDate) ?? null
      : null;
  const focusCell = selectedCell ?? todayCell;

  const leagueInfo = getLeagueProgress(xp);
  const sortedBoard = [...liveLeaderboard].sort((a, b) => b.xp - a.xp);
  const myRank = Math.max(
    1,
    sortedBoard.findIndex((entry) => entry.isUser) + 1,
  );
  const totalCompetitors = Math.max(1, sortedBoard.length);

  const courseStatsList = LANGUAGES.map((course) => ({
    course,
    stats: getCourseStats(course.id),
  }));
  const startedCoursesCount = courseStatsList.filter(
    (item) => item.stats.done > 0 || item.course.id === activeLang,
  ).length;
  const sortedCourses = [...courseStatsList].sort((a, b) => {
    if (a.course.id === activeLang) return -1;
    if (b.course.id === activeLang) return 1;
    if (b.stats.pct !== a.stats.pct) return b.stats.pct - a.stats.pct;
    return b.stats.done - a.stats.done;
  });
  const masteryCourseItem =
    courseStatsList.find((item) => item.course.id === masteryLangId) ??
    courseStatsList[0];

  const level = Math.floor(xp / LEVEL_XP) + 1;
  const xpIntoLevel = xp % LEVEL_XP;
  const levelPct = Math.min(100, Math.round((xpIntoLevel / LEVEL_XP) * 100));
  const accuracyPct =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
  const avatarInitials = username.slice(0, 2).toUpperCase();
  const activeThemeSpec =
    AVATAR_THEMES.find((t) => t.id === avatarTheme) ?? AVATAR_THEMES[0];

  const bottomPadding = Math.max(120, insets.bottom + 88);
  const [focusCycle, setFocusCycle] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const raf = requestAnimationFrame(() => {
        setFocusCycle((c) => c + 1);
      });
      return () => cancelAnimationFrame(raf);
    }, []),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* 1. TOP HEADER BAR (Centered "Profile" + Right Settings Icon) */}
      <TabHeader
        title="Profile"
        titleSize={18}
        borderColor={HEADER_BORDER}
        rightElement={
          <View style={styles.headerRightRow}>
            <CurrencyPillButton
              value={gems}
              onPress={() => {
                tapHaptic();
                playSound('drawer_open');
                setShopOpen(true);
              }}
              haptic="selection"
              sound="none"
              accessibilityRole="button"
              accessibilityLabel={`Open Gem Shop. Balance ${gems} gems`}
              style={styles.headerGemBtn}
            >
              <GemIcon size={14} />
              <Text style={styles.headerGemText}>{gems}</Text>
            </CurrencyPillButton>

            <SpringPressable
              onPress={openSettings}
              hitSlop={10}
              haptic="selection"
              sound="none"
              pressScale={0.94}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={styles.settingsBtn}
            >
              <Ionicons name="settings-outline" size={20} color="#94A3B8" />
            </SpringPressable>
          </View>
        }
      />

      {/* 2. SCROLLABLE BENTO LAYOUT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
      >
        {/* SECTION 1: Developer Identity Hero Card */}
        <SpringPressable
          onPress={() => openModal('edit')}
          haptic="selection"
          sound="none"
          pressScale={0.985}
          style={styles.heroCard}
        >
          <HeroAmbientGlow
            accentColor={activeThemeSpec.ring}
            secondaryColor={activeThemeSpec.bar}
            intensity={1}
          />
          {/* Left Avatar Badge */}
          <View
            style={[
              styles.avatarBadge,
              {
                backgroundColor: activeThemeSpec.bg,
                borderColor: activeThemeSpec.ring,
              },
            ]}
          >
            <View
              style={[
                styles.miniTerminalAvatar,
                { borderColor: `${activeThemeSpec.bar}50` },
              ]}
            >
              <View style={styles.miniTerminalDots}>
                <View style={[styles.miniDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.avatarInitials}>{avatarInitials}</Text>
            </View>
          </View>

          {/* Center User Info */}
          <View style={styles.userInfo}>
            <View style={styles.heroTopNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {username}
              </Text>
              <View style={styles.editHintPill}>
                <Feather name="edit-2" size={10} color="#C4B5FD" />
                <Text style={styles.editHintText}>Edit</Text>
              </View>
            </View>

            <Text style={styles.userHandle} numberOfLines={1}>
              {handle}
            </Text>

            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>
                {`LVL ${level} • ${league.toUpperCase()}`}
              </Text>
            </View>

            <View style={styles.heroXpTrackWrap}>
              <View style={styles.heroXpTrack}>
                <View
                  style={[
                    styles.heroXpFill,
                    {
                      width: `${Math.max(6, levelPct)}%`,
                      backgroundColor: activeThemeSpec.ring,
                    },
                  ]}
                >
                  <View style={styles.heroXpShine} />
                </View>
              </View>
              <Text style={styles.heroXpCaption}>
                {`${xpIntoLevel}/${LEVEL_XP} XP`}
              </Text>
            </View>
          </View>

          {/* Right Contemporary Abstract Graphic */}
          <HeroSyntaxGraphic />
        </SpringPressable>

        {/* SECTION 1B: Guest Mode "Save Your Progress" Banner / Cloud Status */}
        {isGuest ? (
          <SpringPressable
            onPress={() => {
              tapHaptic();
              playSound('drawer_open');
              setAuthModalOpen(true);
            }}
            haptic="medium"
            sound="none"
            pressScale={0.985}
            style={styles.saveProgressBanner}
          >
            <View style={styles.saveProgressIconBox}>
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color="#C4B5FD"
              />
            </View>
            <View style={styles.saveProgressCopy}>
              <Text style={styles.saveProgressTitle}>Save Your Progress</Text>
              <Text style={styles.saveProgressSub}>
                Guest Mode · Link Email or Apple ID to protect your XP &amp; streak
              </Text>
            </View>
            <View style={styles.saveProgressActionPill}>
              <Text style={styles.saveProgressActionText}>Link</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </SpringPressable>
        ) : (
          <View style={styles.cloudLinkedBanner}>
            <View style={styles.cloudLinkedIconBox}>
              <Ionicons
                name={authProvider === 'apple' ? 'logo-apple' : 'shield-checkmark'}
                size={16}
                color="#34D399"
              />
            </View>
            <View style={styles.saveProgressCopy}>
              <Text style={styles.cloudLinkedTitle}>
                {authProvider === 'apple'
                  ? 'Apple ID Linked'
                  : 'Cloud Account Synced'}
              </Text>
              <Text style={styles.saveProgressSub} numberOfLines={1}>
                {authEmail ?? 'Progress backed up to Supabase Cloud'}
              </Text>
            </View>
            <SpringPressable
              onPress={handleSignOut}
              haptic="light"
              sound="none"
              pressScale={0.96}
              style={styles.signOutPill}
            >
              <Text style={styles.signOutPillText}>Sign Out</Text>
            </SpringPressable>
          </View>
        )}

        {/* SECTION 2: "Overview" — 2x2 Bento Metrics Grid */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.metricsGrid}>
            {/* Card 1: Day Streak */}
            <StaggerCascadeItem
              index={0}
              triggerKey={focusCycle}
              style={styles.metricCellWrap}
            >
              <SpringPressable
                onPress={() => openModal('streak')}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={styles.metricCard}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    savedByFreezeYesterday && {
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={savedByFreezeYesterday ? 'snow' : 'flame'}
                    size={20}
                    color={
                      savedByFreezeYesterday
                        ? '#38BDF8'
                        : codedTodayCount > 0 || streak > 0
                          ? '#F97316'
                          : '#71717A'
                    }
                  />
                </View>
                <View style={styles.metricTextCol}>
                  <View style={styles.metricTopRow}>
                    <Text style={styles.metricValue} numberOfLines={1}>
                      {streak}
                    </Text>
                    <Text
                      style={[
                        styles.metricStatusTag,
                        {
                          color:
                            codedTodayCount > 0
                              ? '#34D399'
                              : savedByFreezeYesterday
                                ? '#38BDF8'
                                : streak > 0
                                  ? '#FBBF24'
                                  : '#71717A',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {codedTodayCount > 0
                        ? 'TODAY'
                        : savedByFreezeYesterday
                          ? 'FROZEN'
                          : streak > 0
                            ? 'DUE'
                            : 'NEW'}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel} numberOfLines={1}>
                    {`Streak · Best ${bestStreak}d`}
                  </Text>
                </View>
              </SpringPressable>
            </StaggerCascadeItem>

            {/* Card 2: Total XP */}
            <StaggerCascadeItem
              index={1}
              triggerKey={focusCycle}
              style={styles.metricCellWrap}
            >
              <SpringPressable
                onPress={() => openModal('stats')}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={styles.metricCard}
              >
                <View style={styles.metricIconBox}>
                  <Ionicons name="flash" size={19} color="#A78BFA" />
                </View>
                <View style={styles.metricTextCol}>
                  <Text style={styles.metricValue} numberOfLines={1}>
                    {xp.toLocaleString()}
                  </Text>
                  <Text style={styles.metricLabel} numberOfLines={1}>
                    {`Lv ${level} · ${accuracyPct}% acc`}
                  </Text>
                </View>
              </SpringPressable>
            </StaggerCascadeItem>

            {/* Card 3: Current League */}
            <StaggerCascadeItem
              index={2}
              triggerKey={focusCycle}
              style={styles.metricCellWrap}
            >
              <SpringPressable
                onPress={() => openModal('league')}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={styles.metricCard}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: 'rgba(124, 92, 252, 0.14)' },
                  ]}
                >
                  <Ionicons
                    name="trophy"
                    size={18}
                    color={leagueInfo.currentTier.accent}
                  />
                </View>
                <View style={styles.metricTextCol}>
                  <View style={styles.metricTopRow}>
                    <Text style={styles.metricValueLeague} numberOfLines={1}>
                      {leagueInfo.currentTier.name}
                    </Text>
                    <Text style={styles.metricRankTag} numberOfLines={1}>
                      #{myRank}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel} numberOfLines={1}>
                    League
                  </Text>
                </View>
              </SpringPressable>
            </StaggerCascadeItem>

            {/* Card 4: Bugs Crushed & Duels */}
            <StaggerCascadeItem
              index={3}
              triggerKey={focusCycle}
              style={styles.metricCellWrap}
            >
              <SpringPressable
                onPress={() => router.navigate('/sandbox')}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={styles.metricCard}
              >
                <View style={styles.metricIconBox}>
                  <Ionicons name="bug" size={19} color="#EF4444" />
                </View>
                <View style={styles.metricTextCol}>
                  <View style={styles.metricTopRow}>
                    <Text style={styles.metricValue} numberOfLines={1}>
                      {bugsCrushed}
                    </Text>
                    <Text style={styles.metricRankTag} numberOfLines={1}>
                      {`${duelsWon}W`}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel} numberOfLines={1}>
                    {`Bugs · ${duelsWon} Duels`}
                  </Text>
                </View>
              </SpringPressable>
            </StaggerCascadeItem>
          </View>
        </View>

        {/* SECTION 2B: "Built Projects & Duels" Showcase */}
        <View style={styles.sectionBlock}>
          <View style={styles.projectsHeaderRow}>
            <Text style={styles.sectionTitle}>Built Projects</Text>
            <Text style={styles.projectsHeaderMeta}>
              {`${completedProjects.length}/${GUIDED_PROJECTS.length} BUILT · ${duelsWon}/${Math.max(duelsWon, duelsPlayed)} DUELS WON`}
            </Text>
          </View>

          <View style={styles.projectsList}>
            {GUIDED_PROJECTS.map((project) => {
              const built = completedProjects.includes(project.id);
              return (
                <SpringPressable
                  key={project.id}
                  onPress={() => {
                    tapHaptic();
                    playSound('select');
                    router.navigate('/sandbox');
                  }}
                  haptic="light"
                  sound="none"
                  pressScale={0.985}
                  style={styles.projectRow}
                >
                  <View style={styles.projectLogoBox}>
                    <LanguageLogo language={project.language} size={18} />
                  </View>
                  <View style={styles.projectCopy}>
                    <Text style={styles.projectRowTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.projectRowSub} numberOfLines={1}>
                      {`${project.difficulty} · ${project.steps.length} milestones`}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.projectStatusBadge,
                      built
                        ? styles.projectStatusBuilt
                        : styles.projectStatusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.projectStatusText,
                        built
                          ? styles.projectStatusTextBuilt
                          : styles.projectStatusTextPending,
                      ]}
                    >
                      {built ? 'BUILT ✓' : 'IN LAB →'}
                    </Text>
                  </View>
                </SpringPressable>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: "Activity & Mastery" — Live Heatmap + Interactive Language Progress */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Activity &amp; Mastery</Text>

          <View style={styles.activityCard}>
            {/* 1. Interactive 48-Day Contribution Diagram */}
            <View style={styles.heatmapSection}>
              <View style={styles.heatmapHeaderRow}>
                <Text style={styles.heatmapTitle}>Coding Consistency</Text>
                <Text style={styles.heatmapSubtitle} numberOfLines={1}>
                  {`${activeDaysCount}/48 days · ${totalRecentActions} actions`}
                </Text>
              </View>

              <View style={styles.heatmapGrid}>
                {heatmapCols.map((col, colIdx) => (
                  <View key={colIdx} style={styles.heatmapCol}>
                    {col.map((cell) => {
                      const isPicked = selectedHeatDate === cell.dateKey;
                      return (
                        <Pressable
                          key={cell.dateKey}
                          hitSlop={4}
                          accessibilityRole="button"
                          accessibilityLabel={`${cell.dateLabel}: ${cell.count} actions`}
                          onPress={() => {
                            tapHaptic();
                            playSound('tap');
                            setSelectedHeatDate((prev) =>
                              prev === cell.dateKey ? null : cell.dateKey,
                            );
                          }}
                          style={[
                            styles.heatmapCell,
                            { backgroundColor: HEATMAP_LEVELS[cell.level] },
                            cell.isToday &&
                              !isPicked &&
                              styles.heatmapCellToday,
                            cell.isFrozen &&
                              !isPicked &&
                              styles.heatmapCellFrozen,
                            isPicked && styles.heatmapCellSelected,
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>

              <View style={styles.heatmapLegendRow}>
                <Text style={styles.heatmapLegendText}>7w ago → Today</Text>
                <View style={styles.heatmapLegend}>
                  <Text style={styles.heatmapLegendText}>Less</Text>
                  {HEATMAP_LEVELS.map((bg, idx) => (
                    <View
                      key={idx}
                      style={[styles.heatmapLegendSwatch, { backgroundColor: bg }]}
                    />
                  ))}
                  <Text style={styles.heatmapLegendText}>More</Text>
                </View>
              </View>

              {focusCell ? (
                <View style={styles.heatmapInspectorBox}>
                  <View style={styles.heatmapInspectorTop}>
                    <Text style={styles.heatmapInspectorTitle} numberOfLines={1}>
                      {`${focusCell.isToday ? 'Today' : `${focusCell.weekdayShort} · ${focusCell.dateLabel}`} · ${focusCell.count} ${focusCell.count === 1 ? 'action' : 'actions'}`}
                    </Text>
                    {selectedHeatDate !== null ? (
                      <Pressable
                        onPress={() => {
                          tapHaptic();
                          setSelectedHeatDate(null);
                        }}
                        hitSlop={6}
                        style={styles.heatmapActionChip}
                      >
                        <Text style={styles.heatmapActionChipText}>Today</Text>
                      </Pressable>
                    ) : focusCell.isToday && focusCell.count === 0 ? (
                      <Pressable
                        onPress={() => {
                          selectionHaptic();
                          router.navigate('/sandbox');
                        }}
                        hitSlop={6}
                        style={styles.heatmapPracticeChip}
                      >
                        <Text style={styles.heatmapPracticeChipText}>
                          Practice →
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.heatmapTapHint}>Tap any block</Text>
                    )}
                  </View>

                  <View style={styles.heatmapInspectorPills}>
                    <View
                      style={[
                        styles.heatmapStatPill,
                        focusCell.breakdown.lessons > 0 &&
                          styles.heatmapStatPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.heatmapStatPillText,
                          focusCell.breakdown.lessons > 0 &&
                            styles.heatmapStatPillTextActive,
                        ]}
                      >
                        {`${focusCell.breakdown.lessons} Lessons`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.heatmapStatPill,
                        focusCell.breakdown.blitz > 0 &&
                          styles.heatmapStatPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.heatmapStatPillText,
                          focusCell.breakdown.blitz > 0 &&
                            styles.heatmapStatPillTextActive,
                        ]}
                      >
                        {`${focusCell.breakdown.blitz} Blitz`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.heatmapStatPill,
                        focusCell.breakdown.runs > 0 &&
                          styles.heatmapStatPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.heatmapStatPillText,
                          focusCell.breakdown.runs > 0 &&
                            styles.heatmapStatPillTextActive,
                        ]}
                      >
                        {`${focusCell.breakdown.runs} Runs`}
                      </Text>
                    </View>
                    {focusCell.isFrozen ? (
                      <View style={styles.heatmapFrozenPill}>
                        <Text style={styles.heatmapFrozenPillText}>Frozen</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>

            {/* 2. Divider */}
            <View style={styles.activityDivider} />

            {/* 3. Language Mastery Progress Rows (All 18 Tracks + Unit Breakdown Modal) */}
            <View style={styles.masteryHeaderRow}>
              <View>
                <Text style={styles.masterySectionTitle}>Track Mastery</Text>
                <Text style={styles.masterySectionSub}>
                  Tap any track to inspect unit breakdown
                </Text>
              </View>
              <Text style={styles.masteryCountBadge}>
                {`${startedCoursesCount}/${LANGUAGES.length} started`}
              </Text>
            </View>

            <View style={styles.masteryList}>
              {sortedCourses.map(({ course, stats }) => {
                const isActiveCourse = course.id === activeLang;
                return (
                  <SpringPressable
                    key={course.id}
                    onPress={() => {
                      setMasteryLangId(course.id);
                      openModal('mastery');
                    }}
                    haptic="selection"
                    sound="none"
                    pressScale={0.985}
                    style={[
                      styles.masteryRow,
                      isActiveCourse && styles.masteryRowActive,
                    ]}
                  >
                    <View style={styles.masteryLangInfo}>
                      <LanguageLogo language={course.id} size={18} />
                      <View style={styles.masteryLangTextCol}>
                        <Text style={styles.masteryLangName} numberOfLines={1}>
                          {course.name}
                        </Text>
                        <Text style={styles.masteryRankSub} numberOfLines={1}>
                          {stats.avgAccuracy !== null
                            ? `${stats.rank} · ${stats.avgAccuracy}%`
                            : stats.rank}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.masteryBarTrack}>
                      {stats.pct > 0 ? (
                        <View
                          style={[
                            styles.masteryBarFill,
                            { width: `${stats.pct}%` },
                          ]}
                        >
                          <View style={styles.masteryBarShine} />
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.masteryPctText}>
                      {stats.done}/{stats.total}
                    </Text>
                  </SpringPressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Settings Sheet Modal */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeSettings()}
      >
        <View style={styles.modalRoot}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              { opacity: settingsBackdropOpacity },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeSettings()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.settingsSheet,
              {
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: settingsTranslateY }],
              },
            ]}
          >
            <View {...settingsPanResponder.panHandlers}>
              <View style={styles.settingsDragHandle} />
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsSheetTitle}>Settings</Text>
                <SpringPressable
                  onPress={() => closeSettings()}
                  hitSlop={8}
                  haptic="selection"
                  sound="none"
                  pressScale={0.94}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </SpringPressable>
              </View>
            </View>

            <ScrollView
              style={styles.settingsScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.settingsGroup}>
              <SpringPressable
                onPress={() => closeSettings(() => openModal('edit'), true)}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={[styles.settingRow, styles.settingRowBorder]}
              >
                <View style={styles.settingIconWrap}>
                  <Feather name="edit-2" size={15} color="#C4B5FD" />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Edit Profile</Text>
                  <Text style={styles.settingRowSub}>
                    Name, @handle, badge color &amp; course
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </SpringPressable>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="volume-high-outline"
                    size={16}
                    color="#C4B5FD"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Sound Effects</Text>
                  <Text style={styles.settingRowSub}>
                    Studio audio cues, chimes &amp; keystrokes
                  </Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSounds}
                  trackColor={{ false: '#1E1E2C', true: '#7C5CFC' }}
                  thumbColor="#FAFAFA"
                  ios_backgroundColor="#1E1E2C"
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={16}
                    color="#A78BFA"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Haptic Feedback</Text>
                  <Text style={styles.settingRowSub}>
                    Tactile response on taps &amp; code runs
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={toggleHaptics}
                  trackColor={{ false: '#1E1E2C', true: '#7C5CFC' }}
                  thumbColor="#FAFAFA"
                  ios_backgroundColor="#1E1E2C"
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color="#C4B5FD"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Daily Reminders</Text>
                  <Text style={styles.settingRowSub}>
                    19:30 streak nudge &amp; 5/5 heart alerts
                  </Text>
                </View>
                <Switch
                  value={dailyReminderEnabled}
                  onValueChange={toggleReminders}
                  trackColor={{ false: '#1E1E2C', true: '#7C5CFC' }}
                  thumbColor="#FAFAFA"
                  ios_backgroundColor="#1E1E2C"
                />
              </View>

              <SpringPressable
                onPress={() =>
                  closeSettings(() => setLegalDoc('privacy'), true)
                }
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={[styles.settingRow, styles.settingRowBorder]}
              >
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color="#94A3B8"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Privacy Policy</Text>
                  <Text style={styles.settingRowSub}>
                    How Codelingo handles &amp; protects data
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </SpringPressable>

              <SpringPressable
                onPress={() =>
                  closeSettings(() => setLegalDoc('terms'), true)
                }
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={[styles.settingRow, styles.settingRowBorder]}
              >
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="#94A3B8"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Terms of Service</Text>
                  <Text style={styles.settingRowSub}>
                    Platform rules &amp; virtual rewards notice
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </SpringPressable>

              <SpringPressable
                onPress={() => closeSettings(() => openModal('privacy'), true)}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={[styles.settingRow, styles.settingRowBorder]}
              >
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="cloud-done-outline"
                    size={16}
                    color="#94A3B8"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>Cloud &amp; Sync</Text>
                  <Text style={styles.settingRowSub}>
                    {cloudConfigured
                      ? pendingSync
                        ? 'Pending cloud backup'
                        : 'Supabase Cloud active'
                      : 'Offline local cache'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </SpringPressable>

              <SpringPressable
                onPress={() => closeSettings(() => openModal('about'), true)}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={[styles.settingRow, styles.settingRowBorder]}
              >
                <View style={styles.settingIconWrap}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#94A3B8"
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingRowTitle}>About Codelingo</Text>
                </View>
                <Text style={styles.versionBadge}>v1.0.0</Text>
              </SpringPressable>

              <SpringPressable
                onPress={handleDeleteAccountFlow}
                haptic="selection"
                sound="none"
                pressScale={0.98}
                style={styles.settingRow}
              >
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={[styles.settingRowTitle, { color: '#EF4444' }]}>
                    Delete Account &amp; Reset All Data
                  </Text>
                  <Text style={styles.settingRowSub}>
                    Permanently erase cloud &amp; device records
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#EF4444" />
              </SpringPressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Action / Detail Modals (Edit Profile, Streak, Combat Stats, Privacy/Sync, About, Reset) */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="none"
        onRequestClose={() => closeModal()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.detailBackdrop}
        >
          <Animated.View
            style={[styles.detailOverlay, { opacity: modalOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeModal()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.detailCard,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            {activeModal === 'edit' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View style={styles.detailIconBadge}>
                      <Feather name="user" size={17} color="#C4B5FD" />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>Edit Profile</Text>
                      <Text style={styles.detailSub}>
                        Saved locally &amp; synced to leaderboards
                      </Text>
                    </View>
                  </View>

                  <SpringPressable
                    onPress={() => closeModal()}
                    hitSlop={8}
                    haptic="light"
                    sound="none"
                    pressScale={0.94}
                    style={styles.closeModalBtn}
                  >
                    <Ionicons name="close" size={16} color="#94A3B8" />
                  </SpringPressable>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>DISPLAY NAME</Text>
                  <TextInput
                    value={draftName}
                    onChangeText={(txt) => {
                      setDraftName(txt);
                      if (editError) setEditError(null);
                    }}
                    placeholder="Tarek"
                    placeholderTextColor="#52525B"
                    maxLength={24}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>HANDLE</Text>
                  <TextInput
                    value={draftHandle}
                    onChangeText={setDraftHandle}
                    placeholder="@tarek_dev"
                    placeholderTextColor="#52525B"
                    autoCapitalize="none"
                    maxLength={24}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>BADGE ACCENT</Text>
                  <View style={styles.swatchRow}>
                    {AVATAR_THEMES.map((theme) => {
                      const active = draftTheme === theme.id;
                      return (
                        <Pressable
                          key={theme.id}
                          onPress={() => {
                            selectionHaptic();
                            playSound('select');
                            setDraftTheme(theme.id);
                          }}
                          style={[
                            styles.swatchChip,
                            active && {
                              borderColor: theme.ring,
                              backgroundColor: theme.bg,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.swatchDot,
                              { backgroundColor: theme.ring },
                            ]}
                          />
                          <Text
                            style={[
                              styles.swatchText,
                              active && { color: '#FAFAFA' },
                            ]}
                          >
                            {theme.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>ACTIVE COURSE</Text>
                  <ScrollView
                    style={styles.langPickScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.langPickGrid}>
                      {LANGUAGES.map((course) => {
                        const active = draftLang === course.id;
                        return (
                          <Pressable
                            key={course.id}
                            onPress={() => {
                              selectionHaptic();
                              playSound('select');
                              setDraftLang(course.id);
                            }}
                            style={[
                              styles.langPickChip,
                              active && styles.langPickChipActive,
                            ]}
                          >
                            <LanguageLogo language={course.id} size={15} />
                            <Text
                              style={[
                                styles.langPickText,
                                active && { color: '#FAFAFA' },
                              ]}
                            >
                              {course.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {editError ? (
                  <Text style={styles.formErrorText}>{editError}</Text>
                ) : null}

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailSecondaryBtn}
                  >
                    <Text style={styles.detailSecondaryText}>Cancel</Text>
                  </SpringPressable>
                  <SpringPressable
                    onPress={handleSaveProfile}
                    haptic="medium"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailPrimaryBtn}
                  >
                    <Text style={styles.detailPrimaryText}>Save Profile</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'streak' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View
                      style={[
                        styles.detailIconBadge,
                        savedByFreezeYesterday
                          ? {
                              backgroundColor: 'rgba(56, 189, 248, 0.14)',
                              borderColor: 'rgba(56, 189, 248, 0.28)',
                            }
                          : {
                              backgroundColor: 'rgba(249, 115, 22, 0.14)',
                              borderColor: 'rgba(249, 115, 22, 0.28)',
                            },
                      ]}
                    >
                      <Ionicons
                        name={savedByFreezeYesterday ? 'snow' : 'flame'}
                        size={18}
                        color={savedByFreezeYesterday ? '#38BDF8' : '#F97316'}
                      />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>
                        {streak > 0
                          ? `${streak}-Day Streak`
                          : 'Start Your Streak'}
                      </Text>
                      <Text style={styles.detailSub}>
                        {codedTodayCount > 0
                          ? `Secured today · ${codedTodayCount} actions logged`
                          : savedByFreezeYesterday
                            ? 'Protected by Streak Freeze yesterday · Code today'
                            : 'Complete a lesson or Bug Blitz today to build momentum'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.streakWeekStrip}>
                  {streakWeekCells.map((cell) => {
                    const isDone = cell.count > 0;
                    return (
                      <View
                        key={cell.dateKey}
                        style={[
                          styles.streakDayCell,
                          cell.isToday && styles.streakDayCellToday,
                        ]}
                      >
                        <Text style={styles.streakDayWeekday}>
                          {cell.weekdayShort}
                        </Text>
                        <View
                          style={[
                            styles.streakDayCircle,
                            isDone
                              ? styles.streakDayCircleDone
                              : cell.isFrozen
                                ? styles.streakDayCircleFrozen
                                : cell.isToday
                                  ? styles.streakDayCirclePending
                                  : styles.streakDayCircleEmpty,
                          ]}
                        >
                          <Ionicons
                            name={
                              isDone
                                ? 'flame'
                                : cell.isFrozen
                                  ? 'snow'
                                  : cell.isToday
                                    ? 'time-outline'
                                    : 'remove'
                            }
                            size={13}
                            color={
                              isDone
                                ? '#F97316'
                                : cell.isFrozen
                                  ? '#38BDF8'
                                  : cell.isToday
                                    ? '#FBBF24'
                                    : '#52525B'
                            }
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.detailMetricsRow}>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>TODAY</Text>
                    <Text
                      style={[
                        styles.detailMetricVal,
                        {
                          color: codedTodayCount > 0 ? '#34D399' : '#FBBF24',
                        },
                      ]}
                    >
                      {codedTodayCount > 0 ? 'SECURED' : 'PENDING'}
                    </Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>BEST STREAK</Text>
                    <Text style={styles.detailMetricVal}>
                      {bestStreak}d
                    </Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>FREEZES</Text>
                    <Text style={[styles.detailMetricVal, { color: '#38BDF8' }]}>
                      {`${streakFreezes}/${MAX_STREAK_FREEZES}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.freezeShopBox}>
                  <View style={styles.freezeShopInfo}>
                    <View style={styles.freezeIconWrap}>
                      <Ionicons name="snow" size={16} color="#38BDF8" />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.freezeTitle}>Streak Freeze</Text>
                      <Text style={styles.freezeSub} numberOfLines={2}>
                        {`Auto-protects 1 missed day · Balance: ${gems.toLocaleString()} gems`}
                      </Text>
                    </View>
                  </View>

                  <SpringPressable
                    onPress={handleBuyFreeze}
                    haptic="selection"
                    sound="none"
                    pressScale={0.96}
                    style={[
                      styles.freezeBuyBtn,
                      (streakFreezes >= MAX_STREAK_FREEZES ||
                        gems < STREAK_FREEZE_COST) &&
                        styles.freezeBuyBtnMuted,
                    ]}
                  >
                    <Text style={styles.freezeBuyText}>
                      {streakFreezes >= MAX_STREAK_FREEZES
                        ? 'Full'
                        : `${STREAK_FREEZE_COST}g`}
                    </Text>
                  </SpringPressable>
                </View>

                {freezeFeedback ? (
                  <Text style={styles.syncFeedbackText}>{freezeFeedback}</Text>
                ) : null}

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() =>
                      closeModal(() => router.navigate('/sandbox'), true)
                    }
                    haptic="selection"
                    pressScale={0.97}
                    style={styles.detailSecondaryBtn}
                  >
                    <Text style={styles.detailSecondaryText}>Bug Blitz</Text>
                  </SpringPressable>
                  <SpringPressable
                    onPress={() =>
                      closeModal(() => router.navigate(LEARN_ROUTE), true)
                    }
                    haptic="selection"
                    pressScale={0.97}
                    style={[styles.detailPrimaryBtn, { flex: 1 }]}
                  >
                    <Text style={styles.detailPrimaryText}>Go to Learn</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'league' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View
                      style={[
                        styles.detailIconBadge,
                        {
                          backgroundColor: 'rgba(124, 92, 252, 0.14)',
                          borderColor: 'rgba(124, 92, 252, 0.28)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="trophy"
                        size={18}
                        color={leagueInfo.currentTier.accent}
                      />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>
                        {`${leagueInfo.currentTier.name} League`}
                      </Text>
                      <Text style={styles.detailSub}>
                        {`Rank #${myRank} of ${totalCompetitors} · ${xp.toLocaleString()} Total XP`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.leagueProgressBox}>
                  <View style={styles.leagueProgressTop}>
                    <Text style={styles.leagueProgressTitle}>
                      {leagueInfo.nextTier
                        ? `${leagueInfo.currentTier.name} → ${leagueInfo.nextTier.name}`
                        : 'Highest Tier Reached'}
                    </Text>
                    <Text style={styles.leagueProgressMeta}>
                      {leagueInfo.nextTier
                        ? `${leagueInfo.xpToNext.toLocaleString()} XP left`
                        : `${xp.toLocaleString()} XP`}
                    </Text>
                  </View>
                  <View style={styles.leagueProgressTrack}>
                    <View
                      style={[
                        styles.leagueProgressFill,
                        {
                          width: `${leagueInfo.progressPct}%`,
                          backgroundColor: leagueInfo.currentTier.accent,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.syncMetaBox}>
                  {LEAGUE_TIERS.map((tier) => {
                    const isCurrent = tier.name === leagueInfo.currentTier.name;
                    const isUnlocked = xp >= tier.minXp;
                    return (
                      <View
                        key={tier.name}
                        style={[
                          styles.leagueLadderRow,
                          isCurrent && styles.leagueLadderRowActive,
                        ]}
                      >
                        <View style={styles.leagueLadderLeft}>
                          <View
                            style={[
                              styles.leagueTierDot,
                              { backgroundColor: tier.accent },
                            ]}
                          />
                          <Text
                            style={[
                              styles.leagueTierName,
                              isCurrent && { color: '#FFFFFF' },
                            ]}
                          >
                            {tier.name}
                          </Text>
                        </View>
                        <Text style={styles.leagueTierRight}>
                          {isCurrent
                            ? 'CURRENT'
                            : isUnlocked
                              ? 'UNLOCKED'
                              : `${tier.minXp.toLocaleString()}+ XP`}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() =>
                      closeModal(() => router.navigate('/leaderboard'), true)
                    }
                    haptic="selection"
                    pressScale={0.97}
                    style={[styles.detailPrimaryBtn, { flex: 1 }]}
                  >
                    <Text style={styles.detailPrimaryText}>
                      Open Leaderboard
                    </Text>
                  </SpringPressable>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailSecondaryBtn}
                  >
                    <Text style={styles.detailSecondaryText}>Done</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'mastery' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View style={styles.detailIconBadge}>
                      <LanguageLogo
                        language={masteryCourseItem.course.id}
                        size={20}
                      />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>
                        {`${masteryCourseItem.course.name} Mastery`}
                      </Text>
                      <Text style={styles.detailSub}>
                        {`${masteryCourseItem.stats.rank} · ${masteryCourseItem.stats.done}/${masteryCourseItem.stats.total} lessons`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailMetricsRow}>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>COMPLETION</Text>
                    <Text style={styles.detailMetricVal}>
                      {`${masteryCourseItem.stats.pct}%`}
                    </Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>AVG ACC</Text>
                    <Text style={styles.detailMetricVal}>
                      {masteryCourseItem.stats.avgAccuracy !== null
                        ? `${masteryCourseItem.stats.avgAccuracy}%`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>TRACK</Text>
                    <Text
                      style={[
                        styles.detailMetricVal,
                        {
                          color:
                            masteryCourseItem.course.id === activeLang
                              ? '#A78BFA'
                              : '#FAFAFA',
                        },
                      ]}
                    >
                      {masteryCourseItem.course.id === activeLang
                        ? 'ACTIVE'
                        : 'READY'}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  style={styles.unitBreakdownScroll}
                  contentContainerStyle={styles.unitBreakdownList}
                  showsVerticalScrollIndicator={false}
                >
                  {masteryCourseItem.stats.unitBreakdown.map((unit, idx) => {
                    const isUnitComplete =
                      unit.total > 0 && unit.done === unit.total;
                    return (
                      <View key={unit.id} style={styles.unitRowCard}>
                        <View style={styles.unitRowTop}>
                          <Text style={styles.unitRowTitle} numberOfLines={1}>
                            {`U${idx + 1} · ${unit.title}`}
                          </Text>
                          <Text
                            style={[
                              styles.unitRowCount,
                              isUnitComplete && { color: '#34D399' },
                            ]}
                          >
                            {`${unit.done}/${unit.total}`}
                          </Text>
                        </View>
                        <View style={styles.masteryBarTrack}>
                          <View
                            style={[
                              styles.masteryBarFill,
                              {
                                width: `${unit.pct}%`,
                                backgroundColor: isUnitComplete
                                  ? '#34D399'
                                  : '#7C5CFC',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailSecondaryBtn}
                  >
                    <Text style={styles.detailSecondaryText}>Close</Text>
                  </SpringPressable>
                  <SpringPressable
                    onPress={() => {
                      const targetId = masteryCourseItem.course.id;
                      setActiveLang(targetId);
                      closeModal(() => router.navigate(LEARN_ROUTE), true);
                    }}
                    haptic="selection"
                    pressScale={0.97}
                    style={[styles.detailPrimaryBtn, { flex: 1 }]}
                  >
                    <Text style={styles.detailPrimaryText}>
                      {masteryCourseItem.course.id === activeLang
                        ? 'Continue Track'
                        : 'Switch & Learn'}
                    </Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'stats' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View style={styles.detailIconBadge}>
                      <Ionicons name="flash" size={18} color="#A78BFA" />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>Coding Telemetry</Text>
                      <Text style={styles.detailSub}>
                        {`Level ${level} · ${LEVEL_XP - xpIntoLevel} XP to Level ${level + 1}`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailMetricsRow}>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>TOTAL XP</Text>
                    <Text style={styles.detailMetricVal}>
                      {xp.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>WEEKLY XP</Text>
                    <Text style={[styles.detailMetricVal, { color: '#C4B5FD' }]}>
                      {weeklyXp.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>ACCURACY</Text>
                    <Text style={[styles.detailMetricVal, { color: '#34D399' }]}>
                      {accuracyPct}%
                    </Text>
                  </View>
                </View>

                <View style={styles.detailMetricsRow}>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>BEST COMBO</Text>
                    <Text style={styles.detailMetricVal}>{bestCombo}x</Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>BLITZ BEST</Text>
                    <Text style={styles.detailMetricVal}>{blitzBest}</Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricLabel}>CODE RUNS</Text>
                    <Text style={styles.detailMetricVal}>{executions}</Text>
                  </View>
                </View>

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={[styles.detailPrimaryBtn, { flex: 1 }]}
                  >
                    <Text style={styles.detailPrimaryText}>Close</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'privacy' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View style={styles.detailIconBadge}>
                      <Ionicons
                        name="shield-checkmark"
                        size={17}
                        color="#34D399"
                      />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>Privacy &amp; Sync</Text>
                      <Text style={styles.detailSub}>
                        {cloudConfigured
                          ? 'Offline-first cache + Supabase Cloud'
                          : 'Offline local cache mode'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.syncMetaBox}>
                  <View style={styles.syncMetaRow}>
                    <Text style={styles.syncMetaKey}>PROFILE ID</Text>
                    <Text style={styles.syncMetaVal}>
                      {userId.slice(0, 14)}
                    </Text>
                  </View>
                  <View style={styles.syncMetaRow}>
                    <Text style={styles.syncMetaKey}>SYNC STATE</Text>
                    <Text
                      style={[
                        styles.syncMetaVal,
                        { color: pendingSync ? '#FBBF24' : '#34D399' },
                      ]}
                    >
                      {pendingSync ? 'PENDING CHANGES' : 'UP TO DATE'}
                    </Text>
                  </View>
                  <View style={styles.syncMetaRow}>
                    <Text style={styles.syncMetaKey}>LAST SYNCED</Text>
                    <Text style={styles.syncMetaVal}>
                      {lastSyncedAt
                        ? new Date(lastSyncedAt).toLocaleTimeString()
                        : 'Local only'}
                    </Text>
                  </View>
                </View>

                {syncMessage ? (
                  <Text style={styles.syncFeedbackText}>{syncMessage}</Text>
                ) : null}

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={handleManualSync}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailSecondaryBtn}
                  >
                    {syncBusy ? (
                      <CarbonSpinnerDots color="#C4B5FD" size="sm" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={13} color="#E2E8F0" />
                        <Text style={styles.detailSecondaryText}>Sync Now</Text>
                      </>
                    )}
                  </SpringPressable>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailPrimaryBtn}
                  >
                    <Text style={styles.detailPrimaryText}>Done</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'about' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View style={styles.detailIconBadge}>
                      <Ionicons name="code-slash" size={17} color="#C4B5FD" />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>Codelingo v1.0.0</Text>
                      <Text style={styles.detailSub}>
                        Interactive Developer Learning Suite
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.syncMetaBox}>
                  <View style={styles.syncMetaRow}>
                    <Text style={styles.syncMetaKey}>COURSES</Text>
                    <Text style={styles.syncMetaVal}>
                      18 tracks: Python, C++, JS, Go, Java, Rust, SQL, C, TS, CSS, HTML, PHP, ASM, Swift, Kotlin, Julia, Lua, C#
                    </Text>
                  </View>
                  <View style={styles.syncMetaRow}>
                    <Text style={styles.syncMetaKey}>CURRICULUM</Text>
                    <Text style={styles.syncMetaVal}>
                      {totalCurriculumNodes} interactive nodes
                    </Text>
                  </View>
                  <View style={styles.syncMetaRow}>
                    <Text style={styles.syncMetaKey}>MODES</Text>
                    <Text style={styles.syncMetaVal}>
                      Lessons · Playground · Bug Blitz
                    </Text>
                  </View>
                </View>

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={[styles.detailPrimaryBtn, { flex: 1 }]}
                  >
                    <Text style={styles.detailPrimaryText}>Close</Text>
                  </SpringPressable>
                </View>
              </>
            ) : activeModal === 'reset' ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleGroup}>
                    <View
                      style={[
                        styles.detailIconBadge,
                        {
                          backgroundColor: 'rgba(239, 68, 68, 0.14)',
                          borderColor: 'rgba(239, 68, 68, 0.30)',
                        },
                      ]}
                    >
                      <Ionicons name="warning" size={17} color="#EF4444" />
                    </View>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailTitle}>Reset Progress?</Text>
                      <Text style={styles.detailSub}>
                        Resets XP, completed nodes, streak &amp; Bug Blitz stats
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailFooter}>
                  <SpringPressable
                    onPress={() => closeModal()}
                    haptic="light"
                    sound="none"
                    pressScale={0.97}
                    style={styles.detailSecondaryBtn}
                  >
                    <Text style={styles.detailSecondaryText}>Cancel</Text>
                  </SpringPressable>
                  <SpringPressable
                    onPress={handleConfirmReset}
                    haptic="medium"
                    sound="none"
                    pressScale={0.97}
                    style={[
                      styles.detailPrimaryBtn,
                      { backgroundColor: '#DC2626' },
                    ]}
                  >
                    <Text style={styles.detailPrimaryText}>
                      Reset Everything
                    </Text>
                  </SpringPressable>
                </View>
              </>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <GemShopModal visible={shopOpen} onClose={() => setShopOpen(false)} />
      <AccountAuthModal
        visible={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signup"
      />
      <LegalReaderModal
        visible={legalDoc !== null}
        initialDoc={legalDoc ?? 'privacy'}
        onClose={() => setLegalDoc(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scrollable Bento Container ----------------------------------------- */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 18,
  },

  /* Section 1: Developer Identity Hero Card ---------------------------- */
  heroCard: {
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#191826',
    borderWidth: 2,
    borderColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTerminalAvatar: {
    width: 36,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#11101A',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    paddingHorizontal: 5,
    paddingTop: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 3,
  },
  miniTerminalDots: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 2.5,
  },
  miniDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
  avatarInitials: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  userInfo: {
    marginLeft: 14,
    zIndex: 2,
    flex: 1,
    paddingRight: 78,
  },
  heroTopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.25)',
  },
  editHintText: {
    fontFamily: UI_FONT,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  userName: {
    fontFamily: UI_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  userHandle: {
    fontFamily: MONO,
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 1,
  },
  levelPill: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    alignSelf: 'flex-start',
  },
  levelPillText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  heroXpTrackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  heroXpTrack: {
    flex: 1,
    height: 11,
    borderRadius: 999,
    backgroundColor: '#1F1D30',
    overflow: 'hidden',
  },
  heroXpFill: {
    height: '100%',
    borderRadius: 999,
    paddingTop: 2,
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  heroXpShine: {
    height: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  heroXpCaption: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  heroGraphicWrap: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    width: 85,
    gap: 6,
    alignItems: 'flex-end',
    opacity: 0.22,
  },
  heroGraphicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  heroTokenBar: {
    height: 5.5,
    borderRadius: 3,
  },

  /* Section Shared ----------------------------------------------------- */
  sectionBlock: {
    width: '100%',
  },
  sectionTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  /* Section 2: 2x2 Bento Metrics Grid ---------------------------------- */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  metricCellWrap: {
    width: '48.3%',
  },
  metricCard: {
    width: '100%',
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextCol: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    fontFamily: MONO,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  metricValueLeague: {
    fontFamily: UI_FONT,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#94A3B8',
  },

  /* Section 3: Activity & Mastery Card --------------------------------- */
  activityCard: {
    backgroundColor: '#151421',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    padding: 16,
    gap: 14,
  },
  heatmapSection: {
    gap: 10,
  },
  heatmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heatmapTitle: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  heatmapSubtitle: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  heatmapGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heatmapCol: {
    flex: 1,
    gap: 5,
  },
  heatmapCell: {
    width: '100%',
    height: 18,
    borderRadius: 7,
  },
  heatmapCellSelected: {
    borderWidth: 1,
    borderColor: '#FAFAFA',
  },
  activityDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  masteryList: {
    gap: 6,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginHorizontal: -6,
    borderRadius: 8,
  },
  masteryRowActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.22)',
  },
  masteryLangInfo: {
    width: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masteryLangTextCol: {
    flex: 1,
    gap: 1,
  },
  masteryRankSub: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#71717A',
    letterSpacing: -0.2,
  },
  masteryLangName: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  masteryBarTrack: {
    flex: 1,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#1F1D30',
    overflow: 'hidden',
  },
  masteryBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    paddingTop: 2,
    paddingHorizontal: 3,
    justifyContent: 'flex-start',
  },
  masteryBarShine: {
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  masteryPctText: {
    width: 42,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
    fontVariant: ['tabular-nums'],
  },

  /* Settings Modal ----------------------------------------------------- */
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  settingsSheet: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#12111A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#252338',
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
  },
  settingsDragHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 8,
  },
  settingsScroll: {
    maxHeight: 520,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsSheetTitle: {
    fontFamily: UI_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  closeModalBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#1A1927',
    borderWidth: 1.5,
    borderColor: '#2C2A40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsGroup: {
    backgroundColor: '#151421',
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#252338',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#181824',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: {
    flex: 1,
    gap: 2,
  },
  settingRowTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  settingRowSub: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#94A3B8',
  },
  versionBadge: {
    fontFamily: MONO,
    fontSize: 11.5,
    color: '#64748B',
  },
  detailBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4, 4, 8, 0.78)',
  },
  detailCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#12111A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 16,
    gap: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  detailIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 92, 252, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderCopy: {
    flex: 1,
  },
  detailTitle: {
    fontFamily: UI_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  detailSub: {
    fontFamily: UI_FONT,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  formField: {
    gap: 5,
  },
  formLabel: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.6,
  },
  formInput: {
    height: 38,
    borderRadius: 9,
    backgroundColor: '#0E0E15',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 12,
    fontFamily: UI_FONT,
    fontSize: 13.5,
    color: '#FAFAFA',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  swatchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0E0E15',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  swatchText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  langPickScroll: {
    maxHeight: 136,
  },
  langPickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  langPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0E0E15',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langPickChipActive: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  langPickText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  formErrorText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  detailMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailMetricBox: {
    flex: 1,
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  detailMetricLabel: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  detailMetricVal: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
    marginTop: 3,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  syncMetaBox: {
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  syncMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  syncMetaKey: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  syncMetaVal: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  syncFeedbackText: {
    fontFamily: UI_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  detailSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#181726',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  detailSecondaryText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  detailPrimaryBtn: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrimaryText: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 6,
  },
  metricStatusTag: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metricRankTag: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: -0.2,
  },
  heatmapCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.55)',
  },
  heatmapCellFrozen: {
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.65)',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  heatmapLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heatmapInspectorBox: {
    backgroundColor: '#0E0E15',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  heatmapInspectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heatmapInspectorTitle: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: -0.2,
  },
  heatmapTapHint: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#71717A',
    letterSpacing: -0.2,
  },
  heatmapActionChip: {
    backgroundColor: '#181824',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heatmapActionChipText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  heatmapPracticeChip: {
    backgroundColor: '#1E1A30',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heatmapPracticeChipText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  heatmapInspectorPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heatmapStatPill: {
    backgroundColor: '#151520',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heatmapStatPillActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  heatmapStatPillText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: -0.2,
  },
  heatmapStatPillTextActive: {
    color: '#E9D5FF',
  },
  heatmapFrozenPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heatmapFrozenPillText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7DD3FC',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heatmapLegendText: {
    fontFamily: MONO,
    fontSize: 9.5,
    color: '#64748B',
  },
  heatmapLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3.5,
  },
  masteryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  masterySectionTitle: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  masterySectionSub: {
    fontFamily: MONO,
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  masteryCountBadge: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#A78BFA',
    backgroundColor: '#161622',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  streakWeekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0E15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 4,
  },
  streakDayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakDayCellToday: {
    backgroundColor: 'rgba(124, 92, 252, 0.08)',
  },
  streakDayWeekday: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
  },
  streakDayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDayCircleDone: {
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  streakDayCircleFrozen: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.40)',
  },
  streakDayCirclePending: {
    backgroundColor: 'rgba(251, 191, 36, 0.10)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  streakDayCircleEmpty: {
    backgroundColor: '#151520',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  freezeShopBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#0E0E15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  freezeShopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  freezeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeTitle: {
    fontFamily: UI_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  freezeSub: {
    fontFamily: UI_FONT,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  freezeBuyBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeBuyBtnMuted: {
    backgroundColor: '#1E293B',
  },
  freezeBuyText: {
    fontFamily: MONO,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leagueProgressBox: {
    backgroundColor: '#0E0E15',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  leagueProgressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leagueProgressTitle: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  leagueProgressMeta: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '600',
    color: '#A78BFA',
  },
  leagueProgressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1C1C28',
    overflow: 'hidden',
  },
  leagueProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  leagueLadderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginHorizontal: -6,
    borderRadius: 7,
  },
  leagueLadderRowActive: {
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
  },
  leagueLadderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leagueTierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueTierName: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  leagueTierRight: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  unitBreakdownScroll: {
    maxHeight: 205,
  },
  unitBreakdownList: {
    gap: 8,
  },
  unitRowCard: {
    backgroundColor: '#0E0E15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 6,
  },
  unitRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  unitRowTitle: {
    flex: 1,
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  unitRowCount: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerGemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: '#151421',
    borderWidth: 1.5,
    borderColor: '#28263D',
    borderBottomWidth: 3,
    borderBottomColor: '#0E0D18',
  },
  headerGemText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  projectsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  projectsHeaderMeta: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.2,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  projectsList: {
    gap: 0,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#171624',
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#252338',
    borderBottomWidth: 3,
    borderBottomColor: '#0C0B14',
    padding: 12,
    marginBottom: 8,
  },
  projectLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectCopy: {
    flex: 1,
    gap: 2,
  },
  projectRowTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  projectRowSub: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#94A3B8',
  },
  projectStatusBadge: {
    height: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectStatusBuilt: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.42)',
    borderBottomColor: '#059669',
  },
  projectStatusPending: {
    backgroundColor: '#1E1C2E',
    borderColor: '#322F4A',
    borderBottomColor: '#100F1A',
  },
  projectStatusText: {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: '800',
  },
  projectStatusTextBuilt: {
    color: '#34D399',
  },
  projectStatusTextPending: {
    color: '#C4B5FD',
  },
  saveProgressBanner: {
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#4C35B5',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveProgressIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1D30',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProgressCopy: {
    flex: 1,
    gap: 2,
  },
  saveProgressTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  saveProgressSub: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 15.5,
  },
  saveProgressActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#7C5CFC',
    borderBottomWidth: 3,
    borderBottomColor: '#5639D6',
  },
  saveProgressActionText: {
    fontFamily: UI_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cloudLinkedBanner: {
    backgroundColor: '#151421',
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderBottomWidth: 4,
    borderBottomColor: '#0C0B14',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cloudLinkedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudLinkedTitle: {
    fontFamily: UI_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  signOutPill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#1E1C2E',
    borderWidth: 1.5,
    borderColor: '#322F4A',
    borderBottomWidth: 3,
    borderBottomColor: '#100F1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutPillText: {
    fontFamily: UI_FONT,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },
});
