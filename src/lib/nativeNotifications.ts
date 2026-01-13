// Native notifications using Capacitor Local Notifications
// This module handles scheduled notifications that work even when the app is closed

import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions, PendingResult } from '@capacitor/local-notifications';

export interface NativeNotificationSettings {
  enabled: boolean;
  mealReminderTime: string; // HH:mm format
  workoutReminderTime: string; // HH:mm format
  workoutDays: number[]; // 0-6 for Sunday-Saturday
  restDayReminder: boolean;
}

const STORAGE_KEY = 'fittrack_native_notification_settings';

const DEFAULT_SETTINGS: NativeNotificationSettings = {
  enabled: false,
  mealReminderTime: '19:00',
  workoutReminderTime: '09:00',
  workoutDays: [],
  restDayReminder: false,
};

// Notification IDs for different types
const NOTIFICATION_IDS = {
  MEAL_REMINDER: 1000,
  WORKOUT_REMINDER_BASE: 2000, // 2000-2006 for each day
  REST_DAY_REMINDER_BASE: 3000, // 3000-3006 for each day
};

// Check if running on native platform
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get stored settings
export const getNativeNotificationSettings = (): NativeNotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// Save settings
export const saveNativeNotificationSettings = (settings: NativeNotificationSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save native notification settings:', error);
  }
};

// Request notification permissions
export const requestNativeNotificationPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

// Check current permission status
export const checkNativeNotificationPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  if (!isNativePlatform()) return 'denied';

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'denied';
  }
};

// Cancel all scheduled notifications
export const cancelAllNativeNotifications = async (): Promise<void> => {
  if (!isNativePlatform()) return;

  try {
    const pending: PendingResult = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
};

// Parse time string to hours and minutes
const parseTime = (time: string): { hours: number; minutes: number } => {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
};

// Get next occurrence of a specific day and time
const getNextDayOccurrence = (dayOfWeek: number, hours: number, minutes: number): Date => {
  const now = new Date();
  const result = new Date();
  result.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  let daysUntil = dayOfWeek - currentDay;

  if (daysUntil < 0 || (daysUntil === 0 && result <= now)) {
    daysUntil += 7;
  }

  result.setDate(result.getDate() + daysUntil);
  return result;
};

// Schedule daily meal reminder
const scheduleMealReminder = async (time: string): Promise<void> => {
  const { hours, minutes } = parseTime(time);
  const now = new Date();
  const scheduleTime = new Date();
  scheduleTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduleTime <= now) {
    scheduleTime.setDate(scheduleTime.getDate() + 1);
  }

  const options: ScheduleOptions = {
    notifications: [
      {
        id: NOTIFICATION_IDS.MEAL_REMINDER,
        title: 'Meal Reminder 🍽️',
        body: "Don't forget to log your meals today!",
        schedule: {
          at: scheduleTime,
          repeats: true,
          every: 'day',
        },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#7c3aed',
      },
    ],
  };

  await LocalNotifications.schedule(options);
};

// Schedule workout day reminders
const scheduleWorkoutReminders = async (
  workoutDays: number[],
  time: string
): Promise<void> => {
  const { hours, minutes } = parseTime(time);
  const notifications = workoutDays.map((day) => ({
    id: NOTIFICATION_IDS.WORKOUT_REMINDER_BASE + day,
    title: 'Workout Day 💪',
    body: 'Ready for your workout today?',
    schedule: {
      at: getNextDayOccurrence(day, hours, minutes),
      repeats: true,
      every: 'week' as const,
    },
    smallIcon: 'ic_stat_icon_config_sample',
    iconColor: '#7c3aed',
  }));

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
};

// Schedule rest day reminders
const scheduleRestDayReminders = async (
  workoutDays: number[],
  time: string
): Promise<void> => {
  const { hours, minutes } = parseTime(time);
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const restDays = allDays.filter((day) => !workoutDays.includes(day));

  const notifications = restDays.map((day) => ({
    id: NOTIFICATION_IDS.REST_DAY_REMINDER_BASE + day,
    title: 'Rest Day 😌',
    body: 'Focus on recovery today. Stay hydrated!',
    schedule: {
      at: getNextDayOccurrence(day, hours, minutes),
      repeats: true,
      every: 'week' as const,
    },
    smallIcon: 'ic_stat_icon_config_sample',
    iconColor: '#7c3aed',
  }));

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
};

// Main function to schedule all notifications based on settings
export const scheduleAllNativeNotifications = async (
  settings?: NativeNotificationSettings
): Promise<void> => {
  if (!isNativePlatform()) return;

  const currentSettings = settings || getNativeNotificationSettings();

  if (!currentSettings.enabled) {
    await cancelAllNativeNotifications();
    return;
  }

  // Cancel existing notifications first
  await cancelAllNativeNotifications();

  try {
    // Schedule meal reminder
    await scheduleMealReminder(currentSettings.mealReminderTime);

    // Schedule workout day reminders
    if (currentSettings.workoutDays.length > 0) {
      await scheduleWorkoutReminders(
        currentSettings.workoutDays,
        currentSettings.workoutReminderTime
      );
    }

    // Schedule rest day reminders if enabled
    if (currentSettings.restDayReminder && currentSettings.workoutDays.length > 0) {
      await scheduleRestDayReminders(
        currentSettings.workoutDays,
        currentSettings.workoutReminderTime
      );
    }

    console.log('Native notifications scheduled successfully');
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
  }
};

// Update settings and reschedule notifications
export const updateNativeNotificationSettings = async (
  settings: NativeNotificationSettings
): Promise<void> => {
  saveNativeNotificationSettings(settings);
  await scheduleAllNativeNotifications(settings);
};

// Initialize notifications on app start (for native platforms)
export const initializeNativeNotifications = async (): Promise<void> => {
  if (!isNativePlatform()) return;

  const settings = getNativeNotificationSettings();
  if (settings.enabled) {
    const permission = await checkNativeNotificationPermission();
    if (permission === 'granted') {
      await scheduleAllNativeNotifications(settings);
    }
  }

  // Listen for notification events
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    console.log('Notification action performed:', action);
  });
};

// Send an immediate notification (for testing)
export const sendTestNativeNotification = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9999,
          title: 'FitTrack Test 🔔',
          body: 'Native notifications are working!',
          schedule: { at: new Date(Date.now() + 1000) },
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#7c3aed',
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
};
