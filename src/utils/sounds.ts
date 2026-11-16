import { Platform } from 'react-native';
import {
  createAudioPlayer,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import {
  ensureSharedAudioMode,
  getCachedLocalAudioUri,
  NATIVE_PLAYER_UPDATE_INTERVAL_MS,
  playTactileSound,
  preloadSharedAudioAsset,
  releaseSoundEngine,
  setSoundEngineEnabled,
  warmupSoundEngine,
  type TactileSoundId,
} from '@/services/soundEngine';

export type SoundCue =
  | 'tap'
  | 'select'
  | 'token_in'
  | 'token_in_2'
  | 'token_in_3'
  | 'token_in_4'
  | 'token_in_5'
  | 'token_out'
  | 'token_snap'
  | 'card_swipe'
  | 'combo_up'
  | 'error'
  | 'level_complete'
  | 'drawer_open'
  | 'drawer_close'
  | 'correct'
  | 'combo'
  | 'wrong'
  | 'heart_lost'
  | 'run_code'
  | 'run_success'
  | 'coin'
  | 'tick'
  | 'tick_urgent'
  | 'victory'
  | 'step_next'
  | 'boot_ready'
  | 'reveal'
  | 'switch_on'
  | 'switch_off';

interface SoundSpec {
  source: AudioSource;
  poolSize: number;
  cooldownMs: number;
  volume: number;
}

const SOUND_SPECS: Record<SoundCue, SoundSpec> = {
  tap: {
    source: require('@/assets/sounds/tap.wav'),
    poolSize: 2,
    cooldownMs: 28,
    volume: 0.72,
  },
  select: {
    source: require('@/assets/sounds/select.wav'),
    poolSize: 2,
    cooldownMs: 36,
    volume: 0.78,
  },
  token_in: {
    source: require('@/assets/sounds/token_in.wav'),
    poolSize: 2,
    cooldownMs: 22,
    volume: 0.88,
  },
  token_in_2: {
    source: require('@/assets/sounds/token_in_2.wav'),
    poolSize: 1,
    cooldownMs: 22,
    volume: 0.88,
  },
  token_in_3: {
    source: require('@/assets/sounds/token_in_3.wav'),
    poolSize: 1,
    cooldownMs: 22,
    volume: 0.88,
  },
  token_in_4: {
    source: require('@/assets/sounds/token_in_4.wav'),
    poolSize: 1,
    cooldownMs: 22,
    volume: 0.88,
  },
  token_in_5: {
    source: require('@/assets/sounds/token_in_5.wav'),
    poolSize: 1,
    cooldownMs: 22,
    volume: 0.88,
  },
  token_out: {
    source: require('@/assets/sounds/token_out.wav'),
    poolSize: 2,
    cooldownMs: 22,
    volume: 0.82,
  },
  token_snap: {
    source: require('@/assets/sounds/token_in.wav'),
    poolSize: 2,
    cooldownMs: 20,
    volume: 0.85,
  },
  card_swipe: {
    source: require('@/assets/sounds/drawer_open.wav'),
    poolSize: 1,
    cooldownMs: 45,
    volume: 0.72,
  },
  combo_up: {
    source: require('@/assets/sounds/combo.wav'),
    poolSize: 1,
    cooldownMs: 70,
    volume: 0.96,
  },
  error: {
    source: require('@/assets/sounds/wrong.wav'),
    poolSize: 1,
    cooldownMs: 90,
    volume: 0.88,
  },
  level_complete: {
    source: require('@/assets/sounds/victory.wav'),
    poolSize: 1,
    cooldownMs: 250,
    volume: 0.96,
  },
  drawer_open: {
    source: require('@/assets/sounds/drawer_open.wav'),
    poolSize: 1,
    cooldownMs: 90,
    volume: 0.76,
  },
  drawer_close: {
    source: require('@/assets/sounds/drawer_close.wav'),
    poolSize: 2,
    cooldownMs: 90,
    volume: 0.72,
  },
  correct: {
    source: require('@/assets/sounds/correct.wav'),
    poolSize: 1,
    cooldownMs: 90,
    volume: 0.94,
  },
  combo: {
    source: require('@/assets/sounds/combo.wav'),
    poolSize: 1,
    cooldownMs: 110,
    volume: 0.96,
  },
  wrong: {
    source: require('@/assets/sounds/wrong.wav'),
    poolSize: 1,
    cooldownMs: 90,
    volume: 0.88,
  },
  heart_lost: {
    source: require('@/assets/sounds/heart_lost.wav'),
    poolSize: 1,
    cooldownMs: 140,
    volume: 0.9,
  },
  run_code: {
    source: require('@/assets/sounds/run_code.wav'),
    poolSize: 1,
    cooldownMs: 100,
    volume: 0.86,
  },
  run_success: {
    source: require('@/assets/sounds/run_success.wav'),
    poolSize: 1,
    cooldownMs: 120,
    volume: 0.92,
  },
  coin: {
    source: require('@/assets/sounds/coin.wav'),
    poolSize: 1,
    cooldownMs: 100,
    volume: 0.92,
  },
  tick: {
    source: require('@/assets/sounds/tick.wav'),
    poolSize: 1,
    cooldownMs: 420,
    volume: 0.65,
  },
  tick_urgent: {
    source: require('@/assets/sounds/tick_urgent.wav'),
    poolSize: 1,
    cooldownMs: 420,
    volume: 0.82,
  },
  victory: {
    source: require('@/assets/sounds/victory.wav'),
    poolSize: 1,
    cooldownMs: 350,
    volume: 0.96,
  },
  step_next: {
    source: require('@/assets/sounds/step_next.wav'),
    poolSize: 2,
    cooldownMs: 70,
    volume: 0.56,
  },
  boot_ready: {
    source: require('@/assets/sounds/boot_ready.wav'),
    poolSize: 1,
    cooldownMs: 280,
    volume: 0.52,
  },
  reveal: {
    source: require('@/assets/sounds/reveal.wav'),
    poolSize: 1,
    cooldownMs: 120,
    volume: 0.6,
  },
  switch_on: {
    source: require('@/assets/sounds/switch_on.wav'),
    poolSize: 1,
    cooldownMs: 45,
    volume: 0.72,
  },
  switch_off: {
    source: require('@/assets/sounds/switch_off.wav'),
    poolSize: 1,
    cooldownMs: 45,
    volume: 0.68,
  },
};

const CORE_WARM_CUES: readonly SoundCue[] = [
  'tap',
  'select',
  'switch_on',
  'switch_off',
  'drawer_close',
  'step_next',
  'token_out',
];

const STAGGERED_WARM_CUES: readonly SoundCue[] = [
  'token_in_2',
  'token_in_3',
  'token_in_4',
  'token_in_5',
  'run_code',
  'coin',
  'heart_lost',
];

const SECONDARY_PRELOAD_CUES: readonly SoundCue[] = [
  ...STAGGERED_WARM_CUES,
  'run_success',
  'reveal',
  'tick',
  'tick_urgent',
  'boot_ready',
];

const CORE_CUE_SET = new Set<SoundCue>(CORE_WARM_CUES);
const MAX_ANDROID_ACTIVE_SECONDARY_CUES = 7;

const PENTATONIC_TOKEN_CUES: readonly SoundCue[] = [
  'token_in',
  'token_in_2',
  'token_in_3',
  'token_in_4',
  'token_in_5',
];

interface PoolSlot {
  player: AudioPlayer;
  isLoaded: boolean;
  isPlaying: boolean;
  hasPlayed: boolean;
  lastUsedAt: number;
  lastVolume: number;
  needsRewind: boolean;
  isRewinding: boolean;
  rewindGen: number;
  rewindPromise: Promise<void> | null;
  pendingPlayGen: number;
  isLocalUri: boolean;
  isPriming: boolean;
  primeTimer: ReturnType<typeof setTimeout> | null;
  subscription: { remove: () => void } | null;
  onLoadedWaiter?: (() => void) | null;
}

interface CuePool {
  slots: PoolSlot[];
  cursor: number;
}

let soundsEnabled = true;
let hasBootFocused = false;
let hardwarePrimed = false;
let lastAnySoundAt = 0;
let warmupPromise: Promise<void> | null = null;
let staggeredWarmTimer: ReturnType<typeof setTimeout> | null = null;

const pools = new Map<SoundCue, CuePool>();
const lastPlayedAt = new Map<SoundCue, number>();

function isAudioRuntimeSupported(): boolean {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return false;
  }
  return true;
}

