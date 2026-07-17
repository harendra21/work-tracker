import { useState, useEffect } from "react";

const STORAGE_KEY = "wt-onboarded";

const STEPS = [
  {
    icon: "🧩",
    title: "Install the extension",
    description:
      "Search for 'Work Tracker' in the VS Code marketplace and install it. Restart VS Code when prompted.",
    accent: "from-brand/15 to-teal-500/10",
    iconBg: "from-brand to-teal-500",
  },
  {
    icon: "🔑",
    title: "Generate an API key",
    description:
      "Open Settings in the sidebar and click 'Generate Key'. Give it a name so you remember which device it's for.",
    accent: "from-amber-500/15 to-orange-500/10",
    iconBg: "from-amber-500 to-orange-500",
  },
  {
    icon: "🚀",
    title: "Start tracking",
    description:
      "Paste the key in VS Code via the command 'Work Tracker: Setup API Key'. Your coding time will appear here in seconds.",
    accent: "from-emerald-500/15 to-teal-500/10",
    iconBg: "from-emerald-500 to-teal-500",
  },
] as const;

export default function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Small delay so the dashboard paints first
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const finish = (markDone: boolean) => {
    if (markDone) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish(true);
    }
  };

  if (!open) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className={`bg-gradient-to-br ${s.accent} px-6 pt-8 pb-6 text-center`}>
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${s.iconBg} text-white text-4xl shadow-lg mb-4`}
          >
            {s.icon}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 className="text-xl font-bold">{s.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            {s.description}
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-brand"
                    : i < step
                      ? "w-1.5 bg-brand/50"
                      : "w-1.5 bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => finish(true)}
              className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex-1" />
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm hover:shadow transition-all"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
