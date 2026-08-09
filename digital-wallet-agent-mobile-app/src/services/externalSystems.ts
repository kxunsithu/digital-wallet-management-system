import apiFetch from "../lib/api";

export interface ActiveExternalSystem {
  id: number;
  name: string;
  system_link: string | null;
  system_logo: string | null;
  system_logo_url: string | null;
  status: string;
  created_at: string;
  user?: {
    id: number;
    full_name?: string;
    phone_number?: string;
  } | null;
}

export async function getActiveExternalSystems(): Promise<ActiveExternalSystem[]> {
  const res = await apiFetch("/external-systems/active");
  if (res.status === 200 && res.body?.success) {
    return res.body.data ?? [];
  }
  throw new Error(res.body?.message ?? "Failed to load external systems");
}

export interface AgentExternalSystem {
  id: number;
  name: string;
  system_link: string | null;
  system_logo: string | null;
  system_logo_url: string | null;
  api_key_prefix: string | null;
  status: string;
  created_at: string;
}

export async function getMyExternalSystems(): Promise<AgentExternalSystem[]> {
  const res = await apiFetch("/external-systems/mine");
  if (res.status === 200 && res.body?.success) {
    return res.body.data ?? [];
  }
  throw new Error(res.body?.message ?? "Failed to load external systems");
}

const isLocalUri = (uri?: string | null): boolean => {
  if (!uri || typeof uri !== 'string' || !uri.trim()) return false;
  const trimmed = uri.trim();
  return trimmed.startsWith('file://') || trimmed.startsWith('content://') || trimmed.startsWith('ph://') || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'));
};

const buildFilePayload = (uri: string, defaultPrefix: string) => {
  const safeUri = String(uri || '').trim();
  if (!safeUri) {
    throw new Error('Invalid image file path');
  }

  let cleanUri = safeUri.split('?')[0];
  try {
    cleanUri = decodeURI(cleanUri);
  } catch (e) {
    // fallback
  }

  const isPng = cleanUri.toLowerCase().endsWith('.png');
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const ext = isPng ? 'png' : 'jpg';
  const name = `${defaultPrefix}_${Date.now()}.${ext}`;

  return {
    uri: safeUri,
    name: name,
    type: mimeType,
  };
};

export async function createExternalSystem(
  name: string,
  systemLink?: string,
  logoUri?: string
): Promise<AgentExternalSystem> {
  const formData = new FormData();
  formData.append('name', name);
  if (systemLink && systemLink.trim()) {
    formData.append('system_link', systemLink.trim());
  }
  if (isLocalUri(logoUri) && logoUri) {
    const payload = buildFilePayload(logoUri, 'system_logo');
    // @ts-ignore
    formData.append('system_logo', payload);
  }
  const res = await apiFetch('/external-systems', {
    method: 'POST',
    body: formData,
  });
  if (res.status === 201 && res.body?.success) {
    return res.body.data;
  }
  throw new Error(res.body?.message ?? 'Failed to create external system');
}

export async function updateExternalSystem(
  id: number,
  name: string,
  systemLink?: string,
  logoUri?: string
): Promise<AgentExternalSystem> {
  const formData = new FormData();
  formData.append('name', name);
  if (systemLink && systemLink.trim()) {
    formData.append('system_link', systemLink.trim());
  } else {
    // send empty string so backend clears it
    formData.append('system_link', '');
  }
  if (isLocalUri(logoUri) && logoUri) {
    const payload = buildFilePayload(logoUri, 'system_logo');
    // @ts-ignore
    formData.append('system_logo', payload);
  }
  const res = await apiFetch(`/external-systems/${id}/update`, {
    method: 'POST',
    body: formData,
  });
  if (res.status === 200 && res.body?.success) {
    return res.body.data;
  }
  throw new Error(res.body?.message ?? 'Failed to update external system');
}

export async function generateExternalSystemKey(id: number): Promise<{ system: AgentExternalSystem; apiKey: string }> {
  const res = await apiFetch(`/external-systems/${id}/generate-key`, {
    method: "POST",
  });
  if (res.status === 200 && res.body?.success) {
    return { system: res.body.data, apiKey: res.body.data.api_key };
  }
  throw new Error(res.body?.message ?? "Failed to generate API key");
}

export interface AgentExternalPayment {
  id: number;
  reference: string;
  external_system_id: number;
  customer_user_id: number;
  agent_user_id: number;
  amount: string | number;
  fee: string | number;
  order_reference: string | null;
  description: string | null;
  status: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Whether the authenticated user was the payer ('outgoing') or the merchant ('incoming'). */
  direction?: 'incoming' | 'outgoing';
  external_system: { id: number; name: string } | null;
  customer: { id: number; full_name: string; phone_number: string } | null;
  /** The agent who owns the external system and receives the payment. */
  agent: { id: number; full_name: string; phone_number: string } | null;
}

export async function getMyExternalPayments(): Promise<AgentExternalPayment[]> {
  const res = await apiFetch("/external-payments/mine");
  if (res.status === 200 && res.body?.success) {
    return res.body.data?.data ?? [];
  }
  throw new Error(res.body?.message ?? "Failed to load external payment history");
}
