// Notification settings and service for PWA

export interface NotificationSettings {
  enabled: boolean;
  newDayReminder: boolean;
  workoutDayReminder: boolean;
  mealTrackingReminder: boolean;
  reminderTime: string; // HH:mm format
}

const STORAGE_KEY = 'fittrack_notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  newDayReminder: true,
  workoutDayReminder: true,
  mealTrackingReminder: false,
  reminderTime: '09:00',
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
    title: 'Good morning ☀️',
    body: 'New day, new plan. Ready when you are.',
  },
  workoutDay: {
    title: 'Workout day 💪',
    body: "Today is a workout day. Let's get it done.",
  },
  mealTracking: {
    title: 'How did today go? 🍽️',
    body: "Don't forget to log today's meals.",
  },
};

// Schedule check for notifications (called on app load)
export const checkAndScheduleNotifications = async (): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;
  if (Notification.permission !== 'granted') return;

  // Get stored last notification dates
  const lastNewDay = localStorage.getItem('fittrack_last_newday_notification');
  const lastMealReminder = localStorage.getItem('fittrack_last_meal_notification');
  const today = new Date().toISOString().split('T')[0];

  // Check if we should send new day reminder
  if (settings.newDayReminder && lastNewDay !== today) {
    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // Send if past reminder time and haven't sent today
    if (now >= reminderTime) {
      await sendNotification(
        NOTIFICATION_MESSAGES.newDay.title,
        { body: NOTIFICATION_MESSAGES.newDay.body, tag: 'new-day' }
      );
      localStorage.setItem('fittrack_last_newday_notification', today);
    }
  }

  // Check workout day reminder
  if (settings.workoutDayReminder) {
    const profile = localStorage.getItem('fittrack_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      const workoutDays = parsed.workoutDays ?? parsed.coachProfile?.workoutDays ?? [];
      const dayOfWeek = new Date().getDay();
      
      if (workoutDays.includes(dayOfWeek)) {
        const lastWorkoutReminder = localStorage.getItem('fittrack_last_workout_notification');
        if (lastWorkoutReminder !== today) {
          await sendNotification(
            NOTIFICATION_MESSAGES.workoutDay.title,
            { body: NOTIFICATION_MESSAGES.workoutDay.body, tag: 'workout-day' }
          );
          localStorage.setItem('fittrack_last_workout_notification', today);
        }
      }
    }
  }

  // Meal tracking reminder (evening check - after 7pm)
  if (settings.mealTrackingReminder && lastMealReminder !== today) {
    const now = new Date();
    if (now.getHours() >= 19) {
      const meals = localStorage.getItem('fittrack_meals');
      const todayMeals = meals ? JSON.parse(meals).filter((m: { date: string }) => m.date === today) : [];
      
      if (todayMeals.length === 0) {
        await sendNotification(
          NOTIFICATION_MESSAGES.mealTracking.title,
          { body: NOTIFICATION_MESSAGES.mealTracking.body, tag: 'meal-tracking' }
        );
        localStorage.setItem('fittrack_last_meal_notification', today);
      }
    }
  }
};
