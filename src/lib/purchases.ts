// RevenueCat in-app purchase integration for FitTrack
// SDK: @revenuecat/purchases-capacitor
//
// This is a skeleton — real purchase flows will be wired up after:
//   1. RevenueCat dashboard project is created and API keys are obtained
//   2. Google Play Console products/subscriptions are configured
//   3. RevenueCat entitlements are mapped to those products

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { isNativePlatform } from './nativeNotifications';

// TODO: Replace with real RevenueCat API key from dashboard
//       (Settings > API Keys > public Android SDK key)
const REVENUECAT_ANDROID_API_KEY = '';

// TODO: Replace with the entitlement identifier configured in RevenueCat dashboard
const PREMIUM_ENTITLEMENT_ID = 'premium';

let initialized = false;

/**
 * Initialize RevenueCat SDK. Call once on app startup (e.g. in App.tsx).
 * No-ops on web — RevenueCat only works on native platforms.
 */
export async function initializePurchases(): Promise<void> {
  if (initialized || !isNativePlatform()) return;

  if (!REVENUECAT_ANDROID_API_KEY) {
    console.warn('[Purchases] RevenueCat API key not configured — skipping initialization');
    return;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG }); // TODO: Change to WARN for production
    await Purchases.configure({
      apiKey: REVENUECAT_ANDROID_API_KEY,
    });
    initialized = true;
  } catch (error) {
    console.error('[Purchases] Failed to initialize RevenueCat:', error);
  }
}

/**
 * Check whether the current user has an active premium subscription.
 * Returns false on web or if RevenueCat is not initialized.
 */
export async function getSubscriptionStatus(): Promise<boolean> {
  if (!initialized) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
    return entitlement !== undefined;
  } catch (error) {
    console.error('[Purchases] Failed to check subscription status:', error);
    return false;
  }
}

/**
 * Fetch available subscription packages from RevenueCat.
 * TODO: Wire this up to PremiumPaywall.tsx once products are configured.
 */
export async function getOfferings() {
  if (!initialized) return null;

  try {
    const { offerings } = await Purchases.getOfferings();
    return offerings?.current ?? null;
  } catch (error) {
    console.error('[Purchases] Failed to fetch offerings:', error);
    return null;
  }
}

/**
 * Purchase a package. Returns true if the purchase granted premium access.
 * TODO: Wire this up to replace handleMockPurchase in PremiumPaywall.tsx.
 */
export async function purchasePackage(packageToPurchase: unknown): Promise<boolean> {
  if (!initialized) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToPurchase as any });
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    // User cancelled or purchase failed — not necessarily an error
    console.warn('[Purchases] Purchase did not complete:', error);
    return false;
  }
}
