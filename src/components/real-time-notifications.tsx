"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, X, AlertTriangle, Calendar, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'EMERGENCY_RESCHEDULE' | 'TIMETABLE_CHANGED' | 'ATTENDANCE_CHANGED' | 'HOLIDAY_CHANGED' | 'NEP_COMPLIANCE_CHANGED';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  read: boolean;
}

export default function RealTimeNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (session) {
      // Initialize socket connection to current origin by default
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || origin || 'http://localhost:3001', {
        path: '/api/socketio'
      });
      setSocket(newSocket);

      // Join role-based room
      newSocket.emit('join-role', session.user.role);

      // Listen for real-time notifications
      newSocket.on('emergency-notification', (data) => {
        addNotification({
          type: 'EMERGENCY_RESCHEDULE',
          title: 'Emergency Rescheduling',
          message: `Emergency rescheduling for ${data.date}: ${data.reason}`,
          data
        });
      });

      newSocket.on('timetable-changed', (data) => {
        addNotification({
          type: 'TIMETABLE_CHANGED',
          title: 'Timetable Updated',
          message: `Timetable has been ${data.action}: ${data.entry.subject?.name || 'Unknown subject'}`,
          data
        });
      });

      newSocket.on('attendance-changed', (data) => {
        addNotification({
          type: 'ATTENDANCE_CHANGED',
          title: 'Attendance Updated',
          message: `Faculty ${data.action} recorded`,
          data
        });
      });

      newSocket.on('holiday-changed', (data) => {
        addNotification({
          type: 'HOLIDAY_CHANGED',
          title: 'Holiday Updated',
          message: `Holiday ${data.action}: ${data.holiday.name}`,
          data
        });
      });

      newSocket.on('nep-compliance-changed', (data) => {
        addNotification({
          type: 'NEP_COMPLIANCE_CHANGED',
          title: 'NEP Compliance Updated',
          message: `Faculty ${data.isCompliant ? 'now compliant' : 'non-compliant'} with NEP 2020`,
          data
        });
      });

      return () => {
        newSocket.close();
      };
    }
  }, [session]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification for urgent events
    if (notification.type === 'EMERGENCY_RESCHEDULE') {
      toast.error(notification.message, {
        duration: 10000,
        action: {
          label: "View Details",
          onClick: () => setShowNotifications(true)
        }
      });
    } else {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY_RESCHEDULE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'TIMETABLE_CHANGED':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'ATTENDANCE_CHANGED':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'HOLIDAY_CHANGED':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'NEP_COMPLIANCE_CHANGED':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'EMERGENCY_RESCHEDULE':
        return 'border-red-200 bg-red-50';
      case 'TIMETABLE_CHANGED':
        return 'border-blue-200 bg-blue-50';
      case 'ATTENDANCE_CHANGED':
        return 'border-green-200 bg-green-50';
      case 'HOLIDAY_CHANGED':
        return 'border-purple-200 bg-purple-50';
      case 'NEP_COMPLIANCE_CHANGED':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'font-medium' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm">{notification.title}</h4>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs mt-2"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}