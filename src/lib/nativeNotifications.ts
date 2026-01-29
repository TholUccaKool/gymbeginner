export function isNativePlatform() {
  return false;
}

export async function initializeNativeNotifications() {
  // no-op for web
}

export function getNativeNotificationSettings() {
  return null;
}

export async function updateNativeNotificationSettings() {
  return;
}

export async function requestNativeNotificationPermission() {
  return false;
}

export async function checkNativeNotificationPermission() {
  return false;
}

export async function sendTestNativeNotification() {
  return;
}
