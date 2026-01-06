import { useState, useEffect } from 'react';
import { Scale, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getPendingAdjustment, 
  acceptAdjustment, 
  dismissAdjustment,
  DailyAdjustmentState 
} from '@/lib/calorieAdjustment';
import { hasCoachAccess } from '@/lib/storage';
import { toast } from 'sonner';

interface CalorieAdjustmentCardProps {
  onAdjustmentAccepted?: (newTarget: number) => void;
  onShowPaywall?: () => void;
}

export function CalorieAdjustmentCard({ onAdjustmentAccepted, onShowPaywall }: CalorieAdjustmentCardProps) {
  const [adjustment, setAdjustment] = useState<DailyAdjustmentState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show for users with coach access
    if (!hasCoachAccess()) return;
    
    const pending = getPendingAdjustment();
    setAdjustment(pending);
  }, []);

  const handleAccept = () => {
    if (!adjustment) return;
    
    acceptAdjustment(adjustment);
    onAdjustmentAccepted?.(adjustment.adjustedTarget);
    toast.success("Today's target adjusted", {
      description: `New target: ${adjustment.adjustedTarget} calories`
    });
    setDismissed(true);
  };

  const handleDismiss = () => {
    if (!adjustment) return;
    
    dismissAdjustment(adjustment);
    setDismissed(true);
  };

  // Don't show if no adjustment or dismissed
  if (!adjustment || dismissed) return null;

  const reduction = adjustment.originalTarget - adjustment.adjustedTarget;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 animate-slide-up shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Scale className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1">Keeping the week balanced</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Yesterday was a bit higher than planned — totally fine. 
            Want to aim for {adjustment.adjustedTarget} calories today to balance the week?
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="bg-secondary px-2 py-1 rounded-lg">
              {adjustment.originalTarget} → {adjustment.adjustedTarget} cal
            </span>
            <span>(-{reduction} today)</span>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleAccept}
              className="flex-1 h-9"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Sounds good
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="h-9 px-3 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
