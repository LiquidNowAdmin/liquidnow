import { Check } from "lucide-react";

interface QuickCheckProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export default function QuickCheckProgress({ currentStep, totalSteps = 5 }: QuickCheckProgressProps) {
  return (
    <div className="quickcheck-progress">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isDone = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="contents">
            <div
              className={`quickcheck-progress-step ${
                isDone ? "quickcheck-progress-step-done" : ""
              } ${isActive ? "quickcheck-progress-step-active" : ""}`}
            >
              {isDone ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < totalSteps && (
              <div
                className={`quickcheck-progress-line ${
                  isDone ? "quickcheck-progress-line-done" : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
