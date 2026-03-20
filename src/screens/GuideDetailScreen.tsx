import { ArrowLeft, Clock, Eye } from 'lucide-react';
import type { KBArticle } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface GuideDetailScreenProps {
  article: KBArticle;
  onBack: () => void;
  onEdit?: () => void;
}

export function GuideDetailScreen({ article, onBack, onEdit }: GuideDetailScreenProps) {
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
        {/* Article Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
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

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">
              {article.title}
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
              {article.description}
            </p>

            {/* Steps */}
            <div className="space-y-8">
              {article.steps.map((step, index) => (
                <div key={step.id} className="relative pl-12">
                  <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
                    {index + 1}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
