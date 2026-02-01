import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExitWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
  hasProgress: boolean;
}

export function ExitWorkoutDialog({ 
  open, 
  onOpenChange, 
  onConfirmExit,
  hasProgress 
}: ExitWorkoutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            {hasProgress ? "Exit workout?" : "Leave workout?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {hasProgress 
              ? "Your progress will be saved. You can continue this workout later."
              : "Are you sure you want to leave?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="w-full mt-0">
            Continue Workout
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmExit}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            {hasProgress ? "Save & Exit" : "Exit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
