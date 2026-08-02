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
