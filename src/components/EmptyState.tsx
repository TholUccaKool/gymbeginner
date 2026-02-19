import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional secondary hint text below the description */
  hint?: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state with consistent spacing, icon, and optional CTA.
 * Used across History, Meals, PRs, AI Feedback, etc.
 */
export function EmptyState({ icon: Icon, title, description, hint, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center py-10 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <p className="font-display font-semibold text-sm text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] leading-relaxed">
        {description}
      </p>
      {hint && (
        <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[220px]">
          {hint}
        </p>
      )}
      {action && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
