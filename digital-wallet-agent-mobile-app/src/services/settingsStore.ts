// services/settingsStore.ts
// Persistent settings store using SecureStore
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'app_settings';

export interface AppSettings {
  autoSaveReceipt: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSaveReceipt: false,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export async function getAutoSaveReceipt(): Promise<boolean> {
  const settings = await getSettings();
  return settings.autoSaveReceipt;
}

export async function setAutoSaveReceipt(value: boolean): Promise<void> {
  await updateSettings({ autoSaveReceipt: value });
}
