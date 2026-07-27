import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className={`bg-gradient-to-br ${s.accent} px-6 pt-8 pb-6 text-center`}>
              <motion.div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${s.iconBg} text-white text-4xl shadow-lg mb-4`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              >
                {s.icon}
              </motion.div>
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
                  <motion.div
                    key={i}
                    className={`h-1.5 rounded-full ${
                      i === step
                        ? "w-8 bg-brand"
                        : i < step
                          ? "w-1.5 bg-brand/50"
                          : "w-1.5 bg-gray-200 dark:bg-gray-700"
                    }`}
                    animate={i === step ? { width: 32 } : { width: 6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => finish(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  whileHover={{ x: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Skip tour
                </motion.button>
                <div className="flex-1" />
                {step > 0 && (
                  <motion.button
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                )}
                <motion.button
                  onClick={next}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm hover:shadow"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isLast ? "Get started" : "Next"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
