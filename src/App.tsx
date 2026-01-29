import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { hasCompletedOnboarding, getUserProfile } from "@/lib/storage";
import { checkAndScheduleNotifications } from "@/lib/notifications";
import { initializeNativeNotifications, isNativePlatform } from "@/lib/nativeNotifications";
import { CoachChat } from "@/components/CoachChat";
import Onboarding from "./pages/Onboarding";
import CoachOnboarding from "./pages/CoachOnboarding";
import TodayPage from "./pages/TodayPage";
import WorkoutPage from "./pages/WorkoutPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const profile = getUserProfile();
  if (!profile) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const completed = hasCompletedOnboarding();
  return completed ? <Navigate to="/today" replace /> : <Onboarding />;
}

function AppContent() {
  // Track whether to show coach chat - updates on navigation/profile changes
  const [showCoachChat, setShowCoachChat] = useState(() => {
    const profile = getUserProfile();
    return hasCompletedOnboarding() || !!profile;
  });

  // Re-check visibility when route changes or on interval to catch profile updates
  useEffect(() => {
    const checkVisibility = () => {
      const profile = getUserProfile();
      const shouldShow = hasCompletedOnboarding() || !!profile;
      setShowCoachChat(shouldShow);
    };

    // Check periodically to catch localStorage updates (from onboarding completion)
    const interval = setInterval(checkVisibility, 500);
    
    // Also listen for storage events (for cross-tab sync)
    window.addEventListener('storage', checkVisibility);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkVisibility);
    };
  }, []);

  // Initialize notifications on app load
  useEffect(() => {
    // Initialize native notifications if on Capacitor
    if (isNativePlatform()) {
      initializeNativeNotifications();
    } else {
      // PWA fallback: check notifications on app open/return
      checkAndScheduleNotifications();

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkAndScheduleNotifications();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding/coach" element={<CoachOnboarding />} />
        <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
        <Route path="/workout" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global Coach Chat - only show after onboarding */}
      {showCoachChat && <CoachChat />}
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
