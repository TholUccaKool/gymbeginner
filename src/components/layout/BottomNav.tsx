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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-18 max-w-lg mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-5 py-2.5 rounded-2xl transition-all duration-300 min-w-[4.5rem]",
                isActive
                  ? "text-primary bg-primary-muted scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform duration-300", 
                  isActive && "stroke-[2.5] scale-110"
                )} 
              />
              <span className={cn(
                "text-[11px] font-medium transition-all",
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