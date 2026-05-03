import { useEffect, useRef } from 'react';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Settings, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notification.isRead) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Задержка 1 секунда, чтобы убедиться, что пользователь действительно увидел уведомление
          const timer = setTimeout(() => {
            markAsRead(notification.id);
          }, 1000);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.5 } // Уведомление должно быть видно наполовину
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [notification.id, notification.isRead, markAsRead]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'system': return <Settings className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div 
      ref={itemRef}
      className={cn(
        "p-4 transition-colors relative group",
        !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
      )}
    >
      <div className="flex gap-3">
        <div className="mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={cn(
              "text-sm font-bold truncate",
              !notification.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
            )}>
              {notification.title}
            </p>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ru })}
            </span>
          </div>
          <p className={cn(
            "text-xs leading-relaxed line-clamp-2",
            !notification.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
          )}>
            {notification.message}
          </p>
        </div>
      </div>
      {!notification.isRead && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
      )}
    </div>
  );
}

export function NotificationPanel() {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAll 
  } = useNotificationStore();

  return (
    <div className="flex flex-col w-[320px] sm:w-[380px] max-h-[500px] overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Уведомления</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-[11px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Прочесть
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-[11px] font-bold text-slate-400 hover:text-red-600 uppercase tracking-wider" 
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Очистить
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Уведомлений пока нет</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Здесь будут появляться важные системные сообщения</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600">
              Показать все
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
