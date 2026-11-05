import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { LangId } from '@/data/courses';

const MAX_HEARTS = 5;
const REFILL_COST = 50;
const STORAGE_KEY = 'codelingo_duolingo_v3';

interface PersistedState {
  xp: number;
  weeklyXp: number;
  streak: number;
  gems: number;
  hearts: number;
  activeLang: LangId;
  completedNodes: Record<LangId, string[]>;
  claimedChests: string[];
  bestCombo: number;
  totalAnswers: number;
  correctAnswers: number;
  bugsCrushed: number;
  blitzBest: number;
}

const INITIAL_STATE: PersistedState = {
  xp: 850,
  weeklyXp: 420,
  streak: 5,
  gems: 450,
  hearts: MAX_HEARTS,
  activeLang: 'python',
  completedNodes: {
    python: ['python-0', 'python-1'],
    cpp: ['cpp-0'],
    js: [],
    go: ['go-0'],
  },
  claimedChests: [],
  bestCombo: 4,
  totalAnswers: 18,
  correctAnswers: 16,
  bugsCrushed: 6,
  blitzBest: 5,
};

function loadSavedState(): PersistedState {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        return {
          ...INITIAL_STATE,
          ...parsed,
          completedNodes: {
            ...INITIAL_STATE.completedNodes,
            ...(parsed.completedNodes ?? {}),
          },
          claimedChests: parsed.claimedChests ?? INITIAL_STATE.claimedChests,
        };
      }
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
  return INITIAL_STATE;
}

function saveState(state: PersistedState): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage write errors
  }
}

interface GameState extends PersistedState {
  maxHearts: number;
  combo: number;
  setActiveLang: (lang: LangId) => void;
  /** Records a single exercise answer, updating XP, combo, and hearts. Returns XP earned. */
  recordAnswer: (correct: boolean, baseXp?: number) => number;
  /** Marks a path node completed and awards completion XP + gems. */
  completeNode: (lang: LangId, nodeId: string, bonusXp?: number) => void;
  /** Claims a path bonus treasure chest (+25 gems). Returns true if newly claimed. */
  claimChest: (chestId: string) => boolean;
  /** Spends 50 gems to restore full hearts (or free emergency refill if gems < 50 and hearts === 0). */
  refillHearts: () => boolean;
  /** Records a 60s Bug Hunt Blitz score and awards XP + gems. */
  recordBlitzScore: (score: number, bugsFixed: number) => void;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadSavedState(), []);

  const [xp, setXp] = useState(initial.xp);
  const [weeklyXp, setWeeklyXp] = useState(initial.weeklyXp);
  const [streak] = useState(initial.streak);
  const [gems, setGems] = useState(initial.gems);
  const [hearts, setHearts] = useState(initial.hearts);
  const [activeLang, setActiveLang] = useState<LangId>(initial.activeLang);
  const [completedNodes, setCompletedNodes] = useState<Record<LangId, string[]>>(initial.completedNodes);
  const [claimedChests, setClaimedChests] = useState<string[]>(initial.claimedChests);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(initial.bestCombo);
  const [totalAnswers, setTotalAnswers] = useState(initial.totalAnswers);
  const [correctAnswers, setCorrectAnswers] = useState(initial.correctAnswers);
  const [bugsCrushed, setBugsCrushed] = useState(initial.bugsCrushed);
  const [blitzBest, setBlitzBest] = useState(initial.blitzBest);

  useEffect(() => {
    saveState({
      xp,
      weeklyXp,
      streak,
      gems,
      hearts,
      activeLang,
      completedNodes,
      claimedChests,
      bestCombo,
      totalAnswers,
      correctAnswers,
      bugsCrushed,
      blitzBest,
    });
  }, [
    xp,
    weeklyXp,
    streak,
    gems,
    hearts,
    activeLang,
    completedNodes,
    claimedChests,
    bestCombo,
    totalAnswers,
    correctAnswers,
    bugsCrushed,
    blitzBest,
  ]);

  const recordAnswer = useCallback(
    (correct: boolean, baseXp = 10): number => {
      setTotalAnswers((t) => t + 1);
      if (correct) {
        const nextCombo = combo + 1;
        const mult = nextCombo >= 4 ? 2 : nextCombo >= 2 ? 1.5 : 1;
        const gained = Math.round(baseXp * mult);
        setCombo(nextCombo);
        setBestCombo((b) => Math.max(b, nextCombo));
        setCorrectAnswers((c) => c + 1);
        setXp((x) => x + gained);
        setWeeklyXp((w) => w + gained);
        return gained;
      } else {
        setCombo(0);
        setHearts((h) => Math.max(0, h - 1));
        return 0;
      }
    },
    [combo],
  );

  const completeNode = useCallback((lang: LangId, nodeId: string, bonusXp = 15) => {
    setCompletedNodes((prev) => {
      const current = prev[lang] ?? [];
      if (current.includes(nodeId)) return prev;
      return { ...prev, [lang]: [...current, nodeId] };
    });
    setXp((x) => x + bonusXp);
    setWeeklyXp((w) => w + bonusXp);
    setGems((g) => g + 20);
  }, []);

  const claimChest = useCallback(
    (chestId: string): boolean => {
      if (claimedChests.includes(chestId)) return false;
      setClaimedChests((prev) => [...prev, chestId]);
      setGems((g) => g + 25);
      return true;
    },
    [claimedChests],
  );

  const refillHearts = useCallback((): boolean => {
    if (hearts >= MAX_HEARTS) return false;
    if (gems >= REFILL_COST) {
      setGems((g) => g - REFILL_COST);
      setHearts(MAX_HEARTS);
      return true;
    }
    if (hearts === 0) {
      setHearts(MAX_HEARTS);
      return true;
    }
    return false;
  }, [hearts, gems]);

  const recordBlitzScore = useCallback((score: number, bugsFixed: number) => {
    setBlitzBest((b) => Math.max(b, score));
    setBugsCrushed((c) => c + bugsFixed);
    if (score > 0) {
      setXp((x) => x + score * 15);
      setWeeklyXp((w) => w + score * 15);
      setGems((g) => g + score * 5);
    }
  }, []);

  return (
    <GameContext.Provider
      value={{
        xp,
        weeklyXp,
        streak,
        gems,
        hearts,
        maxHearts: MAX_HEARTS,
        activeLang,
        completedNodes,
        claimedChests,
        combo,
        bestCombo,
        totalAnswers,
        correctAnswers,
        bugsCrushed,
        blitzBest,
        setActiveLang,
        recordAnswer,
        completeNode,
        claimChest,
        refillHearts,
        recordBlitzScore,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
