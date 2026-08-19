// Exercise image lookup using free-exercise-db (GitHub: yuhonas/free-exercise-db)
// Each exercise has paired start/end JPGs for animation via CSS crossfade.
// Results cached in localStorage to match the app's offline-first architecture.

const STORAGE_KEY = 'fittrack_exercise_images';
const CACHE_VERSION = 1;
const DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

interface ExerciseImageEntry {
  images: [string, string]; // [start position URL, end position URL]
  cachedAt: number;
}

interface ImageCache {
  version: number;
  entries: Record<string, ExerciseImageEntry>;
}

// Manual overrides: app exercise name -> exact API exercise name
// For exercises where normalized word-matching fails
const MANUAL_OVERRIDES: Record<string, string> = {
  'deadlift': 'Barbell Deadlift',
  'back squat': 'Barbell Full Squat',
  'squat': 'Barbell Full Squat',
  'overhead press': 'Barbell Shoulder Press',
  'chin-ups': 'Chin-Up',
  'lat pulldown': 'Close-Grip Front Lat Pulldown',
  'face pulls': 'Face Pull',
  'dips': 'Dips - Triceps Version',
  'skull crushers': 'Decline Close-Grip Bench To Skull Crusher',
  'tricep pushdown': 'Triceps Pushdown',
  'lunges': 'Barbell Lunge',
  'walking lunges': 'Bodyweight Walking Lunge',
  'reverse lunges': 'Crossover Reverse Lunge',
  'chest fly': 'Butterfly',
  'cable fly': 'Flat Bench Cable Flyes',
  'pec deck machine': 'Butterfly',
  'hyperextensions': 'Hyperextensions (Back Extensions)',
  'barbell shrugs': 'Barbell Shrug',
  'dumbbell shrugs': 'Dumbbell Shrug',
  'stiff leg deadlift': 'Stiff-Legged Barbell Deadlift',
  'treadmill': 'Jogging, Treadmill',
  'elliptical': 'Elliptical Trainer',
  'battle ropes': 'Battling Ropes',
  'assault bike': 'Air Bike',
  'tricep kickbacks': 'Tricep Dumbbell Kickback',
  'cable woodchoppers': 'Standing Cable Wood Chop',
  'v-ups': 'Jackknife Sit-Up',
  'box jumps': 'Box Jump (Multiple Response)',
  'jump rope': 'Rope Jumping',
  'bicycle crunch': 'Air Bike',
  'sumo squat': 'Sumo Deadlift',
  'single leg hip thrust': 'Barbell Hip Thrust',
  'dumbbell rdl': 'Stiff-Legged Dumbbell Deadlift',
  'cable kickback': 'Glute Kickback',
  'reverse fly': 'Cable Rear Delt Fly',
  'chest supported row': 'Dumbbell Incline Row',
  'sprints': 'Lunge Sprint',
  'landmine press': 'Landmine Linear Jammer',
  'chest dips': 'Dips - Chest Version',
  'rope pushdown': 'Triceps Pushdown',
  'overhead tricep extension': 'Cable Rope Overhead Triceps Extension',
  'cable overhead extension': 'Cable Rope Overhead Triceps Extension',
  'close grip pulldown': 'Close-Grip Front Lat Pulldown',
  'seated shoulder press': 'Barbell Shoulder Press',
  'dumbbell shoulder press': 'Dumbbell Shoulder Press',
  'calf raise': 'Standing Barbell Calf Raise',
  'leg curl': 'Lying Leg Curls',
  'lying leg curl': 'Lying Leg Curls',
  'bicep curl': 'Barbell Curl',
  'push-ups': 'Pushups',
  'diamond push-ups': 'Pushups (Close and Wide Hand Positions)',
  'wide push-ups': 'Push-Ups With Feet Elevated',
  'pull-ups': 'Pullups',
  'wide grip pull-ups': 'Wide-Grip Rear Pull-Up',
  'bench dips': 'Bench Dips',
  'front raise': 'Front Dumbbell Raise',
  'upright row': 'Upright Barbell Row',
  'push press': 'Push Press',
  'step ups': 'Barbell Step Ups',
  'hack squat': 'Barbell Hack Squat',
  'seated calf raise': 'Seated Calf Raise',
  'donkey calf raise': 'Donkey Calf Raises',
  'hip abduction machine': 'Thigh Abductor',
  'frog pumps': 'Frog Hops',
  'mountain climbers': 'Mountain Climbers',
  'kettlebell swings': 'One-Arm Kettlebell Swings',
  'ab wheel rollout': 'Ab Roller',
  'cable crunch': 'Cable Crunch',
  'bench press': 'Barbell Bench Press - Medium Grip',
  'incline bench press': 'Incline Dumbbell Press',
  'barbell row': 'Bent Over Barbell Row',
  'dumbbell row': 'One-Arm Dumbbell Row',
  'arnold press': 'Arnold Dumbbell Press',
  'lateral raise': 'Side Lateral Raise',
  'cable lateral raise': 'Cable Seated Lateral Raise',
  'machine lateral raise': 'Side Lateral Raise',
  'dumbbell curl': 'Dumbbell Bicep Curl',
  'hammer curl': 'Alternate Hammer Curl',
  'concentration curl': 'Standing Concentration Curl',
  'cable curl': 'Cable Preacher Curl',
  'reverse curl': 'Reverse Barbell Curl',
  'front squat': 'Front Barbell Squat',
  'bulgarian split squat': 'Dumbbell Rear Lunge',
  'leg extension': 'Leg Extensions',
  'sissy squat': 'Weighted Sissy Squat',
  'cable pull through': 'Pull Through',
  'hip thrust': 'Barbell Hip Thrust',
  'glute bridge': 'Barbell Glute Bridge',
  'good mornings': 'Seated Good Mornings',
  'decline bench press': 'Decline Barbell Bench Press',
  'decline dumbbell press': 'Decline Dumbbell Bench Press',
  'flat dumbbell press': 'Dumbbell Bench Press',
  'incline dumbbell fly': 'Incline Dumbbell Flyes',
  't-bar row': 'Lying T-Bar Row',
  'close grip bench press': 'Close-Grip Barbell Bench Press',
  'standing calf raise': 'Standing Barbell Calf Raise',
  'rear delt row': 'Barbell Rear Delt Row',
  'seated cable row': 'Seated Cable Rows',
  'leg raises': 'Flat Bench Lying Leg Raise',
  'hanging knee raise': 'Hanging Leg Raise',
  'toe touches': 'Standing Toe Touches',
  'wrist curl': 'Palms-Up Barbell Wrist Curl Over A Bench',
  'reverse wrist curl': 'Palms-Down Wrist Curl Over A Bench',
  'single leg rdl': 'Stiff-Legged Dumbbell Deadlift',
  'landmine lateral raise': 'Side Lateral Raise',
  'sit-ups': 'Sit-Up',
};

