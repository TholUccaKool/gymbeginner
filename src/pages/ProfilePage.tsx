import { useState } from "react";
import { Settings, Sparkles, Target, User, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { getUserProfile, saveUserProfile } from "@/lib/storage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const profile = getUserProfile();
  const [targets, setTargets] = useState(profile?.nutritionTargets ?? { calories: 2000, protein: 150 });
  const [isEditingTargets, setIsEditingTargets] = useState(false);

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader title="Profile" />

        {/* User Info */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-muted flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">
                {profile?.experienceLevel === 'new' ? 'Coached User' : 'Experienced Lifter'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Member since {profile ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Coach Profile (if exists) */}
        {profile?.coachProfile && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">AI Coach Profile</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Goal</p>
                <p className="font-medium capitalize">{profile.coachProfile.goal?.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Physique</p>
                <p className="font-medium capitalize">{profile.coachProfile.physiqueStyle}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Training Days</p>
                <p className="font-medium">{profile.coachProfile.trainingDays} days/week</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">{profile.coachProfile.weight} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Nutrition Targets */}
        <Dialog open={isEditingTargets} onOpenChange={setIsEditingTargets}>
          <DialogTrigger asChild>
            <button className="w-full bg-card rounded-2xl border border-border p-6 mb-4 text-left hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
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
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="cal-target">Calorie Target</Label>
                <Input
                  id="cal-target"
                  type="number"
                  value={targets.calories}
                  onChange={e => setTargets(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="protein-target">Protein Target (g)</Label>
                <Input
                  id="protein-target"
                  type="number"
                  value={targets.protein}
                  onChange={e => setTargets(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
                  className="mt-1.5"
                />
              </div>
              
              <Button className="w-full" onClick={handleSaveTargets}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Coach Access (for experienced users) */}
        {profile?.experienceLevel === 'experienced' && (
          <button 
            onClick={() => window.location.href = '/onboarding/coach'}
            className="w-full bg-card rounded-2xl border border-border p-6 mb-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="font-semibold">Try AI Coach</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized plans and guidance
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        )}

        {/* Settings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Settings</h3>
            </div>
          </div>
          
          <button
            onClick={handleResetApp}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-destructive"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <span>Reset All Data</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>FitTrack v1.0</p>
          <p className="mt-1">Built with ❤️ for your fitness journey</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
