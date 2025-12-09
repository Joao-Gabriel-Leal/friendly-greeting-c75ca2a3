import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

// Store global de notificações
let notificationsStore: Notification[] = [];
let listeners: ((notifications: Notification[]) => void)[] = [];

export const notificationService = {
  getNotifications: () => notificationsStore,
  
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    notificationsStore = [newNotification, ...notificationsStore].slice(0, 50);
    listeners.forEach(l => l(notificationsStore));
    return newNotification;
  },
  
  markAsRead: (id: string) => {
    notificationsStore = notificationsStore.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    listeners.forEach(l => l(notificationsStore));
  },
  
  markAllAsRead: () => {
    notificationsStore = notificationsStore.map(n => ({ ...n, read: true }));
    listeners.forEach(l => l(notificationsStore));
  },
  
  remove: (id: string) => {
    notificationsStore = notificationsStore.filter(n => n.id !== id);
    listeners.forEach(l => l(notificationsStore));
  },
  
  clear: () => {
    notificationsStore = [];
    listeners.forEach(l => l(notificationsStore));
  },
  
  subscribe: (listener: (notifications: Notification[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(notificationsStore);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-success bg-success/5';
      case 'warning':
        return 'border-l-warning bg-warning/5';
      case 'error':
        return 'border-l-destructive bg-destructive/5';
      default:
        return 'border-l-info bg-info/5';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notificações</h4>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => notificationService.markAllAsRead()}
                className="h-7 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Ler todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => notificationService.clear()}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 border-l-4 transition-colors cursor-pointer hover:bg-muted/50',
                    getTypeStyles(notification.type),
                    !notification.read && 'bg-accent/30'
                  )}
                  onClick={() => notificationService.markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', !notification.read && 'text-foreground')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        notificationService.remove(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
