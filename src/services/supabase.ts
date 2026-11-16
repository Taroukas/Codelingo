/**
 * Supabase Cloud Backend + AsyncStorage Offline-First Cache Layer.
 * Gracefully degrades to offline AsyncStorage cache when EXPO_PUBLIC_SUPABASE_URL
 * or EXPO_PUBLIC_SUPABASE_ANON_KEY are not yet configured in `.env`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';

export type LangId =
  | 'python'
  | 'cpp'
  | 'js'
  | 'go'
  | 'java'
  | 'rust'
  | 'sql'
  | 'c'
  | 'ts'
  | 'css'
  | 'html'
  | 'php'
  | 'asm'
  | 'swift'
  | 'kotlin'
  | 'julia'
  | 'lua'
  | 'csharp';

export interface CloudProfilePayload {
  id: string;
  username: string;
  handle: string;
  avatarUrl?: string | null;
  activeLang: LangId;
  xp: number;
  weeklyXp: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  lastActiveDate: string | null;
  league: string;
  bugsCrushed: number;
  blitzBest: number;
  executions: number;
}

export type AvatarThemeId = 'violet' | 'emerald' | 'sky' | 'amber';

export interface DailyActivityBreakdown {
  lessons: number;
  runs: number;
  blitz: number;
}

export interface LeagueTierSpec {
  name: string;
  minXp: number;
  accent: string;
  minRankNote: string;
}

export const LEAGUE_TIERS: readonly LeagueTierSpec[] = [
  { name: 'Bronze', minXp: 0, accent: '#CD7F32', minRankNote: '0+ XP · Starter bracket' },
  { name: 'Silver', minXp: 250, accent: '#94A3B8', minRankNote: '250+ XP · Daily builders' },
  { name: 'Gold', minXp: 550, accent: '#F59E0B', minRankNote: '550+ XP · Consistent sprint' },
  { name: 'Sapphire', minXp: 900, accent: '#38BDF8', minRankNote: '900+ XP · Syntax qualifiers' },
  { name: 'Ruby', minXp: 1200, accent: '#F43F5E', minRankNote: '1,200+ XP · Bug hunters' },
  { name: 'Obsidian', minXp: 1400, accent: '#A78BFA', minRankNote: '1,400+ XP · Active elite' },
  { name: 'Diamond', minXp: 1800, accent: '#67E8F9', minRankNote: '1,800+ XP · Top promotion tier' },
];

/** Resolve a learner's league tier from cumulative XP. */
export function computeLeagueForXp(xp: number): string {
  const safeXp = Math.max(0, xp);
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= LEAGUE_TIERS[i].minXp) {
      return LEAGUE_TIERS[i].name;
    }
  }
  return LEAGUE_TIERS[0].name;
}

/** Return progress details toward the next league tier. */
export function getLeagueProgress(xp: number): {
  currentTier: LeagueTierSpec;
  nextTier: LeagueTierSpec | null;
  tierIndex: number;
  xpToNext: number;
  progressPct: number;
} {
  const safeXp = Math.max(0, xp);
  let tierIndex = 0;
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= LEAGUE_TIERS[i].minXp) {
      tierIndex = i;
      break;
    }
  }
  const currentTier = LEAGUE_TIERS[tierIndex];
  const nextTier =
    tierIndex + 1 < LEAGUE_TIERS.length ? LEAGUE_TIERS[tierIndex + 1] : null;
  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      tierIndex,
      xpToNext: 0,
      progressPct: 100,
    };
  }
  const span = Math.max(1, nextTier.minXp - currentTier.minXp);
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round(((safeXp - currentTier.minXp) / span) * 100)),
  );
  return {
    currentTier,
    nextTier,
    tierIndex,
    xpToNext: Math.max(0, nextTier.minXp - safeXp),
    progressPct,
  };
}

export interface BugLevelProgress {
  stars: 1 | 2 | 3;
  bestTimeMs: number;
}

export type BugCampaignProgress = Record<LangId, Record<number, BugLevelProgress>>;

