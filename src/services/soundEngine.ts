import { AppState, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import {
  createAudioPlayer,
  preload,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';

export type TactileSoundId =
  | 'token_snap'
  | 'card_swipe'
  | 'correct'
  | 'combo_up'
  | 'error'
  | 'level_complete';

export interface PlayTactileOptions {
  comboCount?: number;
  skipHaptic?: boolean;
  volumeMultiplier?: number;
  preserveNaturalPitch?: boolean;
}

const SAMPLE_RATE = 22050;
const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Long update interval avoids perpetual 250ms UI-thread coroutine wakeups on Android ExoPlayer;
// completion (`didJustFinish`) and readiness (`isLoaded`) arrive via native listener callbacks.
export const NATIVE_PLAYER_UPDATE_INTERVAL_MS = 2000;

interface TactilePoolSlot {
  player: AudioPlayer;
  isLoaded: boolean;
  isPlaying: boolean;
  needsRewind: boolean;
  isRewinding: boolean;
  rewindGen: number;
  rewindPromise: Promise<void> | null;
  pendingPlayGen: number;
  isLocalUri: boolean;
  isPriming: boolean;
  primeTimer: ReturnType<typeof setTimeout> | null;
  onLoadedWaiter: (() => void) | null;
  lastVolume: number;
  lastRate: number;
  subscription: { remove: () => void } | null;
}

interface TactilePool {
  slots: TactilePoolSlot[];
  cursor: number;
}

let soundEngineEnabled = true;
let hardwarePrimed = false;
let audioModePromise: Promise<void> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let warmupPromise: Promise<void> | null = null;
let victoryWarmTimer: ReturnType<typeof setTimeout> | null = null;
const pools = new Map<string, TactilePool>();
const lastTriggeredAt = new Map<string, number>();
const assetPreloadPromises = new Map<number, Promise<string | null>>();
const cachedLocalUrisByModule = new Map<number, string>();

const FALLBACK_ASSETS: Record<TactileSoundId, AudioSource> = {
  token_snap: require('@/assets/sounds/token_in.wav'),
  card_swipe: require('@/assets/sounds/drawer_open.wav'),
  correct: require('@/assets/sounds/correct.wav'),
  combo_up: require('@/assets/sounds/combo.wav'),
  error: require('@/assets/sounds/wrong.wav'),
  level_complete: require('@/assets/sounds/victory.wav'),
};

const BASE_VOLUME: Record<TactileSoundId, number> = {
  token_snap: 0.88,
  card_swipe: 0.65,
  correct: 0.92,
  combo_up: 0.94,
  error: 0.88,
  level_complete: 0.94,
};

const POOL_SIZE: Record<TactileSoundId, number> = {
  token_snap: 2,
  card_swipe: 2,
  correct: 2,
  combo_up: 2,
  error: 2,
  level_complete: 1,
};

const COOLDOWN_MS: Record<TactileSoundId, number> = {
  token_snap: 20,
  card_swipe: 45,
  correct: 70,
  combo_up: 70,
  error: 90,
  level_complete: 220,
};

function isRuntimeAudioSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined';
  }
  return true;
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const hasB1 = i + 1 < bytes.length;
    const hasB2 = i + 2 < bytes.length;
    const b1 = hasB1 ? bytes[i + 1] : 0;
    const b2 = hasB2 ? bytes[i + 2] : 0;
    const triplet = (b0 << 16) | (b1 << 8) | b2;

    out += BASE64_CHARS[(triplet >> 18) & 0x3f];
    out += BASE64_CHARS[(triplet >> 12) & 0x3f];
    out += hasB1 ? BASE64_CHARS[(triplet >> 6) & 0x3f] : '=';
    out += hasB2 ? BASE64_CHARS[triplet & 0x3f] : '=';
  }
  return out;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Render signed float samples (-1..1) into a standard 16-bit mono PCM WAV data URI.
 */
function samplesToWavDataUri(samples: Float32Array): string {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i += 1) {
    const clamped = Math.max(-0.98, Math.min(0.98, samples[i]));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  return `data:audio/wav;base64,${encodeBytesToBase64(new Uint8Array(buffer))}`;
}

function renderToneSweep(
  durationSec: number,
  fStart: number,
  fEnd: number,
  gain = 0.52,
  harmonicGain = 0.18,
  decayRate = 18,
): Float32Array {
  const total = Math.max(128, Math.floor(SAMPLE_RATE * durationSec));
  const out = new Float32Array(total);
  let phase = 0;
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const p = i / total;
    const freq = fStart + (fEnd - fStart) * p;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.004);
    const env = attack * Math.exp(-decayRate * p);
    const body = Math.sin(phase) + harmonicGain * Math.sin(phase * 2.0);
    out[i] = body * env * gain;
  }
  return out;
}

