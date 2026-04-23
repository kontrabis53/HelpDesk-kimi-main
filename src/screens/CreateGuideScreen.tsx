import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { KBArticleCategory } from '@/types';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function CreateGuideScreen() {
  const navigate = useNavigate();
  const createArticle = useKnowledgeStore((state) => state.createArticle);
  const currentUser = useRoleStore((state) => state.currentUser());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<KBArticleCategory>('common');
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    await createArticle({
      title,
      description,
      category,
      tags,
      steps: validSteps,
      successRate: 0,
      views: 0,
      author: currentUser,
    });

    toast.success('Статья создана');
    navigate('/knowledge');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/knowledge')} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Новая статья</h1>
          </div>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Save className="w-4 h-4" />
            Опубликовать
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок статьи</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Как настроить VPN"
                className="bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as KBArticleCategory)}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software">Программное обеспечение</SelectItem>
                    <SelectItem value="network">Сеть и интернет</SelectItem>
                    <SelectItem value="printer">Печать и МФУ</SelectItem>
                    <SelectItem value="security">Безопасность</SelectItem>
                    <SelectItem value="common">Общие вопросы</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="vpn, настройка, удаленка"
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Краткое описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="О чем эта статья..."
                className="bg-slate-50 dark:bg-slate-900 min-h-[100px]"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Шаги решения</h2>
              <Button type="button" onClick={handleAddStep} variant="outline" size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Добавить шаг
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm relative group">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-start gap-4 ml-4">
                    <div className="flex-1 space-y-4">
                      <Input
                        value={step.title}
                        onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                        placeholder="Заголовок шага"
                        className="bg-slate-50 dark:bg-slate-900 font-bold"
                      />
                      <Textarea
                        value={step.description}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        placeholder="Описание действий на этом шаге..."
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