export type SyntaxSprintProgress = Record<LangId, Record<number, BugLevelProgress>>;

export interface GitSimLevelProgress {
  stars: 1 | 2 | 3;
  bestMoves: number;
}

export type GitSimProgress = Record<number, GitSimLevelProgress>;

export interface RobotMazeLevelProgress {
  stars: 1 | 2 | 3;
  bestBlocks: number;
}

export type RobotMazeProgress = Record<number, RobotMazeLevelProgress>;

export type RoboSkinId =
  | 'default_violet'
  | 'obsidian_gold'
  | 'matrix_phosphor'
  | 'cyber_crimson'
  | 'ghost_titanium';

export interface MistakeVaultItem {
  id: string;
  language: LangId;
  unitTitle: string;
  prompt: string;
  codeSnippet: string;
  correctAnswer: string;
  explanation: string;
  timestamp: string;
  source?: 'lesson' | 'bug_hunt' | 'syntax_sprint';
  options?: string[];
  tokens?: string[];
}

export type AuthProviderKind = 'guest' | 'email' | 'apple';

export type DailyGoalMinutes = 5 | 15 | 30;

export type ExperienceLevel = 'beginner' | 'basics' | 'experienced';

export interface PersistedUserState extends CloudProfilePayload {
  completedNodes: Record<LangId, string[]>;
  nodeAccuracies: Record<string, number>;
  bugCampaignProgress?: BugCampaignProgress;
  syntaxSprintProgress?: SyntaxSprintProgress;
  gitSimProgress?: GitSimProgress;
  robotMazeProgress?: RobotMazeProgress;
  mistakeVault?: MistakeVaultItem[];
  unlockedRoboSkins?: RoboSkinId[];
  equippedRoboSkin?: RoboSkinId;
  xpBoostExpiresAt?: number | null;
  completedProjects?: string[];
  duelsWon?: number;
  duelsPlayed?: number;
  claimedChests: string[];
  totalAnswers: number;
  correctAnswers: number;
  combo: number;
  bestCombo: number;
  bestStreak?: number;
  streakFreezes?: number;
  lastStreakFreezeDate?: string | null;
  avatarTheme?: AvatarThemeId;
  activityHistory?: Record<string, number>;
  activityBreakdown?: Record<string, DailyActivityBreakdown>;
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
  dailyReminderEnabled?: boolean;
  followedRivalIds?: string[];
  nudgedRivalIds?: string[];
  hasCompletedOnboarding?: boolean;
  dailyGoalMinutes?: DailyGoalMinutes;
  experienceLevel?: ExperienceLevel;
  nextHeartAt?: number | null;
  authProvider?: AuthProviderKind;
  authEmail?: string | null;
  pendingSync: boolean;
  lastSyncedAt: string | null;
}

export interface CompleteLessonCloudParams {
  profile: CloudProfilePayload;
  language: LangId;
  unitId: string;
  nodeId: string;
  accuracy: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  handle: string;
  avatarUrl?: string | null;
  lang: LangId;
  xp: number;
  weeklyXp?: number;
  streak?: number;
  bugsCrushed?: number;
  league: string;
  isUser?: boolean;
  avatarBg?: string;
  hairColor?: string;
  shirtColor?: string;
}

const STORAGE_KEY = 'codelingo_v2_user_progress';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const isCloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Lazily initialized Supabase client with AsyncStorage session persistence. */
export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Couples Supabase auth token auto-refresh with React Native AppState. */
export function attachSupabaseAppStateListener(): () => void {
  if (!supabase) return () => undefined;

  const subscription = AppState.addEventListener(
    'change',
    (state: AppStateStatus) => {
      if (!supabase) return;
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    },
  );

  return () => {
    subscription.remove();
  };
}

