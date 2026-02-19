import { ReactNode } from "react";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isFeatureUnlocked, getFeature, type FeatureId } from "@/lib/features";
import { cn } from "@/lib/utils";

interface ProFeatureGateProps {
  featureId: FeatureId;
  children: ReactNode;
  /** Content to show as blurred preview for locked features */
  lockedPreview?: ReactNode;
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Wraps content behind a Pro feature gate.
 * If unlocked: renders children normally.
 * If locked + showLockedPreview: shows blurred preview with upgrade CTA.
 * If locked + no preview: shows compact upgrade prompt.
 */
export function ProFeatureGate({ 
  featureId, 
  children, 
  lockedPreview,
  onUpgrade, 
  className 
}: ProFeatureGateProps) {
  const unlocked = isFeatureUnlocked(featureId);
  const feature = getFeature(featureId);

  if (unlocked) {
    return <>{children}</>;
  }

  // Locked with preview
  if (feature.showLockedPreview && lockedPreview) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", className)}>
        {/* Blurred preview */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          <div className="blur-[6px] opacity-60">
            {lockedPreview}
          </div>
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-2xl">
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm">{feature.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                {feature.description}
              </p>
            </div>
            {onUpgrade && (
              <Button 
                size="sm" 
                className="mt-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                onClick={onUpgrade}
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Unlock Pro
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact locked state (no preview)
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-dashed border-amber-400/40 p-4 flex items-center gap-3",
      className
    )}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
        <Crown className="w-4.5 h-4.5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{feature.name}</h4>
        <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
      </div>
      {onUpgrade && (
        <Button 
          size="sm" 
          variant="ghost"
          className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex-shrink-0"
          onClick={onUpgrade}
        >
          Upgrade
        </Button>
      )}
    </div>
  );
}
