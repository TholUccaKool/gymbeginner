# APP_CONTEXT.md

## 1. Overview

FitTrack is an offline-first fitness and nutrition tracking PWA (also Capacitor-wrapped for iOS/Android). Built with React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui. All user data lives in localStorage; the only server call is the AI coach chat via a Supabase Edge Function that proxies to Google Gemini (via Lovable AI gateway). Two user paths: "experienced" (self-directed tracker) and "new" (AI-coached with generated nutrition targets and workout splits). Monetisation is a soft premium gate with a 7-day free trial for coach features. Deployed via Lovable (`lovableproject.com`); Capacitor config points `webDir: dist` with a remote server URL.

---

## 2. Routes

| Path | Component | Description | Guard |
|---|---|---|---|
| `/` | `RootRedirect` | If onboarding complete -> `/today`, else render `Onboarding` | None |
| `/onboarding/coach` | `CoachOnboarding` | Multi-step coach onboarding (goal, physique, body, training days, plan generation) | Redirects to `/today` if already onboarded |
| `/today` | `TodayPage` | Daily dashboard: nutrition rings, meal logging, weekly bar, calorie adjustments, daily guidance, AI feedback | `ProtectedRoute` (requires profile) |
| `/workout` | `WorkoutPage` | Workout selection, active workout tracking with sets/reps/weight, custom workout builder | `ProtectedRoute` |
| `/history` | `HistoryPage` | Day-by-day history browser with week overview, meals + workout details | `ProtectedRoute` |
| `/profile` | `ProfilePage` | Settings, nutrition targets, AI coach access, notification settings, theme toggle, PR list, premium toggle (demo) | `ProtectedRoute` |
| `*` | `NotFound` | 404 page | None |

`ProtectedRoute` checks `getUserProfile() !== null`; redirects to `/` if missing.

Global overlay: `CoachChat` (floating FAB) rendered after onboarding completes, listens to `onProfileUpdated`.

---

## 3. Data Model

### Types (src/lib/types.ts)

| Type | Purpose |
|---|---|
| `UserProfile` | Core user record: experience level, onboarding state, nutrition targets, training schedule, premium status, coach trial tracking |
| `CoachProfile` | AI coach questionnaire answers: goal, physique style, age, height, weight, training days, equipment, injuries, diet pref |
| `NutritionTargets` | Daily calorie + protein (+ optional carbs/fat) targets |
| `CoachMemory` | Adaptive coaching state: missed workouts, nutrition days, streaks |
| `MissedWorkout` | Single missed workout entry (date + scheduled type) |
| `NutritionDay` | Single day nutrition snapshot vs targets |
| `WeeklyReview` | Coach-generated weekly summary with adjustment decisions |
| `Meal` | Single meal log entry (date, name, macros) |
| `FoodSuggestion` | Common food item for quick-add (name, serving, macros) |
| `WorkoutType` | Union: `push \| pull \| legs \| full-body \| upper \| lower \| custom \| rest` |
| `Exercise` | Exercise definition (id, name, muscleGroup) |
| `ExerciseSet` | Single set (reps, weight, completed) |
| `WorkoutExercise` | Exercise + its sets + notes |
| `Workout` | Full workout record (date, type, exercises, completion state, duration) |
| `WeeklyPlan` | AI-generated weekly plan with day-by-day workout assignments |
| `DayPlan` | Single day in a weekly plan |
| `DailyLog` | Aggregate view of a day's meals + workout + nutrition totals |
| `AdjustmentSuggestion` | Smart calorie/protein adjustment suggestion |
| `ExerciseHistory` | Per-exercise progression tracking (last weight/reps, suggested next weight) |

### localStorage Keys