function getPreferredSource(cue: SoundCue): { source: AudioSource; isLocal: boolean } {
  const rawSource = SOUND_SPECS[cue].source;
  if (Platform.OS !== 'web' && typeof rawSource === 'number') {
    const localUri = getCachedLocalAudioUri(rawSource);
    if (localUri) {
      return { source: { uri: localUri }, isLocal: true };
    }
  }

  return { source: rawSource, isLocal: Platform.OS === 'web' };
}

function rewindSlotAfterFinish(slot: PoolSlot): Promise<void> {
  if (slot.isRewinding && slot.rewindPromise) {
    return slot.rewindPromise;
  }
  const gen = ++slot.rewindGen;
  slot.isRewinding = true;
  slot.needsRewind = true;

  const promise = slot.player
    .seekTo(0, 0, 0)
    .then(() => {
      if (slot.rewindGen === gen) {
        slot.needsRewind = false;
      }
    })
    .catch(() => {
      // Preserve needsRewind = true if seek failed so next play recovers cleanly.
    })
    .finally(() => {
      if (slot.rewindGen === gen) {
        slot.isRewinding = false;
        if (slot.rewindPromise === promise) {
          slot.rewindPromise = null;
        }
      }
    });

  slot.rewindPromise = promise;
  return promise;
}

