// Notification settings and service for PWA

export interface NotificationSettings {
  enabled: boolean;
  newDayReminder: boolean;
  workoutDayReminder: boolean;
  mealTrackingReminder: boolean;
}

const STORAGE_KEY = 'fittrack_notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  newDayReminder: true,
  workoutDayReminder: true,
  mealTrackingReminder: false,
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  
  // Don't re-prompt if already denied
  if (Notification.permission === 'denied') return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
};

export const sendNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    // Use service worker for notifications if available
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    } else {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        ...options,
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
};

// Calm, supportive notification messages
export const NOTIFICATION_MESSAGES = {
  newDay: {
    title: 'New day ☀️',
    body: 'Ready to continue your plan?',
  },
  workoutDay: {
    title: 'Workout day 💪',
    body: 'Today is a workout day.',
  },
  mealTracking: {
    title: 'Evening check-in 🍽️',
    body: "Don't forget to log today's meals.",
  },
};

// Check and send notifications on app open/return (event-based, not scheduled)
export const checkAndSendNotifications = async (): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;
  if (Notification.permission !== 'granted') return;

  const today = new Date().toISOString().split('T')[0];
  const lastNewDay = localStorage.getItem('fittrack_last_newday_notification');
  const lastWorkoutReminder = localStorage.getItem('fittrack_last_workout_notification');
  const lastMealReminder = localStorage.getItem('fittrack_last_meal_notification');

  // New day reminder - triggers once per day on first app open
  if (settings.newDayReminder && lastNewDay !== today) {
    await sendNotification(
      NOTIFICATION_MESSAGES.newDay.title,
      { body: NOTIFICATION_MESSAGES.newDay.body, tag: 'new-day' }
    );
    localStorage.setItem('fittrack_last_newday_notification', today);
  }

  // Workout day reminder - triggers once per workout day on app open
  if (settings.workoutDayReminder && lastWorkoutReminder !== today) {
    try {
      const profile = localStorage.getItem('fittrack_user_profile');
      if (profile) {
        const parsed = JSON.parse(profile);
        const workoutDays = parsed.workoutDays ?? parsed.coachProfile?.workoutDays ?? [];
        const dayOfWeek = new Date().getDay();
        
        if (workoutDays.includes(dayOfWeek)) {
          await sendNotification(
            NOTIFICATION_MESSAGES.workoutDay.title,
            { body: NOTIFICATION_MESSAGES.workoutDay.body, tag: 'workout-day' }
          );
          localStorage.setItem('fittrack_last_workout_notification', today);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Evening meal reminder - triggers once per evening if no meals logged
  if (settings.mealTrackingReminder && lastMealReminder !== today) {
    const hour = new Date().getHours();
    if (hour >= 18) { // 6pm or later
      try {
        const meals = localStorage.getItem('fittrack_meals');
        const todayMeals = meals 
          ? JSON.parse(meals).filter((m: { date: string }) => m.date === today) 
          : [];
        
        if (todayMeals.length === 0) {
          await sendNotification(
            NOTIFICATION_MESSAGES.mealTracking.title,
            { body: NOTIFICATION_MESSAGES.mealTracking.body, tag: 'meal-tracking' }
          );
          localStorage.setItem('fittrack_last_meal_notification', today);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
};

// Legacy alias for backwards compatibility
export const checkAndScheduleNotifications = checkAndSendNotifications;