| Key | Shape | Source |
|---|---|---|
| `fittrack_user_profile` | `UserProfile` | storage.ts |
| `fittrack_meals` | `Meal[]` | storage.ts |
| `fittrack_workouts` | `Workout[]` | storage.ts |
| `fittrack_weekly_plans` | `WeeklyPlan[]` | storage.ts |
| `fittrack_coach_memory` | `CoachMemory` | storage.ts |
| `fittrack_weekly_reviews` | `WeeklyReview[]` | storage.ts |
| `fittrack_exercise_history` | `Record<string, ExerciseHistory>` | storage.ts |
| `fittrack_personal_bests` | `Record<string, PersonalBest>` | personalBests.ts |
| `fittrack_calorie_adjustments` | `CalorieAdjustment[]` | calorieAdjustment.ts |
| `fittrack_daily_adjustment_state` | `DailyAdjustmentState` | calorieAdjustment.ts |
| `fittrack_notification_settings` | `NotificationSettings` | notifications.ts |
| `fittrack_native_notification_settings` | `NativeNotificationSettings` | nativeNotifications.ts |
| `fittrack_last_newday_notification` | `string` (YYYY-MM-DD) | notifications.ts |
| `fittrack_last_workout_notification` | `string` (YYYY-MM-DD) | notifications.ts |
| `fittrack_last_meal_notification` | `string` (YYYY-MM-DD) | notifications.ts |
| `fittrack_debug_date_offset` | `string` (integer) | debugDate.ts |
| `fittrack_debug_enabled` | `"true"` | debugDate.ts |

---

## 4. Storage Layer (src/lib/storage.ts)

| Function | Signature | Purpose |
|---|---|---|
| `getUserProfile` | `() => UserProfile \| null` | Read profile from localStorage |
| `saveUserProfile` | `(profile: UserProfile) => void` | Write profile + emit `profileUpdated` event |
| `hasCompletedOnboarding` | `() => boolean` | Check `profile.onboardingComplete` |
| `getMeals` | `() => Meal[]` | Get all meals |
| `getMealsByDate` | `(date: string) => Meal[]` | Filter meals by YYYY-MM-DD |
| `saveMeal` | `(meal: Meal) => void` | Append meal |
| `updateMeal` | `(meal: Meal) => void` | Update meal by id |
| `deleteMeal` | `(mealId: string) => void` | Remove meal by id |
| `getWorkouts` | `() => Workout[]` | Get all workouts |
| `getWorkoutByDate` | `(date: string) => Workout \| null` | Find workout by date |
| `saveWorkout` | `(workout: Workout) => void` | Upsert workout by id |
| `deleteWorkout` | `(workoutId: string) => void` | Remove workout |
| `getWeeklyPlans` | `() => WeeklyPlan[]` | Get all weekly plans |
| `getCurrentWeeklyPlan` | `() => WeeklyPlan \| null` | Get latest plan |
| `saveWeeklyPlan` | `(plan: WeeklyPlan) => void` | Append plan |
| `getTodayPlannedWorkout` | `() => { type, isRestDay } \| null` | Determine today's workout type from schedule + rotation |
| `getDailyNutritionTotals` | `(date: string) => { calories, protein, carbs, fat }` | Sum meals for a date |
| `generateId` | `() => string` | Timestamp + random string ID |
| `getTodayDate` | `() => string` | YYYY-MM-DD, debug-date-aware |
| `getCoachMemory` | `() => CoachMemory \| null` | Read coach memory |
| `saveCoachMemory` | `(memory: CoachMemory) => void` | Write coach memory |
| `initializeCoachMemory` | `() => CoachMemory` | Create if not exists |
| `recordNutritionDay` | `(date: string) => void` | Log nutrition day + update streak |
| `recordMissedWorkout` | `(date, type) => void` | Log missed workout + reset streak |
| `recordCompletedWorkout` | `() => void` | Increment workout streak |
| `getWeeklyReviews` | `() => WeeklyReview[]` | Get all reviews |
| `getLatestWeeklyReview` | `() => WeeklyReview \| null` | Get most recent |
| `saveWeeklyReview` | `(review: WeeklyReview) => void` | Append (keep last 12) |
| `isCoachTrialActive` | `() => boolean` | Check 7-day trial window |
| `startCoachTrial` | `() => void` | Set trial start date |
| `getDaysLeftInTrial` | `() => number` | Days remaining in trial (-1 if premium) |
| `hasCoachAccess` | `() => boolean` | `isPremium \|\| isCoachTrialActive()` |
| `shouldShowWeeklyReview` | `() => boolean` | True if 7+ days since last review |
| `generateWeeklyReview` | `() => WeeklyReview \| null` | Create review with stats + adjustment logic |
| `getExerciseHistory` | `() => Record<string, ExerciseHistory>` | All exercise progression data |
| `getExerciseHistoryByName` | `(name: string) => ExerciseHistory \| null` | Single exercise history |
| `saveExerciseHistoryFromWorkout` | `(workout: Workout) => void` | Batch-save progression after workout |
| `getSuggestedWeightForExercise` | `(name: string) => { weight, reps } \| null` | Get next suggested weight |

