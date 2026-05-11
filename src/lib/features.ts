// Feature flag system for monetization and progressive feature gating
// All flags are offline-first, stored in localStorage

import { getUserProfile, isCoachTrialActive } from './storage';

export type FeatureId = 
  | 'weekly_reviews'
  | 'smart_adjustments'
  | 'coach_memory'
  | 'daily_guidance'
  | 'ai_performance_feedback'
  | 'adaptive_difficulty'
  | 'personal_bests'
  | 'advanced_analytics';

export interface FeatureConfig {
  id: FeatureId;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  /** If true, free users see a blurred/locked preview */
  showLockedPreview: boolean;
}

export const FEATURES: Record<FeatureId, FeatureConfig> = {
  weekly_reviews: {
    id: 'weekly_reviews',
    name: 'Weekly Reviews',
    description: 'See how you did and what\'s changing',
    tier: 'pro',
    showLockedPreview: true,
  },
  smart_adjustments: {
    id: 'smart_adjustments',
    name: 'Smart Adjustments',
    description: 'Calories and protein adapt to your progress',
    tier: 'pro',
    showLockedPreview: true,
  },
  coach_memory: {
    id: 'coach_memory',
    name: 'Coach Memory',
    description: 'Your history shapes future recommendations',
    tier: 'pro',
    showLockedPreview: false,
  },
  daily_guidance: {
    id: 'daily_guidance',
    name: 'Daily Guidance',
    description: 'Know what to focus on each day',
    tier: 'pro',
    showLockedPreview: true,
  },
  ai_performance_feedback: {
    id: 'ai_performance_feedback',
    name: 'AI Performance Feedback',
    description: 'Weekly AI-generated training insights and advice',
    tier: 'pro',
    showLockedPreview: true,
  },
  adaptive_difficulty: {
    id: 'adaptive_difficulty',
    name: 'Adaptive Difficulty',
    description: 'Auto-adjust workout intensity based on performance',
    tier: 'pro',
    showLockedPreview: true,
  },
  personal_bests: {
    id: 'personal_bests',
    name: 'Personal Bests',
    description: 'Track your PRs across all exercises',
    tier: 'free',
    showLockedPreview: false,
  },
  advanced_analytics: {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into your training patterns',
    tier: 'pro',
    showLockedPreview: true,
  },
};

/**
 * Check if the user is on the paid plan (not trial).
 * Use for display-only checks like "show PREMIUM badge".
 */
export function isPaidPlan(): boolean {
  const profile = getUserProfile();
  return profile?.isPremium === true;
}

/**
 * Check if a feature is unlocked for the current user.
 * Free-tier features are always unlocked.
 * Pro features require isPremium OR an active coach trial.
 */
export function isFeatureUnlocked(featureId: FeatureId): boolean {
  const config = FEATURES[featureId];
  if (!config) return false;
  if (config.tier === 'free') return true;

  const profile = getUserProfile();
  if (profile?.isPremium) return true;

  return isCoachTrialActive();
}

/**
 * Get all features grouped by tier for display.
 */
export function getProFeatures(): FeatureConfig[] {
  return Object.values(FEATURES).filter(f => f.tier === 'pro');
}

/**
 * Get the feature config by ID.
 */
export function getFeature(featureId: FeatureId): FeatureConfig {
  return FEATURES[featureId];
}