/** Deterministic RFC-4122 UUID v4 generator using Math.random / crypto when available. */
export function generateLocalUuid(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ------------------------------------------------------------------ */
/*  Local AsyncStorage Cache (0ms offline-first read/write)           */
/* ------------------------------------------------------------------ */

export async function loadCachedUserData(): Promise<Partial<PersistedUserState> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Partial<PersistedUserState>;
    }
  } catch {
    // Never crash on storage read errors
  }
  return null;
}

export async function saveCachedUserData(state: PersistedUserState): Promise<void> {
  const serialized = JSON.stringify(state);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Ignore AsyncStorage write failures in restricted test environments
  }
}

export async function clearCachedUserData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

export async function wipeAllLocalStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch {
    await clearCachedUserData();
  }
}

/* ------------------------------------------------------------------ */
/*  Supabase Cloud Sync Operations (Background, Graceful Fallback)    */
/* ------------------------------------------------------------------ */

function toProfileRow(profile: CloudProfilePayload) {
  return {
    id: profile.id,
    username: profile.username,
    handle: profile.handle,
    avatar_url: profile.avatarUrl ?? null,
    active_lang: profile.activeLang,
    xp: profile.xp,
    weekly_xp: profile.weeklyXp,
    gems: profile.gems,
    hearts: profile.hearts,
    max_hearts: profile.maxHearts,
    streak: profile.streak,
    last_active_date: profile.lastActiveDate,
    league: profile.league,
    bugs_crushed: profile.bugsCrushed,
    blitz_best: profile.blitzBest,
    executions: profile.executions,
    updated_at: new Date().toISOString(),
  };
}

export async function syncProfileToCloud(
  profile: CloudProfilePayload,
): Promise<{ synced: boolean; error?: string }> {
  if (!supabase) {
    return { synced: false, error: 'offline_fallback' };
  }
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(toProfileRow(profile), { onConflict: 'id' });

    if (error) {
      return { synced: false, error: error.message };
    }
    return { synced: true };
  } catch (err) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export async function completeLessonTransaction(
  params: CompleteLessonCloudParams,
): Promise<{ synced: boolean; error?: string }> {
  if (!supabase) {
    return { synced: false, error: 'offline_fallback' };
  }
  try {
    const profileRes = await supabase
      .from('profiles')
      .upsert(toProfileRow(params.profile), { onConflict: 'id' });

    if (profileRes.error) {
      return { synced: false, error: profileRes.error.message };
    }

    const progressRes = await supabase.from('user_progress').upsert(
      {
        user_id: params.profile.id,
        language: params.language,
        unit_id: params.unitId,
        node_id: params.nodeId,
        completed: true,
        accuracy: Math.max(0, Math.min(100, Math.round(params.accuracy))),
        completed_at: params.completedAt,
      },
      { onConflict: 'user_id,node_id' },
    );

    if (progressRes.error) {
      return { synced: false, error: progressRes.error.message };
    }

    return { synced: true };
  } catch (err) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export async function refillHeartsWithGems(
  userId: string,
  nextGems: number,
  nextHearts: number,
): Promise<{ synced: boolean; error?: string }> {
  if (!supabase) {
    return { synced: false, error: 'offline_fallback' };
  }
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        gems: nextGems,
        hearts: nextHearts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { synced: false, error: error.message };
    }
    return { synced: true };
  } catch (err) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Live Leaderboard Fetch + Offline Obsidian League Roster            */
/* ------------------------------------------------------------------ */

