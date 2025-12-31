import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { hasCompletedOnboarding, getUserProfile } from "@/lib/storage";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