function renderSequence(
  notes: readonly { freq: number; delaySec: number; durSec: number; gain: number }[],
  totalSec: number,
): Float32Array {
  const total = Math.floor(SAMPLE_RATE * totalSec);
  const out = new Float32Array(total);
  for (const n of notes) {
    const startIdx = Math.floor(n.delaySec * SAMPLE_RATE);
    const noteLen = Math.floor(n.durSec * SAMPLE_RATE);
    for (let j = 0; j < noteLen && startIdx + j < total; j += 1) {
      const t = j / SAMPLE_RATE;
      const p = j / noteLen;
      const attack = Math.min(1, t / 0.006);
      const decay = Math.exp(-7.5 * p);
      const wave =
        Math.sin(2 * Math.PI * n.freq * t) +
        0.24 * Math.sin(2 * Math.PI * n.freq * 2 * t) +
        0.08 * Math.sin(2 * Math.PI * n.freq * 3 * t);
      out[startIdx + j] += wave * attack * decay * n.gain;
    }
  }
  return out;
}

const cachedDataUris = new Map<string, string>();

/**
 * Procedural 16-bit mono PCM WAV synthesizer generating crisp tactical UI cues.
 */
export function synthesizeWavDataUri(
  sound: TactileSoundId,
  comboCount = 1,
): string {
  const clampedCombo = Math.max(1, Math.min(12, Math.round(comboCount)));
  const cacheKey = sound === 'combo_up' ? `${sound}_${clampedCombo}` : sound;
  const existing = cachedDataUris.get(cacheKey);
  if (existing) return existing;

  let samples: Float32Array;
  switch (sound) {
    case 'token_snap': {
      // Crisp mechanical keycap click (850Hz -> 1200Hz, ~25ms)
      samples = renderToneSweep(0.032, 850, 1200, 0.56, 0.28, 9.5);
      break;
    }
    case 'card_swipe': {
      // Soft airy whoosh (520Hz -> 240Hz + subtle filtered air transient, ~68ms)
      const total = Math.floor(SAMPLE_RATE * 0.068);
      samples = new Float32Array(total);
      let phase = 0;
      let noiseState = 0.25;
      for (let i = 0; i < total; i += 1) {
        const p = i / total;
        const freq = 520 - 280 * p;
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        // Deterministic linear congruential noise filtered gently
        const raw = ((i * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5;
        noiseState = noiseState * 0.78 + raw * 0.22;
        const env = Math.sin(Math.PI * p) * Math.exp(-3.2 * p);
        samples[i] = (0.35 * Math.sin(phase) + 0.55 * noiseState) * env * 0.65;
      }
      break;
    }
    case 'correct': {
      // Warm major-third harmonic chime (C5 523.25Hz -> E5 659.25Hz, ~150ms)
      samples = renderSequence(
        [
          { freq: 523.25, delaySec: 0, durSec: 0.095, gain: 0.42 },
          { freq: 659.25, delaySec: 0.048, durSec: 0.13, gain: 0.48 },
        ],
        0.19,
      );
      break;
    }
    case 'combo_up': {
      // Rising chromatic pitch chime scaling cleanly with comboCount
      const semitones = clampedCombo - 1;
      const baseFreq = 523.25 * Math.pow(2, semitones / 12);
      const fifthFreq = baseFreq * 1.4983;
      samples = renderSequence(
        [
          { freq: baseFreq, delaySec: 0, durSec: 0.075, gain: 0.38 },
          { freq: fifthFreq, delaySec: 0.036, durSec: 0.115, gain: 0.48 },
        ],
        0.16,
      );
      break;
    }
    case 'error': {
      // Muted low wooden/synth thud (180Hz -> 130Hz, ~160ms)
      samples = renderToneSweep(0.16, 180, 130, 0.58, 0.16, 6.2);
      break;
    }
    case 'level_complete': {
      // Clean 4-note ascending electronic arpeggio (C5 - E5 - G5 - B5)
      samples = renderSequence(
        [
          { freq: 523.25, delaySec: 0, durSec: 0.12, gain: 0.34 },
          { freq: 659.25, delaySec: 0.068, durSec: 0.13, gain: 0.36 },
          { freq: 783.99, delaySec: 0.136, durSec: 0.15, gain: 0.38 },
          { freq: 987.77, delaySec: 0.205, durSec: 0.24, gain: 0.46 },
        ],
        0.46,
      );
      break;
    }
  }

  const uri = samplesToWavDataUri(samples);
  cachedDataUris.set(cacheKey, uri);
  return uri;
}

export function attachSharedAudioAppStateListener(): void {
  if (!isRuntimeAudioSupported() || Platform.OS === 'web' || appStateSubscription) {
    return;
  }
  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void setIsAudioActiveAsync(true).catch(() => undefined);
    }
  });
}