const SEEDED_RIVALS: Omit<LeaderboardEntry, 'rank'>[] = [
  {
    id: 'rival-laura',
    username: 'laura_c',
    handle: 'laura_c',
    lang: 'cpp',
    xp: 1850,
    weeklyXp: 490,
    streak: 14,
    bugsCrushed: 19,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#1E293B',
    shirtColor: '#4F46E5',
  },
  {
    id: 'rival-sam',
    username: 'sam_py',
    handle: 'sam_py',
    lang: 'python',
    xp: 1680,
    weeklyXp: 420,
    streak: 11,
    bugsCrushed: 15,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#0F172A',
    shirtColor: '#3B82F6',
  },
  {
    id: 'rival-alex',
    username: 'alex_dev',
    handle: 'alex_dev',
    lang: 'go',
    xp: 1590,
    weeklyXp: 365,
    streak: 9,
    bugsCrushed: 12,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#334155',
    shirtColor: '#7C5CFC',
  },
  {
    id: 'rival-fatih',
    username: 'fatih_99',
    handle: 'fatih_99',
    lang: 'js',
    xp: 1390,
    weeklyXp: 295,
    streak: 7,
    bugsCrushed: 10,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#1E293B',
    shirtColor: '#3B82F6',
  },
  {
    id: 'rival-nour',
    username: 'nour_a',
    handle: 'nour_a',
    lang: 'python',
    xp: 1280,
    weeklyXp: 260,
    streak: 6,
    bugsCrushed: 8,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#7C2D12',
    shirtColor: '#334155',
  },
  {
    id: 'rival-bilal',
    username: 'bilal_dev',
    handle: 'bilal_dev',
    lang: 'cpp',
    xp: 1150,
    weeklyXp: 225,
    streak: 4,
    bugsCrushed: 9,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#0F172A',
    shirtColor: '#4F46E5',
  },
  {
    id: 'rival-hana',
    username: 'hana_go',
    handle: 'hana_go',
    lang: 'go',
    xp: 1020,
    weeklyXp: 190,
    streak: 5,
    bugsCrushed: 7,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#312E81',
    shirtColor: '#0EA5E9',
  },
  {
    id: 'rival-youssef',
    username: 'youssef_js',
    handle: 'youssef_js',
    lang: 'js',
    xp: 940,
    weeklyXp: 165,
    streak: 3,
    bugsCrushed: 6,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#0F172A',
    shirtColor: '#10B981',
  },
  {
    id: 'rival-maya',
    username: 'maya_py',
    handle: 'maya_py',
    lang: 'python',
    xp: 860,
    weeklyXp: 140,
    streak: 4,
    bugsCrushed: 5,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#4C1D95',
    shirtColor: '#7C5CFC',
  },
  {
    id: 'rival-omar',
    username: 'omar_cpp',
    handle: 'omar_cpp',
    lang: 'cpp',
    xp: 780,
    weeklyXp: 110,
    streak: 2,
    bugsCrushed: 4,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#1E293B',
    shirtColor: '#334155',
  },
  {
    id: 'rival-chloe',
    username: 'chloe_go',
    handle: 'chloe_go',
    lang: 'go',
    xp: 690,
    weeklyXp: 85,
    streak: 2,
    bugsCrushed: 3,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#7C2D12',
    shirtColor: '#0EA5E9',
  },
  {
    id: 'rival-kenji',
    username: 'kenji_rs',
    handle: 'kenji_rs',
    lang: 'rust',
    xp: 1840,
    weeklyXp: 460,
    streak: 11,
    bugsCrushed: 14,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#0F172A',
    shirtColor: '#EA580C',
  },
  {
    id: 'rival-nadia',
    username: 'nadia_java',
    handle: 'nadia_java',
    lang: 'java',
    xp: 1510,
    weeklyXp: 350,
    streak: 8,
    bugsCrushed: 11,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#451A03',
    shirtColor: '#2563EB',
  },
  {
    id: 'rival-tariq',
    username: 'tariq_sql',
    handle: 'tariq_sql',
    lang: 'sql',
    xp: 1120,
    weeklyXp: 245,
    streak: 5,
    bugsCrushed: 7,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#1E293B',
    shirtColor: '#0284C7',
  },
  {
    id: 'rival-elena',
    username: 'elena_c',
    handle: 'elena_c',
    lang: 'c',
    xp: 980,
    weeklyXp: 175,
    streak: 4,
    bugsCrushed: 9,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#312E81',
    shirtColor: '#4F46E5',
  },
  {
    id: 'rival-yuna',
    username: 'yuna_ts',
    handle: 'yuna_ts',
    lang: 'ts',
    xp: 1710,
    weeklyXp: 410,
    streak: 10,
    bugsCrushed: 12,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#1E293B',
    shirtColor: '#3178C6',
  },
  {
    id: 'rival-lucas',
    username: 'lucas_swift',
    handle: 'lucas_swift',
    lang: 'swift',
    xp: 1380,
    weeklyXp: 295,
    streak: 7,
    bugsCrushed: 8,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#451A03',
    shirtColor: '#F05138',
  },
  {
    id: 'rival-mina',
    username: 'mina_kt',
    handle: 'mina_kt',
    lang: 'kotlin',
    xp: 1290,
    weeklyXp: 260,
    streak: 6,
    bugsCrushed: 9,
    league: 'Obsidian',
    avatarBg: '#CBD5E1',
    hairColor: '#312E81',
    shirtColor: '#7F52FF',
  },
  {
    id: 'rival-theo',
    username: 'theo_cs',
    handle: 'theo_cs',
    lang: 'csharp',
    xp: 1090,
    weeklyXp: 210,
    streak: 5,
    bugsCrushed: 7,
    league: 'Obsidian',
    avatarBg: '#E2E8F0',
    hairColor: '#0F172A',
    shirtColor: '#512BD4',
  },
];

