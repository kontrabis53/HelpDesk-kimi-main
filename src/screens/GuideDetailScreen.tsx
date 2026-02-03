import { useState } from 'react';
import type { KnowledgeGuide } from '@/types';
import { guideCategoryLabels } from '@/types';
import { ArrowLeft, CheckCircle, HelpCircle, ChevronRight, ChevronLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuideDetailScreenProps {
  guide: KnowledgeGuide;
  onBack: () => void;
  onCreateTicket: () => void;
}

export function GuideDetailScreen({ 
  guide, 
  onBack,
  onCreateTicket 
}: GuideDetailScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);

  const step = guide.steps[currentStep];
  const isLastStep = currentStep === guide.steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      setCompleted(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCompleted(false);
    setFeedback(null);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{guide.title}</h1>
        </div>

        <div className="p-4 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Проблема решена?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Помогла ли эта инструкция решить вашу проблему?
            </p>

            {!feedback ? (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setFeedback('helpful')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Да, помогло
                </button>
                <button
                  onClick={() => setFeedback('not_helpful')}
                  className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Нет
                </button>
              </div>
            ) : feedback === 'helpful' ? (
              <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                Отлично! Рады, что помогло.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Жаль, что инструкция не помогла. Создайте заявку, и специалист поможет вам.
                </p>
                <Button onClick={onCreateTicket} className="w-full bg-blue-600 hover:bg-blue-700">
                  Создать заявку
                </Button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={handleRestart}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
              >
                Пройти инструкцию сначала
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{guide.title}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {guideCategoryLabels[guide.category]} • Шаг {currentStep + 1} из {guide.steps.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-slate-800 px-4 pb-3">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / guide.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {step.order}
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{step.title}</h2>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {step.description}
          </p>

          {step.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
              <img 
                src={step.imageUrl} 
                alt={step.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Tip */}
          {step.order === 1 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Следуйте шагам по порядку. Если проблема решена раньше - отлично!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 dark:border-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={cn('flex-1', isFirstStep && 'w-full')}
          >
            {isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Готово
              </>
            ) : (
              <>
                Далее
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Skip */}
        <button
          onClick={onCreateTicket}
          className="w-full text-center text-sm text-slate-400 dark:text-slate-500 mt-4 hover:text-slate-600 dark:hover:text-slate-300"
        >
          Не помогло - создать заявку
        </button>
      </div>
    </div>
  );
}