Also exports: `COMMON_FOODS` (20 items), `DEFAULT_EXERCISES` (by workout type), `ALL_EXERCISES` (~100 exercises across 12 muscle groups).

---

## 5. Event Bus (src/lib/events.ts)

| Event | Constant | Fired by | Listened by |
|---|---|---|---|
| `app:dataUpdated` | `APP_EVENTS.DATA_UPDATED` | `CoachChat.tsx` (after action applied), `coachChat.ts:applyCoachAction` (schedule_workout) | `TodayPage` (refresh meals + child components), `WorkoutPage` (refresh workout) |
| `app:profileUpdated` | `APP_EVENTS.PROFILE_UPDATED` | `storage.ts:saveUserProfile` | `App.tsx:AppContent` (toggle CoachChat visibility), `AIPerformanceFeedback` (react to premium toggle) |

Additionally, `debugDate.ts` emits a raw `debug-date-change` CustomEvent (not part of events.ts).

---

## 6. Premium Gating

### Feature IDs (src/lib/features.ts)

| Feature ID | Tier | showLockedPreview |
|---|---|---|
| `weekly_reviews` | pro | true |
| `smart_adjustments` | pro | true |
| `coach_memory` | pro | false |
| `daily_guidance` | pro | true |
| `ai_performance_feedback` | pro | true |
| `adaptive_difficulty` | pro | true |
| `personal_bests` | free | false |
| `advanced_analytics` | pro | true |

### ProFeatureGate usage

- `AIPerformanceFeedback.tsx:234` wraps `ai_performance_feedback`

### isFeatureUnlocked callsites (outside features.ts)

- `ProFeatureGate.tsx:29` - gate check
- `AIPerformanceFeedback.tsx:134` - useState init
- `AIPerformanceFeedback.tsx:139` - useEffect re-check

### Direct `profile.isPremium` reads (violations)

- `WeeklyReviewCard.tsx:45` - `const isPremium = profile?.isPremium`
- `PremiumPaywall.tsx:161` - `checkPremium()` reads `profile?.isPremium`
- `PremiumPaywall.tsx:171` - `isPremium()` reads `profile?.isPremium`
- `ProfilePage.tsx:82-94` - `isPremium()` (via usePremiumGate hook, which reads directly)

Note: `usePremiumGate` hook in PremiumPaywall.tsx bypasses features.ts entirely, reading `profile?.isPremium` directly. This is used by TodayPage, ProfilePage, CoachOnboarding, and DailyGuidance. Multiple components use this hook rather than `isFeatureUnlocked`.

---

## 7. Date Handling

### getSimulatedDate / getSimulatedTodayDate / getTodayDate callsites

- `TodayPage.tsx:142` - display date
- `TodayStatus.tsx:42,57` - day of week, weekly stats
- `WeeklyStreakCard.tsx:15` - streak calculation
- `AIPerformanceFeedback.tsx:27` - insight generation
- `DebugDatePanel.tsx:23,29` - UI display
- `storage.ts:getTodayDate()` - used by most storage functions

### `new Date()` violations (using wall-clock time instead of simulated date)

These call `new Date()` for current-time purposes where `getSimulatedDate()` should arguably be used:

