import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  attachSupabaseAppStateListener,
  AuthProviderKind,
  AvatarThemeId,
  BugCampaignProgress,
  BugLevelProgress,
  buildLocalLeaderboard,
  CloudAuthSessionInfo,
  completeLessonTransaction,
  computeLeagueForXp,
  DailyActivityBreakdown,
  DailyGoalMinutes,
  deleteCloudAccountAndData,
  ExperienceLevel,
  fetchCloudAccountSnapshot,
  fetchLiveLeaderboard,
  generateLocalUuid,
  getCurrentAuthSession,
  GitSimLevelProgress,
  GitSimProgress,
  isCloudConfigured,
  LangId,
  LeaderboardEntry,
  loadCachedUserData,
  mergeGuestAndCloudState,
  MistakeVaultItem,
  PersistedUserState,
  refillHeartsWithGems,
  RobotMazeLevelProgress,
  RobotMazeProgress,
  RoboSkinId,
  saveCachedUserData,
  signOutFromCloud,
  syncProfileToCloud,
  SyntaxSprintProgress,
} from '@/services/supabase';
import {
  cancelAllScheduledNotifications,
  syncDailyStreakReminder,
  syncHeartsRefilledNotification,
} from '@/services/notifications';
import { setHapticsEnabled } from '@/utils/haptics';
import { setSoundsEnabled } from '@/utils/sounds';

export type {
  AuthProviderKind,
  AvatarThemeId,
  BugCampaignProgress,
  BugLevelProgress,
  CloudAuthSessionInfo,
  DailyActivityBreakdown,
  DailyGoalMinutes,
  ExperienceLevel,
  GitSimLevelProgress,
  GitSimProgress,
  LangId,
  LeaderboardEntry,
  MistakeVaultItem,
  RobotMazeLevelProgress,
  RobotMazeProgress,
  RoboSkinId,
  SyntaxSprintProgress,
};

export const HEART_REFILL_COST = 100;
export const SINGLE_HEART_COST = 25;
export const BLITZ_HEART_REWARD = 2;
export const STREAK_FREEZE_COST = 200;
export const XP_OVERCLOCK_COST = 150;
export const XP_OVERCLOCK_DURATION_MS = 15 * 60 * 1000;
export const HEART_REGEN_INTERVAL_MS = 20 * 60 * 1000;
export const MAX_STREAK_FREEZES = 2;

const MAX_MISTAKE_VAULT = 50;

function applyXpMultiplier(
  baseXp: number,
  xpBoostExpiresAt: number | null | undefined,
): number {
  const safeBase = Math.max(0, Math.round(baseXp));
  if (xpBoostExpiresAt && xpBoostExpiresAt > Date.now()) {
    return safeBase * 2;
  }
  return safeBase;
}

export type NodeStatus = 'completed' | 'active' | 'locked';

export function computeNodeStatus(
  completedIds: readonly string[],
  nodeId: string,
  allNodesInOrder: readonly { id: string }[],
): NodeStatus {
  if (completedIds.includes(nodeId)) {
    return 'completed';
  }
  const firstUncompleted = allNodesInOrder.find(
    (n) => !completedIds.includes(n.id),
  );
  if (firstUncompleted?.id === nodeId) {
    return 'active';
  }
  return 'locked';
}

export interface CompleteLessonInput {
  lang: LangId;
  unitId: string;
  nodeId: string;
  xpReward: number;
  gemReward: number;
  accuracy: number;
  isCubeCheckpoint?: boolean;
}

export interface RecordBugLevelInput {
  lang: LangId;
  levelNumber: number;
  stars: 1 | 2 | 3;
  elapsedMs: number;
  xpReward: number;
  gemReward: number;
  bugsFixed?: number;
}

export interface RecordBugLevelResult {
  earnedXp: number;
  earnedGems: number;
  isFirstClear: boolean;
  isNewBestStars: boolean;
  bestStars: 1 | 2 | 3;
  bestTimeMs: number;
}

const INITIAL_COMPLETED: Record<LangId, string[]> = {
  python: [],
  cpp: [],
  js: [],
  go: [],
  java: [],
  rust: [],
  sql: [],
  c: [],
  ts: [],
  css: [],
  html: [],
  php: [],
  asm: [],
  swift: [],
  kotlin: [],
  julia: [],
  lua: [],
  csharp: [],
};

const ALL_BUG_CAMPAIGN_LANGS = Object.keys(INITIAL_COMPLETED) as LangId[];

export function createEmptyBugCampaignProgress(): BugCampaignProgress {
  const out = {} as BugCampaignProgress;
  for (const lang of ALL_BUG_CAMPAIGN_LANGS) {
    out[lang] = {};
  }
  return out;
}

export function normalizeBugCampaignProgress(
  raw?: Partial<BugCampaignProgress> | null,
): BugCampaignProgress {
  const out = createEmptyBugCampaignProgress();
  if (!raw || typeof raw !== 'object') return out;

  for (const lang of ALL_BUG_CAMPAIGN_LANGS) {
    const langMap = raw[lang];
    if (!langMap || typeof langMap !== 'object') continue;
    const cleaned: Record<number, BugLevelProgress> = {};
    for (const [levelKey, entry] of Object.entries(langMap)) {
      const levelNum = Number(levelKey);
      if (
        !Number.isInteger(levelNum) ||
        levelNum < 1 ||
        levelNum > 30 ||
        !entry ||
        typeof entry !== 'object'
      ) {
        continue;
      }
      const stars =
        entry.stars === 3 ? 3 : entry.stars === 2 ? 2 : entry.stars === 1 ? 1 : null;
      const bestTimeMs =
        typeof entry.bestTimeMs === 'number' && Number.isFinite(entry.bestTimeMs) && entry.bestTimeMs > 0
          ? Math.round(entry.bestTimeMs)
          : null;
      if (stars && bestTimeMs) {
        cleaned[levelNum] = { stars, bestTimeMs };
      }
    }
    out[lang] = cleaned;
  }
  return out;
}

export function getBugLanguageStars(
  progress: BugCampaignProgress | undefined,
  lang: LangId,
): number {
  const langMap = progress?.[lang];
  if (!langMap) return 0;
  let total = 0;
  for (let lvl = 1; lvl <= 30; lvl += 1) {
    total += langMap[lvl]?.stars ?? 0;
  }
  return total;
}

export function getBugTotalStars(progress: BugCampaignProgress | undefined): number {
  let total = 0;
  for (const lang of ALL_BUG_CAMPAIGN_LANGS) {
    total += getBugLanguageStars(progress, lang);
  }
  return total;
}

export function getBugLevelStatus(
  progress: BugCampaignProgress | undefined,
  lang: LangId,
  levelNumber: number,
): NodeStatus {
  const langMap = progress?.[lang];
  if (langMap?.[levelNumber]) {
    return 'completed';
  }
  if (levelNumber <= 1 || langMap?.[levelNumber - 1]) {
    return 'active';
  }
  return 'locked';
}

export interface RecordGitSimLevelInput {
  levelNumber: number;
  stars: 1 | 2 | 3;
  movesUsed: number;
  xpReward: number;
  gemReward: number;
}

export interface RecordGitSimLevelResult {
  earnedXp: number;
  earnedGems: number;
  isFirstClear: boolean;
  isNewBestStars: boolean;
  bestStars: 1 | 2 | 3;
  bestMoves: number;
}

export interface RecordRobotMazeLevelInput {
  levelNumber: number;
  stars: 1 | 2 | 3;
  blocksUsed: number;
  xpReward: number;
  gemReward: number;
}

export interface RecordRobotMazeLevelResult {
  earnedXp: number;
  earnedGems: number;
  isFirstClear: boolean;
  isNewBestStars: boolean;
  bestStars: 1 | 2 | 3;
  bestBlocks: number;
}

export function normalizeSyntaxSprintProgress(
  raw?: Partial<SyntaxSprintProgress> | null,
): SyntaxSprintProgress {
  return normalizeBugCampaignProgress(raw);
}

export function getSyntaxSprintLanguageStars(
  progress: SyntaxSprintProgress | undefined,
  lang: LangId,
): number {
  return getBugLanguageStars(progress, lang);
}

export function getSyntaxSprintTotalStars(
  progress: SyntaxSprintProgress | undefined,
): number {
  return getBugTotalStars(progress);
}

export function getSyntaxSprintLevelStatus(
  progress: SyntaxSprintProgress | undefined,
  lang: LangId,
  levelNumber: number,
): NodeStatus {
  return getBugLevelStatus(progress, lang, levelNumber);
}

export function normalizeGitSimProgress(
  raw?: Partial<GitSimProgress> | null,
): GitSimProgress {
  const out: GitSimProgress = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [levelKey, entry] of Object.entries(raw)) {
    const levelNum = Number(levelKey);
    if (
      !Number.isInteger(levelNum) ||
      levelNum < 1 ||
      levelNum > 30 ||
      !entry ||
      typeof entry !== 'object'
    ) {
      continue;
    }
    const stars =
      entry.stars === 3 ? 3 : entry.stars === 2 ? 2 : entry.stars === 1 ? 1 : null;
    const bestMoves =
      typeof entry.bestMoves === 'number' &&
      Number.isFinite(entry.bestMoves) &&
      entry.bestMoves > 0
        ? Math.round(entry.bestMoves)
        : null;
    if (stars && bestMoves) {
      out[levelNum] = { stars, bestMoves };
    }
  }
  return out;
}