/**
 * Configure and activate the OS audio session once across all sound subsystems.
 */
export function ensureSharedAudioMode(): Promise<void> {
  if (!isRuntimeAudioSupported()) return Promise.resolve();
  attachSharedAudioAppStateListener();
  if (audioModePromise) return audioModePromise;

  audioModePromise = setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  })
    .then(() => setIsAudioActiveAsync(true))
    .catch(() => {
      audioModePromise = null;
    });

  return audioModePromise;
}

export function getCachedLocalAudioUri(moduleId: number): string | null {
  const cached = cachedLocalUrisByModule.get(moduleId);
  if (cached) return cached;
  const asset = Asset.fromModule(moduleId);
  if (asset.localUri) {
    cachedLocalUrisByModule.set(moduleId, asset.localUri);
    return asset.localUri;
  }
  return null;
}

/**
 * Resolve a bundled audio asset to a local URI and populate Expo's preload byte cache once.
 */
export function preloadSharedAudioAsset(moduleId: number): Promise<string | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);

  const cached = getCachedLocalAudioUri(moduleId);
  const existing = assetPreloadPromises.get(moduleId);
  if (existing) return existing;

  const task = (async (): Promise<string | null> => {
    try {
      let localUri = cached;
      if (!localUri) {
        const asset = Asset.fromModule(moduleId);
        await asset.downloadAsync();
        localUri = asset.localUri ?? null;
        if (localUri) {
          cachedLocalUrisByModule.set(moduleId, localUri);
        }
      }
      if (localUri) {
        await preload({ uri: localUri }, { preferredForwardBufferDuration: 2 }).catch(
          () => undefined,
        );
      }
      return localUri;
    } catch {
      return null;
    }
  })();

  assetPreloadPromises.set(moduleId, task);
  return task;
}

function rewindSlotAfterFinish(slot: TactilePoolSlot): Promise<void> {
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
      // Keep needsRewind = true so the next play recovers cleanly.
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

function clearPrimeTimer(slot: TactilePoolSlot): void {
  if (slot.primeTimer) {
    clearTimeout(slot.primeTimer);
    slot.primeTimer = null;
  }
}

function finishSlotPrime(slot: TactilePoolSlot, restoreVolume: number): void {
  clearPrimeTimer(slot);
  if (!slot.isPriming) return;
  slot.isPriming = false;
  try {
    if (slot.isPlaying) {
      slot.player.pause();
      slot.isPlaying = false;
    }
  } catch {
    // Ignore pause errors during warm-up teardown
  }
  if (Math.abs(slot.lastVolume - restoreVolume) > 0.005) {
    slot.lastVolume = restoreVolume;
    slot.player.volume = restoreVolume;
  }
  void rewindSlotAfterFinish(slot);
}

function createSlot(
  sound: TactileSoundId,
  comboCount = 1,
): TactilePoolSlot | null {
  try {
    let source: AudioSource;
    let isLocalUri = Platform.OS === 'web';
    if (Platform.OS === 'web') {
      source = { uri: synthesizeWavDataUri(sound, comboCount) };
    } else {
      const moduleId = FALLBACK_ASSETS[sound] as number;
      const localUri = getCachedLocalAudioUri(moduleId);
      if (localUri) {
        source = { uri: localUri };
        isLocalUri = true;
      } else {
        source = FALLBACK_ASSETS[sound];
      }
    }

    const player = createAudioPlayer(source, {
      updateInterval: NATIVE_PLAYER_UPDATE_INTERVAL_MS,
      keepAudioSessionActive: true,
      allowsExternalPlayback: false,
    });
    if (Platform.OS !== 'web') {
      player.shouldCorrectPitch = false;
    }

    const slot: TactilePoolSlot = {
      player,
      isLoaded: false,
      isPlaying: false,
      needsRewind: false,
      isRewinding: false,
      rewindGen: 0,
      rewindPromise: null,
      pendingPlayGen: 0,
      isLocalUri,
      isPriming: false,
      primeTimer: null,
      onLoadedWaiter: null,
      lastVolume: -1,
      lastRate: 1.0,
      subscription: null,
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
          finishSlotPrime(slot, BASE_VOLUME[sound]);
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
  } catch {
    return null;
  }
}

function getOrCreatePool(
  sound: TactileSoundId,
  comboCount = 1,
): TactilePool | null {
  const clampedCombo = Math.max(1, Math.min(12, Math.round(comboCount)));
  const cacheKey =
    Platform.OS === 'web' && sound === 'combo_up'
      ? `web_${sound}_${clampedCombo}`
      : `${Platform.OS}_${sound}`;

  const existing = pools.get(cacheKey);
  if (existing) return existing;

  const targetCount = Platform.OS === 'web' ? 1 : POOL_SIZE[sound];
  const slots: TactilePoolSlot[] = [];
  for (let i = 0; i < targetCount; i++) {
    const slot = createSlot(sound, clampedCombo);
    if (slot) slots.push(slot);
  }
  if (slots.length === 0) return null;

  const pool: TactilePool = { slots, cursor: 0 };
  pools.set(cacheKey, pool);
  return pool;
}

function pickPoolSlot(pool: TactilePool): TactilePoolSlot {
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

function upgradeIdlePoolToLocalUri(sound: TactileSoundId, localUri: string): void {
  const pool = pools.get(`${Platform.OS}_${sound}`);
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
        slot.lastVolume = -1;
        slot.lastRate = 1.0;
      } catch {
        // Keep existing source if replace fails mid-transition
      }
    }
  }
}

