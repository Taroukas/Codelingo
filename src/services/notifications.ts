/**
 * Smart Local Notifications Service (Expo SDK 58 `expo-notifications`).
 * Fully compatible with iOS & Android Expo Go, with safe web/simulator no-op fallbacks.
 */

import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_CHANNEL_ID = 'codelingo-reminders';
const DAILY_STREAK_ID = 'codelingo-daily-streak';
const DAILY_STREAK_SKIP_IDS = [
  'codelingo-daily-streak-day1',
  'codelingo-daily-streak-day2',
  'codelingo-daily-streak-day3',
  'codelingo-daily-streak-day4',
  'codelingo-daily-streak-day5',
];
const HEARTS_REFILLED_ID = 'codelingo-hearts-refilled';

const ALL_STREAK_IDS = [DAILY_STREAK_ID, ...DAILY_STREAK_SKIP_IDS];

let handlerConfigured = false;
let channelReady = false;

export function configureNotifications(): void {
  if (Platform.OS === 'web' || handlerConfigured) return;
  handlerConfigured = true;
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Ignore in restricted web / headless environments
  }
}

configureNotifications();

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Study & Hearts Reminders',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#7C5CFC',
      sound: 'default',
    });
    channelReady = true;
  } catch {
    // Best-effort channel setup
  }
}

export async function getNotificationPermissionStatus(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const perms = await getPermissionsAsync();
    return Boolean(
      perms.granted ||
        perms.ios?.status === IosAuthorizationStatus.PROVISIONAL,
    );
  } catch {
    return false;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    configureNotifications();
    await ensureAndroidChannel();
    const current = await getPermissionsAsync();
    if (
      current.granted ||
      current.ios?.status === IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const requested = await requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return Boolean(
      requested.granted ||
        requested.ios?.status === IosAuthorizationStatus.PROVISIONAL,
    );
  } catch {
    return false;
  }
}

async function cancelIds(ids: readonly string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all(
    ids.map((id) =>
      cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

/**
 * Schedules or cancels the daily 19:30 coding streak reminder.
 * If the user already completed a coding session today, today's 19:30 ping is
 * skipped cleanly and upcoming 19:30 reminders begin tomorrow instead.
 */
export async function syncDailyStreakReminder(
  enabled: boolean,
  completedToday: boolean,
  streakDays = 0,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelIds(ALL_STREAK_IDS);
    if (!enabled) return;

    const granted = await getNotificationPermissionStatus();
    if (!granted) return;

    await ensureAndroidChannel();

    const streakCopy =
      streakDays > 0
        ? `Protect your ${streakDays}-day streak — complete a quick 5-min challenge tonight.`
        : 'Build your daily coding habit — complete a quick lesson or Bug Blitz today.';

    if (!completedToday) {
      await scheduleNotificationAsync({
        identifier: DAILY_STREAK_ID,
        content: {
          title: 'Keep your coding streak alive',
          body: streakCopy,
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 30,
          channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
        },
      });
      return;
    }

    // Already coded today: skip tonight cleanly and schedule upcoming 19:30 pings from tomorrow.
    const now = new Date();
    for (let i = 0; i < DAILY_STREAK_SKIP_IDS.length; i += 1) {
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + i + 1,
        19,
        30,
        0,
        0,
      );
      await scheduleNotificationAsync({
        identifier: DAILY_STREAK_SKIP_IDS[i],
        content: {
          title: 'Keep your coding streak alive',
          body: 'Ready for today’s coding session? Five minutes keeps momentum sharp.',
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: target,
          channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
        },
      });
    }
  } catch {
    // Graceful no-op when notifications aren't supported
  }
}

export async function cancelHeartsRefilledNotification(): Promise<void> {
  await cancelIds([HEARTS_REFILLED_ID]);
}

/**
 * Schedules a one-shot alert for the moment all hearts finish regenerating,
 * or cancels any pending heart alert if hearts are already full.
 */
export async function syncHeartsRefilledNotification(
  hearts: number,
  maxHearts: number,
  fullRefillAtMs: number | null,
  remindersAllowed = true,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelHeartsRefilledNotification();
    if (
      !remindersAllowed ||
      hearts >= maxHearts ||
      !fullRefillAtMs ||
      fullRefillAtMs <= Date.now() + 5000
    ) {
      return;
    }

    const granted = await getNotificationPermissionStatus();
    if (!granted) return;

    await ensureAndroidChannel();

    await scheduleNotificationAsync({
      identifier: HEARTS_REFILLED_ID,
      content: {
        title: `Hearts restored (${maxHearts}/${maxHearts})`,
        body: 'Your hearts are full again. Jump back into Codelingo!',
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(fullRefillAtMs),
        channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
      },
    });
  } catch {
    // Graceful no-op
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore errors
  }
}
