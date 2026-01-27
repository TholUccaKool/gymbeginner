// Lightweight custom event emitter for cross-component data sync
// Used to notify UI components when data changes from external sources (e.g., AI Coach)

export const APP_EVENTS = {
  DATA_UPDATED: 'app:dataUpdated',
} as const;

export function emitDataUpdated() {
  window.dispatchEvent(new CustomEvent(APP_EVENTS.DATA_UPDATED));
}

export function onDataUpdated(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(APP_EVENTS.DATA_UPDATED, handler);
  return () => window.removeEventListener(APP_EVENTS.DATA_UPDATED, handler);
}
