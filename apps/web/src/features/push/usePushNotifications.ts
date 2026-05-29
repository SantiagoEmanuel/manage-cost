import { useState } from 'react';
import { pushApi } from './push.api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported && 'Notification' in window ? Notification.permission : 'denied'
  );

  async function subscribe() {
    if (!isSupported) return;
    if (permission === 'denied') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') return;
    const key = await pushApi.getVapidKey();
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await pushApi.subscribe(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
  }

  return { subscribe, isSupported, permission };
}
