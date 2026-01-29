// Lightweight custom event emitter for cross-component data sync
// Used to notify UI components when data changes from external sources (e.g., AI Coach)

export const APP_EVENTS = {
  DATA_UPDATED: 'app:dataUpdated',
  PROFILE_UPDATED: 'app:profileUpdated',
} as const;

export function emitDataUpdated() {
  window.dispatchEvent(new CustomEvent(APP_EVENTS.DATA_UPDATED));
}

export function onDataUpdated(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(APP_EVENTS.DATA_UPDATED, handler);
  return () => window.removeEventListener(APP_EVENTS.DATA_UPDATED, handler);
}

export function emitProfileUpdated() {
  window.dispatchEvent(new CustomEvent(APP_EVENTS.PROFILE_UPDATED));
}

export function onProfileUpdated(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(APP_EVENTS.PROFILE_UPDATED, handler);
  return () => window.removeEventListener(APP_EVENTS.PROFILE_UPDATED, handler);
}
