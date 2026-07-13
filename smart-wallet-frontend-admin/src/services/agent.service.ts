import api from "../lib/axiox";

export const getAgents = (params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  state_region_id?: string;
  township_id?: string;
}) => api.get("agents", { params });

export const getAgent = (id: number | string) => api.get(`agents/${id}`);

export const deleteAgent = (id: number | string) => api.delete(`agents/${id}`);
