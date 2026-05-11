import { cn } from '@/lib/utils';
import type { Role } from '@/types/roles';
import { Users } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  userRole?: Role;
  sizeClass?: string;
  textClass?: string;
  className?: string;
  isGroup?: boolean;
}

export function UserAvatar({ 
  avatarUrl: rawAvatarUrl, 
  name, 
  userRole, 
  sizeClass = "w-12 h-12", 
  textClass = "text-lg",
  className,
  isGroup = false
}: UserAvatarProps) {
  
  // Normalize null/undefined strings from backend very aggressively
  const avatarUrl = (
    !rawAvatarUrl || 
    rawAvatarUrl === 'null' || 
    rawAvatarUrl === 'undefined' || 
    String(rawAvatarUrl).trim() === '' ||
    rawAvatarUrl === '[object Object]'
  ) ? null : rawAvatarUrl;
  
  // Neutral group avatar
  if (isGroup && !avatarUrl) {
    return (
      <div 
        className={cn(
          sizeClass, 
          "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 aspect-square",
          className
        )}
      >
        <Users className={cn("text-slate-400", textClass)} />
      </div>
    );
  }

  // Fallback for no avatar
  if (!avatarUrl) {
    return (
      <div 
        className={cn(
          sizeClass, 
          "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 aspect-square",
          className
        )}
        style={{ backgroundColor: userRole?.color || '#3B82F6' }}
      >
        <span className={cn("font-bold text-white uppercase", textClass)}>
          {name && name !== 'null' ? name.charAt(0) : '?'}
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
        "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden text-white font-bold uppercase shrink-0 aspect-square", 
        colorClass, 
        textClass,
        className
      )}>
        {name && name !== 'null' ? name.charAt(0) : '?'}
      </div>
    );
  }

  // Emoji rendering (short strings)
  if (typeof avatarUrl === 'string' && avatarUrl.length <= 8) {
    return (
      <div className={cn(
        sizeClass, 
        "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 aspect-square", 
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
      "rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 aspect-square",
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
