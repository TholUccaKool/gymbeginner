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
      <AnimatedFigure
        exerciseName={exerciseName}
        primaryMuscles={muscles.primary}
        size={size}
      />
    </div>
  );
}

// Animated SVG figure for exercises - Canonical Stickman Rigs
function AnimatedFigure({
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

  // Determine exercise type for animation
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

        {/* === 1. SQUAT RIG (Side View) === */}
        {exerciseType === 'squat' && (
          <g className="animate-squat">
            {/* Head */}
            <circle cx="0" cy="-24" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Torso */}
            <line x1="0" y1="-19" x2="0" y2="2" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            {/* Legs (simplified zigzag for standing -> squat) */}
            <path d="M0,2 L-2,15 L-2,30" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
            <path d="M0,2 L2,15 L2,30" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
            {/* Arms (out for balance) */}
            <path d="M0,-15 L10,-5" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
          </g>
        )}

        {/* === 2. HINGE RIG (Side View) === */}
        {exerciseType === 'hinge' && (
          <g className="animate-hinge-hips">
            {/* Torso Group that rotates */}
            <g className="animate-hinge-torso">
              <line x1="0" y1="0" x2="0" y2="-22" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
              <circle cx="0" cy="-27" r="5" fill="currentColor" className="text-foreground/80" />
              {/* Arms hanging */}
              <line x1="0" y1="-18" x2="5" y2="5" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            </g>
            {/* Legs (Fixed but hips move) */}
            <path d="M0,0 L-3,28" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('hamstrings') ? "text-primary" : "text-foreground/80"} />
            <path d="M0,0 L3,28" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('hamstrings') ? "text-primary" : "text-foreground/80"} />
          </g>
        )}

        {/* === 3. PUSH RIG (Push-up Side View) === */}
        {exerciseType === 'push' && (
          <g transform="rotate(-90)" className="animate-push-body">
            {/* Horizontal Body Line */}
            <line x1="0" y1="-15" x2="0" y2="15" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('core') ? "text-primary" : "text-foreground/80"} />
            {/* Head */}
            <circle cx="0" cy="-20" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Legs */}
            <line x1="0" y1="15" x2="0" y2="30" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            {/* Arms (Animated) */}
            <g className="animate-push-arms">
              <line x1="-3" y1="-10" x2="-12" y2="-10" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('pectoralis') || primaryMuscles.includes('triceps') ? "text-primary" : "text-foreground/80"} />
            </g>
          </g>
        )}

        {/* === 4. PULL RIG (Standing Row Side View) === */}
        {exerciseType === 'pull' && (
          <g>
            {/* Torso (slight brace) */}
            <line x1="0" y1="-5" x2="0" y2="25" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <circle cx="0" cy="-10" r="5" fill="currentColor" className="text-foreground/80" />
            {/* Legs (braced) */}
            <path d="M0,25 L-8,45" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <path d="M0,25 L8,45" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />

            {/* Arms (Pulling Motion) */}
            <g className="animate-pull-arms">
              {/* Arm reaching forward then back */}
              <path d="M0,0 L15,5" stroke="currentColor" strokeWidth={commonStrokeWidth} className={primaryMuscles.includes('lats') || primaryMuscles.includes('biceps') ? "text-primary" : "text-foreground/80"} />
            </g>
          </g>
        )}

        {/* === 5. LUNGE RIG (Split Stance Side View) === */}
        {exerciseType === 'lunge' && (
          <g className="animate-lunge">
            {/* Torso */}
            <line x1="0" y1="-20" x2="0" y2="0" stroke="currentColor" strokeWidth={commonStrokeWidth} className="text-foreground/80" />
            <circle cx="0" cy="-25" r="5" fill="currentColor" className="text-foreground/80" />

            {/* Legs (Split) */}
            {/* Front Leg */}
            <path d="M0,0 L10,10 L10,25" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
            {/* Back Leg */}
            <path d="M0,0 L-10,15 L-15,30" stroke="currentColor" strokeWidth={commonStrokeWidth} fill="none" className={primaryMuscles.includes('glutes') ? "text-primary" : "text-foreground/80"} />
          </g>
        )}

        {/* === STATIC FALLBACK === */}
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