function clearPrimeTimer(slot: PoolSlot): void {
  if (slot.primeTimer) {
    clearTimeout(slot.primeTimer);
    slot.primeTimer = null;
  }
}

function finishSlotPrime(slot: PoolSlot, restoreVolume: number): void {
  clearPrimeTimer(slot);
  if (!slot.isPriming) return;
  slot.isPriming = false;
  try {
    if (slot.isPlaying) {
      slot.player.pause();
      slot.isPlaying = false;
    }
  } catch {
    // Ignore pause errors during teardown.
  }
  if (Math.abs(slot.lastVolume - restoreVolume) > 0.005) {
    slot.lastVolume = restoreVolume;
    slot.player.volume = restoreVolume;
  }
  void rewindSlotAfterFinish(slot);
}

function releaseCuePool(cue: SoundCue, pool: CuePool): void {
  for (const slot of pool.slots) {
    clearPrimeTimer(slot);
    slot.onLoadedWaiter = null;
    try {
      slot.subscription?.remove();
    } catch {
      // Ignore listener removal errors.
    }
    try {
      slot.player.release();
    } catch {
      // Ignore already-released players.
    }
  }
  pools.delete(cue);
}

function pruneAndroidSecondaryPoolsIfNeeded(protectedCue: SoundCue): void {
  if (Platform.OS !== 'android') return;

  const activeSecondary: { cue: SoundCue; pool: CuePool; lastUsedAt: number }[] = [];
  for (const [cue, pool] of pools.entries()) {
    if (CORE_CUE_SET.has(cue) || cue === protectedCue) continue;
    const anyPlayed = pool.slots.some((s) => s.hasPlayed);
    if (!anyPlayed) continue;
    const latestUse = pool.slots.reduce((max, s) => Math.max(max, s.lastUsedAt), 0);
    activeSecondary.push({ cue, pool, lastUsedAt: latestUse });
  }

  if (activeSecondary.length <= MAX_ANDROID_ACTIVE_SECONDARY_CUES) return;
  activeSecondary.sort((a, b) => a.lastUsedAt - b.lastUsedAt);

  let toDrop = activeSecondary.length - MAX_ANDROID_ACTIVE_SECONDARY_CUES;
  for (const item of activeSecondary) {
    if (toDrop <= 0) break;
    const busy = item.pool.slots.some(
      (s) => s.isPlaying || s.isRewinding || s.isPriming,
    );
    if (!busy) {
      releaseCuePool(item.cue, item.pool);
      toDrop--;
    }
  }
}

function createSlot(cue: SoundCue): PoolSlot {
  const spec = SOUND_SPECS[cue];
  const { source, isLocal } = getPreferredSource(cue);
  const player = createAudioPlayer(source, {
    updateInterval: NATIVE_PLAYER_UPDATE_INTERVAL_MS,
    keepAudioSessionActive: true,
    allowsExternalPlayback: false,
  });
  player.volume = spec.volume;

  const slot: PoolSlot = {
    player,
    isLoaded: false,
    isPlaying: false,
    hasPlayed: false,
    lastUsedAt: 0,
    lastVolume: spec.volume,
    needsRewind: false,
    isRewinding: false,
    rewindGen: 0,
    rewindPromise: null,
    pendingPlayGen: 0,
    isLocalUri: isLocal,
    isPriming: false,
    primeTimer: null,
    subscription: null,
    onLoadedWaiter: null,
  };

  slot.subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.isLoaded) {
      slot.isLoaded = true;
      if (slot.onLoadedWaiter) {
        const waiter = slot.onLoadedWaiter;
        slot.onLoadedWaiter = null;
        waiter();
      }
    }
    if (typeof status.playing === 'boolean') {
      slot.isPlaying = status.playing;
    }
    if (slot.isPriming) {
      if (status.didJustFinish || (!status.playing && status.currentTime > 0)) {
        finishSlotPrime(slot, spec.volume);
      }
      return;
    }
    if (Platform.OS !== 'web' && status.didJustFinish) {
      slot.isPlaying = false;
      slot.needsRewind = true;
      void rewindSlotAfterFinish(slot);
    }
  });

  return slot;
}