- `storage.ts:125` - `getTodayPlannedWorkout()` uses `new Date().getDay()` instead of simulated date
- `coachChat.ts:66` - `buildUserContext()` uses `new Date().getDay()`
- `WeeklyBar.tsx:23` - `new Date()` for current week calculation
- `WeeklyReviewCard.tsx:33` - `new Date()` for 24-hour check
- `notifications.ts:110,131,148` - `new Date()` for notification timing (arguably correct for real-time notifications)
- `storage.ts:461,493,512,525,534,546,578,579,592,601,602,623,635,636` - various `new Date()` in coach memory, trial, and review logic

Many of these use `new Date()` for ISO timestamps (`.toISOString()`) which is correct. The functional violations where simulated date should be used but isn't:
- **`storage.ts:125`** - `getTodayPlannedWorkout()` uses real day-of-week
- **`coachChat.ts:66`** - `buildUserContext()` sends real day-of-week to coach
- **`WeeklyBar.tsx:23`** - weekly bar uses real date for "today" markers

---

## 8. Color/Theme Drift

### `text-white` violations (outside src/components/ui/)

| File | Line | Context |
|---|---|---|
| `ProFeatureGate.tsx` | 51 | Lock icon in locked overlay |
| `ProFeatureGate.tsx` | 62 | "Unlock Pro" button text |
| `PremiumPaywall.tsx` | 56 | Crown icon |
| `PremiumPaywall.tsx` | 121 | Purchase button text |
| `ProfilePage.tsx` | 84 | Crown icon on premium badge |
| `ProfilePage.tsx` | 94 | "PREMIUM" badge text |
| `WeeklyStreakCard.tsx` | 94 | Trophy icon (when streak >= 4) |
| `WeeklyStreakCard.tsx` | 96 | Flame icon (when streak >= 4) |

### Hex literals (outside tailwind.config.ts/index.css)

| File | Line | Value | Context |
|---|---|---|---|
| `nativeNotifications.ts` | 144 | `#7c3aed` | Capacitor notification icon color |
| `nativeNotifications.ts` | 168 | `#7c3aed` | Capacitor notification icon color |
| `nativeNotifications.ts` | 195 | `#7c3aed` | Capacitor notification icon color |
| `nativeNotifications.ts` | 288 | `#7c3aed` | Capacitor notification icon color |

No `text-black`, `bg-white`, `bg-black`, or `Colors.` references found outside ui/.

---

## 9. Page-Level Component Graph

### TodayPage
- **Children**: `PageHeader`, `WeeklyBar`, `CalorieAdjustmentCard`, `WeeklyStreakCard`, `WeeklyReviewCard`, `TodayStatus`, `AIPerformanceFeedback`, `DailyGuidance`, `ProgressRing` (x2), `EmptyState`, `Dialog` (add meal), `PremiumPaywall`, `BottomNav`
- **Local state**: `meals`, `isAddingMeal`, `mealName`, `mealCalories`, `mealProtein`, `searchQuery`, `showSuggestions`, `adjustedCalorieTarget`, `refreshKey`, premium gate state (via `usePremiumGate`)

### WorkoutPage
- **Children**: `PageHeader`, `BottomNav`, `ExitWorkoutDialog`, `ExerciseAnimation`, `Dialog` (custom builder), `DndContext`/`SortableContext` (exercise reordering), `SortableExerciseItem`
- **Local state**: `workout`, `isActive`, `showCustomBuilder`, `showExitDialog`, `selectedExercises`, `exerciseSearch`, `editingSet`, `editValue`, `expandedExercise`

### HistoryPage
- **Children**: `PageHeader`, `BottomNav`, `EmptyState`
- **Local state**: `selectedDate`

### ProfilePage
- **Children**: `PageHeader`, `BottomNav`, `NotificationSettings`, `EmptyState`, `Dialog` (edit targets), `PremiumPaywall`
- **Local state**: `targets`, `isEditingTargets`, premium gate state (via `usePremiumGate`), `forceUpdate` (dummy state for re-render)

### Onboarding
- **Children**: `Button`, `Input` (none from component library beyond ui primitives)
- **Local state**: `step` (`welcome | experience | trainingDays | selectDays`), `trainingDays`, `selectedDays`

