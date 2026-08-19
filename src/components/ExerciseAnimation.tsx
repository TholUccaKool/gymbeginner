import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getExerciseImages, resolveExerciseImages } from "@/lib/exerciseImages";

// Muscle group definitions for highlighting
const MUSCLE_GROUPS: Record<string, { primary: string[]; secondary: string[] }> = {
  chest: { primary: ['pectoralis'], secondary: ['anterior-deltoid', 'triceps'] },
  back: { primary: ['lats', 'rhomboids'], secondary: ['rear-deltoid', 'biceps'] },
  shoulders: { primary: ['anterior-deltoid', 'lateral-deltoid'], secondary: ['trapezius', 'triceps'] },
  biceps: { primary: ['biceps'], secondary: ['forearms'] },
  triceps: { primary: ['triceps'], secondary: ['chest'] },
  quads: { primary: ['quadriceps'], secondary: ['glutes'] },
  hamstrings: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
  glutes: { primary: ['glutes'], secondary: ['hamstrings', 'lower-back'] },
  calves: { primary: ['calves'], secondary: [] },
  core: { primary: ['abs', 'obliques'], secondary: ['lower-back'] },
};

// Map exercise muscle groups to our muscle group system
function getMuscleGroups(muscleGroup: string): { primary: string[]; secondary: string[] } {
  const normalized = muscleGroup.toLowerCase();

  if (normalized.includes('chest')) return MUSCLE_GROUPS.chest;
  if (normalized.includes('back') || normalized.includes('lat')) return MUSCLE_GROUPS.back;
  if (normalized.includes('shoulder') || normalized.includes('delt')) return MUSCLE_GROUPS.shoulders;
  if (normalized.includes('bicep')) return MUSCLE_GROUPS.biceps;
  if (normalized.includes('tricep')) return MUSCLE_GROUPS.triceps;
  if (normalized.includes('quad') || normalized.includes('leg')) return MUSCLE_GROUPS.quads;
  if (normalized.includes('hamstring')) return MUSCLE_GROUPS.hamstrings;
  if (normalized.includes('glute') || normalized.includes('hip')) return MUSCLE_GROUPS.glutes;
  if (normalized.includes('calf') || normalized.includes('calves')) return MUSCLE_GROUPS.calves;
  if (normalized.includes('core') || normalized.includes('ab')) return MUSCLE_GROUPS.core;

  return { primary: [], secondary: [] };
}

/** Hook to resolve exercise images (cached in localStorage, async fetch on miss). */
function useExerciseImages(exerciseName: string): [string, string] | null {
  const [images, setImages] = useState<[string, string] | null>(() => {
    const cached = getExerciseImages(exerciseName);
    return cached?.images ?? null;
  });

  useEffect(() => {
    // If already cached, nothing to do
    if (images) return;

    let cancelled = false;
    resolveExerciseImages(exerciseName).then(result => {
      if (!cancelled && result) {
        setImages(result.images);
      }
    });
    return () => { cancelled = true; };
  }, [exerciseName, images]);

  return images;
}

interface ExerciseAnimationProps {
  exerciseName: string;
  muscleGroup: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  showCompact?: boolean;
}

