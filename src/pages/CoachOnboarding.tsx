import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserProfile, saveUserProfile } from "@/lib/storage";
import { CoachProfile } from "@/lib/types";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type Step = 'goal' | 'physique' | 'body' | 'training' | 'selectDays' | 'generating';

const WEEKDAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

const GOALS = [
  { id: 'healthier', label: 'Get Healthier', desc: 'General wellness improvement' },
  { id: 'leaner', label: 'Get Leaner', desc: 'Reduce body fat while maintaining muscle' },
  { id: 'muscle-gain', label: 'Build Muscle', desc: 'Focus on strength and size' },
  { id: 'weight-loss', label: 'Lose Weight', desc: 'Sustainable fat loss' },
] as const;

const PHYSIQUES = [
  { id: 'athletic', label: 'Athletic', desc: 'Balanced strength and definition' },
  { id: 'lean', label: 'Lean', desc: 'Low body fat, toned appearance' },
  { id: 'superhero', label: 'Superhero', desc: 'Impressive muscle mass' },
  { id: 'toned', label: 'Toned', desc: 'Fit and defined without bulk' },
] as const;

export default function CoachOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('goal');
  const [coachProfile, setCoachProfile] = useState<Partial<CoachProfile>>({});

  const updateProfile = (updates: Partial<CoachProfile>) => {
    setCoachProfile(prev => ({ ...prev, ...updates }));
  };

  const calculateTargets = (profile: CoachProfile) => {
    // Basic TDEE calculation
    const bmr = profile.weight * 22; // Simplified
    let multiplier = 1.5 + (profile.trainingDays * 0.05);
    let tdee = bmr * multiplier;

    // Adjust for goal
    switch (profile.goal) {
      case 'weight-loss':
        tdee *= 0.8; // 20% deficit
        break;
      case 'muscle-gain':
        tdee *= 1.1; // 10% surplus
        break;
      case 'leaner':
        tdee *= 0.85; // 15% deficit
        break;
    }

    // Protein: 1.6-2.2g per kg
    const protein = Math.round(profile.weight * 2);

    return {
      calories: Math.round(tdee),
      protein,
    };
  };

  const handleComplete = () => {
    setStep('generating');
    
    // Simulate AI generation delay
    setTimeout(() => {
      const profile = getUserProfile();
      if (profile && coachProfile.goal && coachProfile.age && coachProfile.height && coachProfile.weight && coachProfile.trainingDays) {
        const completeCoachProfile = coachProfile as CoachProfile;
        const targets = calculateTargets(completeCoachProfile);
        
        saveUserProfile({
          ...profile,
          onboardingComplete: true,
          coachProfile: completeCoachProfile,
          nutritionTargets: targets,
        });
      }
      navigate('/today');
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 'goal':
        return (
          <div className="animate-slide-up">
            <h2 className="text-xl font-display font-bold mb-2">What's your main goal?</h2>
            <p className="text-muted-foreground text-sm mb-6">We'll create a plan tailored to you</p>
            
            <div className="space-y-3">
              {GOALS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => {
                    updateProfile({ goal: goal.id });
                    setStep('physique');
                  }}
                  className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow transition-all text-left"
                >
                  <h3 className="font-medium">{goal.label}</h3>
                  <p className="text-sm text-muted-foreground">{goal.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'physique':
        return (
          <div className="animate-slide-up">
            <h2 className="text-xl font-display font-bold mb-2">Desired physique?</h2>
            <p className="text-muted-foreground text-sm mb-6">What body type inspires you?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {PHYSIQUES.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    updateProfile({ physiqueStyle: p.id });
                    setStep('body');
                  }}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow transition-all text-left"
                >
                  <h3 className="font-medium text-sm">{p.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'body':
        return (
          <div className="animate-slide-up">
            <h2 className="text-xl font-display font-bold mb-2">About you</h2>
            <p className="text-muted-foreground text-sm mb-6">This helps us calculate your targets</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  className="mt-1.5"
                  value={coachProfile.age ?? ''}
                  onChange={e => updateProfile({ age: parseInt(e.target.value) || undefined })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    className="mt-1.5"
                    value={coachProfile.height ?? ''}
                    onChange={e => updateProfile({ height: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    className="mt-1.5"
                    value={coachProfile.weight ?? ''}
                    onChange={e => updateProfile({ weight: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-4"
                onClick={() => setStep('training')}
                disabled={!coachProfile.age || !coachProfile.height || !coachProfile.weight}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className="animate-slide-up">
            <h2 className="text-xl font-display font-bold mb-2">Training schedule</h2>
            <p className="text-muted-foreground text-sm mb-6">How many days can you realistically train?</p>
            
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map(days => (
                <button
                  key={days}
                  onClick={() => {
                    updateProfile({ trainingDays: days, workoutDays: [] });
                  }}
                  className={`p-4 rounded-xl border transition-all ${
                    coachProfile.trainingDays === days 
                      ? 'border-primary bg-primary-muted' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg font-bold">{days}</span>
                  <span className="text-xs text-muted-foreground block">day{days > 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>

            <Button 
              className="w-full"
              onClick={() => setStep('selectDays')}
              disabled={!coachProfile.trainingDays}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'selectDays':
        const selectedDays = coachProfile.workoutDays || [];
        const maxDays = coachProfile.trainingDays || 0;
        
        const toggleDay = (dayId: number) => {
          if (selectedDays.includes(dayId)) {
            updateProfile({ workoutDays: selectedDays.filter(d => d !== dayId) });
          } else if (selectedDays.length < maxDays) {
            updateProfile({ workoutDays: [...selectedDays, dayId] });
          }
        };
        
        return (
          <div className="animate-slide-up">
            <h2 className="text-xl font-display font-bold mb-2">Which days do you want to train?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Select exactly {maxDays} day{maxDays > 1 ? 's' : ''} ({selectedDays.length}/{maxDays} selected)
            </p>
            
            <div className="grid grid-cols-7 gap-1.5 mb-6">
              {WEEKDAYS.map(day => {
                const isSelected = selectedDays.includes(day.id);
                const isDisabled = !isSelected && selectedDays.length >= maxDays;
                
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    disabled={isDisabled}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-primary bg-primary-muted'
                        : isDisabled
                          ? 'border-border bg-card opacity-40 cursor-not-allowed'
                          : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                      {day.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button 
              className="w-full"
              onClick={handleComplete}
              disabled={selectedDays.length !== maxDays}
            >
              Create My Plan <Check className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'generating':
        return (
          <div className="animate-fade-in text-center py-12">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-display font-bold mb-2">Creating your plan...</h2>
            <p className="text-muted-foreground text-sm">
              Calculating nutrition targets and workout splits
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-sm mx-auto pt-8">
        {step !== 'generating' && step !== 'goal' && (
          <button
            onClick={() => {
              const steps: Step[] = ['goal', 'physique', 'body', 'training', 'selectDays'];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) setStep(steps[currentIndex - 1]);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
}
