import { useState, useEffect } from 'react';
import { Bell, BellOff, Dumbbell, Utensils, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  NotificationSettings as NotificationSettingsType,
} from '@/lib/notifications';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType>(getNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    if (permission === 'denied') {
      toast.error('Notifications blocked. Please enable in browser settings.');
      return;
    }

    setIsRequesting(true);
    const granted = await requestNotificationPermission();
    setIsRequesting(false);

    if (granted) {
      const newSettings = { ...settings, enabled: true };
      setSettings(newSettings);
      saveNotificationSettings(newSettings);
      setPermission('granted');
      toast.success('Notifications enabled');
    } else {
      toast.error('Permission not granted');
    }
  };

  const handleDisableNotifications = () => {
    const newSettings = { ...settings, enabled: false };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    toast.success('Notifications disabled');
  };

  const updateSetting = <K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  if (permission === 'unsupported') {
    return (
      <div className="p-4 bg-secondary/50 rounded-xl text-center">
        <BellOff className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Notifications not supported on this device
        </p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-secondary/50 rounded-xl text-center">
        <BellOff className="w-6 h-6 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Notifications are blocked. Enable them in your browser settings to receive reminders.
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
            Get reminders when you open the app
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
            <p className="text-xs text-muted-foreground">Enabled</p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => {
            if (!checked) handleDisableNotifications();
          }}
        />
      </div>

      {/* Individual notification types */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Sun className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-sm font-medium">New Day Reminder</p>
              <p className="text-xs text-muted-foreground">
                When you open the app on a new day
              </p>
            </div>
          </div>
          <Switch
            checked={settings.newDayReminder}
            onCheckedChange={(checked) => updateSetting('newDayReminder', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Workout Day</p>
              <p className="text-xs text-muted-foreground">
                When you open the app on workout days
              </p>
            </div>
          </div>
          <Switch
            checked={settings.workoutDayReminder}
            onCheckedChange={(checked) => updateSetting('workoutDayReminder', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Utensils className="w-4 h-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Evening Meal Check</p>
              <p className="text-xs text-muted-foreground">
                If no meals logged when you open in the evening
              </p>
            </div>
          </div>
          <Switch
            checked={settings.mealTrackingReminder}
            onCheckedChange={(checked) => updateSetting('mealTrackingReminder', checked)}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center px-4">
        Reminders appear when you open or return to the app — we can't send scheduled notifications in the background.
      </p>
    </div>
  );
}