function ensurePool(cue: SoundCue): CuePool | null {
  if (!isAudioRuntimeSupported()) return null;

  const existing = pools.get(cue);
  if (existing) return existing;

  const spec = SOUND_SPECS[cue];
  const slots: PoolSlot[] = [];
  for (let i = 0; i < spec.poolSize; i++) {
    slots.push(createSlot(cue));
  }

  const pool: CuePool = { slots, cursor: 0 };
  pools.set(cue, pool);
  return pool;
}

function upgradePoolToLocalUri(cue: SoundCue, localUri: string): void {
  const pool = pools.get(cue);
  if (!pool) return;
  for (const slot of pool.slots) {
    if (!slot.isLocalUri && !slot.isPriming && !slot.isPlaying && !slot.isRewinding) {
      try {
        slot.player.replace({ uri: localUri });
        slot.isLocalUri = true;
        slot.needsRewind = false;
        slot.isRewinding = false;
        slot.rewindPromise = null;
        slot.isLoaded = false;
      } catch {
        // Keep existing source if replace fails mid-transition.
      }
    }
  }
}

function primeTapHardwarePipeline(): void {
  if (
    Platform.OS === 'web' ||
    hardwarePrimed ||
    !soundsEnabled ||
    !isAudioRuntimeSupported()
  ) {
    return;
  }

  const pool = ensurePool('tap');
  const slot = pool?.slots[0];
  if (!slot || slot.needsRewind || slot.isRewinding || slot.isPriming || slot.isPlaying) {
    return;
  }

  hardwarePrimed = true;
  const spec = SOUND_SPECS.tap;

  const triggerSilentPrime = () => {
    if (
      !soundsEnabled ||
      slot.needsRewind ||
      slot.isRewinding ||
      slot.isPriming ||
      slot.isPlaying
    ) {
      return;
    }
    slot.isPriming = true;
    slot.lastVolume = 0;
    slot.player.volume = 0;
    slot.primeTimer = setTimeout(() => {
      finishSlotPrime(slot, spec.volume);
    }, 280);
    try {
      slot.isPlaying = true;
      slot.hasPlayed = true;
      slot.player.play();
    } catch {
      slot.isPlaying = false;
      finishSlotPrime(slot, spec.volume);
    }
  };

  if (slot.isLoaded || slot.player.isLoaded) {
    slot.isLoaded = true;
    triggerSilentPrime();
  } else {
    slot.onLoadedWaiter = triggerSilentPrime;
  }
}

async function prepareCueAssetAndPool(
  cue: SoundCue,
  createPlayerPool: boolean,
): Promise<void> {
  const rawSource = SOUND_SPECS[cue].source;
  if (Platform.OS !== 'web' && typeof rawSource === 'number') {
    const localUri = await preloadSharedAudioAsset(rawSource);
    if (localUri && createPlayerPool) {
      upgradePoolToLocalUri(cue, localUri);
    }
  }

  if (createPlayerPool) {
    try {
      ensurePool(cue);
    } catch {
      // Ignore decode errors on exotic runtimes; lazy init retries on tap.
    }
  }

  if (cue === 'tap') {
    await ensureSharedAudioMode();
    primeTapHardwarePipeline();
  }
}

/** Enable or mute all application sound effects. */
export function setSoundsEnabled(enabled: boolean): void {
  soundsEnabled = enabled;
  setSoundEngineEnabled(enabled);
  if (enabled) {
    initAudioSession();
  }
}

/** Read whether application sound effects are currently active. */
export function isSoundsEnabled(): boolean {
  return soundsEnabled;
}

/**
 * Configure and activate the OS audio session, download local sound assets,
 * preload all SFX player pools, and warm the hardware render pipeline.
 * Safe to invoke multiple times; no-ops during web SSR.
 */