function primeTokenSnapPipeline(): void {
  if (
    Platform.OS === 'web' ||
    hardwarePrimed ||
    !soundEngineEnabled ||
    !isRuntimeAudioSupported()
  ) {
    return;
  }
  const pool = getOrCreatePool('token_snap');
  const slot = pool?.slots[0];
  if (!slot || slot.needsRewind || slot.isRewinding || slot.isPriming || slot.isPlaying) {
    return;
  }

  hardwarePrimed = true;
  const restoreVol = BASE_VOLUME.token_snap;

  const triggerSilentPrime = () => {
    if (
      !soundEngineEnabled ||
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
      finishSlotPrime(slot, restoreVol);
    }, 280);
    try {
      slot.isPlaying = true;
      slot.player.play();
    } catch {
      slot.isPlaying = false;
      finishSlotPrime(slot, restoreVol);
    }
  };

  if (slot.isLoaded || slot.player.isLoaded) {
    slot.isLoaded = true;
    triggerSilentPrime();
  } else {
    slot.onLoadedWaiter = triggerSilentPrime;
  }
}

async function warmupNativeSoundAsset(
  sound: TactileSoundId,
  createPool = true,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const moduleId = FALLBACK_ASSETS[sound] as number;
  const localUri = await preloadSharedAudioAsset(moduleId);
  if (localUri) {
    upgradeIdlePoolToLocalUri(sound, localUri);
  }
  if (createPool) {
    getOrCreatePool(sound);
  }
  if (sound === 'token_snap') {
    await ensureSharedAudioMode();
    primeTokenSnapPipeline();
  }
}

/**
 * Ensure native audio assets are downloaded/preloaded and core tactile pools are warm.
 */
export function warmupSoundEngine(): Promise<void> {
  if (!isRuntimeAudioSupported() || Platform.OS === 'web') {
    return Promise.resolve();
  }
  if (warmupPromise) return warmupPromise;

  void ensureSharedAudioMode();

  const coreCues: TactileSoundId[] = [
    'token_snap',
    'card_swipe',
    'correct',
    'combo_up',
    'error',
  ];

  // Download + preload bytes for all 6 cues immediately; stagger victory pool slightly
  // after initial UI render so startup Looper work stays fast on Android.
  warmupPromise = (async () => {
    await Promise.all([
      ...coreCues.map((id) => warmupNativeSoundAsset(id, true)),
      warmupNativeSoundAsset('level_complete', false),
    ]);
    if (!victoryWarmTimer) {
      victoryWarmTimer = setTimeout(() => {
        victoryWarmTimer = null;
        if (soundEngineEnabled && isRuntimeAudioSupported()) {
          getOrCreatePool('level_complete');
        }
      }, 120);
    }
  })();

  return warmupPromise;
}

export function setSoundEngineEnabled(enabled: boolean): void {
  soundEngineEnabled = enabled;
  if (enabled && Platform.OS !== 'web') {
    void warmupSoundEngine();
  }
}

export function isSoundEngineEnabled(): boolean {
  return soundEngineEnabled;
}