export function getGitSimTotalStars(progress: GitSimProgress | undefined): number {
  if (!progress) return 0;
  let total = 0;
  for (let lvl = 1; lvl <= 30; lvl += 1) {
    total += progress[lvl]?.stars ?? 0;
  }
  return total;
}

export function getGitSimLevelStatus(
  progress: GitSimProgress | undefined,
  levelNumber: number,
): NodeStatus {
  if (progress?.[levelNumber]) {
    return 'completed';
  }
  if (levelNumber <= 1 || progress?.[levelNumber - 1]) {
    return 'active';
  }
  return 'locked';
}

export function normalizeRobotMazeProgress(
  raw?: Partial<RobotMazeProgress> | null,
): RobotMazeProgress {
  const out: RobotMazeProgress = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [levelKey, entry] of Object.entries(raw)) {
    const levelNum = Number(levelKey);
    if (
      !Number.isInteger(levelNum) ||
      levelNum < 1 ||
      levelNum > 30 ||
      !entry ||
      typeof entry !== 'object'
    ) {
      continue;
    }
    const stars =
      entry.stars === 3 ? 3 : entry.stars === 2 ? 2 : entry.stars === 1 ? 1 : null;
    const bestBlocks =
      typeof entry.bestBlocks === 'number' &&
      Number.isFinite(entry.bestBlocks) &&
      entry.bestBlocks > 0
        ? Math.round(entry.bestBlocks)
        : null;
    if (stars && bestBlocks) {
      out[levelNum] = { stars, bestBlocks };
    }
  }
  return out;
}

export function getRobotMazeTotalStars(
  progress: RobotMazeProgress | undefined,
): number {
  if (!progress) return 0;
  let total = 0;
  for (let lvl = 1; lvl <= 30; lvl += 1) {
    total += progress[lvl]?.stars ?? 0;
  }
  return total;
}

export function getRobotMazeLevelStatus(
  progress: RobotMazeProgress | undefined,
  levelNumber: number,
): NodeStatus {
  if (progress?.[levelNumber]) {
    return 'completed';
  }
  if (levelNumber <= 1 || progress?.[levelNumber - 1]) {
    return 'active';
  }
  return 'locked';
}

/** Format a Date into the user's local `YYYY-MM-DD` calendar key. */
export function formatLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatLocalDateKey(d);
}

function dayDiffBetweenKeys(olderKey: string, newerKey: string): number {
  const [oy, om, od] = olderKey.split('-').map(Number);
  const [ny, nm, nd] = newerKey.split('-').map(Number);
  if (!oy || !om || !od || !ny || !nm || !nd) return 999;
  const olderUtc = Date.UTC(oy, om - 1, od);
  const newerUtc = Date.UTC(ny, nm - 1, nd);
  return Math.round((newerUtc - olderUtc) / (24 * 60 * 60 * 1000));
}

function reconcileActivityBreakdown(
  history: Record<string, number>,
  existing?: Record<string, DailyActivityBreakdown>,
): Record<string, DailyActivityBreakdown> {
  const out: Record<string, DailyActivityBreakdown> = { ...(existing ?? {}) };
  for (const [dateKey, rawCount] of Object.entries(history)) {
    const count = Math.max(0, Math.round(rawCount));
    if (count === 0) continue;
    const prev = out[dateKey];
    const prevTotal = prev ? prev.lessons + prev.runs + prev.blitz : 0;
    if (!prev || prevTotal === 0) {
      const lessons = count >= 2 ? Math.max(1, Math.floor(count / 2)) : 0;
      const runs = Math.max(count >= 2 ? 0 : 1, count - lessons);
      out[dateKey] = { lessons, runs, blitz: 0 };
    }
  }
  return out;
}

function reconcileHeartRegen(
  hearts: number,
  maxHearts: number,
  nextHeartAt: number | null | undefined,
  now = Date.now(),
): { hearts: number; nextHeartAt: number | null } {
  const safeMax = Math.max(1, maxHearts || 5);
  const clampedHearts = Math.max(0, Math.min(safeMax, hearts));
  if (clampedHearts >= safeMax) {
    return { hearts: safeMax, nextHeartAt: null };
  }
  if (!nextHeartAt || !Number.isFinite(nextHeartAt)) {
    return { hearts: clampedHearts, nextHeartAt: now + HEART_REGEN_INTERVAL_MS };
  }
  if (now < nextHeartAt) {
    return { hearts: clampedHearts, nextHeartAt };
  }
  const gained = 1 + Math.floor((now - nextHeartAt) / HEART_REGEN_INTERVAL_MS);
  const updatedHearts = Math.min(safeMax, clampedHearts + gained);
  if (updatedHearts >= safeMax) {
    return { hearts: safeMax, nextHeartAt: null };
  }
  return {
    hearts: updatedHearts,
    nextHeartAt: nextHeartAt + gained * HEART_REGEN_INTERVAL_MS,
  };
}

function applyHeartLoss(
  prev: PersistedUserState,
  now = Date.now(),
): Pick<PersistedUserState, 'hearts' | 'nextHeartAt'> {
  const nextHearts = Math.max(0, prev.hearts - 1);
  if (nextHearts >= prev.maxHearts) {
    return { hearts: nextHearts, nextHeartAt: null };
  }
  const existingAnchor =
    typeof prev.nextHeartAt === 'number' && prev.nextHeartAt > now
      ? prev.nextHeartAt
      : now + HEART_REGEN_INTERVAL_MS;
  return {
    hearts: nextHearts,
    nextHeartAt: existingAnchor,
  };
}

function computeFullHeartRefillAt(
  hearts: number,
  maxHearts: number,
  nextHeartAt: number | null | undefined,
): number | null {
  if (hearts >= maxHearts || !nextHeartAt) return null;
  const remainingAdditional = Math.max(0, maxHearts - hearts - 1);
  return nextHeartAt + remainingAdditional * HEART_REGEN_INTERVAL_MS;
}

function cloneInitialCompleted(): Record<LangId, string[]> {
  return {
    python: [...INITIAL_COMPLETED.python],
    cpp: [...INITIAL_COMPLETED.cpp],
    js: [...INITIAL_COMPLETED.js],
    go: [...INITIAL_COMPLETED.go],
    java: [...INITIAL_COMPLETED.java],
    rust: [...INITIAL_COMPLETED.rust],
    sql: [...INITIAL_COMPLETED.sql],
    c: [...INITIAL_COMPLETED.c],
    ts: [...INITIAL_COMPLETED.ts],
    css: [...INITIAL_COMPLETED.css],
    html: [...INITIAL_COMPLETED.html],
    php: [...INITIAL_COMPLETED.php],
    asm: [...INITIAL_COMPLETED.asm],
    swift: [...INITIAL_COMPLETED.swift],
    kotlin: [...INITIAL_COMPLETED.kotlin],
    julia: [...INITIAL_COMPLETED.julia],
    lua: [...INITIAL_COMPLETED.lua],
    csharp: [...INITIAL_COMPLETED.csharp],
  };
}

function createDefaultState(userId = generateLocalUuid()): PersistedUserState {
  return {
    id: userId,
    username: 'Coder',
    handle: '@codelingo_user',
    avatarUrl: null,
    avatarTheme: 'violet',
    activeLang: 'python',
    xp: 0,
    weeklyXp: 0,
    gems: 150,
    hearts: 5,
    maxHearts: 5,
    nextHeartAt: null,
    streak: 0,
    bestStreak: 0,
    streakFreezes: 1,
    lastStreakFreezeDate: null,
    lastActiveDate: null,
    league: computeLeagueForXp(0),
    bugsCrushed: 0,
    blitzBest: 0,
    executions: 0,
    completedNodes: cloneInitialCompleted(),
    nodeAccuracies: {},
    bugCampaignProgress: createEmptyBugCampaignProgress(),
    syntaxSprintProgress: createEmptyBugCampaignProgress(),
    gitSimProgress: {},
    robotMazeProgress: {},
    mistakeVault: [],
    unlockedRoboSkins: ['default_violet'],
    equippedRoboSkin: 'default_violet',
    xpBoostExpiresAt: null,
    completedProjects: [],
    duelsWon: 0,
    duelsPlayed: 0,
    claimedChests: [],
    totalAnswers: 0,
    correctAnswers: 0,
    combo: 0,
    bestCombo: 0,
    activityHistory: {},
    activityBreakdown: {},
    hapticsEnabled: true,
    soundEnabled: true,
    dailyReminderEnabled: false,
    followedRivalIds: [],
    nudgedRivalIds: [],
    hasCompletedOnboarding: false,
    dailyGoalMinutes: 15,
    experienceLevel: 'beginner',
    authProvider: 'guest',
    authEmail: null,
    pendingSync: false,
    lastSyncedAt: null,
  };
}

function createFreshResetState(userId = generateLocalUuid()): PersistedUserState {
  return {
    ...createDefaultState(userId),
    pendingSync: false,
  };
}

function recordTodayActivityState(
  prev: PersistedUserState,
  kind: keyof DailyActivityBreakdown,
  delta: number,
  countsTowardStreak: boolean,
): Pick<
  PersistedUserState,
  | 'streak'
  | 'bestStreak'
  | 'lastActiveDate'
  | 'activityHistory'
  | 'activityBreakdown'
