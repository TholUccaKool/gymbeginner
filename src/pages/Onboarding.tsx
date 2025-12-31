import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { saveUserProfile, generateId } from "@/lib/storage";
import { UserProfile } from "@/lib/types";
import { Dumbbell, Sparkles } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'experience'>('welcome');

  const handleExperienceSelect = (level: 'experienced' | 'new') => {
    const profile: UserProfile = {
      id: generateId(),
      experienceLevel: level,
      createdAt: new Date().toISOString(),
      onboardingComplete: level === 'experienced',
      nutritionTargets: {
        calories: 2000,
        protein: 150,
      },
    };

    saveUserProfile(profile);

    if (level === 'experienced') {
      navigate('/today');
    } else {
      navigate('/onboarding/coach');
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="animate-fade-in text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Dumbbell className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-3xl font-display font-bold mb-3">FitTrack</h1>
          <p className="text-muted-foreground mb-12">
            Your calm, focused fitness companion
          </p>

          <Button 
            size="lg" 
            className="w-full h-14 text-base font-medium"
            onClick={() => setStep('experience')}
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="animate-slide-up text-center max-w-sm w-full">
        <h1 className="text-2xl font-display font-bold mb-2">
          Are you experienced in the gym?
        </h1>
        <p className="text-muted-foreground mb-10">
          This helps us personalize your experience
        </p>

        <div className="space-y-4">
          <button
            onClick={() => handleExperienceSelect('experienced')}
            className="w-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow transition-all duration-200 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary-muted transition-colors">
                <Dumbbell className="w-6 h-6 text-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Experienced</h3>
                <p className="text-sm text-muted-foreground">
                  I know my way around. Just give me a clean tracker.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExperienceSelect('new')}
            className="w-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow transition-all duration-200 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary-muted transition-colors">
                <Sparkles className="w-6 h-6 text-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">New to Fitness</h3>
                <p className="text-sm text-muted-foreground">
                  Guide me with AI-powered plans and coaching.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
