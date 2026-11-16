import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = Platform.OS !== 'web';

/** Lets the Profile preferences switch turn device haptics on or off. */
export function setHapticsEnabled(value: boolean): void {
  enabled = value && Platform.OS !== 'web';
}

/** Light impact feedback on every tap. */
export function tapHaptic(): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Medium impact for primary actions such as running code. */
export function mediumHaptic(): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Selection tick for segmented controls and tab switches. */
export function selectionHaptic(): void {
  if (!enabled) return;
  Haptics.selectionAsync().catch(() => undefined);
}

/** Success notification on a correct answer. */
export function successHaptic(): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

/** Error notification on a mistake. */
export function errorHaptic(): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
