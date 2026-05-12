
import { useState, useRef, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Pin, PinOff, Bell, BellOff, X } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';


interface GroupAdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export function GroupSettingsModal({ isOpen, onClose, chatId }: GroupAdminSettingsModalProps) {
  const { deleteGroup, chats, renameChat, updateChatAvatar, leaveChat, toggleMuteChat, togglePinChat } = useChatStore();
  const currentUser = useAuthStore(state => state.user);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false); // Состояние для AlertDialog подтверждения удаления
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] = useState(false); // Состояние для AlertDialog запроса мастер-пароля
  const [masterPassword, setMasterPassword] = useState(''); // Состояние для хранения мастер-пароля

  const activeChat = chats.find(c => c.id === chatId);
  const isCreator = currentUser?.id === activeChat?.creatorId;

  // Новые состояния для настроек
  const [newName, setNewName] = useState(activeChat?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [tempAvatar, setTempAvatar] = useState<string | null>(activeChat?.avatar || null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeChat) {
      setNewName(activeChat.name);
      setTempAvatar(activeChat.avatar || null);
    }
  }, [activeChat]);

  const handleDeleteGroup = async () => {
    if (!activeChat) return;

    if (isCreator) {
      if (activeChat.participants.length > 1) {
        setIsAlertDialogOpen(true); // Открываем AlertDialog для подтверждения
      } else {
        await deleteGroup(chatId);
        onClose();
      }
    } else {
      setIsMasterPasswordModalOpen(true); // Открываем модальное окно для мастер-пароля
    }
  };

  const confirmDelete = async (mp?: string) => {
    if (!chatId) return;
    await deleteGroup(chatId, mp);
    setIsAlertDialogOpen(false);
    setIsMasterPasswordModalOpen(false);
    onClose();
  };

  const handleMasterPasswordDelete = () => {
    if (!masterPassword.trim()) {
      toast.error('Введите мастер-пароль');
      return;
    }
    confirmDelete(masterPassword);
  };

  const handleRenameGroup = async () => {
    if (!activeChat || !newName.trim() || newName === activeChat.name) return;
    setIsUpdatingName(true);
    const success = await renameChat(chatId, newName.trim());
    if (success) {
      toast.success('Группа переименована');
    } else {
      toast.error('Не удалось переименовать группу');
    }
    setIsUpdatingName(false);
  };

  const handleLeaveGroup = async () => {
    if (!activeChat) return;
    if (confirm('Вы уверены, что хотите покинуть эту группу?')) {
      await leaveChat(chatId);
      onClose();
      toast.info(`Вы покинули группу "${activeChat.name}"`);
    }
  };

  const handleToggleMute = async (checked: boolean) => {
    if (!activeChat) return;
    await toggleMuteChat(chatId);
    toast.info(checked ? 'Уведомления отключены' : 'Уведомления включены');
  };

  const handleTogglePin = async (checked: boolean) => {
    if (!activeChat) return;
    await togglePinChat(chatId);
    toast.info(checked ? 'Чат закреплен' : 'Чат откреплен');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result as string);
        setShowAvatarEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!activeChat || !tempAvatar || isUpdatingAvatar) return;
    setIsUpdatingAvatar(true);
    const success = await updateChatAvatar(chatId, tempAvatar);
    if (success) {
      toast.success('Аватар группы обновлен');
      setShowAvatarEditor(false);
    } else {
      toast.error('Не удалось обновить аватар');
    }
    setIsUpdatingAvatar(false);
  };

  // Memoji и monogramColors (как в ChatScreen)
  const memojis = ['👦', '👧', '👨‍💻', '👩‍💻', '🦸', '🦹', '🐱', '🐶', '🦊', '🦁', '🐸', '🐨'];
  const monogramColors = [
    'bg-amber-400', 'bg-blue-500', 'bg-emerald-500', 
    'bg-rose-500', 'bg-violet-500', 'bg-slate-700'
  ];

  if (!activeChat) {
    console.log(`[GroupAdminSettingsModal] activeChat not found for chatId: ${chatId}`);
    return null;
  } // Не рендерим, если нет активного чата

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[440px] bg-white dark:bg-slate-900 p-0 overflow-hidden border-0 shadow-2xl rounded-[32px] gap-0">
        {/* Header Section */}
        <div className="p-6 pb-4 flex flex-col items-center relative">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase mt-2">
              Настройки группы
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Управление группой "{activeChat.name}"
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Settings Options */}
        <div className="px-6 space-y-6 pb-6">
          {/* ОБЩИЕ НАСТРОЙКИ (для всех участников) */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Общие</h4>
            <div className="flex items-center justify-between">
              <label htmlFor="mute-notifications" className="text-sm font-medium flex items-center gap-2">
                {activeChat.isMuted ? <BellOff className="w-4 h-4 text-slate-500" /> : <Bell className="w-4 h-4 text-slate-500" />} Отключить уведомления
              </label>
              <Switch
                id="mute-notifications"
                checked={activeChat.isMuted}
                onCheckedChange={handleToggleMute}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="pin-chat" className="text-sm font-medium flex items-center gap-2">
                {activeChat.isPinned ? <Pin className="w-4 h-4 text-slate-500" /> : <PinOff className="w-4 h-4 text-slate-500" />} Закрепить чат
              </label>
              <Switch
                id="pin-chat"
                checked={activeChat.isPinned}
                onCheckedChange={handleTogglePin}
              />
            </div>
          </div>

          {/* АДМИНИСТРАТИВНЫЕ НАСТРОЙКИ (только для создателя) */}
          {isCreator && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Администрирование</h4>

              {/* Секция переименования */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Название группы</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Введите название..."
                    className="bg-slate-100 dark:bg-slate-700 border-0 h-11 rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={isUpdatingName}
                  />
                  <Button
                    onClick={handleRenameGroup}
                    disabled={!newName.trim() || newName === activeChat.name || isUpdatingName}
                    className="h-11 px-4 rounded-xl font-bold text-sm"
                  >
                    {isUpdatingName ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </div>

              {/* Секция аватара */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Аватар группы</label>
                <div className="flex items-center gap-4">
                  <UserAvatar avatarUrl={tempAvatar} name={activeChat.name} sizeClass="w-16 h-16" textClass="text-xl" isGroup={true} />
                  <div className="flex-1 space-y-2">
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full h-10 rounded-xl text-xs font-bold">
                      Загрузить фото
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button variant="outline" onClick={() => setShowAvatarEditor(true)} className="w-full h-10 rounded-xl text-xs font-bold">
                      Выбрать аватар/монограмму
                    </Button>
                    {tempAvatar && (
                      <Button variant="ghost" onClick={() => setTempAvatar(null)} className="w-full h-10 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        Удалить аватар
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ОПАСНАЯ ЗОНА (для всех) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Опасная зона</h4>
            {/* Кнопка Удалить группу */}
            <Button
              variant="destructive"
              className="w-full h-12 rounded-xl text-base font-bold flex items-center gap-2 mt-4"
              onClick={handleDeleteGroup}
            >
              <Trash2 className="w-5 h-5" /> Удалить группу
            </Button>
          </div>

          {/* Кнопка Покинуть группу (для всех) */}
          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest mt-6"
            onClick={handleLeaveGroup}
          >
            Покинуть группу
          </Button>
        </div>

        {/* Кнопка Закрыть (для всех) */}
        <Button variant="ghost" onClick={onClose} className="w-full h-10 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
          Закрыть
        </Button>
      </DialogContent>

      {/* AlertDialog для подтверждения удаления группы */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить группу "{activeChat.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              В этой группе {activeChat.participants.length} участник(ов). Вы уверены, что хотите безвозвратно удалить эту группу для всех участников? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete()} className="bg-red-600 hover:bg-red-700">
              Удалить для всех
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog для подтверждения удаления группы с мастер-паролем */}
      <AlertDialog open={isMasterPasswordModalOpen} onOpenChange={setIsMasterPasswordModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить группу "{activeChat.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы не являетесь создателем этой группы. Для удаления введите мастер-пароль.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            placeholder="Мастер-пароль"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            className="mt-4"
          />
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setMasterPassword('')}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleMasterPasswordDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Модальное окно для редактирования аватара */}
      <Dialog open={showAvatarEditor} onOpenChange={(open) => {
        setShowAvatarEditor(open);
        if (!open) setTempAvatar(activeChat.avatar || null); // Сбрасываем tempAvatar при закрытии
      }}>
        <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none bg-[#F2F2F7] dark:bg-black rounded-[32px] shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Редактирование аватара группы</DialogTitle>
          </DialogHeader>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
            <button
              onClick={() => {
                setShowAvatarEditor(false);
                setTempAvatar(activeChat.avatar || null); // Отмена изменений
              }}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
              <button className="px-4 py-1 rounded-full bg-white dark:bg-slate-700 text-xs font-bold shadow-sm">Аватар</button>
              {/* <button className="px-4 py-1 rounded-full text-xs font-bold text-slate-400">Постер</button> */}
            </div>

            <Button
              onClick={handleSaveAvatar}
              disabled={!tempAvatar || isUpdatingAvatar}
              className="h-8 px-4 rounded-full text-xs font-bold"
            >
              {isUpdatingAvatar ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Current avatar preview */}
            <div className="flex justify-center">
              <UserAvatar avatarUrl={tempAvatar} name={activeChat.name} sizeClass="w-32 h-32" textClass="text-5xl" isGroup={true} />
            </div>

            {/* Monograms */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Монограммы</p>
              <div className="grid grid-cols-6 gap-2">
                {monogramColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setTempAvatar(`monogram:${color}`)}
                    className={cn(
                      "aspect-square rounded-full flex items-center justify-center text-xl font-bold text-white transition-all hover:scale-110",
                      color,
                      tempAvatar === `monogram:${color}` && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                    )}
                  >
                    {(activeChat.name || 'Г').charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            {/* Emojis */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Эмодзи</p>
              <div className="grid grid-cols-6 gap-2">
                {memojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setTempAvatar(`emoji:${emoji}`)}
                    className={cn(
                      "aspect-square rounded-full flex items-center justify-center text-3xl transition-all hover:scale-110",
                      tempAvatar === `emoji:${emoji}` && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