const VALID_LANG_IDS = new Set<string>([
  'python',
  'cpp',
  'js',
  'go',
  'java',
  'rust',
  'sql',
  'c',
  'ts',
  'css',
  'html',
  'php',
  'asm',
  'swift',
  'kotlin',
  'julia',
  'lua',
  'csharp',
]);

function isLangId(value: string | null | undefined): value is LangId {
  return Boolean(value && VALID_LANG_IDS.has(value));
}

export function buildLocalLeaderboard(currentUser: {
  id: string;
  username: string;
  handle: string;
  xp: number;
  weeklyXp?: number;
  streak?: number;
  bugsCrushed?: number;
  activeLang: LangId;
  league: string;
}): LeaderboardEntry[] {
  const combined: Omit<LeaderboardEntry, 'rank'>[] = [
    ...SEEDED_RIVALS.map((rival) => ({
      ...rival,
      league: computeLeagueForXp(rival.xp),
    })),
    {
      id: currentUser.id,
      username: currentUser.username,
      handle: currentUser.handle,
      lang: currentUser.activeLang,
      xp: currentUser.xp,
      weeklyXp: currentUser.weeklyXp ?? Math.min(currentUser.xp, 320),
      streak: currentUser.streak ?? 0,
      bugsCrushed: currentUser.bugsCrushed ?? 0,
      league: computeLeagueForXp(currentUser.xp),
      isUser: true,
    },
  ];

  combined.sort((a, b) => b.xp - a.xp);
  return combined.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

interface LeaderboardViewRow {
  id: string;
  username: string;
  handle: string;
  avatar_url: string | null;
  active_lang: string | null;
  xp: number;
  league: string | null;
  rank: number;
}

export async function fetchLiveLeaderboard(currentUser: {
  id: string;
  username: string;
  handle: string;
  xp: number;
  weeklyXp?: number;
  streak?: number;
  bugsCrushed?: number;
  activeLang: LangId;
  league: string;
}): Promise<{ entries: LeaderboardEntry[]; source: 'supabase' | 'offline' }> {
  const fallback = buildLocalLeaderboard(currentUser);

  if (!supabase) {
    return { entries: fallback, source: 'offline' };
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('id, username, handle, avatar_url, active_lang, xp, league, rank')
      .order('xp', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) {
      return { entries: fallback, source: 'offline' };
    }

    const rows = data as LeaderboardViewRow[];
    const paletteCycle = [
      { avatarBg: '#CBD5E1', hairColor: '#1E293B', shirtColor: '#3B82F6' },
      { avatarBg: '#E2E8F0', hairColor: '#7C2D12', shirtColor: '#334155' },
      { avatarBg: '#CBD5E1', hairColor: '#0F172A', shirtColor: '#4F46E5' },
    ];

    const entries: LeaderboardEntry[] = rows.map((row, idx) => {
      const palette = paletteCycle[idx % paletteCycle.length];
      const isUser = row.id === currentUser.id;
      return {
        id: row.id,
        rank: Number(row.rank) || idx + 1,
        username: row.username,
        handle: row.handle,
        avatarUrl: row.avatar_url,
        lang: isLangId(row.active_lang) ? row.active_lang : 'python',
        xp: row.xp,
        weeklyXp: isUser
          ? currentUser.weeklyXp ?? Math.round(row.xp * 0.25)
          : Math.round(row.xp * 0.25),
        streak: isUser ? currentUser.streak ?? 0 : 3 + (idx % 7),
        bugsCrushed: isUser ? currentUser.bugsCrushed ?? 0 : 4 + ((idx * 3) % 15),
        league: row.league ?? computeLeagueForXp(row.xp),
        isUser,
        ...palette,
      };
    });

    // Ensure the active user is always represented in the live view even before first cloud write settles
    if (!entries.some((e) => e.isUser)) {
      return { entries: fallback, source: 'offline' };
    }

    return { entries, source: 'supabase' };
  } catch {
    return { entries: fallback, source: 'offline' };
  }
}

/* ------------------------------------------------------------------ */
/*  Supabase Auth, Account Linking & Deletion Helpers                 */
/* ------------------------------------------------------------------ */

export interface CloudAuthSessionInfo {
  userId: string;
  email: string | null;
  provider: 'email' | 'apple';
  displayName?: string | null;
}

export interface AuthActionResult {
  ok: boolean;
  session?: CloudAuthSessionInfo;
  needsEmailVerification?: boolean;
  error?: string;
}

export interface CloudAccountSnapshot {
  profile: Partial<CloudProfilePayload>;
  completedNodes: Partial<Record<LangId, string[]>>;
  nodeAccuracies: Record<string, number>;
}

const NOT_CONFIGURED_MSG =
  'Cloud sync is offline in this environment. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable cloud sign-in.';

export async function getCurrentAuthSession(): Promise<CloudAuthSessionInfo | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;
    const u = data.session.user;
    const providerRaw = u.app_metadata?.provider;
    const provider: 'email' | 'apple' = providerRaw === 'apple' ? 'apple' : 'email';
    const metaName =
      typeof u.user_metadata?.username === 'string'
        ? u.user_metadata.username
        : typeof u.user_metadata?.full_name === 'string'
          ? u.user_metadata.full_name
          : null;
    return {
      userId: u.id,
      email: u.email ?? null,
      provider,
      displayName: metaName,
    };
  } catch {
    return null;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username?: string,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED_MSG };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: username?.trim()
        ? { data: { username: username.trim() } }
        : undefined,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user) {
      return { ok: false, error: 'Unable to create account.' };
    }
    if (!data.session) {
      return {
        ok: true,
        needsEmailVerification: true,
      };
    }
    return {
      ok: true,
      session: {
        userId: data.user.id,
        email: data.user.email ?? trimmedEmail,
        provider: 'email',
        displayName: username?.trim() || null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error during sign-up.',
    };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED_MSG };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { ok: false, error: 'Please enter your password.' };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user) {
      return { ok: false, error: 'Authentication failed.' };
    }
    const metaName =
      typeof data.user.user_metadata?.username === 'string'
        ? data.user.user_metadata.username
        : null;
    return {
      ok: true,
      session: {
        userId: data.user.id,
        email: data.user.email ?? trimmedEmail,
        provider: 'email',
        displayName: metaName,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error during sign-in.',
    };
  }
}

