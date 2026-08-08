import apiFetch from "../lib/api";

export interface ExternalPayment {
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
  external_system: { id: number; name: string } | null;
  customer: { id: number; full_name: string; phone_number: string } | null;
  /** The agent who owns the external system and receives the payment. */
  agent: { id: number; full_name: string; phone_number: string } | null;
}

export async function getMyExternalPayments(): Promise<ExternalPayment[]> {
  const res = await apiFetch("/external-payments/mine");
  if (res.status === 200 && res.body?.success) {
    return res.body.data?.data ?? [];
  }
  throw new Error(res.body?.message ?? "Failed to load external payment history");
}
