import { useState } from "react";
import { Crown, Check, X, Sparkles, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUserProfile, saveUserProfile } from "@/lib/storage";
import { toast } from "sonner";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const PREMIUM_FEATURES = [
  { icon: Brain, label: "AI Coach with personalized guidance" },
  { icon: TrendingUp, label: "Smart weekly calorie & protein adjustments" },
  { icon: Sparkles, label: "Auto workout progression" },
  { icon: Crown, label: "Advanced insights & recommendations" },
];

export function PremiumPaywall({ open, onOpenChange, feature }: PremiumPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMockPurchase = () => {
    setIsProcessing(true);
    
    // Simulate purchase processing
    setTimeout(() => {
      const profile = getUserProfile();
      if (profile) {
        saveUserProfile({
          ...profile,
          isPremium: true,
        });
      }
      
      setIsProcessing(false);
      onOpenChange(false);
      toast.success("Welcome to Premium! All features are now unlocked.");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Crown className="w-7 h-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Upgrade to Premium</DialogTitle>
        </DialogHeader>

        {feature && (
          <p className="text-center text-sm text-muted-foreground -mt-1">
            <span className="font-medium text-foreground">{feature}</span> is a Premium feature
          </p>
        )}

        {/* Features List */}
        <div className="space-y-3 py-4">
          {PREMIUM_FEATURES.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-lg font-bold">$2.99</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </button>
          
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-xl border-2 transition-all text-left relative ${
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="absolute -top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
              SAVE 44%
            </div>
            <p className="text-xs text-muted-foreground">Yearly</p>
            <p className="text-lg font-bold">$19.99</p>
            <p className="text-xs text-muted-foreground">/year</p>
          </button>
        </div>

        {/* Purchase Button */}
        <Button 
          size="lg" 
          className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
          onClick={handleMockPurchase}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              <Crown className="w-4 h-4 mr-2" />
              {selectedPlan === 'monthly' ? 'Start Monthly' : 'Start Yearly'}
            </>
          )}
        </Button>

        {/* Dismiss */}
        <button
          onClick={() => onOpenChange(false)}
          className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Continue with Free version
        </button>

        <p className="text-center text-xs text-muted-foreground">
          This is a demo. No real payment will be processed.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check premium and show paywall
export function usePremiumGate() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string>();

  const checkPremium = (featureName?: string): boolean => {
    const profile = getUserProfile();
    if (profile?.isPremium) {
      return true;
    }
    setPaywallFeature(featureName);
    setShowPaywall(true);
    return false;
  };

  const isPremium = (): boolean => {
    const profile = getUserProfile();
    return profile?.isPremium ?? false;
  };

  return {
    showPaywall,
    setShowPaywall,
    paywallFeature,
    checkPremium,
    isPremium,
  };
}