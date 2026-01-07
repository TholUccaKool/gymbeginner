import { useState } from 'react';
import { cn } from "@/lib/utils";
import { DebugDatePanel, useLongPress } from "@/components/DebugDatePanel";
import { isDebugModeActive } from "@/lib/debugDate";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, className, action }: PageHeaderProps) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const isDebugActive = isDebugModeActive();

  // Long press to open debug panel (dev only)
  const longPressHandlers = useLongPress(() => {
    if (import.meta.env.DEV || localStorage.getItem('fittrack_debug_enabled') === 'true') {
      setShowDebugPanel(true);
    }
  }, 800);

  return (
    <>
      <header className={cn("flex items-center justify-between py-6", className)}>
        <div 
          className="animate-slide-up select-none"
          {...longPressHandlers}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold tracking-tight">{title}</h1>
            {isDebugActive && (
              <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-mono">
                DEBUG
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="animate-fade-in">{action}</div>}
      </header>

      <DebugDatePanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />
    </>
  );
}