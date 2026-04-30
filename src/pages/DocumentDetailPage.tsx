import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentStore } from '@/stores/documentStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, DollarSign, FileText, Download, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { documentStatusLabels } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documents = useDocumentStore((state) => state.documents);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const document = documents.find((d) => d.id === id);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Документ не найден</h2>
        <p className="text-slate-500 mb-4">Возможно, он был удален или вы перешли по неверной ссылке</p>
        <Button onClick={() => navigate('/documents')}>Вернуться к списку</Button>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/documents/${document.id}/edit`);
  };

  const handleDelete = () => {
    deleteDocument(document.id);
    toast.success('Документ удален');
    navigate('/documents');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {document.number}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  document.status === 'active' ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                  document.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                  "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                )}>
                  {documentStatusLabels[document.status]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleEdit} className="text-slate-600 dark:text-slate-300">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Main Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">{document.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Дата создания</p>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
              </div>
              
              {document.equipmentLocation && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Местоположение</p>
                    <p className="font-medium">{document.equipmentLocation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {document.repairCost !== undefined && document.repairCost > 0 && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Стоимость ремонта</p>
                    <p className="font-medium">{document.repairCost.toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
              )}
              
              {document.equipmentName && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Оборудование</p>
                    <p className="font-medium">{document.equipmentName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-2">Описание</h3>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{document.description}</p>
          </div>
        </div>

        {/* Attached Files */}
        {((document.files && document.files.length > 0) || document.fileUrl) && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Прикрепленные файлы</h3>
            <div className="space-y-3">
              {document.files && document.files.length > 0 ? (
                document.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Файл'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </a>
                    </Button>
                  </div>
                ))
              ) : (
                // Fallback for old single-file documents
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {document.fileName || 'Документ'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Прикреплен {formatDate(document.createdAt)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={document.fileUrl} download={document.fileName} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Скачать
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parts Used */}
        {document.partsUsed && document.partsUsed.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Использованные запчасти</h3>
            <ul className="space-y-2">
              {document.partsUsed.map((part, index) => (
                <li key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {part}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Документ будет навсегда удален из базы данных.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white border-none">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
