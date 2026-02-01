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

// Animated SVG figure for exercises
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
  const figureSize = size === 'sm' ? 24 : 64;
  
  // Determine exercise type for animation
  const exerciseType = getExerciseType(exerciseName);
  
  return (
    <svg 
      width={figureSize} 
      height={figureSize} 
      viewBox="0 0 64 64" 
      className="exercise-animation overflow-visible"
    >
      <g transform={`translate(${32}, ${32}) scale(${scale})`}>
        {/* Squat Animation Structure */}
        {exerciseType === 'squat' && (
          <g className="animate-squat-body">
             {/* Torso */}
             <line x1="0" y1="-15" x2="0" y2="10" stroke="currentColor" strokeWidth="4" className="text-foreground/80" />
             {/* Head */}
             <circle cx="0" cy="-22" r="6" fill="currentColor" className="text-foreground/80" />
             {/* Thighs */}
             <g className="animate-squat-legs">
                <path d="M0,10 L-10,30" stroke="currentColor" strokeWidth="4" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
                <path d="M0,10 L10,30" stroke="currentColor" strokeWidth="4" className={primaryMuscles.includes('quadriceps') ? "text-primary" : "text-foreground/80"} />
                {/* Calves */}
                <path d="M-10,30 L-12,50" stroke="currentColor" strokeWidth="3" className="text-foreground/80" />
                <path d="M10,30 L12,50" stroke="currentColor" strokeWidth="3" className="text-foreground/80" />
             </g>
             {/* Arms (holding weight?) */}
             <path d="M-8,-12 L-15,5" stroke="currentColor" strokeWidth="3" className="text-foreground/80" />
             <path d="M8,-12 L15,5" stroke="currentColor" strokeWidth="3" className="text-foreground/80" />
          </g>
        )}

        {/* Push Animation Structure */}
        {exerciseType === 'push' && (
           <g>
              {/* Bench/Back */}
              {/* <rect x="-15" y="-10" width="30" height="40" rx="2" fill="currentColor" className="text-muted/30" /> */}
              
              {/* Body */}
              <line x1="0" y1="-10" x2="0" y2="20" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="text-foreground/30" />
              <circle cx="0" cy="-18" r="7" fill="currentColor" className="text-foreground/30" />
              
              {/* Moving Arms */}
              <g className="animate-push-arms">
                  <path d="M-8,-5 L-20,10" stroke="currentColor" strokeWidth="4" className={primaryMuscles.includes('pectoralis') || primaryMuscles.includes('triceps') || primaryMuscles.includes('shoulders') ? "text-primary" : "text-foreground/80"} />
                  <path d="M8,-5 L20,10" stroke="currentColor" strokeWidth="4" className={primaryMuscles.includes('pectoralis') || primaryMuscles.includes('triceps') || primaryMuscles.includes('shoulders') ? "text-primary" : "text-foreground/80"} />
                  {/* Barbell/Weight */}
                  <line x1="-25" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="2" className="animate-push-bar text-foreground" />
              </g>

           </g>
        )}

        {/* Pull Animation Structure */}
        {exerciseType === 'pull' && (
            <g>
                {/* Torso */}
                <line x1="0" y1="-5" x2="0" y2="25" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-foreground/50" />
                <circle cx="0" cy="-12" r="7" fill="currentColor" className="text-foreground/50" />

                {/* Arms */}
                <g className="animate-pull-arms">
                   <path d="M-6,-8 L-25,-25" stroke="currentColor" strokeWidth="4" className={primaryMuscles.includes('lats') || primaryMuscles.includes('biceps') ? "text-primary" : "text-foreground/80"} />
                   <path d="M6,-8 L25,-25" stroke="currentColor" strokeWidth="4" className={primaryMuscles.includes('lats') || primaryMuscles.includes('biceps') ? "text-primary" : "text-foreground/80"} />
                   {/* Bar */}
                   <line x1="-30" y1="-25" x2="30" y2="-25" stroke="currentColor" strokeWidth="3" className="animate-pull-bar text-foreground" />
                </g>
            </g>
        )}

        {/* Fallback Static */}
        {exerciseType === 'static' && (
           <g>
               <circle cx="0" cy="-24" r="6" fill="currentColor" className="text-foreground/70" />
               <line x1="0" y1="-18" x2="0" y2="8" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />
               <line x1="-16" y1="-10" x2="0" y2="-14" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />
               <line x1="16" y1="-10" x2="0" y2="-14" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />
               <line x1="-8" y1="24" x2="0" y2="8" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />
               <line x1="8" y1="24" x2="0" y2="8" stroke="currentColor" strokeWidth="3" className="text-foreground/70" />
           </g>
        )}

        {/* Dynamic Static Lifts (Deadlifts etc) uses static stickman but maybe highlighted? */}
        {exerciseType === 'lift' && (
           <g>
            {/* Hinge position */}
            <circle cx="10" cy="-20" r="6" fill="currentColor" className="text-foreground/70" />
            <line x1="10" y1="-14" x2="-8" y2="0" stroke="currentColor" strokeWidth="3" className="text-foreground/70" /> {/* Torso leaning */}
            <line x1="-8" y1="0" x2="-10" y2="25" stroke="currentColor" strokeWidth="3" className="text-foreground/70" /> {/* Legs */}
            <line x1="8" y1="-10" x2="0" y2="20" stroke="currentColor" strokeWidth="3" className={primaryMuscles.includes('hamstrings') ? "text-primary" : "text-foreground/70"} /> {/* Arms reaching down */}
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

// Helper to determine exercise animation type
function getExerciseType(exerciseName: string): 'push' | 'pull' | 'squat' | 'lift' | 'static' {
  const name = exerciseName.toLowerCase();
  
  // Explicit overrides for better matching
  
  if (name.includes('press') || name.includes('push') || name.includes('fly') || name.includes('dip')) {
    return 'push';
  }
  if (name.includes('row') || name.includes('pull') || name.includes('curl') || name.includes('pulldown')) {
    return 'pull';
  }
  if (name.includes('squat') || name.includes('lunge') || name.includes('leg press')) {
    return 'squat';
  }
  if (name.includes('deadlift') || name.includes('shrug') || name.includes('raise') || name.includes('extension')) {
    return 'lift';
  }
  
  return 'static';
}