/**
 * Release all cached tactile sound engine players cleanly.
 */
export function releaseSoundEngine(): void {
  if (victoryWarmTimer) {
    clearTimeout(victoryWarmTimer);
    victoryWarmTimer = null;
  }
  for (const pool of pools.values()) {
    for (const slot of pool.slots) {
      clearPrimeTimer(slot);
      slot.onLoadedWaiter = null;
      try {
        slot.subscription?.remove();
      } catch {
        // Ignore listener removal errors
      }
      try {
        slot.player.release();
      } catch {
        // Ignore already-released players
      }
    }
  }
  pools.clear();
  lastTriggeredAt.clear();
  hardwarePrimed = false;
  warmupPromise = null;
}

function triggerSynchronizedHaptic(sound: TactileSoundId): void {
  if (Platform.OS === 'web') return;
  switch (sound) {
    case 'token_snap':
      Haptics.selectionAsync().catch(() => undefined);
      break;
    case 'card_swipe':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
      break;
    case 'correct':
    case 'level_complete':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      break;
    case 'combo_up':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => undefined,
      );
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => undefined,
      );
      break;
  }
}

/**
 * Play a tactile synthesized sound effect paired with synchronized haptic feedback.
 */
export function playTactileSound(
  sound: TactileSoundId,
  options?: PlayTactileOptions,
): void {
  const now = Date.now();
  const prev = lastTriggeredAt.get(sound) ?? 0;
  if (now - prev < COOLDOWN_MS[sound]) return;
  lastTriggeredAt.set(sound, now);

  if (!options?.skipHaptic) {
    triggerSynchronizedHaptic(sound);
  }

  if (!soundEngineEnabled || !isRuntimeAudioSupported()) return;
  void ensureSharedAudioMode();

  const comboCount = Math.max(1, Math.min(12, options?.comboCount ?? 1));
  const pool = getOrCreatePool(sound, comboCount);
  if (!pool || pool.slots.length === 0) return;

  const slot = pickPoolSlot(pool);

  try {
    const baseVolume = BASE_VOLUME[sound];
    const targetVolume =
      options?.volumeMultiplier !== undefined
        ? Math.max(0.05, Math.min(1, baseVolume * options.volumeMultiplier))
        : baseVolume;

    // Cancel any queued or in-flight silent prime before taking ownership.
    slot.onLoadedWaiter = null;
    if (slot.isPriming) {
      clearPrimeTimer(slot);
      slot.isPriming = false;
      slot.needsRewind = true;
    }

    if (Math.abs(slot.lastVolume - targetVolume) > 0.005) {
      slot.lastVolume = targetVolume;
      slot.player.volume = targetVolume;
    }

    if (Platform.OS === 'web') {
      if (slot.player.currentTime > 0 || slot.player.playing) {
        void slot.player
          .seekTo(0, 0, 0)
          .then(() => {
            if (soundEngineEnabled) slot.player.play();
          })
          .catch(() => {
            try {
              if (soundEngineEnabled) slot.player.play();
            } catch {
              // Non-fatal audio interruption
            }
          });
      } else {
        slot.player.play();
      }
      return;
    }

    const pitchRate =
      sound === 'combo_up' && !options?.preserveNaturalPitch
        ? Math.min(1.65, 0.96 + (comboCount - 1) * 0.065)
        : 1.0;
    if (Math.abs(slot.lastRate - pitchRate) > 0.005) {
      slot.lastRate = pitchRate;
      slot.player.setPlaybackRate(pitchRate);
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
        if (soundEngineEnabled && slot.pendingPlayGen === playGen) {
          slot.needsRewind = true;
          slot.isPlaying = true;
          slot.player.play();
        }
      })
      .catch(() => {
        try {
          if (soundEngineEnabled && slot.pendingPlayGen === playGen) {
            slot.needsRewind = true;
            slot.isPlaying = true;
            slot.player.play();
          }
        } catch {
          // Non-fatal audio interruption
        }
      });
  } catch {
    // Non-fatal audio playback guard
  }
}

/**
 * Convenience helper for rapid-fire combo streaks (Syntax Sprint, Bug Hunt, 1v1 Duels).
 */
export function playComboChime(comboCount: number, skipHaptic = false): void {
  if (comboCount <= 1) {
    playTactileSound('correct', { skipHaptic });
    return;
  }
  playTactileSound('combo_up', { comboCount, skipHaptic });
}

if (isRuntimeAudioSupported() && Platform.OS !== 'web') {
  void warmupSoundEngine();
}
