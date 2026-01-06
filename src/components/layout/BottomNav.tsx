import { Home, Dumbbell, History, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/today", icon: Home, label: "Today" },
  { to: "/workout", icon: Dumbbell, label: "Workout" },
  { to: "/history", icon: History, label: "History" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[4rem] min-h-[3.5rem]",
                isActive
                  ? "text-primary bg-primary-muted"
                  : "text-muted-foreground hover:text-foreground active:bg-secondary/60"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-all", 
                  isActive && "stroke-[2.5]"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}