> {
  const today = formatLocalDateKey();
  const yesterday = localDateKeyDaysAgo(1);
  const nextHistory: Record<string, number> = {
    ...(prev.activityHistory ?? {}),
    [today]: (prev.activityHistory?.[today] ?? 0) + delta,
  };
  const existingDayBreakdown = prev.activityBreakdown?.[today] ?? {
    lessons: 0,
    runs: 0,
    blitz: 0,
  };
  const nextBreakdown: Record<string, DailyActivityBreakdown> = {
    ...(prev.activityBreakdown ?? {}),
    [today]: {
      ...existingDayBreakdown,
      [kind]: existingDayBreakdown[kind] + 1,
    },
  };

  if (!countsTowardStreak) {
    return {
      streak: prev.streak,
      bestStreak: Math.max(prev.bestStreak ?? prev.streak, prev.streak),
      lastActiveDate: prev.lastActiveDate,
      activityHistory: nextHistory,
      activityBreakdown: nextBreakdown,
    };
  }

  let nextStreak: number;
  if (prev.lastActiveDate === today) {
    nextStreak = Math.max(1, prev.streak);
  } else if (
    prev.streak > 0 &&
    (prev.lastActiveDate === yesterday ||
      prev.lastStreakFreezeDate === yesterday ||
      prev.lastActiveDate === null)
  ) {
    nextStreak = prev.streak + 1;
  } else {
    nextStreak = 1;
  }

  return {
    streak: nextStreak,
    bestStreak: Math.max(prev.bestStreak ?? prev.streak, nextStreak),
    lastActiveDate: today,
    activityHistory: nextHistory,
    activityBreakdown: nextBreakdown,
  };
}

function reconcileHydratedStreak(
  state: PersistedUserState,
): Pick<
  PersistedUserState,
  'streak' | 'bestStreak' | 'streakFreezes' | 'lastStreakFreezeDate' | 'lastActiveDate'
> {
  const today = formatLocalDateKey();
  const yesterday = localDateKeyDaysAgo(1);
  const freezes = Math.max(0, state.streakFreezes ?? 1);
  const bestStreak = Math.max(state.bestStreak ?? state.streak, state.streak);

  if (!state.lastActiveDate) {
    if (state.streak > 0) {
      const hasActivityToday = (state.activityHistory?.[today] ?? 0) > 0;
      return {
        streak: state.streak,
        bestStreak,
        streakFreezes: freezes,
        lastStreakFreezeDate: state.lastStreakFreezeDate ?? null,
        lastActiveDate: hasActivityToday ? today : yesterday,
      };
    }
    return {
      streak: 0,
      bestStreak,
      streakFreezes: freezes,
      lastStreakFreezeDate: state.lastStreakFreezeDate ?? null,
      lastActiveDate: null,
    };
  }

  const gap = dayDiffBetweenKeys(state.lastActiveDate, today);
  if (gap <= 1) {
    return {
      streak: state.streak,
      bestStreak,
      streakFreezes: freezes,
      lastStreakFreezeDate: state.lastStreakFreezeDate ?? null,
      lastActiveDate: state.lastActiveDate,
    };
  }

  if (gap === 2 && state.streak > 0) {
    if (state.lastStreakFreezeDate === yesterday) {
      return {
        streak: state.streak,
        bestStreak,
        streakFreezes: freezes,
        lastStreakFreezeDate: yesterday,
        lastActiveDate: state.lastActiveDate,
      };
    }
    if (freezes > 0) {
      return {
        streak: state.streak,
        bestStreak,
        streakFreezes: freezes - 1,
        lastStreakFreezeDate: yesterday,
        lastActiveDate: state.lastActiveDate,
      };
    }
  }

  return {
    streak: 0,
    bestStreak,
    streakFreezes: freezes,
    lastStreakFreezeDate: state.lastStreakFreezeDate ?? null,
    lastActiveDate: state.lastActiveDate,
  };
}

export interface UserStoreValue {
  // User profile & economy
  userId: string;
  username: string;
  handle: string;
  avatarUrl: string | null;
  avatarTheme: AvatarThemeId;
  league: string;
  xp: number;
  weeklyXp: number;
  streak: number;
  bestStreak: number;
  streakFreezes: number;
  lastStreakFreezeDate: string | null;
  lastActiveDate: string | null;
  gems: number;
  hearts: number;
  maxHearts: number;
  nextHeartAt: number | null;
  activeLang: LangId;

  // Onboarding & Cloud Auth state
  hasCompletedOnboarding: boolean;
  dailyGoalMinutes: DailyGoalMinutes;
  experienceLevel: ExperienceLevel;
  authProvider: AuthProviderKind;
  authEmail: string | null;
  isGuest: boolean;
  pendingFirstLessonLaunch: boolean;
  clearPendingFirstLessonLaunch: () => void;

  // Progress & practice counters
  completedNodes: Record<LangId, string[]>;
  nodeAccuracies: Record<string, number>;
  bugCampaignProgress: BugCampaignProgress;
  syntaxSprintProgress: SyntaxSprintProgress;
  gitSimProgress: GitSimProgress;
  robotMazeProgress: RobotMazeProgress;
  mistakeVault: MistakeVaultItem[];
  unlockedRoboSkins: RoboSkinId[];
  equippedRoboSkin: RoboSkinId;
  xpBoostExpiresAt: number | null;
  isXpBoostActive: boolean;
  xpBoostRemainingSec: number;
  completedProjects: string[];
  duelsWon: number;
  duelsPlayed: number;
  claimedChests: string[];
  combo: number;
  bestCombo: number;
  totalAnswers: number;
  correctAnswers: number;
  bugsCrushed: number;
  blitzBest: number;
  executions: number;
  activityHistory: Record<string, number>;
  activityBreakdown: Record<string, DailyActivityBreakdown>;

  // Preferences & social
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  followedRivalIds: string[];
  nudgedRivalIds: string[];

  // Leaderboard & cloud sync metadata
  liveLeaderboard: LeaderboardEntry[];
  leaderboardSource: 'supabase' | 'offline';
  cloudConfigured: boolean;
  pendingSync: boolean;
  lastSyncedAt: string | null;
  isHydrated: boolean;

  // Cross-tab Blitz Heart Recovery trigger
  pendingBlitzRecovery: string | null;
  requestBlitzRecovery: (returnLessonId?: string) => void;
  clearBlitzRecovery: () => void;

  // Actions
  getNodeStatus: (
    lang: LangId,
    nodeId: string,
    allNodesInOrder: readonly { id: string }[],
  ) => NodeStatus;
  setActiveLang: (lang: LangId) => void;
  recordAnswer: (correct: boolean) => void;
  loseHeart: () => void;
  decrementHeart: () => void;
  completeLesson: (input: CompleteLessonInput) => void;
  completeNode: (lang: LangId, nodeId: string, xpReward?: number) => void;
  claimChest: (chestId: string, xpReward?: number, gemReward?: number) => void;
  refillHearts: () => boolean;
  refillHeartsWithGems: () => boolean;
  buySingleHeart: () => boolean;
  earnBlitzHearts: (amount?: number) => number;
  recordBlitzScore: (score: number, bugsFixed: number, xpEarned?: number) => void;
  recordBugLevelCompletion: (input: RecordBugLevelInput) => RecordBugLevelResult;
  recordSyntaxSprintCompletion: (input: RecordBugLevelInput) => RecordBugLevelResult;
  recordGitSimCompletion: (input: RecordGitSimLevelInput) => RecordGitSimLevelResult;
  recordRobotMazeCompletion: (
    input: RecordRobotMazeLevelInput,
  ) => RecordRobotMazeLevelResult;
  recordExecution: () => void;
  updateProfile: (updates: {
    username?: string;
    handle?: string;
    activeLang?: LangId;
    avatarTheme?: AvatarThemeId;
  }) => void;
  setPreferences: (prefs: {
    hapticsEnabled?: boolean;
    soundEnabled?: boolean;
    dailyReminderEnabled?: boolean;
  }) => void;
  buyStreakFreeze: () => boolean;
  addMistakeToVault: (
    item: Omit<MistakeVaultItem, 'id' | 'timestamp'> & { id?: string },
  ) => void;
  resolveMistakeFromVault: (id: string) => { xpEarned: number };
  purchaseRoboSkin: (skinId: RoboSkinId, cost: number) => boolean;
  equipRoboSkin: (skinId: RoboSkinId) => void;
  activateXpOverclock: () => boolean;
  completeGuidedProject: (projectId: string) => {
    xpEarned: number;
    gemsEarned: number;
    firstClear: boolean;
  };
  recordDuelVictory: (won: boolean) => {
    xpEarned: number;
    gemsEarned: number;
  };
  toggleFollowRival: (rivalId: string) => boolean;
  nudgeRival: (rivalId: string) => void;
  syncNow: () => Promise<{ synced: boolean; error?: string }>;
  refreshLeaderboard: () => Promise<void>;
  completeOnboarding: (input: {
    activeLang: LangId;
    dailyGoalMinutes: DailyGoalMinutes;
    experienceLevel?: ExperienceLevel;
    username: string;
    dailyReminderEnabled?: boolean;
    launchFirstLesson?: boolean;
  }) => void;
  linkCloudAccount: (session: CloudAuthSessionInfo) => Promise<{ merged: boolean }>;
  signOutAccount: () => Promise<void>;
  deleteAccountAndResetData: () => Promise<{ error?: string }>;
  resetProgress: () => void;
}

