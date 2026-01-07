// Debug Date Panel - FOR TESTING ONLY
// Hidden panel accessible via long press on the page header

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Bug, ChevronLeft, ChevronRight, RotateCcw, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getDateOffset, 
  setDateOffset, 
  getSimulatedDate,
  isDebugModeActive 
} from '@/lib/debugDate';
import { saveMeal, generateId, getUserProfile, getDailyNutritionTotals } from '@/lib/storage';

interface DebugDatePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugDatePanel({ isOpen, onClose }: DebugDatePanelProps) {
  const [offset, setOffset] = useState(getDateOffset());
  const [simulatedDate, setSimulatedDate] = useState(getSimulatedDate());
  const [overeatingLogged, setOvereatingLogged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOffset(getDateOffset());
      setSimulatedDate(getSimulatedDate());
      setOvereatingLogged(false);
    }
  }, [isOpen]);

  const handleOffsetChange = (newOffset: number) => {
    setDateOffset(newOffset);
    setOffset(newOffset);
    setSimulatedDate(addDays(new Date(), newOffset));
    setOvereatingLogged(false);
  };

  const handleReset = () => {
    handleOffsetChange(0);
  };

  const handleSimulateOvereating = () => {
    const profile = getUserProfile();
    const targetCalories = profile?.nutritionTargets?.calories ?? 2000;
    const dateStr = format(simulatedDate, 'yyyy-MM-dd');
    
    // Check current totals for the day
    const currentTotals = getDailyNutritionTotals(dateStr);
    
    // Calculate how much to add to exceed target by 300-500 kcal
    const surplusAmount = 400; // Fixed surplus for testing
    const remainingToTarget = targetCalories - currentTotals.calories;
    const mealCalories = Math.max(remainingToTarget + surplusAmount, surplusAmount);
    
    const overeatingMeal = {
      id: generateId(),
      date: dateStr,
      name: '🍕 Debug: High-Calorie Test Meal',
      calories: mealCalories,
      protein: Math.round(mealCalories * 0.1), // ~10% protein
      carbs: Math.round(mealCalories * 0.5 / 4), // ~50% carbs
      fat: Math.round(mealCalories * 0.4 / 9), // ~40% fat
      createdAt: new Date().toISOString(),
    };
    
    saveMeal(overeatingMeal);
    setOvereatingLogged(true);
  };

  if (!isOpen) return null;

  // Only show in development
  if (!import.meta.env.DEV && localStorage.getItem('fittrack_debug_enabled') !== 'true') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute bottom-20 left-4 right-4 max-w-md mx-auto bg-card border border-border rounded-2xl shadow-xl p-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4 text-amber-500">
          <Bug className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Debug: Date Simulation</h3>
        </div>

        <div className="bg-secondary/50 rounded-xl p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Simulated "Today"</p>
          <p className="font-mono font-bold text-lg">
            {format(simulatedDate, 'EEEE, MMM d, yyyy')}
          </p>
          {offset !== 0 && (
            <p className="text-xs text-amber-500 mt-1">
              +{offset} day{offset !== 1 ? 's' : ''} from real date
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => handleOffsetChange(offset - 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-2">
            {[0, 1, 2, 3].map(day => (
              <Button
                key={day}
                variant={offset === day ? 'default' : 'outline'}
                size="sm"
                className="w-10 h-10 font-mono"
                onClick={() => handleOffsetChange(day)}
              >
                +{day}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => handleOffsetChange(offset + 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="border-t border-border pt-3 mb-3">
          <p className="text-xs text-muted-foreground mb-2">Test Calorie Adjustment</p>
          <Button
            variant={overeatingLogged ? "secondary" : "outline"}
            size="sm"
            className="w-full"
            onClick={handleSimulateOvereating}
            disabled={overeatingLogged}
          >
            <Utensils className="w-4 h-4 mr-1.5" />
            {overeatingLogged ? 'Overeating Logged ✓' : 'Simulate Overeating (+400 kcal)'}
          </Button>
          {overeatingLogged && (
            <p className="text-xs text-amber-500 mt-1.5 text-center">
              Now advance +1 day to see the adjustment
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleReset}
            disabled={offset === 0}
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset to Real Date
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Refresh page after changing date to see full effect
        </p>
      </div>
    </div>
  );
}

// Hook to detect long press for opening debug panel
export function useLongPress(callback: () => void, ms = 1000) {
  const [startTime, setStartTime] = useState<number | null>(null);

  const start = () => {
    setStartTime(Date.now());
  };

  const end = () => {
    if (startTime && Date.now() - startTime >= ms) {
      callback();
    }
    setStartTime(null);
  };

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: () => setStartTime(null),
    onTouchStart: start,
    onTouchEnd: end,
  };
}
