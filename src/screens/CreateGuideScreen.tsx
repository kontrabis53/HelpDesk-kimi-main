import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GuideCategory } from '@/types';
import { guideCategoryLabels } from '@/types';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function CreateGuideScreen() {
  const navigate = useNavigate();
  const createGuide = useKnowledgeStore((state) => state.createGuide);
  const currentUser = useRoleStore((state) => state.currentUser());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GuideCategory>('common');
  const [tagsInput, setTagsInput] = useState('');
  const [steps, setSteps] = useState<{ id: string; title: string; description: string }[]>([
    { id: '1', title: '', description: '' }
  ]);

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { id: Date.now().toString(), title: '', description: '' }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Ошибка', { description: 'Заполните заголовок и описание' });
      return;
    }

    // Filter out empty steps
    const validSteps = steps
      .filter(step => step.title.trim() || step.description.trim())
      .map((step, index) => ({
        id: step.id,
        order: index + 1,
        title: step.title,
        description: step.description,
      }));

    if (validSteps.length === 0) {
      toast.error('Ошибка', { description: 'Добавьте хотя бы один шаг' });
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (!currentUser) {
      toast.error('Ошибка', { description: 'Пользователь не найден' });
      return;
    }

    createGuide({
      title,
      description,
      category,
      tags,
      steps: validSteps,
      successRate: 0,
      author: currentUser,
    });

    toast.success('Инструкция создана');
    navigate('/knowledge');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/knowledge')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Новая инструкция</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/knowledge')}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Создать
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Main Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Основная информация</h2>
          
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Как настроить принтер"
              className="bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as GuideCategory)}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-900">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(guideCategoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Краткое описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите, какую проблему решает эта инструкция"
              className="bg-slate-50 dark:bg-slate-900 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Теги (через запятую)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="принтер, сеть, ошибка"
              className="bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Шаги решения</h2>
            <Button onClick={handleAddStep} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Добавить шаг
            </Button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <GripVertical className="w-4 h-4 text-slate-300 cursor-move" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Заголовок шага</Label>
                      <Input
                        value={step.title}
                        onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                        placeholder="Что нужно сделать"
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Описание действий</Label>
                      <Textarea
                        value={step.description}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        placeholder="Подробное описание действий..."
                        className="bg-slate-50 dark:bg-slate-900 min-h-[80px]"
                      />
                    </div>
                  </div>

                  {steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
