import { useState, useEffect } from 'react';
import { Bell, BellOff, Dumbbell, Utensils, Moon, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  getNativeNotificationSettings,
  updateNativeNotificationSettings,
  requestNativeNotificationPermission,
  checkNativeNotificationPermission,
  sendTestNativeNotification,
  NativeNotificationSettings as NativeSettingsType,
} from '@/lib/nativeNotifications';
import { getUserProfile } from '@/lib/storage';

export function NativeNotificationSettings() {
  const [settings, setSettings] = useState<NativeSettingsType>(getNativeNotificationSettings);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    loadPermissionStatus();
    loadWorkoutDaysFromProfile();
  }, []);

  const loadPermissionStatus = async () => {
    const status = await checkNativeNotificationPermission();
    setPermission(status);
  };

  const loadWorkoutDaysFromProfile = () => {
    const profile = getUserProfile();
    if (profile) {
      const workoutDays = profile.workoutDays ?? profile.coachProfile?.workoutDays ?? [];
      if (workoutDays.length > 0 && settings.workoutDays.length === 0) {
        const newSettings = { ...settings, workoutDays };
        setSettings(newSettings);
        if (settings.enabled) {
          updateNativeNotificationSettings(newSettings);
        }
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (permission === 'denied') {
      toast.error('Notifications blocked. Please enable in device settings.');
      return;
    }

    setIsRequesting(true);
    const granted = await requestNativeNotificationPermission();
    setIsRequesting(false);

    if (granted) {
      // Load workout days from profile if not set
      const profile = getUserProfile();
      const workoutDays = profile?.workoutDays ?? profile?.coachProfile?.workoutDays ?? [];

      const newSettings = { 
        ...settings, 
        enabled: true,
        workoutDays: settings.workoutDays.length > 0 ? settings.workoutDays : workoutDays,
      };
      setSettings(newSettings);
      await updateNativeNotificationSettings(newSettings);
      setPermission('granted');
      toast.success('Notifications enabled! You\'ll receive reminders even when the app is closed.');
    } else {
      toast.error('Permission not granted');
    }
  };

  const handleDisableNotifications = async () => {
    const newSettings = { ...settings, enabled: false };
    setSettings(newSettings);
    await updateNativeNotificationSettings(newSettings);
    toast.success('Notifications disabled');
  };

  const updateSetting = async <K extends keyof NativeSettingsType>(
    key: K,
    value: NativeSettingsType[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (settings.enabled) {
      await updateNativeNotificationSettings(newSettings);
    }
  };

  const handleTestNotification = async () => {
    const sent = await sendTestNativeNotification();
    if (sent) {
      toast.success('Test notification sent! Check your notification center.');
    } else {
      toast.error('Failed to send test notification');
    }
  };

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-secondary/50 rounded-xl text-center">
        <BellOff className="w-6 h-6 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Notifications are blocked. Enable them in your device settings to receive reminders.
        </p>
      </div>
    );
  }

  if (!settings.enabled) {
    return (
      <div className="p-5 bg-secondary/50 rounded-xl text-center space-y-3">
        <Bell className="w-8 h-8 mx-auto text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">Stay on track</p>
          <p className="text-xs text-muted-foreground mt-1">
            Get scheduled reminders even when the app is closed
          </p>
        </div>
        <Button
          onClick={handleEnableNotifications}
          disabled={isRequesting}
          className="w-full"
        >
          {isRequesting ? 'Requesting...' : 'Enable Notifications'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">Scheduled & background</p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => {
            if (!checked) handleDisableNotifications();
          }}
        />
      </div>

      {/* Meal reminder time */}
      <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <Utensils className="w-4 h-4 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium">Daily Meal Reminder</p>
            <p className="text-xs text-muted-foreground">
              Remind me to log meals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-7">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="meal-time" className="text-xs text-muted-foreground">
            Time:
          </Label>
          <Input
            id="meal-time"
            type="time"
            value={settings.mealReminderTime}
            onChange={(e) => updateSetting('mealReminderTime', e.target.value)}
            className="w-28 h-8 text-sm"
          />
        </div>
      </div>

      {/* Workout reminder time */}
      <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <Dumbbell className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Workout Day Reminder</p>
            <p className="text-xs text-muted-foreground">
              Remind me on workout days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-7">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="workout-time" className="text-xs text-muted-foreground">
            Time:
          </Label>
          <Input
            id="workout-time"
            type="time"
            value={settings.workoutReminderTime}
            onChange={(e) => updateSetting('workoutReminderTime', e.target.value)}
            className="w-28 h-8 text-sm"
          />
        </div>
      </div>

      {/* Rest day reminder toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-3">
          <Moon className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-sm font-medium">Rest Day Reminder</p>
            <p className="text-xs text-muted-foreground">
              Gentle reminder on rest days
            </p>
          </div>
        </div>
        <Switch
          checked={settings.restDayReminder}
          onCheckedChange={(checked) => updateSetting('restDayReminder', checked)}
        />
      </div>

      {/* Test notification button */}
      <Button
        variant="outline"
        onClick={handleTestNotification}
        className="w-full"
      >
        Send Test Notification
      </Button>

      <p className="text-[10px] text-muted-foreground text-center px-4">
        These notifications will appear at the scheduled time, even when the app is closed.
      </p>
    </div>
  );
}
