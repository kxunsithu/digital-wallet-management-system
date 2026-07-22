import api from "../lib/axiox";

export const getAgentManagers = (params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  state_region_id?: string;
  township_id?: string
}) => api.get("agent-managers", { params });

export const getAgentManager = (id: number | string) => api.get(`agent-managers/${id}`);

export const createAgentManager = (data: FormData) =>
  api.post("agent-managers", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const updateAgentManager = (id: number | string, data: any) => {
  if (data instanceof FormData) {
    data.append("_method", "PUT");
    return api.post(`agent-managers/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.put(`agent-managers/${id}`, data);
};

export const toggleAgentManagerStatus = (id: number | string) =>
  api.post(`agent-managers/${id}/toggle-status`);

export const deleteAgentManager = (id: number | string) => api.delete(`agent-managers/${id}`);
