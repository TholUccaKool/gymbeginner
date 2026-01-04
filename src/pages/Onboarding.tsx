import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { saveUserProfile, generateId } from "@/lib/storage";
import { UserProfile } from "@/lib/types";
import { Dumbbell, Sparkles, ArrowRight, Check } from "lucide-react";

const WEEKDAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'experience' | 'trainingDays' | 'selectDays'>('welcome');
  const [experienceLevel, setExperienceLevel] = useState<'experienced' | 'new' | null>(null);
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const handleExperienceSelect = (level: 'experienced' | 'new') => {
    setExperienceLevel(level);
    
    if (level === 'new') {
      // New users go to coach onboarding
      const profile: UserProfile = {
        id: generateId(),
        experienceLevel: level,
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        nutritionTargets: {
          calories: 2000,
          protein: 150,
        },
      };
      saveUserProfile(profile);
      navigate('/onboarding/coach');
    } else {
      // Experienced users pick training days here
      setStep('trainingDays');
    }
  };

  const handleTrainingDaysSelect = (days: number) => {
    setTrainingDays(days);
    setSelectedDays([]);
  };

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else if (selectedDays.length < (trainingDays || 0)) {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleComplete = () => {
    if (!trainingDays || selectedDays.length !== trainingDays) return;

    const profile: UserProfile = {
      id: generateId(),
      experienceLevel: 'experienced',
      createdAt: new Date().toISOString(),
      onboardingComplete: true,
      trainingDays,
      workoutDays: selectedDays,
      nutritionTargets: {
        calories: 2000,
        protein: 150,
      },
    };

    saveUserProfile(profile);
    navigate('/today');
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

  if (step === 'experience') {
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

  if (step === 'trainingDays') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="animate-slide-up max-w-sm w-full">
          <h1 className="text-2xl font-display font-bold mb-2 text-center">
            How many days per week can you realistically go to the gym?
          </h1>
          <p className="text-muted-foreground mb-8 text-center">
            Be honest with yourself
          </p>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map(days => (
              <button
                key={days}
                onClick={() => handleTrainingDaysSelect(days)}
                className={`p-4 rounded-xl border transition-all ${
                  trainingDays === days 
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
            disabled={!trainingDays}
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'selectDays') {
    const maxDays = trainingDays || 0;
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="animate-slide-up max-w-sm w-full">
          <h1 className="text-2xl font-display font-bold mb-2 text-center">
            Which days do you want to train?
          </h1>
          <p className="text-muted-foreground mb-8 text-center">
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
            Get Started <Check className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}