export async function signInWithAppleIdToken(
  identityToken: string,
  rawNonce: string,
  fullName?: string | null,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED_MSG };
  }
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce: rawNonce,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user) {
      return { ok: false, error: 'Apple Sign-In did not return a user session.' };
    }
    return {
      ok: true,
      session: {
        userId: data.user.id,
        email: data.user.email ?? null,
        provider: 'apple',
        displayName: fullName?.trim() || null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Apple Sign-In failed.',
    };
  }
}

export async function signOutFromCloud(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign-out failures offline
  }
}

export async function fetchCloudAccountSnapshot(
  userId: string,
): Promise<CloudAccountSnapshot | null> {
  if (!supabase || !userId) return null;
  try {
    const [profileRes, progressRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('user_progress')
        .select('language, node_id, accuracy')
        .eq('user_id', userId)
        .eq('completed', true),
    ]);

    const row = profileRes.data as Record<string, unknown> | null;
    const progressRows = (progressRes.data ?? []) as {
      language?: string;
      node_id?: string;
      accuracy?: number;
    }[];

    if (!row && progressRows.length === 0) {
      return null;
    }

    const completedNodes: Partial<Record<LangId, string[]>> = {};
    const nodeAccuracies: Record<string, number> = {};
    for (const p of progressRows) {
      if (p.language && isLangId(p.language) && typeof p.node_id === 'string') {
        const list = completedNodes[p.language] ?? [];
        if (!list.includes(p.node_id)) {
          completedNodes[p.language] = [...list, p.node_id];
        }
        if (typeof p.accuracy === 'number' && Number.isFinite(p.accuracy)) {
          nodeAccuracies[p.node_id] = Math.max(0, Math.min(100, Math.round(p.accuracy)));
        }
      }
    }

    const profile: Partial<CloudProfilePayload> = row
      ? {
          id: typeof row.id === 'string' ? row.id : userId,
          username: typeof row.username === 'string' ? row.username : undefined,
          handle: typeof row.handle === 'string' ? row.handle : undefined,
          avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : null,
          activeLang: isLangId(typeof row.active_lang === 'string' ? row.active_lang : null)
            ? (row.active_lang as LangId)
            : undefined,
          xp: typeof row.xp === 'number' ? row.xp : undefined,
          weeklyXp: typeof row.weekly_xp === 'number' ? row.weekly_xp : undefined,
          gems: typeof row.gems === 'number' ? row.gems : undefined,
          hearts: typeof row.hearts === 'number' ? row.hearts : undefined,
          maxHearts: typeof row.max_hearts === 'number' ? row.max_hearts : undefined,
          streak: typeof row.streak === 'number' ? row.streak : undefined,
          lastActiveDate:
            typeof row.last_active_date === 'string' ? row.last_active_date : undefined,
          bugsCrushed: typeof row.bugs_crushed === 'number' ? row.bugs_crushed : undefined,
          blitzBest: typeof row.blitz_best === 'number' ? row.blitz_best : undefined,
          executions: typeof row.executions === 'number' ? row.executions : undefined,
        }
      : { id: userId };

    return { profile, completedNodes, nodeAccuracies };
  } catch {
    return null;
  }
}

