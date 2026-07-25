// services/notificationStore.ts
import * as SecureStore from 'expo-secure-store';

export interface AppNotification {
  id: string;
  type: 'money_received' | 'float_received' | 'cash_out_received' | 'system';
  title: string;
  message: string;
  amount?: number;
  senderPhone?: string;
  senderName?: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'agent_notifications';

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await SecureStore.getItemAsync(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // silent
  }
}

export async function addMoneyReceivedNotification(params: {
  amount: number;
  senderPhone?: string;
  senderName?: string;
  type?: 'money_received' | 'float_received' | 'cash_out_received';
}): Promise<AppNotification[]> {
  const current = await getNotifications();
  const title = params.type === 'float_received'
    ? 'Float Received '
    : params.type === 'cash_out_received'
      ? 'Cash Out Received '
      : 'Money Received ';

  const sender = params.senderName || params.senderPhone || 'Sender';
  const message = `Received +${params.amount.toLocaleString()} MMK from ${sender}`;

  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: params.type || 'money_received',
    title,
    message,
    amount: params.amount,
    senderPhone: params.senderPhone,
    senderName: params.senderName,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // NOTE: SecureStore has a ~2048 byte per-key limit.
  // Cap at 20 notifications and trim if the serialised size would exceed 1900 bytes.
  let updated = [newNotif, ...current];
  while (updated.length > 20) updated.pop();

  // Extra safety: trim until it fits
  let serialised = JSON.stringify(updated);
  while (serialised.length > 1900 && updated.length > 1) {
    updated.pop();
    serialised = JSON.stringify(updated);
  }

  await saveNotifications(updated);
  return updated;
}

export async function markAllNotificationsAsRead(): Promise<AppNotification[]> {
  const current = await getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  await saveNotifications(updated);
  return updated;
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(NOTIFICATIONS_STORAGE_KEY);
  } catch {
    // silent
  }
}
