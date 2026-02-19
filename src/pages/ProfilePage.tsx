import { useState } from "react";
import { Settings, Sparkles, Target, User, ChevronRight, Trash2, Moon, Sun, Crown, Bell, Trophy, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { getUserProfile, saveUserProfile } from "@/lib/storage";
import { getPersonalBestsList, type PersonalBest } from "@/lib/personalBests";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { PremiumPaywall, usePremiumGate } from "@/components/PremiumPaywall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotificationSettings } from "@/components/NotificationSettings";

export default function ProfilePage() {
  const profile = getUserProfile();
  const [targets, setTargets] = useState(profile?.nutritionTargets ?? { calories: 2000, protein: 150 });
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const { theme, setTheme } = useTheme();
  const { showPaywall, setShowPaywall, paywallFeature, checkPremium, isPremium } = usePremiumGate();
  const [, forceUpdate] = useState({});

  const handleSaveTargets = () => {
    if (!profile) return;
    
    saveUserProfile({
      ...profile,
      nutritionTargets: targets,
    });
    
    setIsEditingTargets(false);
    toast.success('Targets updated');
  };

  const handleResetApp = () => {
    if (confirm('This will clear all your data. Are you sure?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleAICoachClick = () => {
    // AI Coach onboarding is free - generation is free, applying is premium
    window.location.href = '/onboarding/coach';
  };

  const togglePremiumDemo = () => {
    const currentProfile = getUserProfile();
    if (currentProfile) {
      saveUserProfile({
        ...currentProfile,
        isPremium: !currentProfile.isPremium,
      });
      forceUpdate({});
      toast.success(currentProfile.isPremium ? "Premium disabled (demo)" : "Premium enabled (demo)");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 gradient-mesh">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader title="Profile" subtitle="Manage your settings" />

        {/* User Info */}
        <div className="bg-card rounded-2xl border border-border/60 p-6 mb-5 shadow-sm animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 relative">
              <User className="w-8 h-8 text-primary-foreground" />
              {isPremium() && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg">
                  {profile?.experienceLevel === 'new' ? 'Coached User' : 'Experienced Lifter'}
                </h2>
                {isPremium() && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Member since {profile ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Coach Profile (if exists) */}
        {profile?.coachProfile && (
          <div className="bg-card rounded-2xl border border-border/60 p-6 mb-5 shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <h3 className="font-semibold">AI Coach Profile</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Goal</p>
                <p className="font-medium capitalize">{profile.coachProfile.goal?.replace('-', ' ')}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Physique</p>
                <p className="font-medium capitalize">{profile.coachProfile.physiqueStyle}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Training Days</p>
                <p className="font-medium">{profile.coachProfile.trainingDays} days/week</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                <p className="font-medium">{profile.coachProfile.weight} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Records */}
        {(() => {
          const prs = getPersonalBestsList();
          return (
            <div className="bg-card rounded-2xl border border-border/60 p-6 mb-5 shadow-sm animate-slide-up" style={{ animationDelay: '75ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-semibold">Personal Records</h3>
              </div>

              {prs.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Dumbbell className="w-5 h-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm text-muted-foreground">No personal records yet</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">Complete workouts to start tracking PRs.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {prs.slice(0, 5).map(pr => (
                    <div
                      key={pr.exerciseName}
                      className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{pr.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {pr.maxWeightReps}×{pr.maxWeight}kg · Vol {pr.maxVolume}kg
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-lg font-display font-bold">{pr.maxWeight}<span className="text-xs text-muted-foreground font-normal">kg</span></p>
                      </div>
                    </div>
                  ))}
                  {prs.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{prs.length - 5} more exercises
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Nutrition Targets */}
        <Dialog open={isEditingTargets} onOpenChange={setIsEditingTargets}>
          <DialogTrigger asChild>
            <button className="w-full bg-card rounded-2xl border border-border/60 p-5 mb-4 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Daily Targets</h3>
                    <p className="text-sm text-muted-foreground">
                      {targets.calories} cal · {targets.protein}g protein
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Daily Targets</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-5 py-2">
              <div>
                <Label htmlFor="cal-target" className="text-sm font-medium">Calorie Target</Label>
                <Input
                  id="cal-target"
                  type="number"
                  value={targets.calories}
                  onChange={e => setTargets(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="protein-target" className="text-sm font-medium">Protein Target (g)</Label>
                <Input
                  id="protein-target"
                  type="number"
                  value={targets.protein}
                  onChange={e => setTargets(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              
              <Button size="lg" className="w-full" onClick={handleSaveTargets}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Coach Access */}
        <button 
          onClick={handleAICoachClick}
          className="w-full bg-card rounded-2xl border border-border/60 p-5 mb-4 text-left shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 animate-slide-up relative overflow-hidden" style={{ animationDelay: '150ms' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">AI Coach</h3>
                <p className="text-sm text-muted-foreground">
                  {isPremium() 
                    ? 'Adjust your plan anytime' 
                    : 'Generate a personalized plan for free'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>

        {/* Notifications */}
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden mb-4 shadow-sm animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Reminders</h3>
            </div>
          </div>
          <div className="p-4">
            <NotificationSettings />
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden mb-6 shadow-sm animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Settings</h3>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-all duration-200 border-b border-border/60"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
              <span>Appearance</span>
            </div>
            <span className="text-sm text-muted-foreground capitalize">{theme || 'System'}</span>
          </button>
          
          <button
            onClick={handleResetApp}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-all duration-200 text-destructive"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <span>Reset All Data</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Premium Status */}
        <div className="bg-card rounded-2xl border border-dashed border-amber-400/50 p-4 mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">
                  {isPremium() ? 'Premium Active' : 'Free Plan'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPremium() 
                    ? 'Ongoing coaching enabled' 
                    : 'You can track meals & workouts'}
                </p>
              </div>
            </div>
            <Switch 
              checked={isPremium()}
              onCheckedChange={togglePremiumDemo}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Demo toggle for testing
          </p>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '350ms' }}>
          <p className="font-medium">FitTrack v1.0</p>
          <p className="mt-1 text-xs">Built with care for your fitness journey</p>
        </div>
      </div>

      <PremiumPaywall 
        open={showPaywall} 
        onOpenChange={setShowPaywall} 
        feature={paywallFeature}
      />

      <BottomNav />
    </div>
  );
}