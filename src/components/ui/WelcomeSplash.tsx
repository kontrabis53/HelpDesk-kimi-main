import { useEffect, useState } from 'react';

interface WelcomeSplashProps {
  userName: string;
  greetingText?: string;
  onComplete: () => void;
}

export function WelcomeSplash({ userName, greetingText, onComplete }: WelcomeSplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-500">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl px-8 py-6 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="text-4xl animate-bounce">
          👋
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {greetingText || "Шо ты маленький, привет"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {userName}
          </p>
        </div>
      </div>
    </div>
  );
}
