import { useState, useEffect, useCallback } from "react";

export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

export function useNotifications() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("rabbit-notification-logs") || localStorage.getItem("rabit-notification-logs");
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
    
    // Check initial permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("rabbit-notification-logs", JSON.stringify(logs));
  }, [logs]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return false;
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === "granted";
  };

  const sendNotification = useCallback(async (title: string, body: string) => {
    if (permission === "granted") {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/rabbit-avatar.svg",
          });
        }).catch((err) => {
          console.error("SW notification failed, falling back", err);
          new Notification(title, { body, icon: "/rabbit-avatar.svg" });
        });
      } else {
        new Notification(title, {
          body,
          icon: "/rabbit-avatar.svg", 
        });
      }
    }

    const newLog: NotificationLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      body,
      timestamp: Date.now(),
      read: false
    };

    setLogs(prev => [newLog, ...prev]);
  }, [permission]);

  const markAllAsRead = useCallback(() => {
    setLogs(prev => prev.map(log => ({ ...log, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setLogs([]);
  }, []);

  const unreadCount = logs.filter(log => !log.read).length;

  return {
    logs,
    permission,
    requestPermission,
    sendNotification,
    markAllAsRead,
    clearAll,
    unreadCount
  };
}