export function ExerciseAnimation({
  exerciseName,
  muscleGroup,
  isExpanded = false,
  onToggle,
  showCompact = true,
}: ExerciseAnimationProps) {
  const muscles = getMuscleGroups(muscleGroup);

  return (
    <div className="select-none">
      {showCompact && (
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors"
        >
          <ExerciseIcon exerciseName={exerciseName} muscleGroup={muscleGroup} size="sm" />
          <div className="flex-1 text-left">
            <p className="text-xs text-muted-foreground">Tap for form guide</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}

      {isExpanded && (
        <div className="mt-3 p-4 bg-secondary/30 rounded-xl animate-fade-in">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <ExerciseIcon exerciseName={exerciseName} muscleGroup={muscleGroup} size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <MuscleHighlight
                primary={muscles.primary}
                secondary={muscles.secondary}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact exercise icon — real image or SVG fallback
function ExerciseIcon({
  exerciseName,
  muscleGroup,
  size = 'sm'
}: {
  exerciseName: string;
  muscleGroup: string;
  size: 'sm' | 'lg'
}) {
  const iconSize = size === 'sm' ? 'w-10 h-10' : 'w-20 h-20';
  const muscles = getMuscleGroups(muscleGroup);
  const images = useExerciseImages(exerciseName);
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = images && !imgFailed;

  return (
    <div className={cn(
      iconSize,
      "rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden"
    )}>
      {showImage ? (
        <ExerciseImageCrossfade images={images} size={size} onError={() => setImgFailed(true)} />
      ) : (
        <AnimatedFigure
          exerciseName={exerciseName}
          primaryMuscles={muscles.primary}
          size={size}
        />
      )}
    </div>
  );
}

// Crossfade between start/end position images
function ExerciseImageCrossfade({
  images,
  size,
  onError,
}: {
  images: [string, string];
  size: 'sm' | 'lg';
  onError: () => void;
}) {
  const containerSize = size === 'sm' ? 'w-10 h-10' : 'w-20 h-20';

  return (
    <div className={cn(containerSize, "relative")}>
      <img
        src={images[0]}
        alt=""
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          "animate-exercise-crossfade"
        )}
        onError={onError}
        loading="lazy"
      />
      <img
        src={images[1]}
        alt=""
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          "animate-exercise-crossfade-alt"
        )}
        onError={onError}
        loading="lazy"
      />
    </div>
  );
}

// Animated SVG figure for exercises (fallback)
function AnimatedFigure({
  exerciseName,
  primaryMuscles,
  size
}: {
  exerciseName: string;
  primaryMuscles: string[];
  size: 'sm' | 'lg';
}) {
  const scale = size === 'sm' ? 0.4 : 0.8;
  const figureSize = size === 'sm' ? 24 : 48;

  // Determine exercise type for animation
  const exerciseType = getExerciseType(exerciseName);

  return (
    <svg
      width={figureSize}
      height={figureSize}
      viewBox="0 0 64 64"
      className="exercise-animation"
    >
      <g transform={`translate(32, 32) scale(${scale})`}>
        {/* Head */}
        <circle cx="0" cy="-24" r="6" fill="currentColor" className="text-foreground/70" />

        {/* Body */}
        <line x1="0" y1="-18" x2="0" y2="8" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />

        {/* Arms - animated based on exercise type */}
        <g className={cn(
          "origin-center",
          exerciseType === 'push' && "animate-push-motion",
          exerciseType === 'pull' && "animate-pull-motion",
          exerciseType === 'lift' && "animate-lift-motion"
        )}>
          <line x1="-16" y1="-10" x2="0" y2="-14" stroke="currentColor" strokeWidth="3"
            className={cn(
              primaryMuscles.includes('biceps') || primaryMuscles.includes('triceps')
                ? "text-primary"
                : "text-foreground/70"
            )}
          />
          <line x1="16" y1="-10" x2="0" y2="-14" stroke="currentColor" strokeWidth="3"
            className={cn(
              primaryMuscles.includes('biceps') || primaryMuscles.includes('triceps')
                ? "text-primary"
                : "text-foreground/70"
            )}
          />
        </g>

        {/* Legs - animated for leg exercises */}
        <g className={cn(
          "origin-center",
          exerciseType === 'squat' && "animate-squat-motion"
        )}>
          <line x1="-8" y1="24" x2="0" y2="8" stroke="currentColor" strokeWidth="3"
            className={cn(
              primaryMuscles.includes('quadriceps') || primaryMuscles.includes('hamstrings') || primaryMuscles.includes('glutes')
                ? "text-primary"
                : "text-foreground/70"
            )}
          />
          <line x1="8" y1="24" x2="0" y2="8" stroke="currentColor" strokeWidth="3"
            className={cn(
              primaryMuscles.includes('quadriceps') || primaryMuscles.includes('hamstrings') || primaryMuscles.includes('glutes')
                ? "text-primary"
                : "text-foreground/70"
            )}
          />
        </g>

        {/* Chest highlight */}
        {primaryMuscles.includes('pectoralis') && (
          <ellipse cx="0" cy="-8" rx="8" ry="5" fill="currentColor" className="text-primary/40" />
        )}

        {/* Back highlight */}
        {(primaryMuscles.includes('lats') || primaryMuscles.includes('rhomboids')) && (
          <ellipse cx="0" cy="-4" rx="10" ry="8" fill="currentColor" className="text-primary/30" />
        )}

        {/* Shoulder highlights */}
        {(primaryMuscles.includes('anterior-deltoid') || primaryMuscles.includes('lateral-deltoid')) && (
          <>
            <circle cx="-12" cy="-12" r="4" fill="currentColor" className="text-primary/50" />
            <circle cx="12" cy="-12" r="4" fill="currentColor" className="text-primary/50" />
          </>
        )}
      </g>
    </svg>
  );
}

// Muscle diagram with highlights
function MuscleHighlight({
  primary,
  secondary
}: {
  primary: string[];
  secondary: string[]
}) {
  const muscleLabels: Record<string, string> = {
    'pectoralis': 'Chest',
    'lats': 'Lats',
    'rhomboids': 'Upper Back',
    'anterior-deltoid': 'Front Delts',
    'lateral-deltoid': 'Side Delts',
    'rear-deltoid': 'Rear Delts',
    'trapezius': 'Traps',
    'biceps': 'Biceps',
    'triceps': 'Triceps',
    'forearms': 'Forearms',
    'quadriceps': 'Quads',
    'hamstrings': 'Hamstrings',
    'glutes': 'Glutes',
    'calves': 'Calves',
    'abs': 'Abs',
    'obliques': 'Obliques',
    'lower-back': 'Lower Back',
  };

  return (
    <div className="space-y-2">
      {primary.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Primary</p>
          <div className="flex flex-wrap gap-1">
            {primary.map((muscle) => (
              <span
                key={muscle}
                className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30"
              >
                {muscleLabels[muscle] || muscle}
              </span>
            ))}
          </div>
        </div>
      )}

      {secondary.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Secondary</p>
          <div className="flex flex-wrap gap-1">
            {secondary.map((muscle) => (
              <span
                key={muscle}
                className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-muted-foreground border border-border/60"
              >
                {muscleLabels[muscle] || muscle}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to determine exercise animation type
function getExerciseType(exerciseName: string): 'push' | 'pull' | 'squat' | 'lift' | 'static' {
  const name = exerciseName.toLowerCase();

  if (name.includes('press') || name.includes('push') || name.includes('fly') || name.includes('dip')) {
    return 'push';
  }
  if (name.includes('row') || name.includes('pull') || name.includes('curl') || name.includes('pulldown')) {
    return 'pull';
  }
  if (name.includes('squat') || name.includes('lunge') || name.includes('leg press')) {
    return 'squat';
  }
  if (name.includes('deadlift') || name.includes('shrug') || name.includes('raise')) {
    return 'lift';
  }

  return 'static';
}
