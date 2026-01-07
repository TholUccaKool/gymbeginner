// Debug Date Simulation - FOR TESTING ONLY
// This module allows developers to simulate future days to test calorie adjustment logic

const DEBUG_DATE_OFFSET_KEY = 'fittrack_debug_date_offset';

// Check if we're in development mode
const isDevelopment = (): boolean => {
  return import.meta.env.DEV || localStorage.getItem('fittrack_debug_enabled') === 'true';
};

// Get the current date offset in days
export const getDateOffset = (): number => {
  if (!isDevelopment()) return 0;
  
  try {
    const offset = localStorage.getItem(DEBUG_DATE_OFFSET_KEY);
    return offset ? parseInt(offset, 10) : 0;
  } catch {
    return 0;
  }
};

// Set the date offset (0 = real date)
export const setDateOffset = (days: number): void => {
  if (!isDevelopment()) return;
  
  try {
    if (days === 0) {
      localStorage.removeItem(DEBUG_DATE_OFFSET_KEY);
    } else {
      localStorage.setItem(DEBUG_DATE_OFFSET_KEY, days.toString());
    }
    // Dispatch event so components can react
    window.dispatchEvent(new CustomEvent('debug-date-change', { detail: { offset: days } }));
  } catch (error) {
    console.error('Failed to set date offset:', error);
  }
};

// Get the simulated "today" date
export const getSimulatedDate = (): Date => {
  const offset = getDateOffset();
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

// Get simulated today in YYYY-MM-DD format
export const getSimulatedTodayDate = (): string => {
  return getSimulatedDate().toISOString().split('T')[0];
};

// Check if debug mode is active
export const isDebugModeActive = (): boolean => {
  return isDevelopment() && getDateOffset() !== 0;
};

// Reset to real date
export const resetToRealDate = (): void => {
  setDateOffset(0);
};

// Enable debug mode (for accessing in production if needed - requires console access)
export const enableDebugMode = (): void => {
  localStorage.setItem('fittrack_debug_enabled', 'true');
  console.log('🔧 Debug mode enabled. Use setDateOffset(days) to simulate future dates.');
};

// Disable debug mode
export const disableDebugMode = (): void => {
  localStorage.removeItem('fittrack_debug_enabled');
  localStorage.removeItem(DEBUG_DATE_OFFSET_KEY);
  console.log('Debug mode disabled.');
};

// Expose to window for console access (development only)
if (typeof window !== 'undefined') {
  (window as any).__fittrack_debug = {
    enableDebugMode,
    disableDebugMode,
    setDateOffset,
    getDateOffset,
    getSimulatedDate,
    isActive: isDebugModeActive,
  };
}
