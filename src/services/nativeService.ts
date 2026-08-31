import { useState, useEffect } from 'react';
import { UserProfile, NotificationSettings } from '../types';

/**
 * Haptic Vibration Feedback for 99% Native App Feel
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(8);
          break;
        case 'medium':
          navigator.vibrate(18);
          break;
        case 'heavy':
          navigator.vibrate(35);
          break;
        case 'success':
          navigator.vibrate([10, 30, 20]);
          break;
        case 'warning':
          navigator.vibrate([25, 40, 25]);
          break;
        case 'error':
          navigator.vibrate([40, 60, 40]);
          break;
      }
    }
  } catch (err) {
    // Haptics not supported or blocked
  }
}

/**
 * Notification Permission Helper
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Send System / Service Worker Notification
 */
export async function sendNativeNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  } = {}
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  const notificationOptions = {
    body: options.body || 'Aapka daily test ka time ho gaya hai! Practice shuru karein 🎯',
    icon: options.icon || '/icon.svg',
    badge: options.badge || '/icon.svg',
    tag: options.tag || 'mockmitra-reminder',
    data: options.data || { url: '/' },
    renotify: true
  };

  try {
    // Prefer Service Worker registration to show native notifications in background/tray
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        triggerHaptic('success');
        return true;
      }
    }

    // Fallback to standard window Notification
    new Notification(title, notificationOptions);
    triggerHaptic('success');
    return true;
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
    return false;
  }
}

/**
 * Test Notification Trigger for User Verification in Settings
 */
export async function triggerTestNotification(examName: string = 'Target Exam'): Promise<boolean> {
  return sendNativeNotification(`MockMitra Study Alert 🎯`, {
    body: `Notification setup successful! Har din aapko ${examName} ki practice ke liye timely reminder milega.`,
    tag: 'mockmitra-test-reminder'
  });
}

/**
 * Check if a reminder should fire at current local minute
 */
export function checkReminderDue(settings?: NotificationSettings): boolean {
  if (!settings || !settings.enabled || !settings.time) return false;

  const now = new Date();
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;

  const todayDateString = now.toDateString();

  // If already notified today at or after scheduled time, don't re-notify
  if (settings.lastNotifiedDate === todayDateString) {
    return false;
  }

  if (currentTimeString === settings.time) {
    return true;
  }

  return false;
}

/**
 * React Hook for Online / Offline Status Detection
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerHaptic('light');
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerHaptic('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