export function mergeGuestAndCloudState(
  guest: PersistedUserState,
  cloud: CloudAccountSnapshot | null,
  auth: CloudAuthSessionInfo,
): PersistedUserState {
  const isSameAccount = guest.id === auth.userId;

  const mergedCompleted = { ...guest.completedNodes };
  if (cloud) {
    for (const lang of VALID_LANG_IDS) {
      const typedLang = lang as LangId;
      const localList = mergedCompleted[typedLang] ?? [];
      const cloudList = cloud.completedNodes[typedLang] ?? [];
      mergedCompleted[typedLang] = Array.from(new Set([...localList, ...cloudList]));
    }
  }

  const mergedAccuracies: Record<string, number> = { ...(cloud?.nodeAccuracies ?? {}) };
  for (const [nodeId, acc] of Object.entries(guest.nodeAccuracies ?? {})) {
    const prevAcc = mergedAccuracies[nodeId] ?? 0;
    mergedAccuracies[nodeId] = Math.max(prevAcc, acc);
  }

  const cloudProfile = cloud?.profile;
  const cloudXp = typeof cloudProfile?.xp === 'number' ? cloudProfile.xp : 0;
  const cloudWeeklyXp = typeof cloudProfile?.weeklyXp === 'number' ? cloudProfile.weeklyXp : 0;
  const cloudGems = typeof cloudProfile?.gems === 'number' ? cloudProfile.gems : 0;

  const mergedXp = isSameAccount
    ? Math.max(guest.xp, cloudXp)
    : cloudProfile
      ? cloudXp + guest.xp
      : guest.xp;

  const mergedWeeklyXp = isSameAccount
    ? Math.max(guest.weeklyXp, cloudWeeklyXp)
    : cloudProfile
      ? cloudWeeklyXp + guest.weeklyXp
      : guest.weeklyXp;

  // Preserve guest-earned gems without duplicating the default 150 welcome gift when merging into an existing account.
  const mergedGems = isSameAccount
    ? Math.max(guest.gems, cloudGems)
    : cloudProfile
      ? cloudGems + Math.max(0, guest.gems - 150)
      : guest.gems;

  const resolvedUsername =
    guest.username && guest.username !== 'Coder'
      ? guest.username
      : cloudProfile?.username && cloudProfile.username !== 'Coder'
        ? cloudProfile.username
        : auth.displayName?.trim() || 'Coder';

  const sanitizedSlug = resolvedUsername
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  const resolvedHandle =
    guest.handle && guest.handle !== '@new_coder'
      ? guest.handle
      : cloudProfile?.handle && cloudProfile.handle !== '@new_coder'
        ? cloudProfile.handle
        : sanitizedSlug
          ? `@${sanitizedSlug}`
          : '@new_coder';

  const mergedStreak = Math.max(guest.streak, cloudProfile?.streak ?? 0);
  const mergedBestStreak = Math.max(guest.bestStreak ?? 0, mergedStreak);

  return {
    ...guest,
    id: auth.userId,
    username: resolvedUsername,
    handle: resolvedHandle,
    avatarUrl: cloudProfile?.avatarUrl ?? guest.avatarUrl ?? null,
    activeLang:
      guest.hasCompletedOnboarding || !cloudProfile?.activeLang
        ? guest.activeLang
        : cloudProfile.activeLang,
    xp: mergedXp,
    weeklyXp: mergedWeeklyXp,
    gems: mergedGems,
    hearts: Math.max(guest.hearts, cloudProfile?.hearts ?? guest.hearts),
    maxHearts: Math.max(guest.maxHearts, cloudProfile?.maxHearts ?? 5),
    streak: mergedStreak,
    bestStreak: mergedBestStreak,
    lastActiveDate: guest.lastActiveDate ?? cloudProfile?.lastActiveDate ?? null,
    league: computeLeagueForXp(mergedXp),
    bugsCrushed: Math.max(guest.bugsCrushed, cloudProfile?.bugsCrushed ?? 0),
    blitzBest: Math.max(guest.blitzBest, cloudProfile?.blitzBest ?? 0),
    executions: Math.max(guest.executions, cloudProfile?.executions ?? 0),
    completedNodes: mergedCompleted,
    nodeAccuracies: mergedAccuracies,
    hasCompletedOnboarding: true,
    authProvider: auth.provider,
    authEmail: auth.email,
    pendingSync: true,
  };
}

export async function deleteCloudAccountAndData(userId: string): Promise<{ error?: string }> {
  try {
    if (supabase && userId) {
      await supabase.from('user_progress').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      // Optional server-side self-delete RPC (no-ops cleanly if absent).
      try {
        await supabase.rpc('delete_user');
      } catch {
        // Ignore if RPC is not deployed on the Postgres instance
      }
      await supabase.auth.signOut();
    }
  } catch (err) {
    await wipeAllLocalStorage();
    return {
      error: err instanceof Error ? err.message : 'Unable to clear cloud records cleanly.',
    };
  }
  await wipeAllLocalStorage();
  return {};
}