// In-memory state
let apiData: { name: string; id: string; images: string[] }[] | null = null;
let fetchPromise: Promise<void> | null = null;

function getCache(): ImageCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ImageCache;
      if (parsed.version === CACHE_VERSION) return parsed;
    }
  } catch { /* ignore */ }
  return { version: CACHE_VERSION, entries: {} };
}

function saveCache(cache: ImageCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch { /* ignore quota errors */ }
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordOverlapScore(a: string, b: string): number {
  const aWords = new Set(a.split(' '));
  const bWords = new Set(b.split(' '));
  let overlap = 0;
  for (const w of aWords) {
    if (bWords.has(w)) overlap++;
  }
  const total = Math.max(aWords.size, bWords.size);
  return total > 0 ? overlap / total : 0;
}

// Pre-compute normalized override keys for lookup
const NORMALIZED_OVERRIDES: Record<string, string> = {};
for (const [key, value] of Object.entries(MANUAL_OVERRIDES)) {
  NORMALIZED_OVERRIDES[normalize(key)] = value;
}

function findMatch(
  exerciseName: string,
  db: { name: string; id: string; images: string[] }[]
): { name: string; id: string; images: string[] } | null {
  const norm = normalize(exerciseName);

  // 1. Manual override (keys are normalized)
  const override = NORMALIZED_OVERRIDES[norm];
  if (override) {
    const overrideNorm = normalize(override);
    const entry = db.find(d => normalize(d.name) === overrideNorm);
    if (entry) return entry;
  }

  // 2. Exact normalized match
  const exact = db.find(d => normalize(d.name) === norm);
  if (exact) return exact;

  // 3. Word overlap >= 0.6
  let best: (typeof db)[0] | null = null;
  let bestScore = 0;
  for (const d of db) {
    const score = wordOverlapScore(norm, normalize(d.name));
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  if (best && bestScore >= 0.6) return best;

  return null;
}

async function loadDatabase(): Promise<void> {
  if (apiData) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(DB_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { name: string; id: string; images: string[] }[]) => {
      apiData = data;
    })
    .catch(err => {
      console.warn('Failed to load exercise image database:', err);
      apiData = [];
    });

  return fetchPromise;
}

/** Resolve exercise images. Returns cached result immediately if available, otherwise fetches. */
export function getExerciseImages(
  exerciseName: string
): { images: [string, string] } | null {
  const cache = getCache();
  const key = normalize(exerciseName);
  const entry = cache.entries[key];
  if (entry) return { images: entry.images };
  return null;
}

/** Async resolve — fetches the database if needed, matches, and caches. */
export async function resolveExerciseImages(
  exerciseName: string
): Promise<{ images: [string, string] } | null> {
  // Check cache first
  const cached = getExerciseImages(exerciseName);
  if (cached) return cached;

  // Load DB
  await loadDatabase();
  if (!apiData || apiData.length === 0) return null;

  const match = findMatch(exerciseName, apiData);
  if (!match || match.images.length < 2) return null;

  const images: [string, string] = [
    `${IMAGE_BASE}/${match.images[0]}`,
    `${IMAGE_BASE}/${match.images[1]}`,
  ];

  // Cache it
  const cache = getCache();
  cache.entries[normalize(exerciseName)] = {
    images,
    cachedAt: Date.now(),
  };
  saveCache(cache);

  return { images };
}

/** Preload images for a list of exercise names (fire-and-forget). */
export function preloadExerciseImages(exerciseNames: string[]): void {
  // Deduplicate
  const unique = [...new Set(exerciseNames)];
  // Resolve all in parallel (non-blocking)
  Promise.all(unique.map(name => resolveExerciseImages(name))).catch(() => {});
}