### CoachOnboarding
- **Children**: `PremiumPaywall`
- **Local state**: `step` (`goal | physique | body | training | selectDays | generating | planReady`), `coachProfile`, `generatedPlan`, premium gate state

---

## 10. AI Coach

### Flow

1. User types message in `CoachChat.tsx` (global floating panel)
2. `sendMessageToCoach()` in `coachChat.ts` builds `UserContext` from current app state (nutrition targets, today's meals/totals, workout schedule, today's workout)
3. Calls `supabase.functions.invoke("coach-chat")` with messages + userContext
4. `supabase/functions/coach-chat/index.ts` receives the request, prepends system prompt + context message, calls `ai.gateway.lovable.dev` with `google/gemini-3-flash-preview`
5. Response parsed as JSON with `{ message, actions, requiresConfirmation }`
6. Actions applied via `applyCoachAction()` in coachChat.ts

### System Prompt Summary

The coach is a friendly, non-judgmental fitness assistant. It can: log meals (with calorie/protein estimation), skip/move/reschedule workouts, schedule extra workouts on rest days, answer plan questions. Responses must be JSON with message + actions array. Actions require user confirmation. Rules: never shame, never give medical advice, never suggest extremes, only modify current week. The prompt includes full action schema definitions.

### Context Sent

`UserContext` object containing: `nutritionTargets`, `todayMeals` (name/cal/protein), `todayTotals`, `workoutDays`, `trainingDays`, `todayWorkout` (type + completed), `dayOfWeek`, `todayDate`. No `CoachMemory` is sent to the edge function -- it is only used locally in storage.ts for streak tracking and weekly reviews.

---

## 11. Personal Records

### Detection
- `personalBests.ts:checkAndUpdatePR()` - checks a single completed set against stored PRs; tracks maxWeight, maxRepsAtWeight, maxVolume (single-set). Returns `PRCheckResult | null`.

### Toast (WorkoutPage)
- `WorkoutPage.tsx:316-320` - on `toggleSet()`, when a set is marked complete, calls `checkAndUpdatePR()`. If PR detected, shows toast: "New Personal Best! {exercise} -- {weight}kg x {reps}".

### Badges (HistoryPage)
- `HistoryPage.tsx:178-183` - calls `workoutHasPR(dayWorkout)` to show a Trophy + "PR" badge next to completed workouts in the day summary.

### Section (ProfilePage)
- `ProfilePage.tsx:138-184` - calls `getPersonalBestsList()` to display top 5 PRs sorted by max weight. Uses `EmptyState` when no PRs exist.

### Divergences
- `workoutHasPR()` uses `>=` comparison (line 137-138: `set.weight >= existing.maxWeight`), meaning it flags ties as PRs. `checkAndUpdatePR()` uses strict `>` for weight (line 80). This means the badge can show on workouts that merely matched (not exceeded) a PR.
- `getWorkoutPRExercises()` also uses `>=` (line 136-139), same issue.

---

## 12. Notifications

### PWA (src/lib/notifications.ts)
- Event-driven, not scheduled. Fires on app open/visibility change.
- `checkAndSendNotifications()` (aliased as `checkAndScheduleNotifications`): checks localStorage timestamps to avoid duplicate notifications per day.
- Triggers:
  - `newDayReminder`: once per day on first app open
  - `workoutDayReminder`: once per workout day on app open (checks profile.workoutDays)
  - `mealTrackingReminder`: once per evening (>= 6pm) if no meals logged
- Called from `App.tsx:useEffect` when not native platform, and on `visibilitychange`.

### Native/Capacitor (src/lib/nativeNotifications.ts)
- Uses `@capacitor/local-notifications` for scheduled, background-capable notifications.
- `initializeNativeNotifications()`: called from `App.tsx:useEffect` when `isNativePlatform()`.
- Schedules:
  - Daily meal reminder (repeats daily at configured time)
  - Workout day reminders (repeats weekly per configured day)
  - Rest day reminders (optional, repeats weekly on non-workout days)
- Settings managed by `NativeNotificationSettings` component.

