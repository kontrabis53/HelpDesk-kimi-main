import { cn } from '@/lib/utils';
import type { Role } from '@/types/roles';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  userRole?: Role;
  sizeClass?: string;
  textClass?: string;
  className?: string;
}

export function UserAvatar({ 
  avatarUrl, 
  name, 
  userRole, 
  sizeClass = "w-12 h-12", 
  textClass = "text-lg",
  className
}: UserAvatarProps) {
  
  // Fallback for no avatar
  if (!avatarUrl || avatarUrl === '') {
    return (
      <div 
        className={cn(
          sizeClass, 
          "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-700",
          className
        )}
        style={{ backgroundColor: userRole?.color || '#3B82F6' }}
      >
        <span className={cn("font-bold text-white uppercase", textClass)}>
          {name ? name.charAt(0) : '?'}
        </span>
      </div>
    );
  }

  // Monogram rendering
  if (typeof avatarUrl === 'string' && avatarUrl.startsWith('monogram:')) {
    const colorClass = avatarUrl.split(':')[1];
    return (
      <div className={cn(
        sizeClass, 
        "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden text-white font-bold uppercase", 
        colorClass, 
        textClass,
        className
      )}>
        {name ? name.charAt(0) : '?'}
      </div>
    );
  }

  // Emoji rendering (short strings)
  if (typeof avatarUrl === 'string' && avatarUrl.length <= 8) {
    return (
      <div className={cn(
        sizeClass, 
        "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-700", 
        textClass,
        className
      )}>
        {avatarUrl}
      </div>
    );
  }

  // Image rendering (Base64 or URL)
  return (
    <div className={cn(
      sizeClass, 
      "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-700",
      className
    )}>
      <img 
        src={avatarUrl} 
        alt={name} 
        className="w-full h-full object-cover" 
        onError={(e) => {
          // If image fails to load, show fallback
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement!.classList.add('bg-slate-200');
        }}
      />
    </div>
  );
}