const UserStoreContext = createContext<UserStoreValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedUserState>(() => createDefaultState());
  const stateRef = useRef<PersistedUserState>(state);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingBlitzRecovery, setPendingBlitzRecovery] = useState<string | null>(null);
  const [pendingFirstLessonLaunch, setPendingFirstLessonLaunch] = useState(false);
  const [boostClockMs, setBoostClockMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const expiresAt = state.xpBoostExpiresAt;
    if (!expiresAt || expiresAt <= Date.now()) {
      return;
    }
    const id = setInterval(() => {
      const now = Date.now();
      setBoostClockMs(now);
      if (now >= expiresAt) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.xpBoostExpiresAt]);

  const [liveLeaderboard, setLiveLeaderboard] = useState<LeaderboardEntry[]>(() =>
    buildLocalLeaderboard({
      id: state.id,
      username: state.username,
      handle: state.handle,
      xp: state.xp,
      weeklyXp: state.weeklyXp,
      streak: state.streak,
      bugsCrushed: state.bugsCrushed,
      activeLang: state.activeLang,
      league: state.league,
    }),
  );
  const [leaderboardSource, setLeaderboardSource] = useState<'supabase' | 'offline'>('offline');

  const commitState = useCallback(
    (updater: (prev: PersistedUserState) => PersistedUserState) => {
      setState((prev) => {
        const next = updater(prev);
        stateRef.current = next;
        void saveCachedUserData(next);
        setLiveLeaderboard(
          buildLocalLeaderboard({
            id: next.id,
            username: next.username,
            handle: next.handle,
            xp: next.xp,
            weeklyXp: next.weeklyXp,
            streak: next.streak,
            bugsCrushed: next.bugsCrushed,
            activeLang: next.activeLang,
            league: next.league,
          }),
        );
        return next;
      });
    },
    [],
  );

  const refreshLeaderboard = useCallback(async () => {
    const cur = stateRef.current;
    const res = await fetchLiveLeaderboard({
      id: cur.id,
      username: cur.username,
      handle: cur.handle,
      xp: cur.xp,
      weeklyXp: cur.weeklyXp,
      streak: cur.streak,
      bugsCrushed: cur.bugsCrushed,
      activeLang: cur.activeLang,
      league: cur.league,
    });
    setLiveLeaderboard(res.entries);
    setLeaderboardSource(res.source);
  }, []);

  // Hydrate offline-first state from AsyncStorage on boot, then refresh leaderboard / sync pending state
  useEffect(() => {
    let active = true;
    const detachAppState = attachSupabaseAppStateListener();

    (async () => {
      const cached = await loadCachedUserData();
      if (!active) return;

      let resolvedState = stateRef.current;
      if (cached) {
        const safeMaxHearts =
          typeof cached.maxHearts === 'number' && cached.maxHearts > 0
            ? cached.maxHearts
            : 5;
        const cachedHeartsRaw =
          typeof cached.hearts === 'number' && cached.hearts >= 0
            ? Math.min(safeMaxHearts, cached.hearts)
            : safeMaxHearts;
        const regen = reconcileHeartRegen(
          cachedHeartsRaw,
          safeMaxHearts,
          cached.nextHeartAt ?? null,
        );

        const hydratedActivityHistory = cached.activityHistory ?? {};
        const hydratedActivityBreakdown = reconcileActivityBreakdown(
          hydratedActivityHistory,
          cached.activityBreakdown,
        );

        const rawResolved: PersistedUserState = {
          ...createDefaultState(typeof cached.id === 'string' && cached.id ? cached.id : undefined),
          ...cached,
          maxHearts: safeMaxHearts,
          hearts: regen.hearts,
          nextHeartAt: regen.nextHeartAt,
          avatarTheme: cached.avatarTheme ?? 'violet',
          hapticsEnabled: cached.hapticsEnabled ?? true,
          soundEnabled: cached.soundEnabled ?? true,
          dailyReminderEnabled: cached.dailyReminderEnabled ?? false,
          followedRivalIds: cached.followedRivalIds ?? [],
          nudgedRivalIds: cached.nudgedRivalIds ?? [],
          activityHistory: hydratedActivityHistory,
          activityBreakdown: hydratedActivityBreakdown,
          streakFreezes:
            typeof cached.streakFreezes === 'number'
              ? Math.max(0, Math.min(MAX_STREAK_FREEZES, cached.streakFreezes))
              : 1,
          bestStreak: Math.max(cached.bestStreak ?? 0, cached.streak ?? 0),
          completedNodes: {
            python: cached.completedNodes?.python ?? [],
            cpp: cached.completedNodes?.cpp ?? [],
            js: cached.completedNodes?.js ?? [],
            go: cached.completedNodes?.go ?? [],
            java: cached.completedNodes?.java ?? [],
            rust: cached.completedNodes?.rust ?? [],
            sql: cached.completedNodes?.sql ?? [],
            c: cached.completedNodes?.c ?? [],
            ts: cached.completedNodes?.ts ?? [],
            css: cached.completedNodes?.css ?? [],
            html: cached.completedNodes?.html ?? [],
            php: cached.completedNodes?.php ?? [],
            asm: cached.completedNodes?.asm ?? [],
            swift: cached.completedNodes?.swift ?? [],
            kotlin: cached.completedNodes?.kotlin ?? [],
            julia: cached.completedNodes?.julia ?? [],
            lua: cached.completedNodes?.lua ?? [],
            csharp: cached.completedNodes?.csharp ?? [],
          },
          nodeAccuracies: cached.nodeAccuracies ?? {},
          bugCampaignProgress: normalizeBugCampaignProgress(cached.bugCampaignProgress),
          syntaxSprintProgress: normalizeSyntaxSprintProgress(
            cached.syntaxSprintProgress,
          ),
          gitSimProgress: normalizeGitSimProgress(cached.gitSimProgress),
          robotMazeProgress: normalizeRobotMazeProgress(cached.robotMazeProgress),
          mistakeVault: Array.isArray(cached.mistakeVault) ? cached.mistakeVault : [],
          unlockedRoboSkins:
            Array.isArray(cached.unlockedRoboSkins) && cached.unlockedRoboSkins.length > 0
              ? Array.from(new Set(['default_violet', ...cached.unlockedRoboSkins]))
              : ['default_violet'],
          equippedRoboSkin: cached.equippedRoboSkin ?? 'default_violet',
          xpBoostExpiresAt:
            typeof cached.xpBoostExpiresAt === 'number' && cached.xpBoostExpiresAt > Date.now()
              ? cached.xpBoostExpiresAt
              : null,
          completedProjects: Array.isArray(cached.completedProjects)
            ? cached.completedProjects
            : [],
          duelsWon:
            typeof cached.duelsWon === 'number' && cached.duelsWon >= 0
              ? cached.duelsWon
              : 0,
          duelsPlayed:
            typeof cached.duelsPlayed === 'number' && cached.duelsPlayed >= 0
              ? cached.duelsPlayed
              : 0,
          claimedChests: cached.claimedChests ?? [],
          hasCompletedOnboarding:
            typeof cached.hasCompletedOnboarding === 'boolean'
              ? cached.hasCompletedOnboarding
              : false,
          dailyGoalMinutes:
            cached.dailyGoalMinutes === 5 ||
            cached.dailyGoalMinutes === 15 ||
            cached.dailyGoalMinutes === 30
              ? cached.dailyGoalMinutes
              : Number(cached.dailyGoalMinutes) === 20
                ? 30
                : 15,
          experienceLevel:
            cached.experienceLevel === 'beginner' ||
            cached.experienceLevel === 'basics' ||
            cached.experienceLevel === 'experienced'
              ? cached.experienceLevel
              : 'beginner',
          authProvider: cached.authProvider ?? 'guest',
          authEmail: cached.authEmail ?? null,
        };
        const reconciledStreak = reconcileHydratedStreak(rawResolved);
        resolvedState = {
          ...rawResolved,
          ...reconciledStreak,
          league: computeLeagueForXp(rawResolved.xp),
        };
        setHapticsEnabled(resolvedState.hapticsEnabled ?? true);
        setSoundsEnabled(resolvedState.soundEnabled ?? true);
        stateRef.current = resolvedState;
        setState(resolvedState);
        if (
          resolvedState.streak !== cached.streak ||
          resolvedState.streakFreezes !== cached.streakFreezes ||
          resolvedState.lastStreakFreezeDate !== cached.lastStreakFreezeDate ||
          resolvedState.league !== cached.league ||
          resolvedState.bestStreak !== cached.bestStreak ||
          resolvedState.hearts !== cached.hearts ||
          resolvedState.nextHeartAt !== cached.nextHeartAt
        ) {
          void saveCachedUserData(resolvedState);
        }
      } else {
        setHapticsEnabled(true);
        setSoundsEnabled(true);
        void saveCachedUserData(resolvedState);
      }

      if (isCloudConfigured) {
        const authSession = await getCurrentAuthSession();
        if (active && authSession) {
          const snapshot = await fetchCloudAccountSnapshot(authSession.userId);
          if (active) {
            resolvedState = mergeGuestAndCloudState(resolvedState, snapshot, authSession);
            stateRef.current = resolvedState;
            setState(resolvedState);
            void saveCachedUserData(resolvedState);
          }
        }
      }

      if (!active) return;
      setIsHydrated(true);

      // Background sync only once the user has started or linked an account
      if (
        isCloudConfigured &&
        (resolvedState.hasCompletedOnboarding ||
          resolvedState.authProvider === 'email' ||
          resolvedState.authProvider === 'apple')
      ) {
        const res = await syncProfileToCloud(resolvedState);
        if (active && res.synced) {
          commitState((prev) => ({
            ...prev,
            pendingSync: false,
            lastSyncedAt: new Date().toISOString(),
          }));
        }
      }

      const lb = await fetchLiveLeaderboard({
        id: resolvedState.id,
        username: resolvedState.username,
        handle: resolvedState.handle,
        xp: resolvedState.xp,
        weeklyXp: resolvedState.weeklyXp,
        streak: resolvedState.streak,
        bugsCrushed: resolvedState.bugsCrushed,
        activeLang: resolvedState.activeLang,
        league: resolvedState.league,
      });
      if (active) {
        setLiveLeaderboard(lb.entries);
        setLeaderboardSource(lb.source);
      }
    })();

    return () => {
      active = false;
      detachAppState();
    };
  }, [commitState]);

  const setActiveLang = useCallback(
    (lang: LangId) => {
      commitState((prev) => {
        const next: PersistedUserState = {
          ...prev,
          activeLang: lang,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
    },
    [commitState],
  );

  const loseHeart = useCallback(() => {
    commitState((prev) => {
      const heartPatch = applyHeartLoss(prev);
      const next: PersistedUserState = {
        ...prev,
        ...heartPatch,
        combo: 0,
        pendingSync: true,
      };
      void syncProfileToCloud(next);
      return next;
    });
  }, [commitState]);

  const recordAnswer = useCallback(
    (correct: boolean) => {
      commitState((prev) => {
        const nextCombo = correct ? prev.combo + 1 : 0;
        const heartPatch = correct
          ? { hearts: prev.hearts, nextHeartAt: prev.nextHeartAt ?? null }
          : applyHeartLoss(prev);
        const next: PersistedUserState = {
          ...prev,
          totalAnswers: prev.totalAnswers + 1,
          correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
          combo: nextCombo,
          bestCombo: Math.max(prev.bestCombo, nextCombo),
          ...heartPatch,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
    },
    [commitState],
  );

  const completeLesson = useCallback(
    (input: CompleteLessonInput) => {
      const completedAt = new Date().toISOString();

      commitState((prev) => {
        const existing = prev.completedNodes[input.lang] ?? [];
        const updatedNodes = existing.includes(input.nodeId)
          ? existing
          : [...existing, input.nodeId];

        const updatedChests =
          input.isCubeCheckpoint && !prev.claimedChests.includes(input.nodeId)
            ? [...prev.claimedChests, input.nodeId]
            : prev.claimedChests;

        const xpAward = applyXpMultiplier(input.xpReward, prev.xpBoostExpiresAt);
        const nextXp = prev.xp + xpAward;
        const activityUpdate = recordTodayActivityState(prev, 'lessons', 2, true);

        const next: PersistedUserState = {
          ...prev,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + xpAward,
          gems: prev.gems + input.gemReward,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          completedNodes: {
            ...prev.completedNodes,
            [input.lang]: updatedNodes,
          },
          nodeAccuracies: {
            ...prev.nodeAccuracies,
            [input.nodeId]: Math.max(0, Math.min(100, Math.round(input.accuracy))),
          },
          claimedChests: updatedChests,
          pendingSync: true,
        };

        void completeLessonTransaction({
          profile: next,
          language: input.lang,
          unitId: input.unitId,
          nodeId: input.nodeId,
          accuracy: input.accuracy,
          completedAt,
        }).then((res) => {
          if (res.synced) {
            void refreshLeaderboard();
          }
        });

        return next;
      });
    },
    [commitState, refreshLeaderboard],
  );

  const completeNode = useCallback(
    (lang: LangId, nodeId: string, xpReward = 25) => {
      completeLesson({
        lang,
        unitId: `${lang}-unit-1`,
        nodeId,
        xpReward,
        gemReward: 10,
        accuracy: 100,
      });
    },
    [completeLesson],
  );

  const claimChest = useCallback(
    (chestId: string, xpReward = 25, gemReward = 25) => {
      commitState((prev) => {
        if (prev.claimedChests.includes(chestId)) return prev;
        const nextXp = prev.xp + xpReward;
        const activityUpdate = recordTodayActivityState(prev, 'lessons', 1, true);
        const next: PersistedUserState = {
          ...prev,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + xpReward,
          gems: prev.gems + gemReward,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          claimedChests: [...prev.claimedChests, chestId],
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
    },
    [commitState],
  );

  const purchaseHeartRefill = useCallback((): boolean => {
    const current = stateRef.current;
    if (current.hearts >= current.maxHearts || current.gems < HEART_REFILL_COST) {
      return false;
    }

    const nextGems = current.gems - HEART_REFILL_COST;
    const nextHearts = current.maxHearts;

    commitState((prev) => ({
      ...prev,
      gems: nextGems,
      hearts: nextHearts,
      nextHeartAt: null,
      pendingSync: true,
    }));

    void refillHeartsWithGems(current.id, nextGems, nextHearts);
    return true;
  }, [commitState]);

  const buySingleHeart = useCallback((): boolean => {
    const current = stateRef.current;
    if (current.hearts >= current.maxHearts || current.gems < SINGLE_HEART_COST) {
      return false;
    }

    const nextGems = current.gems - SINGLE_HEART_COST;
    const nextHearts = Math.min(current.maxHearts, current.hearts + 1);

    commitState((prev) => ({
      ...prev,
      gems: nextGems,
      hearts: nextHearts,
      nextHeartAt: nextHearts >= prev.maxHearts ? null : prev.nextHeartAt ?? Date.now() + HEART_REGEN_INTERVAL_MS,
      pendingSync: true,
    }));

    void refillHeartsWithGems(current.id, nextGems, nextHearts);
    return true;
  }, [commitState]);

  const buyStreakFreeze = useCallback((): boolean => {
    const current = stateRef.current;
    const currentFreezes = current.streakFreezes ?? 0;
    if (currentFreezes >= MAX_STREAK_FREEZES || current.gems < STREAK_FREEZE_COST) {
      return false;
    }

    commitState((prev) => {
      const next: PersistedUserState = {
        ...prev,
        gems: Math.max(0, prev.gems - STREAK_FREEZE_COST),
        streakFreezes: Math.min(MAX_STREAK_FREEZES, (prev.streakFreezes ?? 0) + 1),
        pendingSync: true,
      };
      void syncProfileToCloud(next);
      return next;
    });

    return true;
  }, [commitState]);

  const earnBlitzHearts = useCallback(
    (amount = BLITZ_HEART_REWARD): number => {
      const current = stateRef.current;
      const recovered = Math.max(0, Math.min(amount, current.maxHearts - current.hearts));
      if (recovered === 0) return 0;

      commitState((prev) => {
        const nextHearts = Math.min(prev.maxHearts, prev.hearts + amount);
        const next: PersistedUserState = {
          ...prev,
          hearts: nextHearts,
          nextHeartAt:
            nextHearts >= prev.maxHearts
              ? null
              : prev.nextHeartAt ?? Date.now() + HEART_REGEN_INTERVAL_MS,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return recovered;
    },
    [commitState],
  );

  const recordBlitzScore = useCallback(
    (score: number, bugsFixed: number, xpEarned?: number) => {
      const bonusXp =
        typeof xpEarned === 'number' ? xpEarned : bugsFixed * 15;
      const bonusGems = bugsFixed > 0 ? Math.min(16, bugsFixed * 2) : 0;
      commitState((prev) => {
        const nextXp = prev.xp + bonusXp;
        const activityUpdate = recordTodayActivityState(
          prev,
          'blitz',
          bugsFixed > 0 ? 2 : 1,
          bugsFixed > 0 || score > 0,
        );
        const next: PersistedUserState = {
          ...prev,
          blitzBest: Math.max(prev.blitzBest, score),
          bugsCrushed: prev.bugsCrushed + bugsFixed,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + bonusXp,
          gems: prev.gems + bonusGems,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
    },
    [commitState],
  );

  const recordBugLevelCompletion = useCallback(
    (input: RecordBugLevelInput): RecordBugLevelResult => {
      const snapshot = normalizeBugCampaignProgress(stateRef.current.bugCampaignProgress);
      const prevEntry = snapshot[input.lang]?.[input.levelNumber];
      const isFirstClear = !prevEntry;
      const isNewBestStars = prevEntry ? input.stars > prevEntry.stars : true;
      const cleanElapsed = Math.max(100, Math.round(input.elapsedMs));
      const bestStars = (prevEntry
        ? Math.max(prevEntry.stars, input.stars)
        : input.stars) as 1 | 2 | 3;
      const bestTimeMs = prevEntry
        ? Math.min(prevEntry.bestTimeMs, cleanElapsed)
        : cleanElapsed;

      const baseXp = isFirstClear ? input.xpReward : 5;
      const earnedXp = applyXpMultiplier(baseXp, stateRef.current.xpBoostExpiresAt);
      const earnedGems = isFirstClear ? input.gemReward : isNewBestStars ? 3 : 1;
      const bugsFixed = Math.max(1, input.bugsFixed ?? 1);

      commitState((prev) => {
        const prevProgress = normalizeBugCampaignProgress(prev.bugCampaignProgress);
        const prevLangMap = prevProgress[input.lang] ?? {};
        const nextLangMap: Record<number, BugLevelProgress> = {
          ...prevLangMap,
          [input.levelNumber]: { stars: bestStars, bestTimeMs },
        };
        const nextProgress: BugCampaignProgress = {
          ...prevProgress,
          [input.lang]: nextLangMap,
        };
        const nextXp = prev.xp + earnedXp;
        const completedInLang = Object.keys(nextLangMap).length;
        const activityUpdate = recordTodayActivityState(
          prev,
          'blitz',
          bugsFixed,
          true,
        );
        const next: PersistedUserState = {
          ...prev,
          bugCampaignProgress: nextProgress,
          bugsCrushed: prev.bugsCrushed + bugsFixed,
          blitzBest: Math.max(prev.blitzBest, completedInLang),
          xp: nextXp,
          weeklyXp: prev.weeklyXp + earnedXp,
          gems: prev.gems + earnedGems,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return {
        earnedXp,
        earnedGems,
        isFirstClear,
        isNewBestStars,
        bestStars,
        bestTimeMs,
      };
    },
    [commitState],
  );

  const recordSyntaxSprintCompletion = useCallback(
    (input: RecordBugLevelInput): RecordBugLevelResult => {
      const snapshot = normalizeSyntaxSprintProgress(
        stateRef.current.syntaxSprintProgress,
      );
      const prevEntry = snapshot[input.lang]?.[input.levelNumber];
      const isFirstClear = !prevEntry;
      const isNewBestStars = prevEntry ? input.stars > prevEntry.stars : true;
      const cleanElapsed = Math.max(100, Math.round(input.elapsedMs));
      const bestStars = (prevEntry
        ? Math.max(prevEntry.stars, input.stars)
        : input.stars) as 1 | 2 | 3;
      const bestTimeMs = prevEntry
        ? Math.min(prevEntry.bestTimeMs, cleanElapsed)
        : cleanElapsed;

      const baseXp = isFirstClear ? input.xpReward : 6;
      const earnedXp = applyXpMultiplier(baseXp, stateRef.current.xpBoostExpiresAt);
      const earnedGems = isFirstClear ? input.gemReward : isNewBestStars ? 3 : 1;

      commitState((prev) => {
        const prevProgress = normalizeSyntaxSprintProgress(
          prev.syntaxSprintProgress,
        );
        const prevLangMap = prevProgress[input.lang] ?? {};
        const nextLangMap: Record<number, BugLevelProgress> = {
          ...prevLangMap,
          [input.levelNumber]: { stars: bestStars, bestTimeMs },
        };
        const nextProgress: SyntaxSprintProgress = {
          ...prevProgress,
          [input.lang]: nextLangMap,
        };
        const nextXp = prev.xp + earnedXp;
        const activityUpdate = recordTodayActivityState(
          prev,
          'blitz',
          1,
          true,
        );
        const next: PersistedUserState = {
          ...prev,
          syntaxSprintProgress: nextProgress,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + earnedXp,
          gems: prev.gems + earnedGems,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return {
        earnedXp,
        earnedGems,
        isFirstClear,
        isNewBestStars,
        bestStars,
        bestTimeMs,
      };
    },
    [commitState],
  );

  const recordGitSimCompletion = useCallback(
    (input: RecordGitSimLevelInput): RecordGitSimLevelResult => {
      const snapshot = normalizeGitSimProgress(stateRef.current.gitSimProgress);
      const prevEntry = snapshot[input.levelNumber];
      const isFirstClear = !prevEntry;
      const isNewBestStars = prevEntry ? input.stars > prevEntry.stars : true;
      const cleanMoves = Math.max(1, Math.round(input.movesUsed));
      const bestStars = (prevEntry
        ? Math.max(prevEntry.stars, input.stars)
        : input.stars) as 1 | 2 | 3;
      const bestMoves = prevEntry
        ? Math.min(prevEntry.bestMoves, cleanMoves)
        : cleanMoves;

      const baseXp = isFirstClear ? input.xpReward : 6;
      const earnedXp = applyXpMultiplier(baseXp, stateRef.current.xpBoostExpiresAt);
      const earnedGems = isFirstClear ? input.gemReward : isNewBestStars ? 3 : 1;

      commitState((prev) => {
        const prevProgress = normalizeGitSimProgress(prev.gitSimProgress);
        const nextProgress: GitSimProgress = {
          ...prevProgress,
          [input.levelNumber]: { stars: bestStars, bestMoves },
        };
        const nextXp = prev.xp + earnedXp;
        const activityUpdate = recordTodayActivityState(
          prev,
          'blitz',
          1,
          true,
        );
        const next: PersistedUserState = {
          ...prev,
          gitSimProgress: nextProgress,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + earnedXp,
          gems: prev.gems + earnedGems,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return {
        earnedXp,
        earnedGems,
        isFirstClear,
        isNewBestStars,
        bestStars,
        bestMoves,
      };
    },
    [commitState],
  );

  const recordRobotMazeCompletion = useCallback(
    (input: RecordRobotMazeLevelInput): RecordRobotMazeLevelResult => {
      const snapshot = normalizeRobotMazeProgress(
        stateRef.current.robotMazeProgress,
      );
      const prevEntry = snapshot[input.levelNumber];
      const isFirstClear = !prevEntry;
      const isNewBestStars = prevEntry ? input.stars > prevEntry.stars : true;
      const cleanBlocks = Math.max(1, Math.round(input.blocksUsed));
      const bestStars = (prevEntry
        ? Math.max(prevEntry.stars, input.stars)
        : input.stars) as 1 | 2 | 3;
      const bestBlocks = prevEntry
        ? Math.min(prevEntry.bestBlocks, cleanBlocks)
        : cleanBlocks;

      const baseXp = isFirstClear ? input.xpReward : 6;
      const earnedXp = applyXpMultiplier(baseXp, stateRef.current.xpBoostExpiresAt);
      const earnedGems = isFirstClear ? input.gemReward : isNewBestStars ? 3 : 1;

      commitState((prev) => {
        const prevProgress = normalizeRobotMazeProgress(prev.robotMazeProgress);
        const nextProgress: RobotMazeProgress = {
          ...prevProgress,
          [input.levelNumber]: { stars: bestStars, bestBlocks },
        };
        const nextXp = prev.xp + earnedXp;
        const activityUpdate = recordTodayActivityState(
          prev,
          'blitz',
          1,
          true,
        );
        const next: PersistedUserState = {
          ...prev,
          robotMazeProgress: nextProgress,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + earnedXp,
          gems: prev.gems + earnedGems,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return {
        earnedXp,
        earnedGems,
        isFirstClear,
        isNewBestStars,
        bestStars,
        bestBlocks,
      };
    },
    [commitState],
  );

  const requestBlitzRecovery = useCallback((returnLessonId?: string) => {
    setPendingBlitzRecovery(returnLessonId && returnLessonId.length > 0 ? returnLessonId : '__recovery__');
  }, []);

  const clearBlitzRecovery = useCallback(() => {
    setPendingBlitzRecovery(null);
  }, []);

  const getNodeStatus = useCallback(
    (
      lang: LangId,
      nodeId: string,
      allNodesInOrder: readonly { id: string }[],
    ): NodeStatus =>
      computeNodeStatus(
        state.completedNodes[lang] ?? [],
        nodeId,
        allNodesInOrder,
      ),
    [state.completedNodes],
  );

  const recordExecution = useCallback(() => {
    commitState((prev) => {
      const activityUpdate = recordTodayActivityState(prev, 'runs', 1, false);
      const next: PersistedUserState = {
        ...prev,
        executions: prev.executions + 1,
        ...activityUpdate,
        pendingSync: true,
      };
      void syncProfileToCloud(next);
      return next;
    });
  }, [commitState]);

  const updateProfile = useCallback(
    (updates: {
      username?: string;
      handle?: string;
      activeLang?: LangId;
      avatarTheme?: AvatarThemeId;
    }) => {
      commitState((prev) => {
        const cleanName =
          updates.username !== undefined && updates.username.trim().length > 0
            ? updates.username.trim().slice(0, 20)
            : prev.username;
        let cleanHandle = prev.handle;
        if (updates.handle !== undefined && updates.handle.trim().length > 0) {
          const raw = updates.handle.trim().replace(/\s+/g, '_').slice(0, 20);
          cleanHandle = raw.startsWith('@') ? raw : `@${raw}`;
        }
        const next: PersistedUserState = {
          ...prev,
          username: cleanName,
          handle: cleanHandle,
          activeLang: updates.activeLang ?? prev.activeLang,
          avatarTheme: updates.avatarTheme ?? prev.avatarTheme ?? 'violet',
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
    },
    [commitState],
  );

  const setPreferences = useCallback(
    (prefs: {
      hapticsEnabled?: boolean;
      soundEnabled?: boolean;
      dailyReminderEnabled?: boolean;
    }) => {
      if (typeof prefs.hapticsEnabled === 'boolean') {
        setHapticsEnabled(prefs.hapticsEnabled);
      }
      if (typeof prefs.soundEnabled === 'boolean') {
        setSoundsEnabled(prefs.soundEnabled);
      }
      commitState((prev) => ({
        ...prev,
        hapticsEnabled:
          prefs.hapticsEnabled ?? prev.hapticsEnabled ?? true,
        soundEnabled:
          prefs.soundEnabled ?? prev.soundEnabled ?? true,
        dailyReminderEnabled:
          prefs.dailyReminderEnabled ?? prev.dailyReminderEnabled ?? false,
      }));
    },
    [commitState],
  );

  const addMistakeToVault = useCallback(
    (item: Omit<MistakeVaultItem, 'id' | 'timestamp'> & { id?: string }) => {
      commitState((prev) => {
        const current = prev.mistakeVault ?? [];
        const dedupKey = `${item.language}::${item.prompt.trim()}::${item.codeSnippet.trim()}`;
        const existingIdx = current.findIndex(
          (entry) =>
            `${entry.language}::${entry.prompt.trim()}::${entry.codeSnippet.trim()}` ===
            dedupKey,
        );
        const timestamp = new Date().toISOString();
        const entry: MistakeVaultItem = {
          ...item,
          id:
            item.id ??
            `mistake-${item.language}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp,
        };
        const updated =
          existingIdx >= 0
            ? [
                entry,
                ...current.filter((_, idx) => idx !== existingIdx),
              ]
            : [entry, ...current];
        return {
          ...prev,
          mistakeVault: updated.slice(0, MAX_MISTAKE_VAULT),
          pendingSync: true,
        };
      });
    },
    [commitState],
  );

  const resolveMistakeFromVault = useCallback(
    (id: string): { xpEarned: number } => {
      const xpEarned = applyXpMultiplier(15, stateRef.current.xpBoostExpiresAt);
      commitState((prev) => {
        const prevList = prev.mistakeVault ?? [];
        const nextList = prevList.filter((item) => item.id !== id);
        const nextXp = prev.xp + xpEarned;
        const activityUpdate = recordTodayActivityState(prev, 'lessons', 1, true);
        const next: PersistedUserState = {
          ...prev,
          mistakeVault: nextList,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + xpEarned,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
      return { xpEarned };
    },
    [commitState],
  );

  const purchaseRoboSkin = useCallback(
    (skinId: RoboSkinId, cost: number): boolean => {
      const cur = stateRef.current;
      const unlocked = cur.unlockedRoboSkins ?? ['default_violet'];
      if (unlocked.includes(skinId)) {
        commitState((prev) => ({
          ...prev,
          equippedRoboSkin: skinId,
          pendingSync: true,
        }));
        return true;
      }
      if (cur.gems < cost) return false;
      commitState((prev) => {
        const nextUnlocked = Array.from(
          new Set([...(prev.unlockedRoboSkins ?? ['default_violet']), skinId]),
        );
        const next: PersistedUserState = {
          ...prev,
          gems: Math.max(0, prev.gems - cost),
          unlockedRoboSkins: nextUnlocked,
          equippedRoboSkin: skinId,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });
      return true;
    },
    [commitState],
  );

  const equipRoboSkin = useCallback(
    (skinId: RoboSkinId) => {
      commitState((prev) => {
        const unlocked = prev.unlockedRoboSkins ?? ['default_violet'];
        if (!unlocked.includes(skinId) && skinId !== 'default_violet') {
          return prev;
        }
        return {
          ...prev,
          equippedRoboSkin: skinId,
          pendingSync: true,
        };
      });
    },
    [commitState],
  );

  const activateXpOverclock = useCallback((): boolean => {
    const cur = stateRef.current;
    if (cur.gems < XP_OVERCLOCK_COST) return false;
    const now = Date.now();
    const baseTime =
      cur.xpBoostExpiresAt && cur.xpBoostExpiresAt > now ? cur.xpBoostExpiresAt : now;
    const nextExpiresAt = baseTime + XP_OVERCLOCK_DURATION_MS;
    commitState((prev) => {
      const next: PersistedUserState = {
        ...prev,
        gems: Math.max(0, prev.gems - XP_OVERCLOCK_COST),
        xpBoostExpiresAt: nextExpiresAt,
        pendingSync: true,
      };
      void syncProfileToCloud(next);
      return next;
    });
    return true;
  }, [commitState]);

  const completeGuidedProject = useCallback(
    (projectId: string): { xpEarned: number; gemsEarned: number; firstClear: boolean } => {
      const cur = stateRef.current;
      const existing = cur.completedProjects ?? [];
      const firstClear = !existing.includes(projectId);
      const baseXp = firstClear ? 60 : 15;
      const xpEarned = applyXpMultiplier(baseXp, cur.xpBoostExpiresAt);
      const gemsEarned = firstClear ? 20 : 3;

      commitState((prev) => {
        const prevProjects = prev.completedProjects ?? [];
        const nextProjects = prevProjects.includes(projectId)
          ? prevProjects
          : [...prevProjects, projectId];
        const nextXp = prev.xp + xpEarned;
        const activityUpdate = recordTodayActivityState(prev, 'runs', 2, true);
        const next: PersistedUserState = {
          ...prev,
          completedProjects: nextProjects,
          executions: prev.executions + 1,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + xpEarned,
          gems: prev.gems + gemsEarned,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return { xpEarned, gemsEarned, firstClear };
    },
    [commitState],
  );

  const recordDuelVictory = useCallback(
    (won: boolean): { xpEarned: number; gemsEarned: number } => {
      const cur = stateRef.current;
      const baseXp = won ? 50 : 15;
      const xpEarned = applyXpMultiplier(baseXp, cur.xpBoostExpiresAt);
      const gemsEarned = won ? 20 : 0;

      commitState((prev) => {
        const nextXp = prev.xp + xpEarned;
        const activityUpdate = recordTodayActivityState(
          prev,
          'blitz',
          won ? 2 : 1,
          true,
        );
        const next: PersistedUserState = {
          ...prev,
          duelsWon: (prev.duelsWon ?? 0) + (won ? 1 : 0),
          duelsPlayed: (prev.duelsPlayed ?? 0) + 1,
          xp: nextXp,
          weeklyXp: prev.weeklyXp + xpEarned,
          gems: prev.gems + gemsEarned,
          league: computeLeagueForXp(nextXp),
          ...activityUpdate,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      return { xpEarned, gemsEarned };
    },
    [commitState],
  );

  const toggleFollowRival = useCallback(
    (rivalId: string): boolean => {
      const currentList = stateRef.current.followedRivalIds ?? [];
      const nowFollowing = !currentList.includes(rivalId);
      commitState((prev) => {
        const existing = prev.followedRivalIds ?? [];
        const updated = existing.includes(rivalId)
          ? existing.filter((id) => id !== rivalId)
          : [...existing, rivalId];
        return {
          ...prev,
          followedRivalIds: updated,
        };
      });
      return nowFollowing;
    },
    [commitState],
  );

  const nudgeRival = useCallback(
    (rivalId: string) => {
      commitState((prev) => {
        const existing = prev.nudgedRivalIds ?? [];
        if (existing.includes(rivalId)) return prev;
        return {
          ...prev,
          nudgedRivalIds: [...existing, rivalId],
        };
      });
    },
    [commitState],
  );

  const syncNow = useCallback(async () => {
    const res = await syncProfileToCloud(stateRef.current);
    if (res.synced) {
      commitState((prev) => ({
        ...prev,
        pendingSync: false,
        lastSyncedAt: new Date().toISOString(),
      }));
      await refreshLeaderboard();
    }
    return res;
  }, [commitState, refreshLeaderboard]);

  const clearPendingFirstLessonLaunch = useCallback(() => {
    setPendingFirstLessonLaunch(false);
  }, []);

  const completeOnboarding = useCallback(
    (input: {
      activeLang: LangId;
      dailyGoalMinutes: DailyGoalMinutes;
      experienceLevel?: ExperienceLevel;
      username: string;
      dailyReminderEnabled?: boolean;
      launchFirstLesson?: boolean;
    }) => {
      const strippedHandle = input.username.trim().replace(/^@+/, '');
      const cleanName = strippedHandle || 'Coder';
      const slug = strippedHandle
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      const derivedHandle = slug && slug !== 'coder' ? `@${slug}` : '@codelingo_user';

      commitState((prev) => {
        const next: PersistedUserState = {
          ...prev,
          username: cleanName,
          handle: derivedHandle,
          activeLang: input.activeLang,
          dailyGoalMinutes: input.dailyGoalMinutes,
          experienceLevel: input.experienceLevel ?? prev.experienceLevel ?? 'beginner',
          dailyReminderEnabled:
            typeof input.dailyReminderEnabled === 'boolean'
              ? input.dailyReminderEnabled
              : prev.dailyReminderEnabled ?? false,
          hasCompletedOnboarding: true,
          pendingSync: true,
        };
        void syncProfileToCloud(next);
        return next;
      });

      if (input.launchFirstLesson) {
        setPendingFirstLessonLaunch(true);
      }
    },
    [commitState],
  );

  const linkCloudAccount = useCallback(
    async (session: CloudAuthSessionInfo): Promise<{ merged: boolean }> => {
      const snapshot = await fetchCloudAccountSnapshot(session.userId);
      let nextMergedState = stateRef.current;

      commitState((prev) => {
        const merged = mergeGuestAndCloudState(prev, snapshot, session);
        nextMergedState = merged;
        return merged;
      });

      const res = await syncProfileToCloud(nextMergedState);
      if (res.synced) {
        commitState((prev) => ({
          ...prev,
          pendingSync: false,
          lastSyncedAt: new Date().toISOString(),
        }));
      }
      await refreshLeaderboard();
      return { merged: snapshot !== null };
    },
    [commitState, refreshLeaderboard],
  );

  const signOutAccount = useCallback(async () => {
    await signOutFromCloud();
    commitState((prev) => ({
      ...prev,
      id: generateLocalUuid(),
      authProvider: 'guest',
      authEmail: null,
      pendingSync: false,
      lastSyncedAt: null,
    }));
  }, [commitState]);

  const deleteAccountAndResetData = useCallback(async (): Promise<{ error?: string }> => {
    const curId = stateRef.current.id;
    await cancelAllScheduledNotifications();
    const res = await deleteCloudAccountAndData(curId);
    const fresh = createFreshResetState(generateLocalUuid());
    setPendingFirstLessonLaunch(false);
    setHapticsEnabled(true);
    setSoundsEnabled(true);
    stateRef.current = fresh;
    setState(fresh);
    void saveCachedUserData(fresh);
    return res;
  }, []);

  // Reconcile timed heart regeneration while active & on app foreground resume
  useEffect(() => {
    if (!isHydrated) return;

    const runHeartTick = () => {
      const cur = stateRef.current;
      if (cur.hearts >= cur.maxHearts) return;
      const regen = reconcileHeartRegen(cur.hearts, cur.maxHearts, cur.nextHeartAt ?? null);
      if (regen.hearts !== cur.hearts || regen.nextHeartAt !== cur.nextHeartAt) {
        commitState((prev) => ({
          ...prev,
          hearts: regen.hearts,
          nextHeartAt: regen.nextHeartAt,
          pendingSync: true,
        }));
      }
    };

    const appSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        runHeartTick();
        const cur = stateRef.current;
        void syncDailyStreakReminder(
          Boolean(cur.dailyReminderEnabled),
          cur.lastActiveDate === formatLocalDateKey(),
          cur.streak,
        );
      }
    });

    if (state.hearts >= state.maxHearts || !state.nextHeartAt) {
      return () => {
        appSub.remove();
      };
    }

    const delayMs = Math.max(1000, state.nextHeartAt - Date.now() + 250);
    const timer = setTimeout(runHeartTick, delayMs);

    return () => {
      clearTimeout(timer);
      appSub.remove();
    };
  }, [isHydrated, state.hearts, state.maxHearts, state.nextHeartAt, commitState]);

  // Keep daily streak 19:30 local reminder synced with user settings & today's activity
  useEffect(() => {
    if (!isHydrated) return;
    const completedToday = state.lastActiveDate === formatLocalDateKey();
    void syncDailyStreakReminder(
      Boolean(state.dailyReminderEnabled),
      completedToday,
      state.streak,
    );
  }, [isHydrated, state.dailyReminderEnabled, state.lastActiveDate, state.streak]);

  // Keep one-shot Hearts Refilled local alert synchronized with regeneration math
  useEffect(() => {
    if (!isHydrated) return;
    const fullRefillAtMs = computeFullHeartRefillAt(
      state.hearts,
      state.maxHearts,
      state.nextHeartAt ?? null,
    );
    void syncHeartsRefilledNotification(
      state.hearts,
      state.maxHearts,
      fullRefillAtMs,
      true,
    );
  }, [isHydrated, state.hearts, state.maxHearts, state.nextHeartAt]);

  const resetProgress = useCallback(() => {
    void cancelAllScheduledNotifications();
    const fresh = createFreshResetState(stateRef.current.id);
    setPendingFirstLessonLaunch(false);
    setHapticsEnabled(true);
    setSoundsEnabled(true);
    commitState(() => fresh);
    void saveCachedUserData(fresh);
  }, [commitState]);

  const xpBoostRemainingMs = useMemo(() => {
    if (!state.xpBoostExpiresAt) return 0;
    return Math.max(0, state.xpBoostExpiresAt - boostClockMs);
  }, [state.xpBoostExpiresAt, boostClockMs]);

  const isXpBoostActive = xpBoostRemainingMs > 0;
  const xpBoostRemainingSec = Math.ceil(xpBoostRemainingMs / 1000);

  const authProvider: AuthProviderKind = state.authProvider ?? 'guest';
  const isGuest = authProvider !== 'email' && authProvider !== 'apple';

  const value = useMemo<UserStoreValue>(
    () => ({
      userId: state.id,
      username: state.username,
      handle: state.handle,
      avatarUrl: state.avatarUrl ?? null,
      avatarTheme: state.avatarTheme ?? 'violet',
      league: state.league,
      xp: state.xp,
      weeklyXp: state.weeklyXp,
      streak: state.streak,
      bestStreak: state.bestStreak ?? state.streak,
      streakFreezes: state.streakFreezes ?? 1,
      lastStreakFreezeDate: state.lastStreakFreezeDate ?? null,
      lastActiveDate: state.lastActiveDate,
      gems: state.gems,
      hearts: state.hearts,
      maxHearts: state.maxHearts,
      nextHeartAt: state.nextHeartAt ?? null,
      activeLang: state.activeLang,
      hasCompletedOnboarding: Boolean(state.hasCompletedOnboarding),
      dailyGoalMinutes: state.dailyGoalMinutes ?? 15,
      experienceLevel: state.experienceLevel ?? 'beginner',
      authProvider,
      authEmail: state.authEmail ?? null,
      isGuest,
      pendingFirstLessonLaunch,
      clearPendingFirstLessonLaunch,
      completedNodes: state.completedNodes,
      nodeAccuracies: state.nodeAccuracies,
      bugCampaignProgress: normalizeBugCampaignProgress(state.bugCampaignProgress),
      syntaxSprintProgress: normalizeSyntaxSprintProgress(
        state.syntaxSprintProgress,
      ),
      gitSimProgress: normalizeGitSimProgress(state.gitSimProgress),
      robotMazeProgress: normalizeRobotMazeProgress(state.robotMazeProgress),
      mistakeVault: state.mistakeVault ?? [],
      unlockedRoboSkins: state.unlockedRoboSkins ?? ['default_violet'],
      equippedRoboSkin: state.equippedRoboSkin ?? 'default_violet',
      xpBoostExpiresAt: isXpBoostActive ? (state.xpBoostExpiresAt ?? null) : null,
      isXpBoostActive,
      xpBoostRemainingSec,
      completedProjects: state.completedProjects ?? [],
      duelsWon: state.duelsWon ?? 0,
      duelsPlayed: state.duelsPlayed ?? 0,
      claimedChests: state.claimedChests,
      combo: state.combo,
      bestCombo: state.bestCombo,
      totalAnswers: state.totalAnswers,
      correctAnswers: state.correctAnswers,
      bugsCrushed: state.bugsCrushed,
      blitzBest: state.blitzBest,
      executions: state.executions,
      activityHistory: state.activityHistory ?? {},
      activityBreakdown: state.activityBreakdown ?? {},
      hapticsEnabled: state.hapticsEnabled ?? true,
      soundEnabled: state.soundEnabled ?? true,
      dailyReminderEnabled: state.dailyReminderEnabled ?? false,
      followedRivalIds: state.followedRivalIds ?? [],
      nudgedRivalIds: state.nudgedRivalIds ?? [],
      liveLeaderboard,
      leaderboardSource,
      cloudConfigured: isCloudConfigured,
      pendingSync: state.pendingSync,
      lastSyncedAt: state.lastSyncedAt,
      isHydrated,
      pendingBlitzRecovery,
      requestBlitzRecovery,
      clearBlitzRecovery,
      getNodeStatus,
      setActiveLang,
      recordAnswer,
      loseHeart,
      decrementHeart: loseHeart,
      completeLesson,
      completeNode,
      claimChest,
      refillHearts: purchaseHeartRefill,
      refillHeartsWithGems: purchaseHeartRefill,
      buySingleHeart,
      buyStreakFreeze,
      addMistakeToVault,
      resolveMistakeFromVault,
      purchaseRoboSkin,
      equipRoboSkin,
      activateXpOverclock,
      completeGuidedProject,
      recordDuelVictory,
      earnBlitzHearts,
      recordBlitzScore,
      recordBugLevelCompletion,
      recordSyntaxSprintCompletion,
      recordGitSimCompletion,
      recordRobotMazeCompletion,
      recordExecution,
      updateProfile,
      setPreferences,
      toggleFollowRival,
      nudgeRival,
      syncNow,
      refreshLeaderboard,
      completeOnboarding,
      linkCloudAccount,
      signOutAccount,
      deleteAccountAndResetData,
      resetProgress,
    }),
    [
      state,
      authProvider,
      isGuest,
      pendingFirstLessonLaunch,
      clearPendingFirstLessonLaunch,
      isXpBoostActive,
      xpBoostRemainingSec,
      liveLeaderboard,
      leaderboardSource,
      isHydrated,
      pendingBlitzRecovery,
      requestBlitzRecovery,
      clearBlitzRecovery,
      getNodeStatus,
      setActiveLang,
      recordAnswer,
      loseHeart,
      completeLesson,
      completeNode,
      claimChest,
      purchaseHeartRefill,
      buySingleHeart,
      buyStreakFreeze,
      addMistakeToVault,
      resolveMistakeFromVault,
      purchaseRoboSkin,
      equipRoboSkin,
      activateXpOverclock,
      completeGuidedProject,
      recordDuelVictory,
      earnBlitzHearts,
      recordBlitzScore,
      recordBugLevelCompletion,
      recordSyntaxSprintCompletion,
      recordGitSimCompletion,
      recordRobotMazeCompletion,
      recordExecution,
      updateProfile,
      setPreferences,
      toggleFollowRival,
      nudgeRival,
      syncNow,
      refreshLeaderboard,
      completeOnboarding,
      linkCloudAccount,
      signOutAccount,
      deleteAccountAndResetData,
      resetProgress,
    ],
  );

  return React.createElement(UserStoreContext.Provider, { value }, children);
}

export function useUserStore(): UserStoreValue {
  const ctx = useContext(UserStoreContext);
  if (!ctx) {
    throw new Error('useUserStore must be used inside UserProvider');
  }
  return ctx;
}