### Platform Switch
- `App.tsx:49-66`: `isNativePlatform()` (from Capacitor) determines which path. Native -> `initializeNativeNotifications()`. Web -> `checkAndScheduleNotifications()` + visibility listener.
- `NotificationSettings.tsx:29-31`: renders `NativeNotificationSettings` when `isNativePlatform()`, otherwise renders PWA settings UI.

---

## 13. Drag-and-Drop Usage

All @dnd-kit usage is in `WorkoutPage.tsx`:
- **Imports**: `@dnd-kit/core` (DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent), `@dnd-kit/sortable` (arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy), `@dnd-kit/utilities` (CSS)
- **Purpose**: Reordering exercises in the custom workout builder dialog. `SortableExerciseItem` component wraps each selected exercise with drag handle (`GripVertical` icon). `handleDragEnd` uses `arrayMove` to reorder the `selectedExercises` array.

---

## 14. Charts

- `recharts` is imported only in `src/components/ui/chart.tsx` (`import * as RechartsPrimitive from "recharts"`), which is a shadcn chart wrapper.
- **No page or component outside `src/components/ui/` imports recharts directly.** The chart.tsx wrapper exists but is unused by any application component.

---

## 15. TODOs / WIP Markers

No `TODO`, `FIXME`, `XXX`, `HACK`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` found in `src/` (excluding `src/components/ui/`).

---

## 16. Divergences from Stated Patterns

### Premium gating violations (Section 6)
- `usePremiumGate` hook in `PremiumPaywall.tsx` reads `profile?.isPremium` directly, bypassing `isFeatureUnlocked()`. Used by TodayPage, ProfilePage, CoachOnboarding, DailyGuidance.
- `WeeklyReviewCard.tsx:45` reads `profile?.isPremium` directly for conditional rendering.
- Most pro features are not wrapped in `ProFeatureGate`. Only `ai_performance_feedback` uses the gate component. Others (weekly_reviews, smart_adjustments, daily_guidance, etc.) use ad-hoc `hasCoachAccess()` or `isPremium()` checks.

### Date handling violations (Section 7)
- `storage.ts:125` (`getTodayPlannedWorkout`) uses `new Date().getDay()` -- ignores debug date offset.
- `coachChat.ts:66` (`buildUserContext`) sends `new Date().getDay()` as `dayOfWeek` -- ignores debug date offset.
- `WeeklyBar.tsx:23` uses `new Date()` for week calculation -- ignores debug date offset.

### Color/theme drift (Section 8)
- 8 instances of `text-white` in non-ui components (amber gradient backgrounds, premium badges).
- 4 instances of hardcoded `#7c3aed` hex in native notifications (should reference a shared constant or theme token).

### Personal Records comparison inconsistency (Section 11)
- `workoutHasPR()` and `getWorkoutPRExercises()` use `>=` for comparisons, while `checkAndUpdatePR()` uses `>` for weight. This means the history badge can flag workouts that merely tied a PR.

### Unused components/files
- `src/pages/Index.tsx` - placeholder "Welcome to Your Blank App" page, not referenced in any route.
- `src/components/NavLink.tsx` - custom NavLink wrapper, not imported by any component (BottomNav uses `react-router-dom` NavLink directly).
- `src/hooks/use-mobile.tsx` and `src/hooks/use-toast.ts` - present but not checked for usage.
- `recharts` is a dependency and `chart.tsx` wrapper exists but no component uses it.

### Feature flags not covering all gated features
- `weekly_reviews`, `smart_adjustments`, `coach_memory`, `daily_guidance`, `adaptive_difficulty`, `advanced_analytics` are defined in features.ts but none are checked via `isFeatureUnlocked()` in application code. Gating is done via `hasCoachAccess()` (trial-based) or `isPremium()` (direct profile read) instead.

### CoachMemory not sent to AI
- `CoachMemory` type exists and is maintained locally (streaks, missed workouts, nutrition days), but `coachChat.ts:buildUserContext()` does not include it. The AI coach has no access to historical behavior data.

### WeeklyBar does not use EmptyState
- `WeeklyBar.tsx` renders inline content when no schedule is set, rather than using the `EmptyState` component pattern used elsewhere.
