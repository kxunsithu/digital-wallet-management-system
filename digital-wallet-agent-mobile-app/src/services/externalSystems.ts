import apiFetch from "../lib/api";

export interface AgentExternalSystem {
  id: number;
  name: string;
  system_link: string | null;
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

export async function createExternalSystem(
  name: string,
  systemLink?: string
): Promise<AgentExternalSystem> {
  const res = await apiFetch("/external-systems", {
    method: "POST",
    body: JSON.stringify({
      name,
      system_link: systemLink && systemLink.trim() ? systemLink.trim() : null,
    }),
  });
  if (res.status === 201 && res.body?.success) {
    return res.body.data;
  }
  throw new Error(res.body?.message ?? "Failed to create external system");
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
}

export async function getMyExternalPayments(): Promise<AgentExternalPayment[]> {
  const res = await apiFetch("/external-payments/mine");
  if (res.status === 200 && res.body?.success) {
    return res.body.data?.data ?? [];
  }
  throw new Error(res.body?.message ?? "Failed to load external payment history");
}
