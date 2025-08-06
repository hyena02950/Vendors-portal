
import { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export const NotificationDropdown = () => {
  const { isVendorUser, isElikaAdmin } = useUserRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications for demo purposes
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'New Job Assignment',
        message: 'You have been assigned to a new job posting: Senior React Developer',
        type: 'info',
        read: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Document Approved',
        message: 'Your MSA document has been approved by the admin team',
        type: 'success',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        title: 'Interview Scheduled',
        message: 'Interview scheduled for candidate John Doe on tomorrow at 2:00 PM',
        type: 'info',
        read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <Users className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start space-x-3 p-4 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(notification.created_at)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-center py-8">
              <div className="text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            </DropdownMenuItem>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
