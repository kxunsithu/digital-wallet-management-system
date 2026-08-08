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
