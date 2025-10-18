/**
 * Notification System - Toast notifications for admin actions
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationSystem({ notifications, onDismiss }: NotificationSystemProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [notification]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: 'text-green-900',
          message: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          title: 'text-red-900',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          title: 'text-yellow-900',
          message: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: 'text-blue-900',
          message: 'text-blue-700'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`${styles.bg} border rounded-lg shadow-lg p-4 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.title}`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className={`text-sm mt-1 ${styles.message}`}>
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook for using notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, type, title, message, duration }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    success: (title: string, message?: string) => addNotification('success', title, message),
    error: (title: string, message?: string) => addNotification('error', title, message),
    warning: (title: string, message?: string) => addNotification('warning', title, message),
    info: (title: string, message?: string) => addNotification('info', title, message),
  };
}
