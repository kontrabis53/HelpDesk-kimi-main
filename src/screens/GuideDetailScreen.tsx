import { ArrowLeft, Clock, Eye, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import type { KBArticle } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GuideDetailScreenProps {
  article: KBArticle;
  onBack: () => void;
  onEdit?: () => void;
  onCreateTicket?: () => void;
}

export function GuideDetailScreen({ article, onBack, onEdit, onCreateTicket }: GuideDetailScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const steps = article.steps || [];
  const hasSteps = steps.length > 0;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setIsFinished(false);
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px] md:max-w-md">
              {article.title}
            </h1>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Изменить
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        {/* Progress Bar (if has steps) */}
        {hasSteps && !isFinished && (
          <div className="flex items-center gap-2 px-2">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  idx <= currentStepIndex ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            ))}
          </div>
        )}

        {/* Article Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            {!isFinished ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none px-3 py-1">
                    {article.category}
                  </Badge>
                  <div className="flex items-center gap-4 text-xs text-slate-400 ml-auto">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>{article.views} просмотров</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(article.updatedAt), 'd MMM yyyy', { locale: ru })}</span>
                    </div>
                  </div>
                </div>

                {currentStepIndex === 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">
                      {article.title}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                )}

                {hasSteps ? (
                  <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20 shrink-0">
                        {currentStepIndex + 1}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {currentStep.title}
                      </h3>
                    </div>
                    <div className="pl-14">
                      <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">
                        {currentStep.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">
                      {article.content || article.description}
                    </p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                  
                  {hasSteps ? (
                    <Button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 gap-2"
                    >
                      {currentStepIndex === steps.length - 1 ? 'Завершить' : 'Далее'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setIsFinished(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    >
                      Готово
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* Success/Finish State */
              <div className="text-center py-12 space-y-8">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Инструкция пройдена!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
                    Помогла ли вам эта информация решить проблему?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                  <Button
                    onClick={onBack}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-12 text-lg rounded-xl shadow-lg shadow-emerald-600/20 gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Да, решено
                  </Button>
                  
                  {onCreateTicket && (
                    <Button
                      variant="outline"
                      onClick={onCreateTicket}
                      className="w-full sm:w-auto h-12 px-10 text-lg rounded-xl border-slate-200 dark:border-slate-700 gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Нет, создать заявку
                    </Button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setIsFinished(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  Начать сначала
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Help box */}
        {!isFinished && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/50 flex gap-4 items-start">
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-100">Не получается?</h4>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Если шаги инструкции не помогают или ситуация сложнее, вы всегда можете создать заявку в техподдержку.
              </p>
              {onCreateTicket && (
                <button 
                  onClick={onCreateTicket}
                  className="text-amber-600 dark:text-amber-400 font-bold text-sm hover:underline mt-2 flex items-center gap-1"
                >
                  Создать заявку сейчас <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