export function initAudioSession(): void {
  if (!isAudioRuntimeSupported()) return;
  void ensureSharedAudioMode();
  void warmupSoundEngine();

  if (!warmupPromise) {
    warmupPromise = Promise.all([
      ...CORE_WARM_CUES.map((cue) => prepareCueAssetAndPool(cue, true)),
      ...SECONDARY_PRELOAD_CUES.map((cue) => prepareCueAssetAndPool(cue, false)),
    ]).then(() => {
      if (Platform.OS === 'web' || !soundsEnabled || staggeredWarmTimer) {
        return;
      }
      // Gently stagger secondary lesson pools after boot so Android startup doesn't hitch.
      staggeredWarmTimer = setTimeout(() => {
        staggeredWarmTimer = null;
        if (!soundsEnabled || !isAudioRuntimeSupported()) return;
        for (const cue of STAGGERED_WARM_CUES) {
          try {
            ensurePool(cue);
          } catch {
            // Non-fatal lazy fallback on first play.
          }
        }
      }, 160);
    });
  }
}

function pickPoolSlot(pool: CuePool): PoolSlot {
  const len = pool.slots.length;
  for (let offset = 0; offset < len; offset++) {
    const idx = (pool.cursor + offset) % len;
    const candidate = pool.slots[idx];
    if (
      !candidate.isPriming &&
      !candidate.isPlaying &&
      !candidate.needsRewind &&
      !candidate.isRewinding
    ) {
      pool.cursor = (idx + 1) % len;
      return candidate;
    }
  }
  for (let offset = 0; offset < len; offset++) {
    const idx = (pool.cursor + offset) % len;
    const candidate = pool.slots[idx];
    if (!candidate.isPriming && !candidate.isPlaying) {
      pool.cursor = (idx + 1) % len;
      return candidate;
    }
  }
  const fallback = pool.slots[pool.cursor % len];
  pool.cursor = (pool.cursor + 1) % len;
  return fallback;
}

interface BridgedTactileTarget {
  tactileId: TactileSoundId;
  volumeScale?: number;
  preserveNaturalPitch?: boolean;
  localCooldownMs?: number;
}

const TACTILE_BRIDGE_CUES: Partial<Record<SoundCue, BridgedTactileTarget>> = {
  token_snap: { tactileId: 'token_snap' },
  token_in: { tactileId: 'token_snap' },
  card_swipe: { tactileId: 'card_swipe' },
  drawer_open: {
    tactileId: 'card_swipe',
    volumeScale: 0.76 / 0.65,
    localCooldownMs: 90,
  },
  correct: { tactileId: 'correct', volumeScale: 0.94 / 0.92 },
  combo_up: { tactileId: 'combo_up' },
  combo: {
    tactileId: 'combo_up',
    volumeScale: 0.96 / 0.94,
    preserveNaturalPitch: true,
  },
  error: { tactileId: 'error' },
  wrong: { tactileId: 'error' },
  level_complete: { tactileId: 'level_complete', volumeScale: 0.96 / 0.94 },
  victory: { tactileId: 'level_complete', volumeScale: 0.96 / 0.94 },
};

/**
 * Play a sound cue using the zero-wait pre-rewound ring-buffer pool.
 */
