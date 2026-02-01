import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import "./ExerciseAnimation.css";

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

// Compact exercise icon with animation
function ExerciseIcon({
  exerciseName,
  muscleGroup,
  size = 'sm'
}: {
  exerciseName: string;
  muscleGroup: string;
  size: 'sm' | 'lg'
}) {
  const iconSize = size === 'sm' ? 'w-10 h-10' : 'w-24 h-24';
  const muscles = getMuscleGroups(muscleGroup);

  return (
    <div className={cn(
      iconSize,
      "rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden"
    )}>
      <StaticFigure
        exerciseName={exerciseName}
        primaryMuscles={muscles.primary}
        size={size}
      />
    </div>
  );
}

// Static SVG figure for exercises - Instructional Poses
function StaticFigure({
  exerciseName,
  primaryMuscles,
  size
}: {
  exerciseName: string;
  primaryMuscles: string[];
  size: 'sm' | 'lg';
}) {
  const scale = size === 'sm' ? 0.45 : 0.9;
  const figureSize = size === 'sm' ? 24 : 64;

  // Determine exercise type for visualization
  const exerciseType = getExerciseType(exerciseName);

  const commonStrokeWidth = size === 'sm' ? 4 : 3;

  return (
    <svg
      width={figureSize}
      height={figureSize}
      viewBox="0 0 64 64"
      className="exercise-animation overflow-visible"
    >
      <g transform={`translate(32, 32) scale(${scale})`}>

        {/* === 1. SQUAT POSE (Side View - Mid Rep) === */}
        {exerciseType === 'squat' && (
          <g>
            {/* Head */}
            <circle cx="0" cy="-22" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Torso (slight forward lean for balance) */}
            <line x1="0" y1="-17" x2="2" y2="5" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            {/* Legs (Bent in squat) */}
            <path d="M2,5 L12,5 L14,28" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
            <path d="M2,5 L-2,5 L0,28" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
            {/* Arms (out for balance) */}
            <path d="M0,-14 L12,-8" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
          </g>
        )}

        {/* === 2. HINGE POSE (Side View - Mid Hinge) === */}
        {exerciseType === 'hinge' && (
          <g>
            {/* Torso (Leaned forward 45deg) */}
            <line x1="-5" y1="0" x2="10" y2="-15" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <circle cx="13" cy="-18" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Arms (Hanging down) */}
            <line x1="8" y1="-12" x2="8" y2="10" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            {/* Legs (Soft knees, hips back) */}
            <path d="M-5,0 L-5,28" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('hamstrings') ? "text-primary" : "text-foreground/80"} />
            <path d="M-5,0 L-2,28" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('hamstrings') ? "text-primary" : "text-foreground/80"} />
          </g>
        )}

        {/* === 3. PUSH POSE (Push-up - Bottom Position) === */}
        {exerciseType === 'push' && (
          <g transform="rotate(-90)">
            {/* Horizontal Body Line */}
            <line x1="0" y1="-12" x2="0" y2="15" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('core') ? "text-primary" : "text-foreground/80"} />
            {/* Head */}
            <circle cx="0" cy="-17" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Legs */}
            <line x1="0" y1="15" x2="0" y2="30" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            {/* Arms (Bent elbows) */}
            <polyline points="-3,-10 -12,-5 -3,0" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('pectoralis') || primaryMuscles.includes('triceps') ? "text-primary" : "text-foreground/80"} />
          </g>
        )}

        {/* === 4. PULL POSE (Standing Row - Contracted Phase) === */}
        {exerciseType === 'pull' && (
          <g>
            {/* Torso */}
            <line x1="0" y1="-5" x2="0" y2="25" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <circle cx="0" cy="-10" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Legs */}
            <path d="M0,25 L-5,45" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <path d="M0,25 L5,45" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />

            {/* Arms (Elbows pulled back) */}
            <polyline points="5,-2 15,5 5,12" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('lats') || primaryMuscles.includes('biceps') ? "text-primary" : "text-foreground/80"} />
          </g>
        )}

        {/* === 5. LUNGE POSE (Split Squat - Bottom) === */}
        {exerciseType === 'lunge' && (
          <g>
            {/* Torso */}
            <line x1="0" y1="-15" x2="0" y2="5" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <circle cx="0" cy="-20" r="5" fill="currentColor" className="text-foreground/80" />

            {/* Front Leg (90 deg) */}
            <polyline points="0,5 10,5 10,25" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
            {/* Back Leg (Knee down) */}
            <polyline points="0,5 -10,15 -10,25" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('glutes') ? "text-primary" : "text-foreground/80"} />
          </g>
        )}

        {/* === STATIC FALLBACK (Neutral Stand) === */}
        {exerciseType === 'static' && (
          <g>
            <circle cx="0" cy="-20" r="5" fill="currentColor" className="text-foreground/50" />
            <line x1="0" y1="-15" x2="0" y2="10" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/50" />
            <line x1="-12" y1="-5" x2="12" y2="-5" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/50" />
            <line x1="-8" y1="30" x2="0" y2="10" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/50" />
            <line x1="8" y1="30" x2="0" y2="10" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/50" />
          </g>
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

// Helper to determine exercise animation type - STRICT MAPPING
function getExerciseType(exerciseName: string): 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'static' {
  const name = exerciseName.toLowerCase();

  // 1. EXCLUSIONS (Do NOT animate)
  if (name.includes('leg press')) return 'static';
  if (name.includes('curl')) return 'static';
  if (name.includes('raise') && !name.includes('raise') /* catch-all for lat raise etc */) return 'static';
  if (name.includes('extension') || name.includes('pushdown')) return 'static';
  if (name.includes('fly')) return 'static';
  if (name.includes('calf')) return 'static';
  if (name.includes('plank') || name.includes('crunch') || name.includes('sit-up')) return 'static';

  // 2. SQUAT PATTERN
  if (name.includes('squat')) return 'squat';

  // 3. HINGE PATTERN
  if (name.includes('deadlift') || name.includes('clean') || name.includes('swing')) return 'hinge';

  // 4. LUNGE PATTERN
  if (name.includes('lunge') || name.includes('step-up') || name.includes('split')) return 'lunge';

  // 5. PUSH PATTERN (Pushups, Bench, OHP)
  // Note: user said "push-up style". 
  if (name.includes('bench') || name.includes('press') || name.includes('push-up') || name.includes('push up') || name.includes('dip')) return 'push';

  // 6. PULL PATTERN (Rows)
  if (name.includes('row') || name.includes('pull-up') || name.includes('pull up') || name.includes('chin-up') || name.includes('pulldown')) return 'pull';

  // Default fallback
  return 'static';
}
