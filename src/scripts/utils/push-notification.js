import CONFIG from "../config";
import {
  SubscribePushNotification,
  UnsubscribePushNotification,
} from "../data/api";
import { convertBase64ToUint8Array } from "./index";

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const serviceWorkerUrl = new URL(
      `${import.meta.env.BASE_URL}sw.js`,
      window.location.href,
    );
    const serviceWorkerScope = new URL(
      import.meta.env.BASE_URL,
      window.location.href,
    );

    return await navigator.serviceWorker.register(serviceWorkerUrl, {
      scope: serviceWorkerScope.pathname,
    });
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushSubscription() {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribePushNotification() {
  if (!isPushSupported()) {
    throw new Error("Push notification is not supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
  });

  const subscriptionJson = subscription.toJSON();

  try {
    await SubscribePushNotification({
      endpoint: subscriptionJson.endpoint,
      keys: {
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      },
    });
  } catch (error) {
    await subscription.unsubscribe();
    throw error;
  }

  return subscription;
}

export async function unsubscribePushNotification() {
  const subscription = await getPushSubscription();

  if (!subscription) {
    return null;
  }

  await UnsubscribePushNotification(subscription.endpoint);
  await subscription.unsubscribe();

  return subscription;
}