export function playSound(
  cue: SoundCue,
  options?: { volumeMultiplier?: number; comboCount?: number },
): void {
  if (!soundsEnabled || !isAudioRuntimeSupported()) return;

  const bridged = TACTILE_BRIDGE_CUES[cue];
  if (bridged) {
    const now = Date.now();
    if (bridged.localCooldownMs) {
      const prev = lastPlayedAt.get(cue) ?? 0;
      if (now - prev < bridged.localCooldownMs) return;
    }
    lastPlayedAt.set(cue, now);
    lastAnySoundAt = now;

    const scaledMultiplier =
      bridged.volumeScale !== undefined
        ? (options?.volumeMultiplier ?? 1) * bridged.volumeScale
        : options?.volumeMultiplier;

    playTactileSound(bridged.tactileId, {
      comboCount: options?.comboCount,
      skipHaptic: true,
      volumeMultiplier: scaledMultiplier,
      preserveNaturalPitch: bridged.preserveNaturalPitch,
    });
    return;
  }

  const spec = SOUND_SPECS[cue];
  const now = Date.now();
  const prev = lastPlayedAt.get(cue) ?? 0;
  if (now - prev < spec.cooldownMs) return;
  lastPlayedAt.set(cue, now);
  lastAnySoundAt = now;

  void ensureSharedAudioMode();

  try {
    const pool = ensurePool(cue);
    if (!pool || pool.slots.length === 0) return;

    const slot = pickPoolSlot(pool);
    const targetVolume =
      options?.volumeMultiplier !== undefined
        ? Math.max(0.05, Math.min(1, spec.volume * options.volumeMultiplier))
        : spec.volume;

    // Cancel any queued or in-flight silent hardware prime before taking ownership.
    slot.onLoadedWaiter = null;
    if (slot.isPriming) {
      clearPrimeTimer(slot);
      slot.isPriming = false;
      slot.needsRewind = true;
    }

    slot.lastUsedAt = now;
    slot.hasPlayed = true;
    pruneAndroidSecondaryPoolsIfNeeded(cue);

    if (Math.abs(slot.lastVolume - targetVolume) > 0.005) {
      slot.lastVolume = targetVolume;
      slot.player.volume = targetVolume;
    }

    if (Platform.OS === 'web') {
      if (slot.player.currentTime > 0 || slot.player.playing) {
        void slot.player
          .seekTo(0, 0, 0)
          .then(() => {
            if (soundsEnabled) slot.player.play();
          })
          .catch(() => {
            try {
              if (soundsEnabled) slot.player.play();
            } catch {
              // Ignore playback interruptions on background transitions.
            }
          });
      } else {
        slot.player.play();
      }
      return;
    }

    if (!slot.needsRewind && !slot.isRewinding && !slot.isPlaying) {
      slot.needsRewind = true;
      slot.isPlaying = true;
      slot.player.play();
      return;
    }

    const playGen = ++slot.pendingPlayGen;
    const rewindTask =
      slot.isRewinding && slot.rewindPromise
        ? slot.rewindPromise.then(() =>
            slot.needsRewind ? rewindSlotAfterFinish(slot) : undefined,
          )
        : rewindSlotAfterFinish(slot);

    void rewindTask
      .then(() => {
        if (soundsEnabled && slot.pendingPlayGen === playGen) {
          slot.needsRewind = true;
          slot.isPlaying = true;
          slot.player.play();
        }
      })
      .catch(() => {
        try {
          if (soundsEnabled && slot.pendingPlayGen === playGen) {
            slot.needsRewind = true;
            slot.isPlaying = true;
            slot.player.play();
          }
        } catch {
          // Ignore playback interruptions on background transitions.
        }
      });
  } catch {
    // Audio playback must never break UI interactions.
  }
}

/**
 * Play an ascending C-major pentatonic marimba pop when placing code tokens into slots.
 */
export function playTokenPlaceSound(slotIndex: number): void {
  const safeIndex = Math.max(0, slotIndex);
  const cue =
    PENTATONIC_TOKEN_CUES[safeIndex % PENTATONIC_TOKEN_CUES.length] ?? 'token_in';
  playSound(cue);
}

/**
 * Play the crisp confirmation chime, stepping up to the combo shimmer at 3+ streak.
 */
export function playCorrectStreakSound(comboAfterAnswer: number): void {
  playSound(comboAfterAnswer >= 3 ? 'combo' : 'correct');
}

/** Release all allocated native audio players cleanly. */
export function releaseSoundEffects(): void {
  if (staggeredWarmTimer) {
    clearTimeout(staggeredWarmTimer);
    staggeredWarmTimer = null;
  }
  for (const [cue, pool] of pools.entries()) {
    releaseCuePool(cue, pool);
  }
  pools.clear();
  lastPlayedAt.clear();
  hardwarePrimed = false;
  warmupPromise = null;
  releaseSoundEngine();
}

/**
 * Play a soft navigation click when switching tabs, skipping the initial boot mount
 * and avoiding double-triggers when arriving via an explicit in-screen navigation button.
 */
export function playTabFocusSound(): void {
  if (!hasBootFocused) {
    hasBootFocused = true;
    return;
  }
  if (Date.now() - lastAnySoundAt < 180) {
    return;
  }
  playSound('tap', { volumeMultiplier: 0.55 });
}

// Kick off audio session setup, local WAV downloads, and hardware warm-up immediately at bundle load
// instead of waiting for SplashScreen/font loading to finish.
if (isAudioRuntimeSupported()) {
  initAudioSession();
}
