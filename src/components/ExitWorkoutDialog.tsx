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
            {hasProgress ? "Pause workout?" : "Leave workout?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {hasProgress
              ? "We'll save your progress so you can finish later. Take a break if you need to!"
              : "Are you sure you want to leave? No progress will be saved."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="w-full mt-0 rounded-xl h-12">
            Resume Workout
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmExit}
            className="w-full rounded-xl h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {hasProgress ? "Save & Exit" : "Exit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
