import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, className, action }: PageHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between py-6", className)}>
      <div className="animate-slide-up">
        <h1 className="text-2xl font-display font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="animate-fade-in">{action}</div>}
    </header>
  );
}